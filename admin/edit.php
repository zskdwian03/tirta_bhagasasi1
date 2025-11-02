<?php
require_once "../db.php";
$db = new Database();
$conn = $db->connect();

$id = $_GET['id'] ?? null;

if (!$id) {
    die("ID tidak ditemukan.");
}

$stmt = $conn->prepare("SELECT * FROM books WHERE id = :id");
$stmt->bindParam(':id', $id, PDO::PARAM_INT);
$stmt->execute();
$book = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$book) {
    die("Buku tidak ditemukan.");
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $title = $_POST['title'];
    $desc  = $_POST['description'];

    $query = "UPDATE books SET title = :title, description = :description WHERE id = :id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':description', $desc);
    $stmt->bindParam(':id', $id);
    $stmt->execute();

    echo "<script>alert('Buku berhasil diperbarui!'); window.location.href='index.php';</script>";
    exit;
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Edit Buku - Admin Panel</title>
<style>
  body {
    font-family: Arial, sans-serif;
    background: #f5f6fa;
    margin: 0;
    padding: 40px;
  }

  .edit-container {
    background: white;
    padding: 30px;
    border-radius: 12px;
    width: 420px;
    margin: 0 auto;
    box-shadow: 0 3px 10px rgba(0,0,0,0.1);
  }

  .edit-header {
    text-align: left;
    color: #04376B;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 20px;
    border-bottom: 2px solid #e0e0e0;
    padding-bottom: 10px;
    
  }

  label {
    display: block;
    margin-bottom: 6px;
    font-weight: bold;
    color: #04376B;
  }

  input, textarea {
    width: 100%;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #ccc;
    margin-bottom: 14px;
    font-size: 14px;
  }

  .info-box {
    background: #eaf1ff;
    border-left: 4px solid #04376B;
    padding: 10px 12px;
    margin-bottom: 18px;
    border-radius: 6px;
    color: #04376B;
    font-size: 14px;
  }

  .button-group {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 10px;
  }

  .btn {
    padding: 10px 16px;
    border-radius: 8px;
    border: none;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.3s ease;
  }

  .btn-save {
    background: #04376B;
    color: white;
  }

  .btn-save:hover {
    background: #0652A0;
  }

  .btn-cancel {
    background: #ccc;
    color: #333;
    text-decoration: none;
    display: inline-block;
  }

  .btn-cancel:hover {
    background: #b3b3b3;
  }
</style>
</head>
<body>

<div class="edit-container">
  <div class="edit-header">Edit Buku</div>
  <form method="POST">
    <div class="info-box">
      File PDF saat ini: 
      <strong><?= htmlspecialchars(basename($book['file_path'] ?? 'Belum ada file')) ?></strong>
    </div>

    <label>Judul Buku:</label>
    <input type="text" name="title" value="<?= htmlspecialchars($book['title']) ?>" required>

    <label>Deskripsi:</label>
    <textarea name="description" rows="4"><?= htmlspecialchars($book['description']) ?></textarea>

    <div class="button-group">
      <button type="submit" class="btn btn-save">Simpan Perubahan</button>
      <a href="index.php" class="btn btn-cancel">Batal</a>
    </div>
  </form>
</div>

</body>
</html>
