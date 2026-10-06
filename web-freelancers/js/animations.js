/**
 * Web Freelancers - Advanced Animations & Interactive Engine
 * High-performance canvas particle network, 3D card tilt, typewriter,
 * animated stats counter, social proof ticker, and audio synthesizer.
 */

// ==========================================
// 1. Web Audio Synthesizer (Zero-dependency SFX)
// ==========================================
class SoundEffects {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
        }
    }

    playPop() {
        if (!this.enabled) return;
        try {
            this.init();
            if (this.ctx.state === 'suspended') this.ctx.resume();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.08);
        } catch (e) {
            // Audio policy fallback
        }
    }

    playChime() {
        if (!this.enabled) return;
        try {
            this.init();
            if (this.ctx.state === 'suspended') this.ctx.resume();
            const now = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                gain.gain.setValueAtTime(0.06, now + idx * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.25);
            });
        } catch (e) {}
    }

    playDing() {
        if (!this.enabled) return;
        try {
            this.init();
            if (this.ctx.state === 'suspended') this.ctx.resume();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.3);
        } catch (e) {}
    }
}

window.wfAudio = new SoundEffects();

// ==========================================
// 2. Interactive Cyber Particle Canvas
// ==========================================
class ParticleNetwork {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = window.innerWidth < 768 ? 35 : 75;
        this.maxDistance = 140;
        this.mouse = { x: null, y: null, radius: 150 };

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        window.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        window.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });

        this.createParticles();
        this.animate();
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent ? parent.offsetWidth : window.innerWidth;
        this.canvas.height = parent ? parent.offsetHeight : window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                radius: Math.random() * 2 + 1,
                color: Math.random() > 0.4 ? 'rgba(0, 168, 255,' : 'rgba(245, 158, 11,'
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            // Velocity update
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off borders
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            // Mouse interaction
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = this.mouse.x - p.x;
                const dy = this.mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.mouse.radius) {
                    const force = (this.mouse.radius - dist) / this.mouse.radius;
                    p.x -= (dx / dist) * force * 1.5;
                    p.y -= (dy / dist) * force * 1.5;
                }
            }

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `${p.color} 0.7)`;
            this.ctx.fill();

            // Connect nearby particles
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.maxDistance) {
                    const alpha = (1 - dist / this.maxDistance) * 0.25;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(0, 168, 255, ${alpha})`;
                    this.ctx.lineWidth = 0.8;
                    this.ctx.stroke();
                }
            }
        }

        requestAnimationFrame(() => this.animate());
    }
}

// ==========================================
// 3. Dynamic Typewriter Headline Effect
// ==========================================
class TypewriterEffect {
    constructor(elementId, words, speed = 100, pause = 2200) {
        this.el = document.getElementById(elementId);
        this.words = words || [
            "High-Converting Websites",
            "Profitable E-Commerce Stores",
            "Native Android & iOS Apps",
            "SEO & Google Ads Ranking"
        ];
        this.speed = speed;
        this.pause = pause;
        this.wordIndex = 0;
        this.charIndex = 0;
        this.isDeleting = false;

        if (this.el) this.tick();
    }

    tick() {
        const currentWord = this.words[this.wordIndex % this.words.length];
        
        if (this.isDeleting) {
            this.charIndex--;
            this.el.textContent = currentWord.substring(0, this.charIndex);
        } else {
            this.charIndex++;
            this.el.textContent = currentWord.substring(0, this.charIndex);
        }

        let typeSpeed = this.isDeleting ? this.speed / 2 : this.speed;

        if (!this.isDeleting && this.charIndex === currentWord.length) {
            typeSpeed = this.pause;
            this.isDeleting = true;
        } else if (this.isDeleting && this.charIndex === 0) {
            this.isDeleting = false;
            this.wordIndex++;
            typeSpeed = 400;
        }

        setTimeout(() => this.tick(), typeSpeed);
    }
}

// ==========================================
// 4. 3D Card Hover Tilt with Dynamic Glare
// ==========================================
function init3DTiltCards() {
    const cards = document.querySelectorAll('.tilt-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

            // Update custom glare gradient if present
            const glare = card.querySelector('.card-glare');
            if (glare) {
                glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(0, 168, 255, 0.25) 0%, rgba(255,255,255,0) 65%)`;
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            const glare = card.querySelector('.card-glare');
            if (glare) glare.style.background = 'transparent';
        });
    });
}

// ==========================================
// 5. Animated Number Counter on Viewport Scroll
// ==========================================
function initStatCounters() {
    const counterElements = document.querySelectorAll('[data-counter-target]');
    if (!counterElements.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-counter-target'), 10);
                const suffix = el.getAttribute('data-counter-suffix') || '';
                const prefix = el.getAttribute('data-counter-prefix') || '';
                const duration = 1800;
                let start = 0;
                const startTime = performance.now();

                function update(now) {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    // Ease out expo
                    const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                    const currentVal = Math.floor(ease * target);
                    el.textContent = `${prefix}${currentVal.toLocaleString()}${suffix}`;

                    if (progress < 1) {
                        requestAnimationFrame(update);
                    } else {
                        el.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
                    }
                }

                requestAnimationFrame(update);
                obs.unobserve(el);
            }
        });
    }, { threshold: 0.3 });

    counterElements.forEach(el => observer.observe(el));
}

