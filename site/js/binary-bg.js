(function initBinaryBackground() {
  const canvas = document.getElementById("binary-bg");
  if (!canvas) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d");
  let columns = [];
  let animationId = null;
  let width = 0;
  let height = 0;

  const config = {
    fontSize: 14,
    columnGap: 18,
    speedMin: 0.35,
    speedMax: 1.4,
    opacity: 0.14,
    highlightOpacity: 0.38,
    fade: 0.04,
  };

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const count = Math.ceil(width / config.columnGap);
    columns = Array.from({ length: count }, (_, i) => ({
      x: i * config.columnGap,
      y: Math.random() * height,
      speed: config.speedMin + Math.random() * (config.speedMax - config.speedMin),
      chars: [],
      len: 8 + Math.floor(Math.random() * 14),
    }));

    columns.forEach((col) => {
      col.chars = Array.from({ length: col.len }, () => (Math.random() > 0.5 ? "1" : "0"));
    });
  }

  function drawStatic() {
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${config.fontSize}px "Courier New", monospace`;
    ctx.textAlign = "center";

    columns.forEach((col) => {
      col.chars.forEach((char, i) => {
        const y = (col.y + i * config.fontSize) % (height + col.len * config.fontSize);
        const alpha = i === col.chars.length - 1 ? config.highlightOpacity : config.opacity * (i / col.len);
        ctx.fillStyle = i === col.chars.length - 1
          ? `rgba(66, 165, 245, ${alpha})`
          : `rgba(100, 181, 246, ${alpha * 0.6})`;
        ctx.fillText(char, col.x, y);
      });
    });
  }

  function tick() {
    ctx.fillStyle = "rgba(10, 17, 26, 0.08)";
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${config.fontSize}px "Courier New", monospace`;
    ctx.textAlign = "center";

    columns.forEach((col) => {
      col.y += col.speed;

      if (col.y > config.fontSize * 2 && Math.random() > 0.985) {
        col.chars.push(Math.random() > 0.5 ? "1" : "0");
        if (col.chars.length > col.len) col.chars.shift();
      }

      if (Math.random() > 0.992) {
        const idx = Math.floor(Math.random() * col.chars.length);
        col.chars[idx] = col.chars[idx] === "1" ? "0" : "1";
      }

      if (col.y > height + col.len * config.fontSize) {
        col.y = -col.len * config.fontSize;
        col.speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);
      }

      col.chars.forEach((char, i) => {
        const y = col.y + i * config.fontSize;
        if (y < -config.fontSize || y > height + config.fontSize) return;

        const isHead = i === col.chars.length - 1;
        const alpha = isHead ? config.highlightOpacity : config.opacity * ((i + 1) / col.len);

        ctx.fillStyle = isHead
          ? `rgba(66, 165, 245, ${alpha})`
          : `rgba(100, 181, 246, ${alpha * 0.55})`;
        ctx.fillText(char, col.x, y);
      });
    });

    animationId = requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener("resize", () => {
    resize();
    if (prefersReduced) drawStatic();
  });

  if (prefersReduced) {
    drawStatic();
  } else {
    tick();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else if (!prefersReduced) {
      tick();
    }
  });
})();
