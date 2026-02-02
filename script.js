/* --- CONFIGURATION --- */
const PETAL_COUNT = 15; const TEXT_PATTERN_COUNT = 500; 
const btnNo = document.getElementById('btn-no'); const btnYes = document.getElementById('btn-yes');
const controls = document.querySelector('.controls'); const body = document.body;
const stinkAura = document.querySelector('.stink-aura'); let noClickCount = 0; let flies = [];

const patternContainer = document.getElementById('pattern-container');
function generateBackgroundPattern() {
    patternContainer.innerHTML = '';
    for (let i = 0; i < TEXT_PATTERN_COUNT; i++) {
        const span = document.createElement('span'); span.innerText = "I love you"; span.classList.add('bg-text'); patternContainer.appendChild(span);
    }
}
generateBackgroundPattern();

/* --- MAIN TIMELINE (PAUSED INITIALLY) --- */
const tl = gsap.timeline({ defaults: { ease: "power3.out" }, paused: true });

tl.fromTo(".card-wrapper", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.5, ease: "power4.out" })
.fromTo(".base", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 1 }, "-=1.2") 
.fromTo(".cake", { y: -50, opacity: 0, scale: 0.8 }, { y: 0, opacity: 1, scale: 1, duration: 1, ease: "back.out(1.2)" }, "-=0.8")
.fromTo(".text", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, "-=0.6")
.fromTo(".controls", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, "-=0.4");

const cardWrapper = document.querySelector(".card-wrapper"); 
const card = document.querySelector(".card-composite");

/* --- TILT LOGIC (SILENT PERMISSION) --- */
window.hasMotionPermission = false;
const setCardRotY = gsap.quickSetter(card, "rotationY", "deg");
const setCardRotX = gsap.quickSetter(card, "rotationX", "deg");
const setCakeX = gsap.quickSetter(".cake", "x", "px");
const setCakeY = gsap.quickSetter(".cake", "y", "px");
const setTextX = gsap.quickSetter(".text", "x", "px");
const setTextY = gsap.quickSetter(".text", "y", "px");

// Desktop Mouse Logic
cardWrapper.addEventListener("mousemove", (e) => {
    if(window.hasMotionPermission) return; 
    const rect = cardWrapper.getBoundingClientRect();
    const x = (rect.width / 2 - (e.clientX - rect.left)) / 25; 
    const y = (rect.height / 2 - (e.clientY - rect.top)) / 25;
    gsap.to(card, { rotationY: x, rotationX: -y, duration: 0.5, ease: "power1.out" });
    gsap.to(".cake", { x: x * 0.5, y: y * 0.5, duration: 0.5 }); 
    gsap.to(".text", { x: x * 0.3, y: y * 0.3, duration: 0.5 });
});
cardWrapper.addEventListener("mouseleave", () => { 
    if(window.hasMotionPermission) return;
    gsap.to(card, { rotationY: 0, rotationX: 0, duration: 0.8 }); 
    gsap.to([".cake", ".text"], { x: 0, y: 0, duration: 0.8 }); 
});

// Mobile Tilt Logic
function handleOrientation(e) {
    if (!e.gamma && !e.beta) return;
    window.hasMotionPermission = true;
    const maxTilt = 15;
    const gamma = Math.min(Math.max(e.gamma, -maxTilt), maxTilt); 
    const betaRaw = e.beta - 45; 
    const beta = Math.min(Math.max(betaRaw, -maxTilt), maxTilt); 
    const rotY = gamma; const rotX = -beta; 
    setCardRotY(rotY); setCardRotX(rotX);
    setCakeX(rotY * 0.5); setCakeY(rotX * 0.5);
    setTextX(rotY * 0.3); setTextY(rotX * 0.3);
}

// Function to trigger permission request (iOS 13+)
function requestMotionPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                }
            }).catch(e => console.log(e));
    } else {
        window.addEventListener('deviceorientation', handleOrientation);
    }
}

/* --- PREMIUM INTRO SEQUENCE --- */
const introOverlay = document.getElementById('intro-overlay');
const envelopeBtn = document.getElementById('envelope-btn'); // Now the full screen wrapper
const sealIntact = document.querySelector('.seal-img.intact');
const sealSplitWrapper = document.querySelector('.seal-split-wrapper');
const sealLeft = document.querySelector('.seal-part.left');
const sealRight = document.querySelector('.seal-part.right');
const envFlap = document.getElementById('env-flap');
let introPlayed = false;

