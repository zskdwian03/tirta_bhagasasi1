// ===== Elemen DOM =====
const fileInput = document.getElementById('pdf-upload');
const book = document.getElementById('book');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const resultsPanel = document.getElementById('search-results-panel');
const resultsList = document.getElementById('search-results-list');
const resultsCount = document.getElementById('search-results-count');


pdfjsLib.GlobalWorkerOptions.workerSrc =
 "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

// ===== Variabel Global =====
let current = 0;
let papers = [];
let N = 0;
let pageTexts = {}; // Simpan teks per halaman
let currentQuery = ""; 

const DURATION = 900;
document.documentElement.style.setProperty('--dur', DURATION + 'ms');

// ===== Navigasi tombol =====
nextBtn.addEventListener('click', () => flipForward());
prevBtn.addEventListener('click', () => flipBackward());

// ===== Pencarian  =====
searchBtn.addEventListener('click', () => {
 const query = searchInput.value.trim().toLowerCase();
 
 if (!query) {
  resultsPanel.style.display = 'none';
  currentQuery = "";
  clearAllHighlights();
  return;
 }
 
 currentQuery = query;
 resultsList.innerHTML = ''; 

 const pageNumber = parseInt(query);
 if (!isNaN(pageNumber)) {
  resultsPanel.style.display = 'none';
  goToPage(pageNumber);
 } else {
  const allResults = findAllOccurrences(currentQuery); 

  if (allResults.length > 0) {
   resultsCount.textContent = `${allResults.length} hasil`;
   
   allResults.forEach(result => {
    const li = document.createElement('li');
    li.dataset.page = result.pageNum;
    
    const snippet = generateSnippet(
          pageTexts[result.pageNum],
          currentQuery,
          result.index
        );

    li.innerHTML = `
     <strong>Halaman ${result.pageNum}</strong>
     <p>${snippet}</p>
    `;
    
    li.addEventListener('click', () => {
     goToPage(result.pageNum);
    });
    
    resultsList.appendChild(li);
   });

   resultsPanel.style.display = 'flex'; 
   goToPage(allResults[0].pageNum);

  } else {
   resultsPanel.style.display = 'none';
   alert(`Teks "${query}" tidak ditemukan di PDF.`);
  }
 }
});

// ===== Fungsi Snippet =====
function generateSnippet(text, query, index) {
 if (index === -1) return text.substring(0, 150) + "..."; // Fallback

 const start = Math.max(0, index - 50); 
 const end = Math.min(text.length, index + query.length + 50); 

 let snippet = text.substring(start, end);

 snippet = snippet.replace(new RegExp(escapeRegExp(query), 'gi'), (match) => {
  return `<mark>${match}</mark>`;
 });

 return (start > 0 ? "..." : "") + snippet + (end < text.length ? "..." : "");
}

