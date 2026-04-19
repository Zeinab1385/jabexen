// sign-animation.js - نسخه نهایی و درست برای FastAPI + Pydantic (JSON)

const API_URL = "http://127.0.0.1:8000/auth";

// ========== PARTICLE BACKGROUND (بدون تغییر) ==========
function initParticles() {
    const container = document.getElementById('particles-js');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let particles = [];
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    class Particle {
        constructor() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.size = Math.random() * 3.5 + 0.5;
            this.speedX = Math.random() * 1.2 - 0.6;
            this.speedY = Math.random() * 1.2 - 0.6;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > w) this.speedX *= -1;
            if (this.y < 0 || this.y > h) this.speedY *= -1;
        }
        draw() {
            ctx.fillStyle = '#67e8f9';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function connect() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 130) {
                    ctx.strokeStyle = `rgba(103, 232, 249, ${1 - distance / 130})`;
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => { p.update(); p.draw(); });
        connect();
        requestAnimationFrame(animate);
    }

    for (let i = 0; i < 160; i++) particles.push(new Particle());
    animate();

    window.addEventListener('resize', () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    });
}

// ========== MAIN ==========
document.addEventListener('DOMContentLoaded', () => {
    initParticles();

    const card = document.getElementById('auth-card');
    if (!card) return;

    const toSignup = document.getElementById('to-signup');
    const toSignin = document.getElementById('to-signin');

    if (toSignup) toSignup.addEventListener('click', (e) => { e.preventDefault(); card.classList.add('is-flipped'); });
    if (toSignin) toSignin.addEventListener('click', (e) => { e.preventDefault(); card.classList.remove('is-flipped'); });

    // 3D Mouse Tilt
    const container = document.querySelector('.max-w-md');
    if (container) {
        container.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const rotateX = (y - 0.5) * -25;
            const rotateY = (x - 0.5) * 25;
            card.style.transition = 'none';
            card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        container.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
            card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
        });
    }

    // ==================== SIGN UP (JSON) ====================
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const payload = Object.fromEntries(formData.entries());   // تبدیل به object

            try {
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },   // مهم: JSON
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (res.ok) {
                    alert("✅ تبریک! حساب شما با موفقیت ساخته شد.\nحالا وارد شوید.");
                    card.classList.remove('is-flipped');
                } else {
                    console.error("Server Error:", data);
                    let errorMsg = "خطای ناشناخته";
                    if (data.detail) {
                        if (typeof data.detail === 'string') errorMsg = data.detail;
                        else if (Array.isArray(data.detail)) errorMsg = data.detail.map(err => err.msg || err).join('\n');
                        else errorMsg = JSON.stringify(data.detail, null, 2);
                    }
                    alert("❌ خطا:\n" + errorMsg);
                }
            } catch (err) {
                console.error(err);
                alert("خطا در اتصال به سرور!\nمطمئن شوید uvicorn در حال اجراست.");
            }
        });
    }

    // ==================== SIGN IN (JSON) ====================
    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const payload = Object.fromEntries(formData.entries());

            try {
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (res.ok) {
                    alert(`👾 خوش آمدید ${data.user.username}`);
                    window.location.href = "index.html";
                } else {
                    console.error("Server Error:", data);
                    let errorMsg = "نام کاربری یا رمز عبور اشتباه است";
                    if (data.detail) {
                        if (typeof data.detail === 'string') errorMsg = data.detail;
                        else if (Array.isArray(data.detail)) errorMsg = data.detail.map(err => err.msg || err).join('\n');
                        else errorMsg = JSON.stringify(data.detail);
                    }
                    alert("❌ خطا:\n" + errorMsg);
                }
            } catch (err) {
                console.error(err);
                alert("خطا در اتصال به سرور.");
            }
        });
    }
});