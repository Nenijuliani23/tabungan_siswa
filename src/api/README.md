# API Documentation - Tabungan Siswa SMA Harapan Bandar Pulo

## 📋 Overview

RESTful API untuk aplikasi manajemen tabungan siswa yang dibangun dengan PHP dan MySQL.

## 🔧 Setup & Installation

### 1. Database Setup

1. Buka phpMyAdmin atau MySQL client
2. Import file `setup_database.sql` yang ada di folder `database/`
3. Database `tabungan_siswa` akan otomatis terbuat dengan:
   - Table `siswa`
   - Table `transaksi`
   - Sample data (optional)
   - Views dan Stored Procedures

### 2. API Configuration

1. Copy folder `api/` ke folder `htdocs/api-tabungan/` (untuk XAMPP)
2. Pastikan XAMPP/Apache sudah running
3. Edit file `config.php` jika perlu (ubah DB credentials):
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   define('DB_NAME', 'tabungan_siswa');
   ```

### 3. Testing

Buka browser atau Postman:

```
https://tabungansiswa.rplbc-23.com/api-tabungan/siswa.php
```

---

## 📡 API Endpoints

### Base URL

```
https://tabungansiswa.rplbc-23.com/api-tabungan
```

---

## 1️⃣ Siswa API (`/siswa.php`)

### **GET** - Get All Students

**Request:**

```http
GET /siswa.php
```

**Response (200):**

```json
{
  "success": true,
  "message": "Students retrieved successfully",
  "data": [
    {
      "id": 1,
      "nama": "Ahmad Rizki Pratama",
      "noHp": "081234567890",
      "jenisKelamin": "Laki-laki",
      "alamat": "Jl. Merdeka No. 123, Bandar Pulo",
      "email": "ahmad.rizki@email.com",
      "kelas": "X IPA 1",
      "saldoTabungan": 500000,
      "metodePembayaran": "Transfer Bank",
      "nomorReferensi": "TRF001",
      "createdAt": "2026-01-14 07:00:00",
      "updatedAt": "2026-01-14 07:00:00"
    }
  ]
}
```

---

### **GET** - Get Student by ID

**Request:**

```http
GET /siswa.php?id=1
```

**Response (200):**

```json
{
  "success": true,
  "message": "Student found",
  "data": {
    "id": 1,
    "nama": "Ahmad Rizki Pratama",
    "noHp": "081234567890",
    ...
  }
}
```

---

### **POST** - Create New Student

**Request:**

```http
POST /siswa.php
Content-Type: application/json

{
  "nama": "Budi Santoso",
  "noHp": "081234567891",
  "jenisKelamin": "Laki-laki",
  "alamat": "Jl. Harapan No. 45",
  "email": "budi@email.com",
  "kelas": "X IPA 2",
  "saldoTabungan": 100000,
  "metodePembayaran": "Tunai",
  "nomorReferensi": ""
}
```

**Required Fields:**

- `nama`
- `noHp`
- `jenisKelamin`
- `alamat`
- `email`
- `kelas`

**Optional Fields:**

- `saldoTabungan` (default: 0)
- `metodePembayaran`
- `nomorReferensi`

**Response (201):**

```json
{
  "success": true,
  "message": "Student created successfully",
  "data": {
    "id": 6
  }
}
```

> **Note:** Jika `saldoTabungan > 0`, sistem otomatis membuat record transaksi "setor" pertama.

---

### **PUT** - Update Student

**Request:**

```http
PUT /siswa.php
Content-Type: application/json

{
  "id": 1,
  "nama": "Ahmad Rizki Pratama (Updated)",
  "noHp": "081234567890",
  "jenisKelamin": "Laki-laki",
  "alamat": "Jl. Merdeka No. 123, Bandar Pulo",
  "email": "ahmad.rizki@email.com",
  "kelas": "XI IPA 1",
  "metodePembayaran": "Transfer Bank",
  "nomorReferensi": "TRF001"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Student updated successfully"
}
```

> **Note:** Saldo tidak bisa diubah melalui endpoint ini, gunakan `/transaksi.php`

---

### **DELETE** - Delete Student

**Request:**

```http
DELETE /siswa.php?id=1
```

**Response (200):**

```json
{
  "success": true,
  "message": "Student deleted successfully"
}
```

> **Note:** Semua transaksi siswa akan otomatis terhapus (CASCADE)

---

## 2️⃣ Transaksi API (`/transaksi.php`)

### **GET** - Get All Transactions

**Request:**

```http
GET /transaksi.php
```

**Response (200):**

```json
{
  "success": true,
  "message": "Transactions retrieved successfully",
  "data": [
    {
      "id": 1,
      "siswaId": 1,
      "namaSiswa": "Ahmad Rizki Pratama",
      "type": "setor",
      "amount": 200000,
      "saldoSebelum": 300000,
      "saldoSesudah": 500000,
      "timestamp": "2026-01-14 07:00:00"
    }
  ]
}
```

---

### **GET** - Get Transactions by Student

**Request:**

```http
GET /transaksi.php?siswa_id=1
```

---

### **POST** - Create Transaction (Setor/Tarik)

**Request (Setor):**

```http
POST /transaksi.php
Content-Type: application/json