// ==========================================
// 6. Interactive Project Cost Estimator
// ==========================================
class CostCalculator {
    constructor() {
        this.basePrices = {
            web: 7999,
            ecommerce: 11999,
            app: 7500,
            combo: 18999
        };
        this.pageAddons = {
            '5': 0,
            '10': 2000,
            '20': 4500
        };
        this.addonCheckboxes = document.querySelectorAll('.calc-addon');
        this.planRadios = document.querySelectorAll('input[name="calc-plan"]');
        this.pagesSelect = document.getElementById('calc-pages');
        this.priceDisplay = document.getElementById('calc-total-price');
        this.daysDisplay = document.getElementById('calc-total-days');
        this.orderBtn = document.getElementById('calc-order-btn');

        if (this.priceDisplay) this.init();
    }

    init() {
        this.planRadios.forEach(r => r.addEventListener('change', () => this.calculate()));
        if (this.pagesSelect) this.pagesSelect.addEventListener('change', () => this.calculate()));
        this.addonCheckboxes.forEach(cb => cb.addEventListener('change', () => this.calculate()));
        if (this.orderBtn) {
            this.orderBtn.addEventListener('click', () => this.handleOrder());
        }
        this.calculate();
    }

    calculate() {
        let selectedPlan = 'web';
        this.planRadios.forEach(r => {
            if (r.checked) selectedPlan = r.value;
        });

        let total = this.basePrices[selectedPlan] || 7999;
        let days = selectedPlan === 'combo' ? 12 : 7;

        if (this.pagesSelect) {
            const pagesVal = this.pagesSelect.value;
            total += this.pageAddons[pagesVal] || 0;
            if (pagesVal === '20') days += 3;
        }

        this.addonCheckboxes.forEach(cb => {
            if (cb.checked) {
                total += parseInt(cb.getAttribute('data-price') || 0, 10);
                const extraDays = parseInt(cb.getAttribute('data-days') || 0, 10);
                days += extraDays;
            }
        });

        if (this.priceDisplay) {
            this.priceDisplay.textContent = `₹${total.toLocaleString('en-IN')}`;
        }
        if (this.daysDisplay) {
            this.daysDisplay.textContent = `${days} Days`;
        }
    }

    handleOrder() {
        let planName = 'Web Development';
        this.planRadios.forEach(r => {
            if (r.checked) planName = r.parentElement.querySelector('.plan-label')?.textContent?.trim() || r.value;
        });
        const total = this.priceDisplay ? this.priceDisplay.textContent : '₹7,999';
        const days = this.daysDisplay ? this.daysDisplay.textContent : '7 Days';

        const addons = [];
        this.addonCheckboxes.forEach(cb => {
            if (cb.checked) {
                addons.push(cb.parentElement.textContent.trim());
            }
        });

        const text = `Hi Web Freelancers!%0AI customized a project on your website:%0A*Plan:* ${encodeURIComponent(planName)}%0A*Estimated Total:* ${encodeURIComponent(total)}%0A*Delivery Target:* ${encodeURIComponent(days)}%0A*Add-ons:* ${encodeURIComponent(addons.join(', ') || 'None')}%0A%0AI want to get started!`;
        window.open(`https://wa.me/917530018721?text=${text}`, '_blank');
    }
}

// ==========================================
// 7. Live Social Proof Ticker Popups
// ==========================================
function initSocialProofNotifications() {
    const notifications = [
        { text: "Rahul from Coimbatore booked a Web Development Package", time: "2 min ago", icon: "🌐" },
        { text: "New store launched: 'Lavanya Aari Mart' goes live!", time: "8 min ago", icon: "🛍️" },
        { text: "Karthik from Chennai inquired about Android App (₹7,500)", time: "14 min ago", icon: "📱" },
        { text: "New 5-star review: 'Delivered in 6 days with free hosting!'", time: "25 min ago", icon: "⭐" },
        { text: "Aravind from Madurai booked E-Commerce Store with Shiprocket", time: "31 min ago", icon: "🚀" }
    ];

    let currentIndex = 0;
    const container = document.createElement('div');
    container.id = 'social-proof-toast';
    container.className = 'fixed bottom-6 left-6 z-40 max-w-sm pointer-events-auto transition-all duration-500 transform translate-y-20 opacity-0';
    document.body.appendChild(container);

    function showNext() {
        const item = notifications[currentIndex % notifications.length];
        currentIndex++;

        container.innerHTML = `
            <div class="glass-card p-3.5 rounded-2xl border border-sky-500/30 shadow-2xl flex items-center gap-3 backdrop-blur-xl bg-slate-950/85">
                <div class="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center text-xl flex-shrink-0 animate-pulse">
                    ${item.icon}
                </div>
                <div class="flex-1 pr-2">
                    <p class="text-xs font-bold text-slate-100 leading-snug">${item.text}</p>
                    <span class="text-[10px] text-sky-400 font-semibold flex items-center gap-1 mt-0.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                        Verified • ${item.time}
                    </span>
                </div>
                <button onclick="document.getElementById('social-proof-toast').classList.add('opacity-0', 'translate-y-20')" class="text-slate-500 hover:text-slate-300 text-xs p-1">✕</button>
            </div>
        `;

        // Slide in
        container.classList.remove('opacity-0', 'translate-y-20');
        container.classList.add('opacity-100', 'translate-y-0');

        // Slide out after 5.5s
        setTimeout(() => {
            container.classList.remove('opacity-100', 'translate-y-0');
            container.classList.add('opacity-0', 'translate-y-20');
        }, 5500);
    }

    // First appearance after 4 seconds, then every 20 seconds
    setTimeout(() => {
        showNext();
        setInterval(showNext, 22000);
    }, 4000);
}

// Initialize all animations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ParticleNetwork('hero-canvas');
    new TypewriterEffect('typewriter-text');
    init3DTiltCards();
    initStatCounters();
    new CostCalculator();
    initSocialProofNotifications();
});
