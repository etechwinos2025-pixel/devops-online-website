document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");

  toggle?.addEventListener("click", () => {
    nav?.classList.toggle("open");
  });

  document.querySelectorAll(".nav a").forEach((link) => {
    link.addEventListener("click", () => nav?.classList.remove("open"));
  });

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
    window.location.href = `mailto:training@excelcloudsolutions.com?subject=${subject}&body=${body}`;
  });
});
