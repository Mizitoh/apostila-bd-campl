(function () {
  const STORAGE_KEY = "academia_email";
  const API_URL = "https://micha6555.c44.integrator.host/api/sql";

  const emailInput = document.getElementById("email");

  // Função para enviar SQL para a API
  async function sendSQL(email, sql) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-aluno": email,
        },
        body: JSON.stringify({ email, sql }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      return await res.json();
    } catch (error) {
      console.error("Erro na requisição:", error);
      return { success: false, error: error.message };
    }
  }

  // Função para exibir resposta
  function showResponse(responseElement, json, successMessage) {
    if (json.success) {
      responseElement.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
          <strong>Sucesso!</strong> ${successMessage}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;

      // Auto-remover após 3 segundos
      setTimeout(() => {
        const alert = responseElement.querySelector(".alert");
        if (alert) {
          alert.classList.remove("show");
          setTimeout(() => (responseElement.innerHTML = ""), 150);
        }
      }, 3000);
    } else {
      responseElement.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>Erro!</strong> ${json.error || "Erro ao executar comando"}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
    }
  }

  // Função para criar tabela de resultados
  function createTable(columns, rows) {
    if (!rows || rows.length === 0) {
      return '<div class="alert alert-info">Nenhum registro encontrado.</div>';
    }

    let html =
      '<div class="table-responsive mt-3"><table class="table table-striped table-hover">';

    // Cabeçalho
    html += '<thead class="table-dark"><tr>';
    columns.forEach((col) => {
      html += `<th>${col}</th>`;
    });
    html += "</tr></thead>";

    // Corpo
    html += "<tbody>";
    rows.forEach((row) => {
      html += "<tr>";
      columns.forEach((col) => {
        let value = row[col];

        // Verificar se é nulo/undefined primeiro
        if (value === null || value === undefined) {
          html += `<td>-</td>`;
          return;
        }

        // Formatar booleanos
        if (typeof value === "boolean") {
          html += `<td>${value ? "Sim" : "Não"}</td>`;
          return;
        }

        // Converter para string para verificações
        const valueStr = String(value);

        // Formatar timestamps (data_consulta)
        if (col === "data_consulta" && valueStr.includes("T")) {
          try {
            const date = new Date(value);
            html += `<td>${date.toLocaleString("pt-BR")}</td>`;
          } catch (e) {
            html += `<td>${value}</td>`;
          }
          return;
        }

        // Formatar datas (data_nascimento, etc)
        if (col.includes("data") || col.includes("nascimento")) {
          try {
            const date = new Date(value);
            // Verificar se é uma data válida
            if (!isNaN(date.getTime())) {
              html += `<td>${date.toLocaleDateString("pt-BR")}</td>`;
            } else {
              html += `<td>${value}</td>`;
            }
          } catch (e) {
            html += `<td>${value}</td>`;
          }
          return;
        }

        // Valor padrão
        html += `<td>${value}</td>`;
      });
      html += "</tr>";
    });
    html += "</tbody></table></div>";

    return html;
  }

  // Função para carregar listagem
  async function loadList(table, listElement) {
    const email = emailInput.value.trim();
    if (!email) return;

    const sql = `SELECT * FROM ${table} ORDER BY 1 DESC LIMIT 50;`;

    listElement.innerHTML =
      '<div class="text-center"><div class="spinner-border" role="status"></div></div>';

    try {
      const json = await sendSQL(email, sql);

      if (json.success && json.rows && json.rows.length > 0) {
        const columns = Object.keys(json.rows[0]);
        listElement.innerHTML = `
          <h6 class="mt-4">Registros cadastrados (${json.rows.length}):</h6>
          ${createTable(columns, json.rows)}
        `;
      } else if (json.success) {
        listElement.innerHTML =
          '<div class="alert alert-info mt-4">Nenhum registro encontrado.</div>';
      } else {
        listElement.innerHTML = `<div class="alert alert-warning mt-4">Erro: ${
          json.error || "Não foi possível carregar os registros."
        }</div>`;
      }
    } catch (error) {
      console.error("Erro ao carregar listagem:", error);
      listElement.innerHTML = `<div class="alert alert-danger mt-4">Erro ao carregar: ${error.message}</div>`;
    }
  }

  // Função para escapar strings SQL (prevenir SQL injection básico)
  function escapeSql(str) {
    if (str === null || str === undefined) return "NULL";
    return str.toString().replace(/'/g, "''");
  }

  // Carregar e-mail do localStorage
  document.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      emailInput.value = saved;

      // Carregar listagens iniciais se o e-mail já estiver preenchido
      setTimeout(() => {
        loadList("instrutor", document.getElementById("instrutor-list"));
        loadList("praticantes", document.getElementById("aluno-list"));
        loadList("treino", document.getElementById("treino-list"));
        loadList("ficha_aluno", document.getElementById("ficha-list"));
        loadList("modalidade", document.getElementById("modalidade-list"));
        loadList(
          "instrutor_modalidade",
          document.getElementById("instrutor-modalidade-list"),
        );
        // loadRelatorioCompleto(); // Descomente se quiser carregar automaticamente
      }, 500);
    }
  });

  // Salvar e-mail no localStorage
  emailInput.addEventListener("input", () => {
    const v = emailInput.value.trim();
    if (v) localStorage.setItem(STORAGE_KEY, v);
  });

  // FORM INSTRUTOR
  const instrutorForm = document.getElementById("instrutor-form");
  const instrutorBtn = document.getElementById("instrutor-btn");
  const instrutorResponse = document.getElementById("instrutor-response");
  const instrutorList = document.getElementById("instrutor-list");

  instrutorForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      alert("Por favor, informe seu e-mail no topo da página.");
      return;
    }

    const nome = document.getElementById("instrutor-nome").value.trim();
    const cref = document.getElementById("instrutor-cref").value.trim();

    const sql = `INSERT INTO instrutor (nome, cref) VALUES ('${escapeSql(
      nome,
    )}', '${escapeSql(cref)}');`;

    instrutorBtn.disabled = true;
    instrutorBtn.textContent = "Salvando...";

    try {
      const json = await sendSQL(email, sql);
      showResponse(
        instrutorResponse,
        json,
        "Instrutor cadastrado com sucesso!",
      );

      if (json.success) {
        instrutorForm.reset();
        await loadList("instrutor", instrutorList);
      }
    } finally {
      instrutorBtn.disabled = false;
      instrutorBtn.textContent = "Salvar Instrutor";
    }
  });

  // Carregar listagem ao abrir a tab
  document
    .getElementById("instrutor-tab")
    .addEventListener("shown.bs.tab", () => {
      loadList("instrutor", instrutorList);
    });

  // FORM ALUNO
  const alunoForm = document.getElementById("aluno-form");
  const alunoBtn = document.getElementById("aluno-btn");
  const alunoResponse = document.getElementById("aluno-response");
  const alunoList = document.getElementById("aluno-list");

  alunoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      alert("Por favor, informe seu e-mail no topo da página.");
      return;
    }

    const nome = document.getElementById("aluno-nome").value.trim();
    const dataNascimento = document.getElementById(
      "aluno-data-nascimento",
    ).value;
    const idInstrutor = document.getElementById("aluno-id-instrutor").value;

    let sql;
    if (dataNascimento) {
      sql = `INSERT INTO praticantes (nome, data_nascimento, id_instrutor) VALUES ('${escapeSql(
        nome,
      )}', '${dataNascimento}', ${idInstrutor});`;
    } else {
      sql = `INSERT INTO praticantes (nome, data_nascimento, id_instrutor) VALUES ('${escapeSql(
        nome,
      )}', NULL, ${idInstrutor});`;
    }

    alunoBtn.disabled = true;
    alunoBtn.textContent = "Salvando...";

    try {
      const json = await sendSQL(email, sql);
      showResponse(alunoResponse, json, "Aluno cadastrado com sucesso!");

      if (json.success) {
        alunoForm.reset();
        await loadList("praticantes", alunoList);
      }
    } finally {
      alunoBtn.disabled = false;
      alunoBtn.textContent = "Salvar Aluno";
    }
  });

  document.getElementById("aluno-tab").addEventListener("shown.bs.tab", () => {
    loadList("praticantes", alunoList);
  });

  // FORM TREINO
  const treinoForm = document.getElementById("treino-form");
  const treinoBtn = document.getElementById("treino-btn");
  const treinoResponse = document.getElementById("treino-response");
  const treinoList = document.getElementById("treino-list");

  treinoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      alert("Por favor, informe seu e-mail no topo da página.");
      return;
    }

    const idInstrutor = document.getElementById("treino-id-instrutor").value;
    const idAluno = document.getElementById("treino-id-aluno").value;
    const dataTreino = document.getElementById("treino-data").value;
    const observacoes = document
      .getElementById("treino-observacoes")
      .value.trim();

    // Converter datetime-local para formato PostgreSQL
    const dataFormatada = dataTreino.replace("T", " ");

    let sql;
    if (observacoes) {
      sql = `INSERT INTO treino (id_instrutor, id_aluno, data_treino, observacoes) 
           VALUES (${idInstrutor}, ${idAluno}, TIMESTAMP '${dataFormatada}', '${escapeSql(
             observacoes,
           )}');`;
    } else {
      sql = `INSERT INTO treino (id_instrutor, id_aluno, data_treino, observacoes) 
           VALUES (${idInstrutor}, ${idAluno}, TIMESTAMP '${dataFormatada}', NULL);`;
    }

    treinoBtn.disabled = true;
    treinoBtn.textContent = "Salvando...";

    try {
      const json = await sendSQL(email, sql);
      showResponse(treinoResponse, json, "Treino cadastrado com sucesso!");

      if (json.success) {
        treinoForm.reset();
        await loadList("treino", treinoList);
      }
    } catch (error) {
      showResponse(
        treinoResponse,
        { success: false, error: error.message },
        "",
      );
    } finally {
      treinoBtn.disabled = false;
      treinoBtn.textContent = "Salvar Treino";
    }
  });

  // REMOVIDO A DUPLICAÇÃO - apenas um listener
  document.getElementById("treino-tab").addEventListener("shown.bs.tab", () => {
    loadList("treino", treinoList);
  });

  // FORM FICHA ALUNO
  const fichaForm = document.getElementById("ficha-form");
  const fichaBtn = document.getElementById("ficha-btn");
  const fichaResponse = document.getElementById("ficha-response");
  const fichaList = document.getElementById("ficha-list");

  fichaForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      alert("Por favor, informe seu e-mail no topo da página.");
      return;
    }

    const idAluno = document.getElementById("ficha-id-aluno").value;
    const altura = document.getElementById("ficha-altura").value;
    const peso = document.getElementById("ficha-peso").value;
    const possuiRestricao = document.getElementById(
      "ficha-possui-restricao",
    ).value;

    let sql;
    if (altura && peso) {
      sql = `INSERT INTO ficha_aluno (id_aluno, altura, peso, possui_restricao) 
             VALUES (${idAluno}, ${altura}, ${peso}, ${possuiRestricao});`;
    } else {
      sql = `INSERT INTO ficha_aluno (id_aluno, altura, peso, possui_restricao) 
             VALUES (${idAluno}, NULL, NULL, ${possuiRestricao});`;
    }

    fichaBtn.disabled = true;
    fichaBtn.textContent = "Salvando...";

    try {
      const json = await sendSQL(email, sql);
      showResponse(fichaResponse, json, "Ficha cadastrada com sucesso!");

      if (json.success) {
        fichaForm.reset();
        await loadList("ficha_aluno", fichaList);
      }
    } finally {
      fichaBtn.disabled = false;
      fichaBtn.textContent = "Salvar Ficha";
    }
  });

  document.getElementById("ficha-tab").addEventListener("shown.bs.tab", () => {
    loadList("ficha_aluno", fichaList);
  });

  // FORM MODALIDADE
  const modalidadeForm = document.getElementById("modalidade-form");
  const modalidadeBtn = document.getElementById("modalidade-btn");
  const modalidadeResponse = document.getElementById("modalidade-response");
  const modalidadeList = document.getElementById("modalidade-list");

  modalidadeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      alert("Por favor, informe seu e-mail no topo da página.");
      return;
    }

    const nome = document.getElementById("modalidade-nome").value.trim();

    const sql = `INSERT INTO modalidade (nome) VALUES ('${escapeSql(nome)}');`;

    modalidadeBtn.disabled = true;
    modalidadeBtn.textContent = "Salvando...";

    try {
      const json = await sendSQL(email, sql);
      showResponse(
        modalidadeResponse,
        json,
        "Modalidade cadastrada com sucesso!",
      );

      if (json.success) {
        modalidadeForm.reset();
        await loadList("modalidade", modalidadeList);
      }
    } finally {
      modalidadeBtn.disabled = false;
      modalidadeBtn.textContent = "Salvar Modalidade";
    }
  });

  document
    .getElementById("modalidade-tab")
    .addEventListener("shown.bs.tab", () => {
      loadList("modalidade", modalidadeList);
    });

  // FORM INSTRUTOR-MODALIDADE
  const instrutorModalidadeForm = document.getElementById(
    "instrutor-modalidade-form",
  );
  const instrutorModalidadeBtn = document.getElementById(
    "instrutor-modalidade-btn",
  );
  const instrutorModalidadeResponse = document.getElementById(
    "instrutor-modalidade-response",
  );
  const instrutorModalidadeList = document.getElementById(
    "instrutor-modalidade-list",
  );

  instrutorModalidadeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      alert("Por favor, informe seu e-mail no topo da página.");
      return;
    }

    const idInstrutor = document.getElementById("im-id-instrutor").value;
    const idModalidade = document.getElementById("im-id-modalidade").value;

    const sql = `INSERT INTO instrutor_modalidade (id_instrutor, id_modalidade) 
               VALUES (${idInstrutor}, ${idModalidade});`;

    instrutorModalidadeBtn.disabled = true;
    instrutorModalidadeBtn.textContent = "Vinculando...";

    try {
      const json = await sendSQL(email, sql);
      showResponse(
        instrutorModalidadeResponse,
        json,
        "Vínculo criado com sucesso!",
      );

      if (json.success) {
        instrutorModalidadeForm.reset();
        await loadList("instrutor_modalidade", instrutorModalidadeList);
      }
    } finally {
      instrutorModalidadeBtn.disabled = false;
      instrutorModalidadeBtn.textContent = "Vincular";
    }
  });

  document
    .getElementById("instrutor-modalidade-tab")
    .addEventListener("shown.bs.tab", () => {
      loadList("instrutor_modalidade", instrutorModalidadeList);
    });

  // RELATÓRIO COMPLETO
  const relatorioList = document.getElementById("relatorio-list");
  const relatorioRefreshBtn = document.getElementById("relatorio-refresh-btn");

  async function loadRelatorioCompleto() {
    const email = emailInput.value.trim();
    if (!email) {
      relatorioList.innerHTML =
        '<div class="alert alert-warning">Por favor, informe seu e-mail para visualizar o relatório.</div>';
      return;
    }

    const sql = `
    SELECT 
      a.nome AS aluno,
      a.data_nascimento,
      COALESCE(fa.altura, 0) AS altura,
      COALESCE(fa.peso, 0) AS peso,
      case
        when coalesce(fa.altura, 0) > 0 
        then ROUND(
          coalesce(fa.peso, 0) / 
          (coalesce(fa.altura, 0) * coalesce(fa.altura, 0)),
          2
        )
        else 0
      end as imc,
      CASE
        WHEN COALESCE(fa.altura, 0) <= 0 THEN 'Sem dados'
        WHEN ROUND(COALESCE(fa.peso, 0) / (COALESCE(fa.altura, 0) * COALESCE(fa.altura, 0)), 2) < 18.5 THEN 'Magro'
        WHEN ROUND(COALESCE(fa.peso, 0) / (COALESCE(fa.altura, 0) * COALESCE(fa.altura, 0)), 2) < 25 THEN 'Normal'
        WHEN ROUND(COALESCE(fa.peso, 0) / (COALESCE(fa.altura, 0) * COALESCE(fa.altura, 0)), 2) < 30 THEN 'Sobrepeso'
        WHEN ROUND(COALESCE(fa.peso, 0) / (COALESCE(fa.altura, 0) * COALESCE(fa.altura, 0)), 2) < 35 THEN 'Obeso I'
        WHEN ROUND(COALESCE(fa.peso, 0) / (COALESCE(fa.altura, 0) * COALESCE(fa.altura, 0)), 2) < 40 THEN 'Obeso II'
        ELSE 'Obeso III'
      END AS classificacao_imc,
      CASE 
        WHEN fa.possui_restricao = true THEN 'Sim'
        WHEN fa.possui_restricao = false THEN 'Não'
        ELSE 'Não informado'
      END AS tem_restricao,
      i.nome AS instrutor,
      i.cref,
      STRING_AGG(DISTINCT m.nome, ', ') AS modalidades,
      t.data_treino,
      COALESCE(t.observacoes, '-') AS observacoes
    FROM treino t
    INNER JOIN praticantes a ON t.id_aluno = a.id_aluno
    INNER JOIN instrutor i ON t.id_instrutor = i.id_instrutor
    LEFT JOIN ficha_aluno fa ON a.id_aluno = fa.id_aluno
    LEFT JOIN instrutor_modalidade im ON i.id_instrutor = im.id_instrutor
    LEFT JOIN modalidade m ON im.id_modalidade = m.id_modalidade
    GROUP BY 
      a.nome, 
      a.data_nascimento, 
      fa.altura,
      fa.peso,
      fa.possui_restricao,
      CASE
        WHEN COALESCE(fa.altura, 0) <= 0 THEN 'Sem dados'
        WHEN ROUND(COALESCE(fa.peso, 0) / (COALESCE(fa.altura, 0) * COALESCE(fa.altura, 0)), 2) < 18.5 THEN 'Magro'
        WHEN ROUND(COALESCE(fa.peso, 0) / (COALESCE(fa.altura, 0) * COALESCE(fa.altura, 0)), 2) < 25 THEN 'Normal'
        WHEN ROUND(COALESCE(fa.peso, 0) / (COALESCE(fa.altura, 0) * COALESCE(fa.altura, 0)), 2) < 30 THEN 'Sobrepeso'
        WHEN ROUND(COALESCE(fa.peso, 0) / (COALESCE(fa.altura, 0) * COALESCE(fa.altura, 0)), 2) < 35 THEN 'Obeso I'
        WHEN ROUND(COALESCE(fa.peso, 0) / (COALESCE(fa.altura, 0) * COALESCE(fa.altura, 0)), 2) < 40 THEN 'Obeso II'
        ELSE 'Obeso III'
      END, 
      i.nome, 
      i.cref, 
      t.data_treino, 
      t.observacoes
    ORDER BY t.data_treino DESC
    LIMIT 100;
  `;

    relatorioList.innerHTML =
      '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
    relatorioRefreshBtn.disabled = true;
    relatorioRefreshBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span> Carregando...';

    try {
      const json = await sendSQL(email, sql);

      if (json.success && json.rows && json.rows.length > 0) {
        // Criar tabela personalizada com cores e formatação especial
        let html = `
        <div class="alert alert-info">
          <strong>${json.rows.length}</strong> treino(s) encontrado(s)
        </div>
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th>Aluno</th>
                <th>Idade</th>
                <th>Altura</th>
                <th>Peso</th>
                <th>IMC</th>
                <th>Classificação IMC</th>
                <th>Restrição</th>
                <th>Instrutor</th>
                <th>Modalidades</th>
                <th>Data Treino</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
      `;

        json.rows.forEach((row) => {
          // Calcular idade
          let idade = "-";
          if (row.data_nascimento) {
            const nascimento = new Date(row.data_nascimento);
            const hoje = new Date();
            let age = hoje.getFullYear() - nascimento.getFullYear();
            const mesAtual = hoje.getMonth();
            const mesNascimento = nascimento.getMonth();
            if (
              mesAtual < mesNascimento ||
              (mesAtual === mesNascimento &&
                hoje.getDate() < nascimento.getDate())
            ) {
              age--;
            }
            idade = age + " anos";
          }

          // Formatar data do treino
          let dataTreinoFormatada = "-";
          if (row.data_treino) {
            const dataTreino = new Date(row.data_treino);
            dataTreinoFormatada = dataTreino.toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          }

          // Badge para restrição
          const restricaoClass =
            row.tem_restricao === "Sim"
              ? "bg-danger"
              : row.tem_restricao === "Não"
                ? "bg-success"
                : "bg-secondary";

          // Formatar altura e peso
          const altura = row.altura > 0 ? row.altura + " m" : "-";
          const peso = row.peso > 0 ? row.peso + " kg" : "-";
          const imc = row.imc > 0 ? row.imc : "-";

          // Definir cor da classificação do IMC
          let imcClass = "bg-secondary";
          if (row.classificacao_imc) {
            switch (row.classificacao_imc) {
              case "Magro":
                imcClass = "bg-warning";
                break;
              case "Normal":
                imcClass = "bg-success";
                break;
              case "Sobrepeso":
                imcClass = "bg-warning";
                break;
              case "Obeso I":
                imcClass = "bg-danger";
                break;
              case "Obeso II":
                imcClass = "bg-danger";
                break;
              case "Obeso III":
                imcClass = "bg-dark";
                break;
              default:
                imcClass = "bg-secondary";
            }
          }

          html += `
          <tr>
            <td><strong>${row.aluno}</strong></td>
            <td>${idade}</td>
            <td>${altura}</td>
            <td>${peso}</td>
            <td>${imc}</td>
            <td><span class="badge ${imcClass}">${row.classificacao_imc || "Sem dados"}</span></td>
            <td><span class="badge ${restricaoClass}">${
              row.tem_restricao
            }</span></td>
            <td>${row.instrutor}</td>
            <td><em>${row.modalidades || "Não informado"}</em></td>
            <td><small>${dataTreinoFormatada}</small></td>
            <td>${row.observacoes}</td>
          </tr>
        `;
        });

        html += `
            </tbody>
          </table>
        </div>
      `;

        relatorioList.innerHTML = html;
      } else if (json.success) {
        relatorioList.innerHTML = `
        <div class="alert alert-info">
          <h6>Nenhum treino encontrado</h6>
          <p class="mb-0">Cadastre alunos, instrutores, modalidades e treinos para visualizar o relatório.</p>
        </div>
      `;
      } else {
        relatorioList.innerHTML = `
        <div class="alert alert-danger">
          <strong>Erro ao gerar relatório:</strong> ${
            json.error || "Erro desconhecido"
          }
        </div>
      `;
      }
    } catch (error) {
      console.error("Erro ao carregar relatório:", error);
      relatorioList.innerHTML = `
      <div class="alert alert-danger">
        <strong>Erro:</strong> ${error.message}
      </div>
    `;
    } finally {
      relatorioRefreshBtn.disabled = false;
      relatorioRefreshBtn.innerHTML =
        '<i class="bi bi-arrow-clockwise"></i> Atualizar Relatório';
    }
  }

  // Carregar relatório ao clicar no botão
  relatorioRefreshBtn.addEventListener("click", loadRelatorioCompleto);

  // Carregar relatório ao abrir a tab
  document
    .getElementById("relatorio-tab")
    .addEventListener("shown.bs.tab", () => {
      loadRelatorioCompleto();
    });
})();