function playIntro() {
    if (introPlayed) return;
    introPlayed = true;

    // 1. Silent Permission Request (Since we are inside a user tap/click event)
    requestMotionPermission();

    // 2. Vibrate
    if (navigator.vibrate) try { navigator.vibrate(15); } catch(e){}

    // 3. Animation
    const introTl = gsap.timeline({
        onComplete: () => {
            gsap.to(introOverlay, { 
                opacity: 0, duration: 0.5, pointerEvents: "none",
                onComplete: () => {
                    introOverlay.style.display = 'none';
                    // Small delay to ensure browser repaints before firing main scene
                    requestAnimationFrame(() => tl.play()); 
                }
            });
        }
    });

    introTl.to('.seal-container', { scale: 0.9, duration: 0.1, ease: "power1.in" })
           .call(() => {
               sealIntact.style.display = 'none';
               sealSplitWrapper.style.display = 'block';
           })
           .to([sealLeft, sealRight], { 
               x: (i) => i === 0 ? -25 : 25, 
               rotation: (i) => i === 0 ? -15 : 15,
               opacity: 0, duration: 0.4, ease: "back.out(2)" 
           }, "<")
           .to(envFlap, { 
               rotationX: 180, duration: 0.8, ease: "power2.inOut", transformOrigin: "top"
           }, "-=0.2");
}

envelopeBtn.addEventListener('click', playIntro);
envelopeBtn.addEventListener('touchstart', playIntro, { passive: true });

// Fallback for Reduced Motion
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    envelopeBtn.style.cursor = "default";
    introOverlay.addEventListener('click', () => {
        gsap.to(introOverlay, { opacity: 0, duration: 1, onComplete: () => { 
            introOverlay.style.display = 'none'; tl.play(); 
        }});
    });
}

