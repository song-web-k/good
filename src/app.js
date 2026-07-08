const photos = Array.from({ length: 23 }, (_, index) => ({
  src: `./src/assets/photos/photo-${String(index + 1).padStart(2, "0")}.jpg`,
  alt: `我们的照片 ${index + 1}`,
}));

let stage = "ask";
let accepted = false;
let galleryStarted = false;
let animationFrameId = null;
let canvasResizeHandler = null;
let canvasBurstHandler = null;

function render() {
  document.querySelector("#root").innerHTML = `
    <main class="love-site ${stage === "dream" ? "is-dreaming" : ""} ${galleryStarted ? "gallery-live" : ""}">
      <canvas class="spark-canvas" aria-hidden="true"></canvas>
      <section class="question-screen ${stage === "ask" ? "visible" : ""}" aria-hidden="${stage !== "ask"}">
        <div class="question-card">
          <p class="soft-line">有一件很重要的事情想认真问你</p>
          <h1>你爱不爱我？</h1>
          <div class="answer-actions">
            <button class="yes-button" type="button" data-accept>愿意</button>
            <button class="no-button" type="button" data-shy>我再想想</button>
          </div>
        </div>
      </section>

      <section class="dream-screen ${stage === "dream" ? "visible" : ""}" aria-hidden="${stage !== "dream"}">
        <div class="sky-glow" aria-hidden="true"></div>
        <div class="heart-stage">
          <button class="heart-button ${galleryStarted ? "burst" : ""}" type="button" data-heart aria-label="点击爱心">
            <span class="heart-core"></span>
            <span class="heart-shine"></span>
          </button>
          <p class="heart-caption">${galleryStarted ? "从这一刻开始，所有回忆都在发光" : "点击这颗心"}</p>
        </div>

        <div class="love-copy ${galleryStarted ? "show" : ""}">
          <h2>我喜欢你，是想把每一天都认真交给你的那种喜欢。</h2>
          <p>这些照片会一直向前，像我们以后要一起走过的日子。</p>
        </div>

        <div class="photo-river ${galleryStarted ? "show" : ""}" aria-label="照片滚动播放">
          <div class="river-fade left"></div>
          <div class="river-fade right"></div>
          <div class="photo-track">
            ${photoSet()}
            ${photoSet()}
          </div>
        </div>
      </section>
    </main>
  `;

  bindEvents();
  startCanvas();
}

function photoSet() {
  return photos
    .map(
      (photo, index) => `
        <figure class="photo-frame ${index % 3 === 0 ? "wide" : ""}">
          <img src="${photo.src}" alt="${photo.alt}" loading="${index < 6 ? "eager" : "lazy"}" />
        </figure>
      `,
    )
    .join("");
}

function bindEvents() {
  document.querySelector("[data-accept]")?.addEventListener("click", () => {
    accepted = true;
    stage = "dream";
    render();
  });

  document.querySelector("[data-shy]")?.addEventListener("mouseenter", moveShyButton);
  document.querySelector("[data-shy]")?.addEventListener("click", moveShyButton);

  document.querySelector("[data-heart]")?.addEventListener("click", () => {
    galleryStarted = true;
    render();
    window.dispatchEvent(new CustomEvent("heart:burst"));
  });
}

function moveShyButton(event) {
  const button = event.currentTarget;
  const x = Math.round((Math.random() - 0.5) * 120);
  const y = Math.round((Math.random() - 0.5) * 70);
  button.style.transform = `translate(${x}px, ${y}px)`;
}

function startCanvas() {
  const canvas = document.querySelector(".spark-canvas");
  if (!canvas) return;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  if (canvasResizeHandler) {
    window.removeEventListener("resize", canvasResizeHandler);
  }
  if (canvasBurstHandler) {
    window.removeEventListener("heart:burst", canvasBurstHandler);
  }

  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let particles = [];
  let burstParticles = [];

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: width < 700 ? 44 : 82 }, createParticle);
  }

  function createParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.8,
      alpha: Math.random() * 0.45 + 0.15,
      vx: Math.random() * 0.24 - 0.12,
      vy: Math.random() * 0.18 - 0.05,
      hue: Math.random() > 0.42 ? 330 : 48,
    };
  }

  function createBurst() {
    const cx = width / 2;
    const cy = height * 0.42;
    burstParticles = Array.from({ length: 150 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2.2;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: Math.random() * 42 + 38,
        size: Math.random() * 4 + 1.2,
        hue: Math.random() > 0.5 ? 326 : 44,
      };
    });
  }

  function drawParticle(particle) {
    context.beginPath();
    context.fillStyle = `hsla(${particle.hue}, 100%, 78%, ${particle.alpha})`;
    context.shadowColor = `hsla(${particle.hue}, 100%, 72%, 0.9)`;
    context.shadowBlur = 14;
    context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;

    particle.x += particle.vx;
    particle.y += particle.vy;
    if (particle.x < -10 || particle.x > width + 10 || particle.y < -10 || particle.y > height + 10) {
      Object.assign(particle, createParticle());
      particle.y = height + 8;
    }
  }

  function drawBurst(particle) {
    const alpha = Math.max(particle.life / 80, 0);
    context.beginPath();
    context.fillStyle = `hsla(${particle.hue}, 100%, 74%, ${alpha})`;
    context.shadowColor = `hsla(${particle.hue}, 100%, 70%, ${alpha})`;
    context.shadowBlur = 18;
    context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.985;
    particle.vy *= 0.985;
    particle.life -= 1;
  }

  function animate() {
    context.clearRect(0, 0, width, height);
    particles.forEach(drawParticle);
    burstParticles = burstParticles.filter((particle) => particle.life > 0);
    burstParticles.forEach(drawBurst);
    animationFrameId = requestAnimationFrame(animate);
  }

  canvasResizeHandler = resize;
  canvasBurstHandler = createBurst;
  window.addEventListener("resize", canvasResizeHandler, { passive: true });
  window.addEventListener("heart:burst", canvasBurstHandler);
  resize();
  animate();
}

render();
