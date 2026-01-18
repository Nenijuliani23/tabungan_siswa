<?php
/**
 * API Endpoint: Transaksi
 * Handles transactions (setor/tarik)
 */

require_once 'config.php';

$conn = getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGet($conn);
        break;
    case 'POST':
        handlePost($conn);
        break;
    case 'DELETE':
        handleDelete($conn);
        break;
    default:
        sendResponse(false, 'Method not allowed', null, 405);
}

/**
 * GET - Retrieve all transactions or by siswa_id
 */
function handleGet($conn) {
    // Get transactions by student ID
    if (isset($_GET['siswa_id'])) {
        $siswaId = intval($_GET['siswa_id']);
        $stmt = $conn->prepare("SELECT * FROM transaksi WHERE siswa_id = ? ORDER BY timestamp DESC");
        $stmt->bind_param("i", $siswaId);
        $stmt->execute();
        $result = $stmt->get_result();
    } 
    // Get all transactions
    else {
        $sql = "SELECT * FROM transaksi ORDER BY timestamp DESC";
        $result = $conn->query($sql);
    }
    
    $transactions = [];
    while ($row = $result->fetch_assoc()) {
        $transactions[] = formatTransaction($row);
    }
    
    sendResponse(true, 'Transactions retrieved successfully', $transactions);
}

/**
 * POST - Create new transaction (setor/tarik)
 */
function handlePost($conn) {
    $data = getJsonInput();
    
    // Validate required fields
    $required = ['siswaId', 'type', 'amount'];
    $missing = validateRequired($data, $required);
    
    if (!empty($missing)) {
        sendResponse(false, 'Missing required fields: ' . implode(', ', $missing), null, 400);
    }
    
    $siswaId = intval($data['siswaId']);
    $type = $data['type'];
    $amount = floatval($data['amount']);
    
    // Validate transaction type
    if (!in_array($type, ['setor', 'tarik'])) {
        sendResponse(false, 'Invalid transaction type. Must be "setor" or "tarik"', null, 400);
    }
    
    // Validate amount
    if ($amount <= 0) {
        sendResponse(false, 'Amount must be greater than 0', null, 400);
    }
    
    // Get current student data
    $stmt = $conn->prepare("SELECT nama, saldo_tabungan FROM siswa WHERE id = ?");
    $stmt->bind_param("i", $siswaId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendResponse(false, 'Student not found', null, 404);
    }
    
    $siswa = $result->fetch_assoc();
    $namaSiswa = $siswa['nama'];
    $saldoSebelum = floatval($siswa['saldo_tabungan']);
    
    // Calculate new balance
    if ($type === 'setor') {
        $saldoSesudah = $saldoSebelum + $amount;
    } else {
        $saldoSesudah = $saldoSebelum - $amount;
        
        // Check if balance is sufficient
        if ($saldoSesudah < 0) {
            sendResponse(false, 'Saldo tidak mencukupi untuk penarikan', null, 400);
        }
    }
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // Update student balance
        $updateStmt = $conn->prepare("UPDATE siswa SET saldo_tabungan = ? WHERE id = ?");
        $updateStmt->bind_param("di", $saldoSesudah, $siswaId);
        $updateStmt->execute();
        
        // Insert transaction record
        $insertStmt = $conn->prepare(
            "INSERT INTO transaksi (siswa_id, nama_siswa, type, amount, saldo_sebelum, saldo_sesudah) 
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $insertStmt->bind_param("issddd", $siswaId, $namaSiswa, $type, $amount, $saldoSebelum, $saldoSesudah);
        $insertStmt->execute();
        
        $transactionId = $conn->insert_id;
        
        // Commit transaction
        $conn->commit();
        
        sendResponse(true, 'Transaction completed successfully', [
            'id' => $transactionId,
            'saldoSebelum' => $saldoSebelum,
            'saldoSesudah' => $saldoSesudah
        ], 201);
        
    } catch (Exception $e) {
        $conn->rollback();
        sendResponse(false, 'Transaction failed', ['error' => $e->getMessage()], 500);
    }
}

/**
 * DELETE - Delete transaction
 * Note: This will NOT reverse the balance change
 */
function handleDelete($conn) {
    if (!isset($_GET['id'])) {
        sendResponse(false, 'Transaction ID is required', null, 400);
    }
    
    $id = intval($_GET['id']);
    
    // Check if transaction exists
    $checkStmt = $conn->prepare("SELECT id FROM transaksi WHERE id = ?");
    $checkStmt->bind_param("i", $id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        sendResponse(false, 'Transaction not found', null, 404);
    }
    
    // Delete transaction
    $stmt = $conn->prepare("DELETE FROM transaksi WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        sendResponse(true, 'Transaction deleted successfully');
    } else {
        sendResponse(false, 'Failed to delete transaction', ['error' => $stmt->error], 500);
    }
}

/**
 * Format transaction data to camelCase
 */
function formatTransaction($row) {
    return [
        'id' => $row['id'],
        'siswaId' => $row['siswa_id'],
        'namaSiswa' => $row['nama_siswa'],
        'type' => $row['type'],
        'amount' => floatval($row['amount']),
        'saldoSebelum' => floatval($row['saldo_sebelum']),
        'saldoSesudah' => floatval($row['saldo_sesudah']),
        'timestamp' => $row['timestamp']
    ];
}

$conn->close();
?>