/* --- GAME LOGIC (FLIES/FART) --- */
function createFly() {
    const fly = document.createElement('div'); fly.classList.add('fly'); fly.innerHTML = `<div class="fly-visual"><div class="fly-wing left"></div><div class="fly-wing right"></div></div>`;
    btnNo.appendChild(fly); flies.push(fly);
    const orbit = { angle: Math.random() * 360, radius: 30 + Math.random() * 20 };
    gsap.to(orbit, { angle: orbit.angle + 360 + (Math.random() > 0.5 ? 360 : -360), duration: 1.5 + Math.random(), repeat: -1, ease: "none", onUpdate: () => { const rad = orbit.angle * (Math.PI / 180); gsap.set(fly, { x: Math.cos(rad) * orbit.radius, y: Math.sin(rad) * orbit.radius * 0.5 }); gsap.set(fly.querySelector('.fly-visual'), { rotation: orbit.angle + 90 }); } });
}
function triggerFart() {
    for(let i=0; i<3; i++) {
        const fart = document.createElement('div'); fart.classList.add('fart-cloud'); btnNo.appendChild(fart);
        gsap.set(fart, { x: -20, y: 0, scale: 0.5, opacity: 0.8 });
        gsap.to(fart, { x: -60 - (Math.random() * 30), y: (Math.random() * 40) - 20, scale: 1.5 + Math.random(), opacity: 0, duration: 0.8 + Math.random() * 0.5, ease: "power1.out", onComplete: () => fart.remove() });
    }
}
function spawnFireEffect(rect) {
    for (let i = 0; i < 50; i++) { 
        const p = document.createElement('div'); p.classList.add('particle');
        const type = Math.random(); p.classList.add(type < 0.3 ? 'ember' : type < 0.6 ? 'smoke' : 'ash');
        const size = Math.random() * 8 + 4; p.style.width = `${size}px`; p.style.height = `${size}px`; document.body.appendChild(p);
        const startX = rect.left + rect.width/2; const startY = rect.top + rect.height/2;
        gsap.set(p, { x: startX + (Math.random() * 40 - 20), y: startY + (Math.random() * 30 - 15), opacity: 1, scale: 0 });
        const angle = Math.random() * Math.PI * 2; const velocity = 50 + Math.random() * 100;
        gsap.to(p, { x: startX + Math.cos(angle) * velocity, y: startY + (Math.sin(angle) * velocity) - 100, scale: Math.random() * 1.5, opacity: 0, rotation: Math.random() * 360, duration: 1 + Math.random(), ease: "power2.out", onComplete: () => p.remove() });
    }
}
const floodContainer = document.getElementById('heart-flood-container');
const floodOverlay = document.getElementById('flood-overlay');
function triggerHeartFlood(onHiddenCallback) {
    const heartCount = 150; 
    gsap.to(floodOverlay, { opacity: 1, duration: 0.4, ease: "power2.in", onComplete: () => { if(onHiddenCallback) onHiddenCallback(); }});
    for (let i = 0; i < heartCount; i++) {
        const heart = document.createElement('div'); heart.classList.add('flood-heart');
        const size = Math.random() * 100 + 50; 
        heart.style.width = `${size}px`; heart.style.height = `${size}px`;
        heart.style.left = `${Math.random() * 120 - 10}%`; 
        const hue = Math.random() * 40 + 330; heart.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
        floodContainer.appendChild(heart);
        gsap.to(heart, { y: -window.innerHeight * 1.5, rotation: Math.random() * 360 - 180, duration: Math.random() * 1.5 + 1, delay: Math.random() * 0.3, ease: "power1.inOut", onComplete: () => { heart.remove(); if (i === heartCount - 1) gsap.to(floodOverlay, { opacity: 0, duration: 1 });}});
    }
}
btnNo.addEventListener('click', (e) => {
    e.preventDefault(); noClickCount++;
    if (noClickCount < 5) {
        gsap.fromTo(body, { x: -noClickCount*3 }, { x: noClickCount*3, duration: 0.05, repeat: 5, yoyo: true, clearProps: "x" });
        createFly(); createFly();
        if(noClickCount === 3) triggerFart();
        gsap.to(stinkAura, { opacity: 0.4 + (noClickCount * 0.1), scale: 1.2, duration: 0.3 });
        gsap.to('.sock-icon', { filter: `drop-shadow(0 2px 5px rgba(0,0,0,0.3)) sepia(1) hue-rotate(${20 - noClickCount * 15}deg) brightness(${0.9 - noClickCount * 0.15}) contrast(1.2)`, duration: 0.3 });
        gsap.to(btnYes, { scale: 1 + (noClickCount * 0.2), duration: 0.4, ease: "back.out(1.7)" });
    } else {
        const rect = btnNo.getBoundingClientRect(); gsap.set(btnNo, { pointerEvents: 'none' });
        const tlBurn = gsap.timeline();
        tlBurn.to('.sock-icon', { filter: "brightness(0) grayscale(1)", duration: 0.1 }).call(() => spawnFireEffect(rect))
              .to(btnNo, { opacity: 0, scale: 0, filter: "blur(10px)", duration: 0.5 }, "<").to(flies, { opacity: 0, scale: 0, duration: 0.3 }, "<");
        gsap.to(controls, { gap: 0, duration: 0.5 });
        gsap.to(btnYes, { scale: 2, duration: 0.8, ease: "elastic.out(1, 0.7)" });
    }
});
btnYes.addEventListener('click', () => {
    const screenQuestion = document.getElementById('screen-question'); const screenSuccess = document.getElementById('screen-success'); const successContent = document.querySelector('.success-content');
    gsap.to(controls, { opacity: 0, scale: 0.9, duration: 0.3, pointerEvents: "none" });
    triggerHeartFlood(() => {
        screenQuestion.classList.remove('active'); screenSuccess.classList.add('active');
        gsap.fromTo(successContent, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.5 });
        gsap.fromTo(".pinned-image", { scale: 0.8, opacity: 0, rotation: -5 }, { scale: 1, opacity: 1, rotation: -2, duration: 1, ease: "back.out(1.5)" });
        gsap.fromTo(".celebration-text", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.3, ease: "power2.out" });
    });
});
const container = document.getElementById('petals-container');
function createPetal() {
    const petal = document.createElement('div'); petal.classList.add('petal');
    const size = Math.random() * 15 + 10; petal.style.width = `${size}px`; petal.style.height = `${size}px`; petal.style.left = Math.random() * 100 + 'vw';
    const hue = Math.random() * 20 + 340; petal.style.background = `linear-gradient(135deg, hsl(${hue}, 80%, 50%), hsl(${hue}, 90%, 30%))`;
    const duration = Math.random() * 8 + 8; 
    petal.animate([ { transform: 'translateY(-10vh) rotate(0deg)' }, { transform: `translateY(110vh) rotate(${Math.random() * 360}deg)` }], { duration: duration * 1000, iterations: Infinity, delay: Math.random() * 8000 });
    container.appendChild(petal);
}
for(let i=0; i<PETAL_COUNT; i++) { createPetal(); }