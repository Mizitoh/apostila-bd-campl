document.addEventListener("DOMContentLoaded", function () {
  const content = document.querySelector(".content");
  if (!content) return;
  const headings = content.querySelectorAll("h2");
  if (headings.length === 0) return;
  const tocContainer = document.createElement("aside");
  tocContainer.className = "table-of-contents";
  tocContainer.innerHTML = "<h3>Nesta página</h3><nav></nav>";

  const tocNav = tocContainer.querySelector("nav");
  const tocList = document.createElement("ul");
  headings.forEach((heading, index) => {
    if (!heading.id) {
      heading.id = `secao-${index}`;
    }

    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${heading.id}`;
    a.textContent = heading.textContent;
    a.dataset.target = heading.id;

    li.appendChild(a);
    tocList.appendChild(li);
  });

  tocNav.appendChild(tocList);
  content.appendChild(tocContainer);
  const tocLinks = tocContainer.querySelectorAll("a");

  function highlightActiveSection() {
    let currentSection = "";

    headings.forEach((heading) => {
      const rect = heading.getBoundingClientRect();
      if (rect.top <= 100) {
        currentSection = heading.id;
      }
    });

    tocLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.dataset.target === currentSection) {
        link.classList.add("active");
      }
    });
  }
  tocLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.dataset.target;
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  window.addEventListener("scroll", highlightActiveSection);
  highlightActiveSection();
});
