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
  const formStatus = document.getElementById("form-status");
  const submitBtn = form?.querySelector('button[type="submit"]');
  const courseSelect = form?.querySelector('[name="course"]');

  const params = new URLSearchParams(window.location.search);
  const courseParam = params.get("course");

  const applyContactCourse = (course) => {
    if (!course) return;
    sessionStorage.setItem("contactCourse", course);

    const banner = document.getElementById("contact-course-banner");
    if (banner) {
      banner.textContent = `You're inquiring about: ${course}`;
      banner.hidden = false;
    }

    const email = config.contactEmail || "training@excelcloudsolutions.com";
    const subject = encodeURIComponent(`Question about: ${course}`);
    document.querySelectorAll("[data-contact-email]").forEach((el) => {
      if (el.tagName === "A") el.href = `mailto:${email}?subject=${subject}`;
    });
  };

  const onContactPage = document.getElementById("contact-course-banner");
  if (onContactPage) {
    if (courseParam) applyContactCourse(courseParam);
    else if (sessionStorage.getItem("contactCourse")) {
      applyContactCourse(sessionStorage.getItem("contactCourse"));
    }
  }

  document.querySelectorAll(".contact-course-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const course = btn.getAttribute("data-course");
      if (course) sessionStorage.setItem("contactCourse", course);
    });
  });

  if (courseSelect && courseParam) {
    for (const option of courseSelect.options) {
      if (option.value === courseParam || option.text.includes(courseParam)) {
        courseSelect.value = option.value;
        break;
      }
    }
  }

  const showStatus = (message, type) => {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = `form-status is-visible form-status--${type}`;
  };

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const apiUrl = config.apiUrl;
    const data = Object.fromEntries(new FormData(form).entries());

    if (!apiUrl) {
      showStatus("Registration API is not configured yet. Please call us or email training@excelcloudsolutions.com.", "error");
      return;
    }

    submitBtn.disabled = true;
    showStatus("Submitting your registration...", "success");

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Submission failed");

      form.reset();
      showStatus(payload.message || "Registration submitted successfully. We will contact you soon.", "success");
    } catch (err) {
      showStatus(err.message || "Unable to submit. Please call (330) 391-3130.", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });
});
