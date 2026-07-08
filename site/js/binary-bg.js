(function initBinaryBackground() {
  function start() {
    const canvas = document.getElementById("binary-bg");
    if (!canvas) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    let columns = [];
    let animationId = null;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const config = {
      fontSize: 16,
      columnGap: 16,
      speedMin: 0.6,
      speedMax: 2.2,
      trailOpacity: 0.45,
      headOpacity: 0.95,
      fadeAlpha: 0.06,
    };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.ceil(width / config.columnGap);
      columns = Array.from({ length: count }, (_, i) => {
        const len = 12 + Math.floor(Math.random() * 18);
        return {
          x: i * config.columnGap + config.columnGap / 2,
          y: Math.random() * height,
          speed: config.speedMin + Math.random() * (config.speedMax - config.speedMin),
          len,
          chars: Array.from({ length: len }, () => (Math.random() > 0.5 ? "1" : "0")),
        };
      });
    }

    function drawColumn(col) {
      ctx.font = `600 ${config.fontSize}px "Courier New", Courier, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      for (let i = 0; i < col.chars.length; i++) {
        const y = col.y + i * config.fontSize;
        if (y < -config.fontSize || y > height + config.fontSize) continue;

        const isHead = i === col.chars.length - 1;
        const progress = (i + 1) / col.chars.length;
        const alpha = isHead ? config.headOpacity : config.trailOpacity * progress;

        ctx.fillStyle = isHead
          ? `rgba(66, 165, 245, ${alpha})`
          : `rgba(100, 181, 246, ${alpha * 0.85})`;
        ctx.fillText(col.chars[i], col.x, y);
      }
    }

    function drawStatic() {
      ctx.clearRect(0, 0, width, height);
      columns.forEach(drawColumn);
    }

    function tick() {
      ctx.fillStyle = `rgba(10, 17, 26, ${config.fadeAlpha})`;
      ctx.fillRect(0, 0, width, height);

      columns.forEach((col) => {
        col.y += col.speed;

        if (Math.random() > 0.975) {
          const idx = Math.floor(Math.random() * col.chars.length);
          col.chars[idx] = col.chars[idx] === "1" ? "0" : "1";
        }

        if (col.y - col.len * config.fontSize > height) {
          col.y = -col.len * config.fontSize;
          col.speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);
          col.len = 12 + Math.floor(Math.random() * 18);
          col.chars = Array.from({ length: col.len }, () => (Math.random() > 0.5 ? "1" : "0"));
        }

        drawColumn(col);
      });

      animationId = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", () => {
      cancelAnimationFrame(animationId);
      resize();
      if (prefersReduced) drawStatic();
      else tick();
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
