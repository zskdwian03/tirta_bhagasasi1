<?php
require_once "../db.php"; 

$db = new Database();
$conn = $db->connect();

if (isset($_GET['delete'])) {
    $id = $_GET['delete'];
    $stmt = $conn->prepare("SELECT file_path FROM books WHERE id = :id");
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    $file = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($file && file_exists(__DIR__ . "/../" . $file['file_path'])) unlink(__DIR__ . "/../" . $file['file_path']);
    $stmt = $conn->prepare("DELETE FROM books WHERE id = :id");
    $stmt->bindParam(':id', $id, PDO::PARAM_INT);
    $stmt->execute();
    echo "<script>alert('🗑️ Buku berhasil dihapus!'); window.location.href='index.php';</script>";
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_FILES['pdf'])) {
    $title = $_POST['title'];
    $desc  = $_POST['description'];
    $pdf   = $_FILES['pdf'];

    if ($pdf['error'] == 0) {
        $originalName = basename($pdf['name']);
        $targetDir = "../upload/";
        if (!is_dir($targetDir)) mkdir($targetDir, 0777, true);
        $targetPath = $targetDir . $originalName;
        $dbPath = "upload/" . $originalName;
        if (file_exists($targetPath)) unlink($targetPath);

        if (move_uploaded_file($pdf['tmp_name'], $targetPath)) {
            $stmt = $conn->prepare("INSERT INTO books (title, description, file_path) VALUES (:title, :description, :file_path)");
            $stmt->bindParam(':title', $title);
            $stmt->bindParam(':description', $desc);
            $stmt->bindParam(':file_path', $dbPath);
            $stmt->execute();
            echo "<script>alert('✅ Buku berhasil diupload!'); window.location.href='index.php';</script>";
        } else {
            echo "<script>alert('❌ Gagal memindahkan file.');</script>";
        }
    } else {
        echo "<script>alert('❌ Terjadi kesalahan saat upload file.');</script>";
    }
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Admin Panel - Upload Buku</title>
<style>
  body {
    font-family: "Segoe UI", sans-serif;
    background: #eef2f7;
    margin: 0;
    padding: 40px;
  }

  .card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 18px rgba(0,0,0,0.25);
    width: 90%;
    max-width: 1000px;
    margin: 0 auto 40px auto;
    overflow: hidden;
  }
  .card-header {
    background: #04376B;
    color: white;
    font-weight: 600;
    font-size: 18px;
    padding: 14px 20px;
    letter-spacing: 0.3px;
  }
  .card-content {
    padding: 25px 30px;
  }

  form label {
    font-weight: 600;
    display: block;
    margin-bottom: 6px;
  }
  form input, form textarea {
    width: 100%;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #ccc;
    margin-bottom: 14px;
    font-size: 14px;
  }
  form button {
    width: 100%;
    background: #04376B;
    color: white;
    border: none;
    padding: 12px 0;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    letter-spacing: 0.3px;
    transition: background 0.2s ease;
  }
  form button:hover { background: #0652A0; }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    border: 1px solid black;
  }

  th, td {
    padding: 14px 16px;
    text-align: left;
    border: 1px solid black;
    font-size: 14px;
  }

  th {
    background: #04376B;
    color: white;
    font-weight: 600;
  }

  tr:hover td { 
    background: #f8faff;
  }

  .empty {
    text-align: center;
    color: #666;
    padding: 20px;
  }

  td a {
    text-decoration: none;
    color: black;
    font-size: 18px;
    margin-right: 10px;
    transition: transform 0.2s;
  }

  td a:hover {
    transform: scale(1.2);
  }

  .lihat-file {
    color: #000;
    font-weight: 200;
    font-size: 14px; 
    text-decoration: none;
  }

  .lihat-file:hover {
    text-decoration: underline;
  }
</style>
</head>
<body>

<!-- ==== CARD 1: UPLOAD ==== -->
<div class="card">
  <div class="card-header">📘 Upload Buku Baru</div>
  <div class="card-content">
    <form action="" method="POST" enctype="multipart/form-data">
      <label>Judul Buku</label>
      <input type="text" name="title" required>

      <label>Deskripsi</label>
      <textarea name="description" rows="3" placeholder="Tuliskan deskripsi singkat buku..."></textarea>

      <label>File PDF</label>
      <input type="file" name="pdf" accept="application/pdf" required>

      <button type="submit">Upload Buku</button>
    </form>
  </div>
</div>

<!-- ==== CARD 2: DAFTAR BUKU ==== -->
<div class="card">
  <div class="card-header">📚 Daftar Buku</div>
  <div class="card-content">
    <table>
      <tr>
        <th style="width:60px;">No</th>
        <th>Judul</th>
        <th>Deskripsi</th>
        <th style="width:150px;">File</th>
        <th style="width:180px;">Tanggal Upload</th>
        <th style="width:120px;">Aksi</th>
      </tr>

      <?php
      $stmt = $conn->query("SELECT * FROM books ORDER BY id DESC");
      $no = 1;
      if ($stmt->rowCount() > 0) {
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $tanggal = date("d M Y, H:i", strtotime($row['created_at']));
            $flipbookUrl = "../flipbook/index.html?file=" . urlencode("../" . $row['file_path']);
            echo "
            <tr>
              <td>{$no}</td>
              <td>{$row['title']}</td>
              <td>{$row['description']}</td>
              <td><a href='{$flipbookUrl}' target='_blank' class='lihat-file'>Lihat File</a></td>

              <td>{$tanggal}</td>
              <td>
                <a href='edit.php?id={$row['id']}'>✏️</a>
                <a href='index.php?delete={$row['id']}' onclick=\"return confirm('Yakin ingin menghapus buku ini?')\">🗑️</a>
              </td>
            </tr>";
            $no++;
        }
      } else {
        echo "<tr><td colspan='6' class='empty'>Belum ada buku yang diupload.</td></tr>";
      }
      ?>
    </table>
  </div>
</div>
</body>
</html>
