<?php
/**
 * API Endpoint: Siswa
 * Handles CRUD operations for students
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
    case 'PUT':
        handlePut($conn);
        break;
    case 'DELETE':
        handleDelete($conn);
        break;
    default:
        sendResponse(false, 'Method not allowed', null, 405);
}

/**
 * GET - Retrieve all students or specific student
 */
function handleGet($conn) {
    // Get specific student by ID
    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        $stmt = $conn->prepare("SELECT * FROM siswa WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $siswa = $result->fetch_assoc();
            sendResponse(true, 'Student found', formatSiswa($siswa));
        } else {
            sendResponse(false, 'Student not found', null, 404);
        }
    } 
    // Get all students
    else {
        $sql = "SELECT * FROM siswa ORDER BY created_at DESC";
        $result = $conn->query($sql);
        
        $siswaList = [];
        while ($row = $result->fetch_assoc()) {
            $siswaList[] = formatSiswa($row);
        }
        
        sendResponse(true, 'Students retrieved successfully', $siswaList);
    }
}

/**
 * POST - Create new student
 */
function handlePost($conn) {
    $data = getJsonInput();
    
    // Validate required fields
    $required = ['nama', 'noHp', 'jenisKelamin', 'alamat', 'email', 'kelas'];
    $missing = validateRequired($data, $required);
    
    if (!empty($missing)) {
        sendResponse(false, 'Missing required fields: ' . implode(', ', $missing), null, 400);
    }
    
    // Prepare statement
    $stmt = $conn->prepare(
        "INSERT INTO siswa (nama, no_hp, jenis_kelamin, alamat, email, kelas, saldo_tabungan, metode_pembayaran, nomor_referensi) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    
    $saldoTabungan = isset($data['saldoTabungan']) ? floatval($data['saldoTabungan']) : 0.00;
    $metodePembayaran = isset($data['metodePembayaran']) ? $data['metodePembayaran'] : null;
    $nomorReferensi = isset($data['nomorReferensi']) ? $data['nomorReferensi'] : null;
    
    $stmt->bind_param(
        "ssssssdss",
        $data['nama'],
        $data['noHp'],
        $data['jenisKelamin'],
        $data['alamat'],
        $data['email'],
        $data['kelas'],
        $saldoTabungan,
        $metodePembayaran,
        $nomorReferensi
    );
    
    if ($stmt->execute()) {
        $newId = $conn->insert_id;
        
        // If initial deposit, create transaction record
        if ($saldoTabungan > 0) {
            $transStmt = $conn->prepare(
                "INSERT INTO transaksi (siswa_id, nama_siswa, type, amount, saldo_sebelum, saldo_sesudah) 
                 VALUES (?, ?, 'setor', ?, 0, ?)"
            );
            $transStmt->bind_param("isdd", $newId, $data['nama'], $saldoTabungan, $saldoTabungan);
            $transStmt->execute();
        }
        
        sendResponse(true, 'Student created successfully', ['id' => $newId], 201);
    } else {
        sendResponse(false, 'Failed to create student', ['error' => $stmt->error], 500);
    }
}

/**
 * PUT - Update existing student
 */
function handlePut($conn) {
    $data = getJsonInput();
    
    if (!isset($data['id'])) {
        sendResponse(false, 'Student ID is required', null, 400);
    }
    
    $id = intval($data['id']);
    
    // Check if student exists
    $checkStmt = $conn->prepare("SELECT id FROM siswa WHERE id = ?");
    $checkStmt->bind_param("i", $id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        sendResponse(false, 'Student not found', null, 404);
    }
    
    // Update student
    $stmt = $conn->prepare(
        "UPDATE siswa SET 
         nama = ?, 
         no_hp = ?, 
         jenis_kelamin = ?, 
         alamat = ?, 
         email = ?, 
         kelas = ?,
         metode_pembayaran = ?,
         nomor_referensi = ?
         WHERE id = ?"
    );
    
    $metodePembayaran = isset($data['metodePembayaran']) ? $data['metodePembayaran'] : null;
    $nomorReferensi = isset($data['nomorReferensi']) ? $data['nomorReferensi'] : null;
    
    $stmt->bind_param(
        "ssssssssi",
        $data['nama'],
        $data['noHp'],
        $data['jenisKelamin'],
        $data['alamat'],
        $data['email'],
        $data['kelas'],
        $metodePembayaran,
        $nomorReferensi,
        $id
    );
    
    if ($stmt->execute()) {
        sendResponse(true, 'Student updated successfully');
    } else {
        sendResponse(false, 'Failed to update student', ['error' => $stmt->error], 500);
    }
}

/**
 * DELETE - Delete student
 */
function handleDelete($conn) {
    if (!isset($_GET['id'])) {
        sendResponse(false, 'Student ID is required', null, 400);
    }
    
    $id = intval($_GET['id']);
    
    // Check if student exists
    $checkStmt = $conn->prepare("SELECT id FROM siswa WHERE id = ?");
    $checkStmt->bind_param("i", $id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        sendResponse(false, 'Student not found', null, 404);
    }
    
    // Delete student (transactions will be deleted automatically due to CASCADE)
    $stmt = $conn->prepare("DELETE FROM siswa WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        sendResponse(true, 'Student deleted successfully');
    } else {
        sendResponse(false, 'Failed to delete student', ['error' => $stmt->error], 500);
    }
}

/**
 * Format siswa data to camelCase
 */
function formatSiswa($row) {
    return [
        'id' => $row['id'],
        'nama' => $row['nama'],
        'noHp' => $row['no_hp'],
        'jenisKelamin' => $row['jenis_kelamin'],
        'alamat' => $row['alamat'],
        'email' => $row['email'],
        'kelas' => $row['kelas'],
        'saldoTabungan' => floatval($row['saldo_tabungan']),
        'metodePembayaran' => $row['metode_pembayaran'],
        'nomorReferensi' => $row['nomor_referensi'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at']
    ];
}

$conn->close();
?>
