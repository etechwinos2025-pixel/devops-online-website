(function initTechBackground() {
  function start() {
    const canvas = document.getElementById("tech-bg");
    if (!canvas) return;

    const theme = document.body.dataset.techBg || "binary";
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    let animationId = null;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let state = {};

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initThemeState();
    }

    function initThemeState() {
      if (theme === "binary") {
        state.columns = Array.from({ length: Math.ceil(width / 16) }, (_, i) => ({
          x: i * 16 + 8,
          y: Math.random() * height,
          speed: 0.6 + Math.random() * 1.8,
          len: 12 + Math.floor(Math.random() * 16),
          chars: Array.from({ length: 16 }, () => (Math.random() > 0.5 ? "1" : "0")),
        }));
      }

      if (theme === "circuit") {
        state.nodes = Array.from({ length: 40 }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
        }));
      }

      if (theme === "terminal") {
        state.lines = [
          "$ kubectl apply -f deployment.yaml",
          "$ terraform plan -out=tfplan",
          "$ docker build -t app:latest .",
          "$ git push origin main",
          "$ aws eks update-kubeconfig --name prod",
          "$ helm upgrade --install nginx ./chart",
          "$ pipeline deploy --env production",
        ];
        state.offset = 0;
      }

      if (theme === "network") {
        state.particles = Array.from({ length: 55 }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          r: 1.5 + Math.random() * 2,
        }));
      }
    }

    function fade(alpha) {
      ctx.fillStyle = `rgba(10, 17, 26, ${alpha})`;
      ctx.fillRect(0, 0, width, height);
    }

    function drawBinary() {
      fade(0.07);
      ctx.font = '600 16px "Courier New", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      state.columns.forEach((col) => {
        col.y += col.speed;
        if (Math.random() > 0.97) {
          const i = Math.floor(Math.random() * col.chars.length);
          col.chars[i] = col.chars[i] === "1" ? "0" : "1";
        }
        if (col.y > height + col.len * 16) {
          col.y = -col.len * 16;
          col.speed = 0.6 + Math.random() * 1.8;
        }

        col.chars.forEach((char, i) => {
          const y = col.y + i * 16;
          if (y < -16 || y > height + 16) return;
          const head = i === col.chars.length - 1;
          const a = head ? 0.9 : 0.12 + (i / col.chars.length) * 0.35;
          ctx.fillStyle = head ? `rgba(66, 165, 245, ${a})` : `rgba(100, 181, 246, ${a})`;
          ctx.fillText(char, col.x, y);
        });
      });
    }

    function drawCircuit() {
      fade(0.12);
      state.nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      });

      for (let i = 0; i < state.nodes.length; i++) {
        for (let j = i + 1; j < state.nodes.length; j++) {
          const a = state.nodes[i];
          const b = state.nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 140) {
            const pulse = 0.15 + Math.sin(frame * 0.02 + i) * 0.08;
            ctx.strokeStyle = `rgba(66, 165, 245, ${pulse * (1 - dist / 140)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      state.nodes.forEach((n, i) => {
        const glow = 0.4 + Math.sin(frame * 0.03 + i) * 0.2;
        ctx.fillStyle = `rgba(66, 165, 245, ${glow})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function drawTerminal() {
      fade(0.1);
      ctx.font = '14px "Courier New", monospace';
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const lineH = 28;
      state.offset += prefersReduced ? 0 : 0.4;

      for (let row = 0; row < Math.ceil(height / lineH) + 2; row++) {
        const idx = Math.floor((row + state.offset / lineH) % state.lines.length);
        const line = state.lines[idx];
        const y = row * lineH - (state.offset % lineH);
        const alpha = 0.08 + (row / Math.ceil(height / lineH)) * 0.25;
        ctx.fillStyle = line.startsWith("$") ? `rgba(66, 165, 245, ${alpha + 0.15})` : `rgba(148, 163, 184, ${alpha})`;
        ctx.fillText(line, 24, y);
      }

      const cx = 24 + ctx.measureText(state.lines[0]).width + 8;
      const cy = 12;
      if (Math.floor(frame / 30) % 2 === 0) {
        ctx.fillStyle = "rgba(66, 165, 245, 0.8)";
        ctx.fillRect(cx, cy, 8, 16);
      }
    }

    function drawNetwork() {
      fade(0.1);
      state.particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      });

      for (let i = 0; i < state.particles.length; i++) {
        for (let j = i + 1; j < state.particles.length; j++) {
          const a = state.particles[i];
          const b = state.particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 120) {
            ctx.strokeStyle = `rgba(66, 165, 245, ${0.2 * (1 - dist / 120)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      state.particles.forEach((p) => {
        ctx.fillStyle = "rgba(100, 181, 246, 0.55)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function drawStatic() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(10, 17, 26, 1)";
      ctx.fillRect(0, 0, width, height);
      frame = 60;
      if (theme === "binary") drawBinary();
      if (theme === "circuit") drawCircuit();
      if (theme === "terminal") drawTerminal();
      if (theme === "network") drawNetwork();
    }

    function tick() {
      frame++;
      if (theme === "binary") drawBinary();
      if (theme === "circuit") drawCircuit();
      if (theme === "terminal") drawTerminal();
      if (theme === "network") drawNetwork();
      animationId = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", () => {
      cancelAnimationFrame(animationId);
      resize();
      prefersReduced ? drawStatic() : tick();
    });

    if (prefersReduced) drawStatic();
    else tick();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(animationId);
      else if (!prefersReduced) tick();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