{
  "siswaId": 1,
  "type": "setor",
  "amount": 100000
}
```

**Request (Tarik):**

```http
POST /transaksi.php
Content-Type: application/json

{
  "siswaId": 1,
  "type": "tarik",
  "amount": 50000
}
```

**Required Fields:**

- `siswaId` (integer)
- `type` (string: "setor" atau "tarik")
- `amount` (number > 0)

**Response (201):**

```json
{
  "success": true,
  "message": "Transaction completed successfully",
  "data": {
    "id": 7,
    "saldoSebelum": 500000,
    "saldoSesudah": 600000
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Saldo tidak mencukupi untuk penarikan"
}
```

> **Note:**
>
> - Transaksi menggunakan database transaction untuk memastikan atomicity
> - Saldo siswa otomatis ter-update
> - Validasi saldo dilakukan untuk transaksi "tarik"

---

### **DELETE** - Delete Transaction

**Request:**

```http
DELETE /transaksi.php?id=1
```

**Response (200):**

```json
{
  "success": true,
  "message": "Transaction deleted successfully"
}
```

> **⚠️ Warning:** Menghapus transaksi TIDAK akan membalikkan perubahan saldo!

---

## 3️⃣ Statistik API (`/statistik.php`)

### **GET** - Get Statistics

**Request:**

```http
GET /statistik.php
```

**Response (200):**

```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "total": 5,
    "lakiLaki": 3,
    "perempuan": 2,
    "totalSaldo": 2600000,
    "rataRataSaldo": 520000,
    "totalTransaksi": 10,
    "totalSetor": 1500000,
    "totalTarik": 200000
  }
}
```

---

## 🔐 Error Responses

### 400 - Bad Request

```json
{
  "success": false,
  "message": "Missing required fields: nama, email"
}
```

### 404 - Not Found

```json
{
  "success": false,
  "message": "Student not found"
}
```

### 405 - Method Not Allowed

```json
{
  "success": false,
  "message": "Method not allowed"
}
```

### 500 - Internal Server Error

```json
{
  "success": false,
  "message": "Database connection failed",
  "error": "Connection refused"
}
```

---

## 🧪 Testing dengan Postman

### Import Collection

Buat Postman collection dengan endpoints di atas.

### Environment Variables

```
base_url: https://tabungansiswa.rplbc-23.com/api-tabungan
```

### Test Flow

1. **Create Student** → POST `/siswa.php`
2. **Get All Students** → GET `/siswa.php`
3. **Create Transaction** → POST `/transaksi.php`
4. **Get Statistics** → GET `/statistik.php`
5. **Update Student** → PUT `/siswa.php`
6. **Delete Transaction** → DELETE `/transaksi.php?id=1`
7. **Delete Student** → DELETE `/siswa.php?id=1`

---

## 📝 Notes

### CORS Headers

API sudah dilengkapi dengan CORS headers untuk development:

```php
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### Character Encoding

Database dan API menggunakan `utf8mb4` untuk mendukung karakter Unicode penuh.

### Database Transactions

Endpoint `/transaksi.php` menggunakan MySQL transaction (`BEGIN`, `COMMIT`, `ROLLBACK`) untuk memastikan data consistency.

---

## 🔧 Troubleshooting

### Error: Database connection failed

- Pastikan XAMPP/MySQL sudah running
- Cek credentials di `config.php`
- Pastikan database `tabungan_siswa` sudah dibuat

### Error: 404 Not Found

- Pastikan file API ada di `htdocs/api-tabungan/`
- Cek spelling URL
- Pastikan Apache sudah running

### Error: CORS Error

- Jika masih error CORS, tambahkan header di Apache config
- Atau gunakan Chrome extension untuk disable CORS saat development

---

## 📞 Support

Untuk pertanyaan atau issue, hubungi tim development.

---

**© 2026 SMA Harapan Bandar Pulo - Aplikasi Tabungan Siswa**
