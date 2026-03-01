// assets/js/sidebar.js
document.addEventListener("DOMContentLoaded", function () {
  let isInSubfolder = window.location.pathname.includes("/aulas/");
  const isInSubfolderAdm = window.location.pathname.includes("/adm/");

  if (isInSubfolderAdm) {
    isInSubfolder = true;
  }

  const prefix = isInSubfolder ? "../" : "./";

  const sidebarHTML = `
    <aside class="sidebar">
      <h2>Apostila de Banco de Dados</h2>
      <nav>
        <ul>
          <li><a href="${prefix}index.html">📘 Início</a></li>
          <li><a href="${prefix}aulas.html">📚 Aulas por data</a></li>
          <li><a href="${prefix}parquinho.html">🔥 Parquinho 🛝</a></li>
          <li><a href="${prefix}cola.html">🎓🤫 Colinha</a></li>          
          <li><a href="${prefix}exercicios.html">⛹️‍♀️🏋️‍♂️ Exercícios</a></li>
          <li><a href="${prefix}aulas/aula1.html">1️⃣ Introdução a Banco de Dados</a></li>
          <li><a href="${prefix}aulas/aula2.html">2️⃣ Primeiros passos no PostgreSQL</a></li>
          <li><a href="${prefix}aulas/aula3.html">3️⃣ SQL - Primeiros comandos e modelagem</a></li>
          <li><a href="${prefix}aulas/aula4.html">4️⃣ Relacionamentos e Normalização de dados</a></li>
          <li><a href="${prefix}aulas/aula5.html">5️⃣ PK, FK e Padronização do banco</a></li>
          <li><a href="${prefix}aulas/aula6.html">6️⃣ Leitura de dados</a></li>
          <li><a href="${prefix}aulas/aula7.html">7️⃣ Select com manipulações de strings e cálculos</a></li>
          <li><a href="${prefix}aulas/aula8.html">8️⃣ Backups</a></li>
          <li><a href="${prefix}aulas/aula9.html">9️⃣ Restore e Projeto final</a>
          </li><li><a href="${prefix}projetofinal2.html">💪 Projeto Final Turma 2</a></li>
          <li><a href="${prefix}projeto_final/academia.html">💪 Projeto Final - Academia</a></li>
          <li><a href="${prefix}projetofinal.html">🏥 Projeto Final Turma 1</a></li>
          <li><a href="${prefix}projeto_final/hospital.html">🏥 Projeto Final - Hospital</a></li>
        </ul>
      </nav>
    </aside>
  `;

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
