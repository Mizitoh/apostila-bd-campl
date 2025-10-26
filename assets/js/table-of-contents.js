// assets/js/table-of-contents.js
document.addEventListener("DOMContentLoaded", function () {
  const content = document.querySelector(".content");
  if (!content) return;

  // Pega todos os h2 da página
  const headings = content.querySelectorAll("h2");
  if (headings.length === 0) return;

  // Cria o container do índice
  const tocContainer = document.createElement("aside");
  tocContainer.className = "table-of-contents";
  tocContainer.innerHTML = "<h3>Nesta página</h3><nav></nav>";

  const tocNav = tocContainer.querySelector("nav");
  const tocList = document.createElement("ul");

  // Gera os links do índice
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

  // Destaca a seção ativa ao rolar
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

  // Scroll suave ao clicar
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