function escapeRegExp(string) {
 return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


// ===== Go to Page =====
function goToPage(pageNumber) {
  let targetIndex = 0;
  if (pageNumber > 1) {
    targetIndex = Math.ceil((pageNumber - 1) / 2);
  }

 if (targetIndex < 0 || targetIndex > N) {
  alert("Halaman tidak tersedia!");
  return;
 }

 while (current < targetIndex) flipForward(true); 
 while (current > targetIndex) flipBackward(true); 

 highlightTextOnVisiblePages(currentQuery);
}

// ===== Flip book  =====
function flipForward(silent = false) { 
 if (current >= N) return;
 papers[current].classList.add('flipped');
 current++;
 updateZIndices();
 if (!silent) highlightTextOnVisiblePages(currentQuery); 
}

function flipBackward(silent = false) { 
 if (current <= 0) return;
 papers[current - 1].classList.remove('flipped');
 current--;
 updateZIndices();
 if (!silent) highlightTextOnVisiblePages(currentQuery); 
}

function updateZIndices() {
 papers.forEach((p, i) => {
  if (p.classList.contains('flipped')) p.style.zIndex = i + 1;
  else p.style.zIndex = N + (N - i);
 });
}

// ===== Load PDF  =====
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

// ===== Load PDF Pages  =====
async function loadPDF(url) {
 const pdf = await pdfjsLib.getDocument(url).promise;

 book.innerHTML = '';
 current = 0;
 papers = [];
 pageTexts = {};
 currentQuery = ""; 
 resultsPanel.style.display = 'none'; 

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
  frontContent.dataset.pageNum = i; 
  await renderPageTo(frontContent, frontPage);
  await extractText(frontPage, i);

  if (i + 1 <= pdf.numPages) {
   const backPage = await pdf.getPage(i + 1);
   backContent.dataset.pageNum = i + 1;
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
 context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

 const textLayerDiv = document.createElement("div");
 textLayerDiv.className = "textLayer";

 canvas.style.width = `${scaledViewport.width}px`;
 canvas.style.height = `${scaledViewport.height}px`;
 textLayerDiv.style.width = `${scaledViewport.width}px`;
 textLayerDiv.style.height = `${scaledViewport.height}px`;

 container.innerHTML = '';
 container.appendChild(canvas);
 container.appendChild(textLayerDiv); 

 await page.render({ canvasContext: context, viewport: scaledViewport }).promise;

 const textContent = await page.getTextContent();
 await pdfjsLib.renderTextLayer({
  textContent: textContent,
  container: textLayerDiv,
  viewport: scaledViewport,
  textDivs: []
 }).promise;
}

async function extractText(page, pageNum) {
 const textContent = await page.getTextContent();
 const strings = textContent.items.map(item => item.str);
 pageTexts[pageNum] = strings.join(' ').toLowerCase(); 
}

// ===== Cari teks =====
function findAllOccurrences(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results = [];
  const keywords = q.split(/\s+/).filter(Boolean); // pisah kata-kata (multi-kata)

  for (const [pageNum, text] of Object.entries(pageTexts)) {
    // cari frasa utuh dulu (prioritas)
    let startIndex = text.indexOf(q);
    while (startIndex !== -1) {
      results.push({ pageNum: parseInt(pageNum), index: startIndex });
      startIndex = text.indexOf(q, startIndex + 1);
    }

    // jika tidak ada frasa utuh, cari kata per kata agar tetap menampilkan hasil
    if (results.length === 0 && keywords.length > 1) {
      for (const word of keywords) {
        let i = text.indexOf(word);
        while (i !== -1) {
          results.push({ pageNum: parseInt(pageNum), index: i });
          i = text.indexOf(word, i + 1);
        }
      }
    }
  }

  // urutkan berdasarkan halaman
  return results.sort((a, b) => a.pageNum - b.pageNum || a.index - b.index);
}


// ===== FUNGSI HIGHLIGHT  =====

/**
* Menghapus highlight dengan mengembalikan innerHTML
*/
function clearAllHighlights() {
 const highlightedSpans = document.querySelectorAll('.textLayer > span[data-original-text]');
 
 highlightedSpans.forEach(span => {
  // Kembalikan ke teks aslinya
  span.innerHTML = span.dataset.originalText;
  // Hapus atributnya agar bersih untuk pencarian berikutnya
  delete span.dataset.originalText;
 });
}

/**
* Fungsi  highlight 
*/
function highlightTextOnVisiblePages(query) {
  clearAllHighlights();
  if (!query) return;

  const keywords = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  let leftPageContainer = null;
  let rightPageContainer = null;

  if (current === 0) {
    rightPageContainer = papers[0].querySelector('.side.front .content');
  } else {
    leftPageContainer = papers[current - 1].querySelector('.side.back .content');
    if (current < N) {
      rightPageContainer = papers[current].querySelector('.side.front .content');
    }
  }

  if (leftPageContainer) highlightSpansOnPage(leftPageContainer, keywords);
  if (rightPageContainer) highlightSpansOnPage(rightPageContainer, keywords);
}


/**
* Logika untuk membungkus teks di dalam span
*/
function highlightSpansOnPage(container, keywords) {
  const textLayer = container.querySelector('.textLayer');
  if (!textLayer) return;

  const spans = Array.from(textLayer.querySelectorAll('span'));
  if (spans.length === 0) return;

  spans.forEach(span => {
    const originalText = span.dataset.originalText || span.textContent;
    const lowerText = originalText.toLowerCase();

    // cari apakah span mengandung salah satu kata kunci
    const matchedWords = keywords.filter(word => lowerText.includes(word));
    if (matchedWords.length > 0) {
      if (!span.dataset.originalText) span.dataset.originalText = originalText;

      let newHtml = originalText;
      matchedWords.forEach(word => {
        const regex = new RegExp(`(${escapeRegExp(word)})`, 'gi');
        newHtml = newHtml.replace(regex, `<mark class="highlight-match">$1</mark>`);
      });
      span.innerHTML = newHtml;
    }
  });
}