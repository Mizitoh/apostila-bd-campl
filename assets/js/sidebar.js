// assets/js/sidebar.js
document.addEventListener("DOMContentLoaded", function () {
  const isInSubfolder = window.location.pathname.includes("/aulas/");
  const prefix = isInSubfolder ? "../" : "./";

  const sidebarHTML = `
    <aside class="sidebar">
      <h2>Apostila de Banco de Dados</h2>
      <nav>
        <ul>
          <li><a href="${prefix}index.html">📘 Início</a></li>
          <li><a href="${prefix}aulas.html">📚 Aulas por data</a></li>
          <li><a href="${prefix}aulas/aula1.html">1️⃣ Introdução a Banco de Dados</a></li>
          <li><a href="${prefix}aulas/aula2.html">2️⃣ Primeiros passos no PostgreSQL</a></li>          
        </ul>
      </nav>
    </aside>
  `;

  //<li><a href="${prefix}aulas/aula3.html">3️⃣ Primeiros passos no PostgreSQL</a></li>

  // Encontra o container e insere o sidebar
  const container = document.querySelector(".container");
  if (container) {
    container.insertAdjacentHTML("afterbegin", sidebarHTML);
    highlightCurrentPage();
  }
});

// Destaca a página atual no menu
function highlightCurrentPage() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const links = document.querySelectorAll(".sidebar a");

  links.forEach((link) => {
    const href = link.getAttribute("href");
    const hrefFile = href.split("/").pop();

    if (hrefFile === currentPage) {
      link.classList.add("active-page");
    }
  });
}
