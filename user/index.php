<?php
require __DIR__ . '/../db.php';

// 🔍 Fitur pencarian
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
if ($search !== '') {
  $stmt = $pdo->prepare("SELECT * FROM books WHERE title LIKE ? OR description LIKE ? ORDER BY id DESC");
  $stmt->execute(["%$search%", "%$search%"]);
  $books = $stmt->fetchAll(PDO::FETCH_ASSOC);
} else {
  $books = $pdo->query("SELECT * FROM books ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC);
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>User panel - Daftar Buku</title>
<style>
:root {
  --primary: #04376B;
  --secondary: #0061a8;
  --bg: #f0f3f9;
  --text: #04376B;
  --shadow: rgba(0,0,0,0.1);
}

body {
  font-family: "Segoe UI", Arial, sans-serif;
  background: var(--bg);
  margin: 0;
  padding: 0;
  color: var(--text);
  overflow: hidden; /* ❗Mencegah seluruh halaman ikut scroll */
}

/* === Layout utama === */
.container {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

/* === Sidebar === */
.sidebar {
  width: 300px;
  background: white;
  border-right: 2px solid #e0e0e0;
  box-shadow: 3px 0 6px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden; /* sidebar tetap fix */
}

.sidebar h2 {
  text-align: center;
  color: var(--primary);
  font-size: 20px;
  margin-bottom: 15px;
}

.search-box {
  display: flex;
  gap: 6px;
  margin-bottom: 15px;
}

.search-box input {
  flex: 1;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
}

.search-box button {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}

.search-box button:hover {
  background: var(--secondary);
}

/* daftar buku */
.book-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto; /* ✅ Hanya daftar buku yang bisa di-scroll */
  flex: 1;
  padding-right: 5px;
}

.book-item {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 10px;
  box-shadow: 0 2px 4px var(--shadow);
  transition: all 0.2s ease;
  cursor: pointer;
}

.book-item:hover {
  background: var(--primary);
  color: white;
}

.book-item strong {
  font-size: 15px;
}

.book-item small {
  font-size: 13px;
  opacity: 0.9;
}

/* === Area utama === */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 40px;
  overflow: hidden; /* ❗Tidak ikut scroll */
}

.welcome {
  font-size: 20px;
  margin-top: 20px;
  color: var(--primary);
  font-weight: 600;
}

footer {
  text-align: center;
  background: var(--primary);
  color: white;
  padding: 10px;
  font-size: 14px;
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
}

@media (max-width: 800px) {
  body {
    overflow: auto; /* biar di HP tetap bisa scroll */
  }
  .container {
    flex-direction: column;
    height: auto;
  }
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 2px solid #e0e0e0;
    overflow: visible;
  }
  .book-list {
    max-height: 300px;
  }
}
</style>
</head>
<body>

<div class="container">
  <!-- Sidebar -->
  <div class="sidebar">
    <h2>📚 Daftar Buku</h2>
    <form method="get" class="search-box">
      <input type="text" name="search" placeholder="Cari buku" value="<?= htmlspecialchars($search) ?>">
      <button type="submit">Cari</button>
    </form>

    <div class="book-list">
      <?php if (count($books) === 0): ?>
        <p style="text-align:center;">Tidak ada buku ditemukan.</p>
      <?php else: ?>
        <?php foreach ($books as $book): ?>
          <div class="book-item" onclick="openFlipbook('<?= htmlspecialchars($book['file_path']) ?>')">
            <strong><?= htmlspecialchars($book['title']) ?></strong><br>
            <small><?= htmlspecialchars(mb_strimwidth($book['description'], 0, 60, '...')) ?></small>
          </div>
        <?php endforeach; ?>
      <?php endif; ?>
    </div>
  </div>

  <!-- Main Content -->
  <div class="main-content">
    <div class="welcome">✨  Halo, Selamat Datang!</div>
    <p style="max-width:600px;line-height:1.6;">
      Selamat datang di<strong> Flipbook PDF</strong> dengan tampilan flipbook yang menarik.  
      Klik salah satu buku di sidebar kiri untuk mulai membaca dan menikmati pengalaman membaca yang seru 📖✨
    </p>
  </div>
</div>

<footer>© <?= date('Y') ?> Flipbook - PDF</footer>

<script>
function openFlipbook(filePath) {
  window.open("../flipbook/index.html?file=" + encodeURIComponent("../" + filePath), "_blank");
}
</script>

</body>
</html>
