<?php
/**
 * API Endpoint: Statistik
 * Provides statistical data about students and transactions
 */

require_once 'config.php';

$conn = getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendResponse(false, 'Method not allowed. Only GET is supported', null, 405);
}

// Get statistics
$sql = "SELECT 
    COUNT(*) as total_siswa,
    SUM(CASE WHEN jenis_kelamin = 'Laki-laki' THEN 1 ELSE 0 END) as total_laki_laki,
    SUM(CASE WHEN jenis_kelamin = 'Perempuan' THEN 1 ELSE 0 END) as total_perempuan,
    COALESCE(SUM(saldo_tabungan), 0) as total_saldo,
    COALESCE(AVG(saldo_tabungan), 0) as rata_rata_saldo
FROM siswa";

$result = $conn->query($sql);
$stats = $result->fetch_assoc();

// Get transaction statistics
$transSql = "SELECT 
    COUNT(*) as total_transaksi,
    COALESCE(SUM(CASE WHEN type = 'setor' THEN amount ELSE 0 END), 0) as total_setor,
    COALESCE(SUM(CASE WHEN type = 'tarik' THEN amount ELSE 0 END), 0) as total_tarik
FROM transaksi";

$transResult = $conn->query($transSql);
$transStats = $transResult->fetch_assoc();

// Combine statistics
$response = [
    'total' => intval($stats['total_siswa']),
    'lakiLaki' => intval($stats['total_laki_laki']),
    'perempuan' => intval($stats['total_perempuan']),
    'totalSaldo' => floatval($stats['total_saldo']),
    'rataRataSaldo' => floatval($stats['rata_rata_saldo']),
    'totalTransaksi' => intval($transStats['total_transaksi']),
    'totalSetor' => floatval($transStats['total_setor']),
    'totalTarik' => floatval($transStats['total_tarik'])
];

sendResponse(true, 'Statistics retrieved successfully', $response);

$conn->close();
?>
