document.addEventListener("DOMContentLoaded", () => {
  const config = window.SITE_CONFIG || {};

  document.querySelectorAll("[data-phone-display]").forEach((el) => {
    if (config.phoneDisplay) el.textContent = config.phoneDisplay;
  });

  document.querySelectorAll("[data-phone-tel]").forEach((el) => {
    if (config.phoneTel) el.href = `tel:${config.phoneTel}`;
  });

  document.querySelectorAll("[data-contact-email]").forEach((el) => {
    if (config.contactEmail) {
      el.textContent = config.contactEmail;
      if (el.tagName === "A") el.href = `mailto:${config.contactEmail}`;
    }
  });

  document.querySelectorAll("[data-site-url]").forEach((el) => {
    const url = config.siteUrl || "https://www.training.excelcloudsolutions.com";
    const display = config.siteDisplay || url.replace(/^https?:\/\//, "");
    el.textContent = display;
    if (el.tagName === "A") el.href = url;
  });

  document.querySelectorAll("[data-company-url]").forEach((el) => {
    const url = config.companyUrl || "https://www.excelcloudsolutions.com";
    const display = config.companyDisplay || url.replace(/^https?:\/\//, "");
    el.textContent = display;
    if (el.tagName === "A") el.href = url;
  });

  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");

  toggle?.addEventListener("click", () => {
    nav?.classList.toggle("open");
  });

  document.querySelectorAll(".nav a").forEach((link) => {
    link.addEventListener("click", () => nav?.classList.remove("open"));
  });

  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  const form = document.getElementById("register-form");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = data.get("name");
    const email = data.get("email");
    const course = data.get("course");
    const message = data.get("message") || "";
    const subject = encodeURIComponent(`DevOps Training Registration — ${course}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nCourse: ${course}\n\n${message}`
    );
    window.location.href = `mailto:${config.contactEmail || "training@excelcloudsolutions.com"}?subject=${subject}&body=${body}`;
  });
});
