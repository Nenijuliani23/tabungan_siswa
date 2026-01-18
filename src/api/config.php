<?php
/**
 * Database Configuration
 * Tabungan Siswa - SMA Harapan Bandar Pulo
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'tabungan_siswa');

/**
 * Get Database Connection
 */
function getConnection() {
    try {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            throw new Exception("Connection failed: " . $conn->connect_error);
        }
        
        $conn->set_charset("utf8mb4");
        return $conn;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed',
            'error' => $e->getMessage()
        ]);
        exit();
    }
}

/**
 * Send JSON Response
 */
function sendResponse($success, $message, $data = null, $code = 200) {
    http_response_code($code);
    $response = [
        'success' => $success,
        'message' => $message
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response);
    exit();
}

/**
 * Get JSON Input
 */
function getJsonInput() {
    $json = file_get_contents('php://input');
    return json_decode($json, true);
}

/**
 * Validate Required Fields
 */
function validateRequired($data, $fields) {
    $missing = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            $missing[] = $field;
        }
    }
    return $missing;
}
?>
