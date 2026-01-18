-- ========================================
-- DATABASE SETUP: Tabungan Siswa
-- SMA Harapan Bandar Pulo
-- ========================================

-- 1. CREATE DATABASE
CREATE DATABASE IF NOT EXISTS tabungan_siswa;
USE tabungan_siswa;

-- ========================================
-- 2. TABLE: siswa
-- ========================================
CREATE TABLE IF NOT EXISTS siswa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    no_hp VARCHAR(20) NOT NULL,
    jenis_kelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
    alamat TEXT NOT NULL,
    email VARCHAR(100) NOT NULL,
    kelas VARCHAR(20) NOT NULL,
    saldo_tabungan DECIMAL(15, 2) DEFAULT 0.00,
    metode_pembayaran VARCHAR(50),
    nomor_referensi VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nama (nama),
    INDEX idx_kelas (kelas),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 3. TABLE: transaksi
-- ========================================
CREATE TABLE IF NOT EXISTS transaksi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    nama_siswa VARCHAR(100) NOT NULL,
    type ENUM('setor', 'tarik') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    saldo_sebelum DECIMAL(15, 2) NOT NULL,
    saldo_sesudah DECIMAL(15, 2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_siswa_id (siswa_id),
    INDEX idx_type (type),
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- 4. SAMPLE DATA (Optional)
-- ========================================

-- Sample Siswa
INSERT INTO siswa (nama, no_hp, jenis_kelamin, alamat, email, kelas, saldo_tabungan, metode_pembayaran, nomor_referensi) VALUES
('Ahmad Rizki Pratama', '081234567890', 'Laki-laki', 'Jl. Merdeka No. 123, Bandar Pulo', 'ahmad.rizki@email.com', 'X IPA 1', 500000.00, 'Transfer Bank', 'TRF001'),
('Siti Nurhaliza', '082345678901', 'Perempuan', 'Jl. Pendidikan No. 45, Bandar Pulo', 'siti.nurhaliza@email.com', 'X IPA 2', 750000.00, 'QRIS', 'QRIS002'),
('Budi Santoso', '083456789012', 'Laki-laki', 'Jl. Harapan No. 67, Bandar Pulo', 'budi.santoso@email.com', 'X IPS 1', 300000.00, 'Tunai', NULL),
('Dewi Lestari', '084567890123', 'Perempuan', 'Jl. Sejahtera No. 89, Bandar Pulo', 'dewi.lestari@email.com', 'X IPS 2', 450000.00, 'E-Wallet', 'EWLT003'),
('Reza Firmansyah', '085678901234', 'Laki-laki', 'Jl. Cendekia No. 12, Bandar Pulo', 'reza.firmansyah@email.com', 'XI IPA 1', 600000.00, 'Transfer Bank', 'TRF004');

-- Sample Transaksi
INSERT INTO transaksi (siswa_id, nama_siswa, type, amount, saldo_sebelum, saldo_sesudah) VALUES
(1, 'Ahmad Rizki Pratama', 'setor', 200000.00, 300000.00, 500000.00),
(2, 'Siti Nurhaliza', 'setor', 250000.00, 500000.00, 750000.00),
(3, 'Budi Santoso', 'setor', 300000.00, 0.00, 300000.00),
(4, 'Dewi Lestari', 'setor', 150000.00, 300000.00, 450000.00),
(4, 'Dewi Lestari', 'tarik', 50000.00, 500000.00, 450000.00),
(5, 'Reza Firmansyah', 'setor', 400000.00, 200000.00, 600000.00);

-- ========================================
-- 5. VIEWS (Optional - untuk kemudahan query)
-- ========================================

-- View untuk statistik
CREATE OR REPLACE VIEW view_statistik AS
SELECT 
    COUNT(*) as total_siswa,
    SUM(CASE WHEN jenis_kelamin = 'Laki-laki' THEN 1 ELSE 0 END) as total_laki_laki,
    SUM(CASE WHEN jenis_kelamin = 'Perempuan' THEN 1 ELSE 0 END) as total_perempuan,
    SUM(saldo_tabungan) as total_saldo,
    AVG(saldo_tabungan) as rata_rata_saldo,
    (SELECT COUNT(*) FROM transaksi) as total_transaksi,
    (SELECT SUM(amount) FROM transaksi WHERE type = 'setor') as total_setor,
    (SELECT SUM(amount) FROM transaksi WHERE type = 'tarik') as total_tarik
FROM siswa;

-- ========================================
-- 6. STORED PROCEDURES (Optional)
-- ========================================

DELIMITER //

-- Procedure untuk menambah siswa
CREATE PROCEDURE sp_tambah_siswa(
    IN p_nama VARCHAR(100),
    IN p_no_hp VARCHAR(20),
    IN p_jenis_kelamin VARCHAR(20),
    IN p_alamat TEXT,
    IN p_email VARCHAR(100),
    IN p_kelas VARCHAR(20),
    IN p_saldo_tabungan DECIMAL(15,2),
    IN p_metode_pembayaran VARCHAR(50),
    IN p_nomor_referensi VARCHAR(100)
)
BEGIN
    INSERT INTO siswa (nama, no_hp, jenis_kelamin, alamat, email, kelas, saldo_tabungan, metode_pembayaran, nomor_referensi)
    VALUES (p_nama, p_no_hp, p_jenis_kelamin, p_alamat, p_email, p_kelas, p_saldo_tabungan, p_metode_pembayaran, p_nomor_referensi);
    
    SELECT LAST_INSERT_ID() as id;
END //

-- Procedure untuk transaksi setor/tarik
CREATE PROCEDURE sp_transaksi(
    IN p_siswa_id INT,
    IN p_type VARCHAR(10),
    IN p_amount DECIMAL(15,2)
)
BEGIN
    DECLARE v_nama_siswa VARCHAR(100);
    DECLARE v_saldo_sebelum DECIMAL(15,2);
    DECLARE v_saldo_sesudah DECIMAL(15,2);
    
    -- Get current balance and name
    SELECT nama, saldo_tabungan INTO v_nama_siswa, v_saldo_sebelum
    FROM siswa WHERE id = p_siswa_id;
    
    -- Calculate new balance
    IF p_type = 'setor' THEN
        SET v_saldo_sesudah = v_saldo_sebelum + p_amount;
    ELSE
        SET v_saldo_sesudah = v_saldo_sebelum - p_amount;
    END IF;
    
    -- Check if balance is sufficient for withdrawal
    IF p_type = 'tarik' AND v_saldo_sesudah < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Saldo tidak mencukupi';
    END IF;
    
    -- Update siswa balance
    UPDATE siswa SET saldo_tabungan = v_saldo_sesudah WHERE id = p_siswa_id;
    
    -- Insert transaction record
    INSERT INTO transaksi (siswa_id, nama_siswa, type, amount, saldo_sebelum, saldo_sesudah)
    VALUES (p_siswa_id, v_nama_siswa, p_type, p_amount, v_saldo_sebelum, v_saldo_sesudah);
    
    SELECT LAST_INSERT_ID() as transaction_id;
END //

DELIMITER ;

-- ========================================
-- 7. GRANT PERMISSIONS (Optional)
-- ========================================
-- Uncomment and modify if you need to create a specific user
-- CREATE USER IF NOT EXISTS 'tabungan_user'@'localhost' IDENTIFIED BY 'your_password';
-- GRANT ALL PRIVILEGES ON tabungan_siswa.* TO 'tabungan_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ========================================
-- END OF SETUP
-- ========================================
