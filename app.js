// ===============================
// Canvas / Context
// ===============================
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// ===============================
// 状態
// ===============================
let scale = 1;
const minScale = 0.5;
const maxScale = 5;

let offsetX = 0;
let offsetY = 0;

let isDrawing = false;
let lastX = 0;
let lastY = 0;

let lastDistance = null;

// 手書きデータ
const strokes = [];
let currentStroke = null;

// ===============================
// 画像（1回だけ読み込み）
// ===============================
const baseImage = new Image();

// ★ テスト用（最初に表示したい画像があれば）
// baseImage.src = 'sample.jpg';

baseImage.onload = () => {
  draw();
};

// ===============================
// Canvas サイズ（固定）
// ===============================
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ===============================
// 描画（1か所に集約）
// ===============================
function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  ctx.drawImage(baseImage, 0, 0);

  // 手書き再描画
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;

  for (const stroke of strokes) {
    ctx.beginPath();
    stroke.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  }
}

// ===============================
// ユーティリティ
// ===============================
function getDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

function getCanvasPoint(touch) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (touch.clientX - rect.left - offsetX) / scale,
    y: (touch.clientY - rect.top - offsetY) / scale
  };
}

// ===============================
// タッチイベント
// ===============================
canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    // 手書き開始
    isDrawing = true;
    currentStroke = [];

    const p = getCanvasPoint(e.touches[0]);
    currentStroke.push(p);
    strokes.push(currentStroke);

    lastX = p.x;
    lastY = p.y;
  }

  if (e.touches.length === 2) {
    // ピンチ開始
    lastDistance = getDistance(e.touches);
  }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 1 && isDrawing) {
    e.preventDefault();

    const p = getCanvasPoint(e.touches[0]);
    currentStroke.push(p);

    lastX = p.x;
    lastY = p.y;

    draw();
  }

  if (e.touches.length === 2) {
    e.preventDefault();

    const newDistance = getDistance(e.touches);
    const zoom = newDistance / lastDistance;

    const newScale = Math.min(
      maxScale,
      Math.max(minScale, scale * zoom)
    );

    const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

    offsetX = centerX - (centerX - offsetX) * (newScale / scale);
    offsetY = centerY - (centerY - offsetY) * (newScale / scale);

    scale = newScale;
    lastDistance = newDistance;

    draw();
  }
}, { passive: false });

canvas.addEventListener('touchend', () => {
  isDrawing = false;
  lastDistance = null;
});
// ===============================
// 画像読み込み（file input）
// ===============================
const fileInput = document.getElementById('fileInput');

fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    baseImage.src = reader.result;

    // 状態リセット
    scale = 1;
    offsetX = 0;
    offsetY = 0;
    strokes.length = 0;
  };
  reader.readAsDataURL(file);
});

