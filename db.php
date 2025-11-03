<?php
class Database {
    private $host = "127.0.0.1";      // tidak perlu menulis :3306, default port MySQL sudah 3306
    private $port = "3306";           // tambahkan properti port agar lebih fleksibel
    private $db_name = "d_flipbook"; // ganti sesuai nama database kamu
    private $username = "root"; 
    private $password = ""; 
    private $conn;

    public function connect() {
        $this->conn = null;
        try {
            // Membuat koneksi PDO
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset=utf8";
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            // Pesan error jika koneksi gagal
            die("❌ Koneksi ke database gagal: " . $e->getMessage());
        }
        return $this->conn;
    }
}

// ✅ Gunakan ini agar bisa dipanggil di file lain langsung:
$database = new Database();
$pdo = $database->connect();
?>
