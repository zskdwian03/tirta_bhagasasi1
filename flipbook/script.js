const fileInput = document.getElementById('pdf-upload');
const book = document.getElementById('book');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

let current = 0;
let papers = [];
let N = 0;
let pageTexts = {}; // Simpan teks tiap halaman

const DURATION = 900;
document.documentElement.style.setProperty('--dur', DURATION + 'ms');

// ===== Navigasi tombol =====
nextBtn.addEventListener('click', () => flipForward());
prevBtn.addEventListener('click', () => flipBackward());

// ===== Search =====
searchBtn.addEventListener('click', () => {
  const query = searchInput.value.trim();
  if (!query) {
    alert("Masukkan nomor halaman atau kata untuk dicari!");
    return;
  }

  const pageNumber = parseInt(query);
  if (!isNaN(pageNumber)) {
    goToPage(pageNumber);
  } else {
    const foundPage = findTextInPDF(query);
    if (foundPage) goToPage(foundPage);
    else alert(`Teks "${query}" tidak ditemukan di PDF.`);
  }
});

// ===== Go to Page =====
function goToPage(pageNumber) {
  const targetIndex = Math.ceil(pageNumber / 2);
  if (targetIndex < 1 || targetIndex > N) {
    alert("Halaman tidak tersedia!");
    return;
  }

  while (current < targetIndex) flipForward();
  while (current > targetIndex) flipBackward();
}

// ===== Flip book =====
function flipForward() {
  if (current >= N) return;
  papers[current].classList.add('flipped');
  current++;
  updateZIndices();
}

function flipBackward() {
  if (current <= 0) return;
  papers[current - 1].classList.remove('flipped');
  current--;
  updateZIndices();
}

function updateZIndices() {
  papers.forEach((p, i) => {
    if (p.classList.contains('flipped')) p.style.zIndex = i + 1;
    else p.style.zIndex = N + (N - i);
  });
}

// ===== Load PDF =====
window.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  let pdfFile = params.get('file'); 

  if (!pdfFile) {
    console.warn("⚠️ Tidak ada parameter file di URL, menunggu input manual...");
    return;
  }

  if (!pdfFile.startsWith('../') && !pdfFile.startsWith('./')) pdfFile = '../' + pdfFile;

  try {
    await loadPDF(pdfFile);
  } catch (e) {
    console.error("❌ Gagal memuat PDF:", e);
    alert("Gagal membuka PDF. Pastikan file ada di folder upload/ dan path-nya benar.");
  }
});

if (fileInput) {
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const fileURL = URL.createObjectURL(file);
    await loadPDF(fileURL);
  });
}

// ===== Load PDF Pages =====
async function loadPDF(url) {
  const pdf = await pdfjsLib.getDocument(url).promise;

  book.innerHTML = '';
  current = 0;
  papers = [];
  pageTexts = {};

  for (let i = 1; i <= pdf.numPages; i += 2) {
    const paper = document.createElement('div');
    paper.className = 'paper';
    paper.dataset.index = Math.ceil(i / 2);

    const front = document.createElement('div');
    front.className = 'side front';
    const frontContent = document.createElement('div');
    frontContent.className = 'content';
    front.appendChild(frontContent);
    paper.appendChild(front);

    const back = document.createElement('div');
    back.className = 'side back';
    const backContent = document.createElement('div');
    backContent.className = 'content';
    back.appendChild(backContent);
    paper.appendChild(back);

    const frontPage = await pdf.getPage(i);
    await renderPageTo(frontContent, frontPage);
    await extractText(frontPage, i);

    if (i + 1 <= pdf.numPages) {
      const backPage = await pdf.getPage(i + 1);
      await renderPageTo(backContent, backPage);
      await extractText(backPage, i + 1);
    }

    book.appendChild(paper);
    papers.push(paper);
  }

  N = papers.length;
  updateZIndices();
  console.log(`✅ Berhasil memuat ${pdf.numPages} halaman (${N} lembar)`);
}

// ===== Render PDF ke Canvas =====
async function renderPageTo(container, page) {
  const bookWidth = book.clientWidth / 2;
  const bookHeight = book.clientHeight;
  const viewport = page.getViewport({ scale: 1.4 });
  const scaleX = bookWidth / viewport.width;
  const scaleY = bookHeight / viewport.height;
  const scale = Math.min(scaleX, scaleY);
  const scaledViewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const outputScale = (window.devicePixelRatio || 1) * 2;
  canvas.width = scaledViewport.width * outputScale;
  canvas.height = scaledViewport.height * outputScale;
  canvas.style.width = `${bookWidth}px`;
  canvas.style.height = `${bookHeight}px`;
  context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

  container.innerHTML = '';
  await page.render({ canvasContext: context, viewport: scaledViewport }).promise;

  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.style.width = "100%";
  wrapper.style.height = "100%";
  wrapper.appendChild(canvas);
  container.appendChild(wrapper);
}

// ===== Ekstrak teks untuk search =====
async function extractText(page, pageNum) {
  const textContent = await page.getTextContent();
  const strings = textContent.items.map(item => item.str);
  pageTexts[pageNum] = strings.join(' ').toLowerCase();
}

// ===== Cari teks di PDF =====
function findTextInPDF(query) {
  const q = query.toLowerCase();
  for (const [pageNum, text] of Object.entries(pageTexts)) {
    if (text.includes(q)) return parseInt(pageNum);
  }
  return null;
}
  