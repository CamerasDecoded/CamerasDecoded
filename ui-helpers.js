// js/ui-helpers.js
// Toast
export function cdToast(message, type = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast' + (type === 'error' ? ' error' : '');
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Confirm Dialog (simple overlay)
export function cdConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(6px);
      z-index:99999; display:flex; align-items:center; justify-content:center;
    `;
    const modal = document.createElement('div');
    modal.style.cssText = `
      background:#0F0F0F; border:1px solid var(--green); border-radius:16px;
      padding:32px 28px; max-width:400px; width:90%; text-align:center;
      box-shadow:0 0 60px rgba(141,235,0,0.1);
    `;
    modal.innerHTML = `
      <h3 style="font-family:'Space Mono',monospace;color:var(--green);margin-bottom:8px;">Are you sure?</h3>
      <p style="color:var(--text-muted);margin-bottom:20px;">${message}</p>
      <div style="display:flex;gap:12px;">
        <button class="btn-secondary" style="flex:1;" id="confirmNo">Cancel</button>
        <button class="btn-primary" style="flex:1;" id="confirmYes">Yes, do it</button>
      </div>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    overlay.querySelector('#confirmNo').onclick = () => { overlay.remove(); resolve(false); };
    overlay.querySelector('#confirmYes').onclick = () => { overlay.remove(); resolve(true); };
  });
}

// Confetti
export function triggerConfetti() {
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;z-index:10000;pointer-events:none;';
  document.body.appendChild(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const colors = ['#8deb00', '#00e5ff', '#ff6b6b', '#ffd93d', '#a855f7', '#ff8800'];
  const particles = [];
  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.3 - 50,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: Math.random() * 4 + 2,
      vx: (Math.random() - 0.5) * 3,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 6,
      opacity: 1
    });
  }
  let frame = 0;
  const maxFrames = 150;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rotation += p.rotSpeed; p.vy += 0.05;
      if (frame > 60) p.opacity -= 0.008;
      if (p.opacity > 0 && p.y < canvas.height + 20) {
        alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
      }
    });
    frame++;
    if (alive && frame < maxFrames) requestAnimationFrame(animate);
    else { canvas.remove(); }
  }
  animate();
}

// Particles (background)
export function initParticles() {
  const canvas = document.createElement('canvas');
  canvas.id = 'particles-bg';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;pointer-events:none;opacity:0.4;';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');
  let w, h;
  const particles = [];
  const count = 80;
  function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();
  class Particle { constructor() { this.x = Math.random()*w; this.y = Math.random()*h; this.size = Math.random()*2+0.5; this.speedX = (Math.random()-0.5)*0.3; this.speedY = (Math.random()-0.5)*0.3; this.opacity = Math.random()*0.3+0.05; } update() { this.x += this.speedX; this.y += this.speedY; if (this.x < 0 || this.x > w) this.speedX *= -1; if (this.y < 0 || this.y > h) this.speedY *= -1; } draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fillStyle = `rgba(141,235,0,${this.opacity})`; ctx.fill(); } }
  for (let i = 0; i < count; i++) particles.push(new Particle());
  function animate() { ctx.clearRect(0,0,w,h); particles.forEach(p => { p.update(); p.draw(); }); requestAnimationFrame(animate); }
  animate();
}