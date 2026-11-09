// File: tracker.js
// Deskripsi: Menangani Face Tracking menggunakan Tracking.js & Desain Kacamata Kotak

window.faceData = { x: 0.5, y: 0.46, w: 0.38 };
let tracker = null;
let trackTask = null;

// Fungsi Menggambar Kacamata Kotak Hitam Terpisah
window.drawFx = function(ctx, W, H, effectKey, f) {
  if (effectKey !== 'sun') return;
  const cx = f.x * W, cy = f.y * H, w = f.w * W;
  
  // Posisi mata (sedikit di atas titik tengah bounding box wajah)
  const eyeY = cy - w * 0.15; 
  const gw = w * 0.36; // Lebar satu lensa kaca
  const gh = gw * 0.6; // Tinggi lensa kaca
  const gap = w * 0.1; // Jarak celah antar kaca (bridge)

  ctx.save();
  ctx.fillStyle = '#111'; // Hitam pekat
  ctx.strokeStyle = '#111';
  ctx.lineWidth = w * 0.035;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Lensa Kiri & Kanan (Bentuk Kotak)
  ctx.fillRect(cx - gap/2 - gw, eyeY - gh/2, gw, gh);
  ctx.fillRect(cx + gap/2, eyeY - gh/2, gw, gh);
  
  // Garis sambungan (Bridge hidung)
  ctx.beginPath();
  ctx.moveTo(cx - gap/2, eyeY - gh*0.1);
  ctx.lineTo(cx + gap/2, eyeY - gh*0.1);
  ctx.stroke();
  
  // Tangkai Kiri & Kanan
  ctx.beginPath();
  ctx.moveTo(cx - gap/2 - gw, eyeY - gh*0.1);
  ctx.lineTo(cx - gap/2 - gw - w*0.08, eyeY - gh*0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + gap/2 + gw, eyeY - gh*0.1);
  ctx.lineTo(cx + gap/2 + gw + w*0.08, eyeY - gh*0.2);
  ctx.stroke();
  
  ctx.restore();
};

// Inisialisasi Face Tracker dari Library
window.initTracker = function() {
  if (tracker || typeof tracking === 'undefined') return;
  
  tracker = new tracking.ObjectTracker('face');
  tracker.setInitialScale(4);
  tracker.setStepSize(2);
  tracker.setEdgesDensity(0.1);

  tracker.on('track', function(event) {
    if (event.data.length > 0 && window.fx === 'sun') {
      let rect = event.data[0]; 
      let v = document.getElementById('v');
      if(!v || !v.videoWidth) return;
      
      let nx = (rect.x + rect.width / 2) / v.videoWidth;
      let ny = (rect.y + rect.height / 2) / v.videoHeight;
      let nw = rect.width / v.videoWidth * 1.3; // Lebar kacamata menyesuaikan wajah

      let m = window.mirror && window.facing === 'user';
      let tx = m ? 1 - nx : nx;
      
      // Smoothing pergerakan agar kacamata bergerak mulus (responsif)
      window.faceData.x += (tx - window.faceData.x) * 0.25;
      window.faceData.y += (ny - window.faceData.y) * 0.25;
      window.faceData.w += (nw - window.faceData.w) * 0.25;
    }
  });
  
  trackTask = tracking.track('#v', tracker);
};

// Loop Animasi untuk menempelkan kacamata secara real-time
function trackingLoop() {
  const v = document.getElementById('v');
  const c = document.getElementById('fc');
  
  if (v && v.videoWidth) {
    if (c.width !== v.videoWidth || c.height !== v.videoHeight) {
      c.width = v.videoWidth;
      c.height = v.videoHeight;
    }
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    
    if (window.fx === 'sun') {
      window.drawFx(ctx, c.width, c.height, window.fx, window.faceData);
    }
  }
  requestAnimationFrame(trackingLoop);
}

// Interaksi geser manual (sebagai backup)
window.addEventListener('DOMContentLoaded', () => {
  const fc = document.getElementById('fc');
  const sz = document.getElementById('sz');

  function moveFx(e) {
    if (window.fx !== 'sun' || !(e.buttons || e.pointerType === 'touch')) return;
    const r = fc.getBoundingClientRect();
    window.faceData.x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    window.faceData.y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
  }

  if (fc) {
    fc.onpointerdown = e => {
      if (e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId);
      moveFx(e);
    };
    fc.onpointermove = moveFx;
  }
  if (sz) {
    sz.oninput = e => { window.faceData.w = e.target.value / 100; };
  }

  requestAnimationFrame(trackingLoop);
});