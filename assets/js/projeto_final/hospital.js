(function () {
  const STORAGE_KEY = "parquinho_email";
  const API_URL = "https://micha6555.c44.integrator.host/api/sql";

  const emailInput = document.getElementById("email");
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
  function showResponse(responseElement, json, successMessage) {
    if (json.success) {
      responseElement.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
          <strong>Sucesso!</strong> ${successMessage}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
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
  function createTable(columns, rows) {
    if (!rows || rows.length === 0) {
      return '<div class="alert alert-info">Nenhum registro encontrado.</div>';
    }

    let html =
      '<div class="table-responsive mt-3"><table class="table table-striped table-hover">';
    html += '<thead class="table-dark"><tr>';
    columns.forEach((col) => {
      html += `<th>${col}</th>`;
    });
    html += "</tr></thead>";
    html += "<tbody>";
    rows.forEach((row) => {
      html += "<tr>";
      columns.forEach((col) => {
        let value = row[col];
        if (value === null || value === undefined) {
          html += `<td>-</td>`;
          return;
        }
        if (typeof value === "boolean") {
          html += `<td>${value ? "Sim" : "Não"}</td>`;
          return;
        }
        const valueStr = String(value);
        if (col === "data_consulta" && valueStr.includes("T")) {
          try {
            const date = new Date(value);
            html += `<td>${date.toLocaleString("pt-BR")}</td>`;
          } catch (e) {
            html += `<td>${value}</td>`;
          }
          return;
        }
        if (col.includes("data") || col.includes("nascimento")) {
          try {
            const date = new Date(value);
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
        html += `<td>${value}</td>`;
      });
      html += "</tr>";
    });
    html += "</tbody></table></div>";

    return html;
  }
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
  function escapeSql(str) {
    if (str === null || str === undefined) return "NULL";
    return str.toString().replace(/'/g, "''");
  }
  document.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      emailInput.value = saved;
      setTimeout(() => {
        loadList("medico", document.getElementById("medico-list"));
        loadList("paciente", document.getElementById("paciente-list"));
        loadList("consulta", document.getElementById("consulta-list"));
        loadList("ficha_paciente", document.getElementById("ficha-list"));
        loadList(
          "especialidade",
          document.getElementById("especialidade-list")
        );
        loadList(
          "medico_especialidade",
          document.getElementById("medico-especialidade-list")
        );
      }, 500);
    }
  });
  emailInput.addEventListener("input", () => {
    const v = emailInput.value.trim();
    if (v) localStorage.setItem(STORAGE_KEY, v);
  });
  const medicoForm = document.getElementById("medico-form");
  const medicoBtn = document.getElementById("medico-btn");
  const medicoResponse = document.getElementById("medico-response");
  const medicoList = document.getElementById("medico-list");

  medicoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      alert("Por favor, informe seu e-mail no topo da página.");
      return;
    }

    const nome = document.getElementById("medico-nome").value.trim();
    const crm = document.getElementById("medico-crm").value.trim();

    const sql = `INSERT INTO medico (nome, crm) VALUES ('${escapeSql(
      nome
    )}', '${escapeSql(crm)}');`;

    medicoBtn.disabled = true;
    medicoBtn.textContent = "Salvando...";

    try {
      const json = await sendSQL(email, sql);
      showResponse(medicoResponse, json, "Médico cadastrado com sucesso!");

      if (json.success) {
        medicoForm.reset();
        await loadList("medico", medicoList);
      }
    } finally {
      medicoBtn.disabled = false;
      medicoBtn.textContent = "Salvar Médico";
    }
  });
  document.getElementById("medico-tab").addEventListener("shown.bs.tab", () => {
    loadList("medico", medicoList);
  });
  const pacienteForm = document.getElementById("paciente-form");
  const pacienteBtn = document.getElementById("paciente-btn");
  const pacienteResponse = document.getElementById("paciente-response");
  const pacienteList = document.getElementById("paciente-list");

  pacienteForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      alert("Por favor, informe seu e-mail no topo da página.");
      return;
    }

    const nome = document.getElementById("paciente-nome").value.trim();
    const dataNascimento = document.getElementById(
      "paciente-data-nascimento"
    ).value;

    let sql;
    if (dataNascimento) {
      sql = `INSERT INTO paciente (nome, data_nascimento) VALUES ('${escapeSql(
        nome
      )}', '${dataNascimento}');`;
    } else {
      sql = `INSERT INTO paciente (nome, data_nascimento) VALUES ('${escapeSql(
        nome
      )}', NULL);`;
    }

    pacienteBtn.disabled = true;
    pacienteBtn.textContent = "Salvando...";

    try {
      const json = await sendSQL(email, sql);
      showResponse(pacienteResponse, json, "Paciente cadastrado com sucesso!");

      if (json.success) {
        pacienteForm.reset();
        await loadList("paciente", pacienteList);
      }
    } finally {
      pacienteBtn.disabled = false;
      pacienteBtn.textContent = "Salvar Paciente";
    }
  });

  document
    .getElementById("paciente-tab")
    .addEventListener("shown.bs.tab", () => {
      loadList("paciente", pacienteList);
    });
  const consultaForm = document.getElementById("consulta-form");
  const consultaBtn = document.getElementById("consulta-btn");
  const consultaResponse = document.getElementById("consulta-response");
  const consultaList = document.getElementById("consulta-list");

  consultaForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      alert("Por favor, informe seu e-mail no topo da página.");
      return;
    }

    const idMedico = document.getElementById("consulta-id-medico").value;
    const idPaciente = document.getElementById("consulta-id-paciente").value;
    const dataConsulta = document.getElementById("consulta-data").value;
    const observacoes = document
      .getElementById("consulta-observacoes")
      .value.trim();
    const dataFormatada = dataConsulta.replace("T", " ");

    let sql;
    if (observacoes) {
      sql = `INSERT INTO consulta (id_medico, id_paciente, data_consulta, observacoes) 
           VALUES (${idMedico}, ${idPaciente}, TIMESTAMP '${dataFormatada}', '${escapeSql(
        observacoes
      )}');`;
    } else {
      sql = `INSERT INTO consulta (id_medico, id_paciente, data_consulta, observacoes) 
           VALUES (${idMedico}, ${idPaciente}, TIMESTAMP '${dataFormatada}', NULL);`;
    }

    consultaBtn.disabled = true;
    consultaBtn.textContent = "Salvando...";

    try {
      const json = await sendSQL(email, sql);
      showResponse(consultaResponse, json, "Consulta cadastrada com sucesso!");

      if (json.success) {
        consultaForm.reset();
        await loadList("consulta", consultaList);
      }
    } catch (error) {
      showResponse(
        consultaResponse,
        { success: false, error: error.message },
        ""
      );
    } finally {
      consultaBtn.disabled = false;
      consultaBtn.textContent = "Salvar Consulta";
    }
  });
  document
    .getElementById("consulta-tab")
    .addEventListener("shown.bs.tab", () => {
      loadList("consulta", consultaList);
    });
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

    const idPaciente = document.getElementById("ficha-id-paciente").value;
    const tipoSanguineo = document.getElementById("ficha-tipo-sanguineo").value;
    const possuiConvenio = document.getElementById(
      "ficha-possui-convenio"
    ).value;

    let sql;
    if (tipoSanguineo) {
      sql = `INSERT INTO ficha_paciente (id_paciente, tipo_sanguineo, possui_convenio) 
             VALUES (${idPaciente}, '${tipoSanguineo}', ${possuiConvenio});`;
    } else {
      sql = `INSERT INTO ficha_paciente (id_paciente, tipo_sanguineo, possui_convenio) 
             VALUES (${idPaciente}, NULL, ${possuiConvenio});`;
    }

    fichaBtn.disabled = true;
    fichaBtn.textContent = "Salvando...";

    try {
      const json = await sendSQL(email, sql);
      showResponse(fichaResponse, json, "Ficha cadastrada com sucesso!");

      if (json.success) {
        fichaForm.reset();
        await loadList("ficha_paciente", fichaList);
      }
    } finally {
      fichaBtn.disabled = false;
      fichaBtn.textContent = "Salvar Ficha";
    }
  });

  document.getElementById("ficha-tab").addEventListener("shown.bs.tab", () => {
    loadList("ficha_paciente", fichaList);
  });
  const especialidadeForm = document.getElementById("especialidade-form");
  const especialidadeBtn = document.getElementById("especialidade-btn");
  const especialidadeResponse = document.getElementById(
    "especialidade-response"
  );
  const especialidadeList = document.getElementById("especialidade-list");

  especialidadeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      alert("Por favor, informe seu e-mail no topo da página.");
      return;
    }

    const nome = document.getElementById("especialidade-nome").value.trim();

    const sql = `INSERT INTO especialidade (nome) VALUES ('${escapeSql(
      nome
    )}');`;

    especialidadeBtn.disabled = true;
    especialidadeBtn.textContent = "Salvando...";

    try {
      const json = await sendSQL(email, sql);
      showResponse(
        especialidadeResponse,
        json,
        "Especialidade cadastrada com sucesso!"
      );

      if (json.success) {
        especialidadeForm.reset();
        await loadList("especialidade", especialidadeList);
      }
    } finally {
      especialidadeBtn.disabled = false;
      especialidadeBtn.textContent = "Salvar Especialidade";
    }
  });

  document
    .getElementById("especialidade-tab")
    .addEventListener("shown.bs.tab", () => {
      loadList("especialidade", especialidadeList);
    });
  const medicoEspecialidadeForm = document.getElementById(
    "medico-especialidade-form"
  );
  const medicoEspecialidadeBtn = document.getElementById(
    "medico-especialidade-btn"
  );
  const medicoEspecialidadeResponse = document.getElementById(
    "medico-especialidade-response"
  );
  const medicoEspecialidadeList = document.getElementById(
    "medico-especialidade-list"
  );

  medicoEspecialidadeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email) {
      alert("Por favor, informe seu e-mail no topo da página.");
      return;
    }

    const idMedico = document.getElementById("me-id-medico").value;
    const idEspecialidade = document.getElementById(
      "me-id-especialidade"
    ).value;

    const sql = `INSERT INTO medico_especialidade (id_medico, id_especialidade) 
               VALUES (${idMedico}, ${idEspecialidade});`;

    medicoEspecialidadeBtn.disabled = true;
    medicoEspecialidadeBtn.textContent = "Vinculando...";

    try {
      const json = await sendSQL(email, sql);
      showResponse(
        medicoEspecialidadeResponse,
        json,
        "Vínculo criado com sucesso!"
      );

      if (json.success) {
        medicoEspecialidadeForm.reset();
        await loadList("medico_especialidade", medicoEspecialidadeList);
      }
    } finally {
      medicoEspecialidadeBtn.disabled = false;
      medicoEspecialidadeBtn.textContent = "Vincular";
    }
  });

  document
    .getElementById("medico-especialidade-tab")
    .addEventListener("shown.bs.tab", () => {
      loadList("medico_especialidade", medicoEspecialidadeList);
    });
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
      p.nome AS paciente,
      p.data_nascimento,
      COALESCE(fp.tipo_sanguineo, 'Não informado') AS tipo_sanguineo,
      CASE 
        WHEN fp.possui_convenio = true THEN 'Sim'
        WHEN fp.possui_convenio = false THEN 'Não'
        ELSE 'Não informado'
      END AS tem_convenio,
      m.nome AS medico,
      m.crm,
      STRING_AGG(DISTINCT e.nome, ', ') AS especialidades,
      c.data_consulta,
      COALESCE(c.observacoes, '-') AS observacoes
    FROM consulta c
    INNER JOIN paciente p ON c.id_paciente = p.id_paciente
    INNER JOIN medico m ON c.id_medico = m.id_medico
    LEFT JOIN ficha_paciente fp ON p.id_paciente = fp.id_paciente
    LEFT JOIN medico_especialidade me ON m.id_medico = me.id_medico
    LEFT JOIN especialidade e ON me.id_especialidade = e.id_especialidade
    GROUP BY 
      p.nome, 
      p.data_nascimento, 
      fp.tipo_sanguineo, 
      fp.possui_convenio, 
      m.nome, 
      m.crm, 
      c.data_consulta, 
      c.observacoes
    ORDER BY c.data_consulta DESC
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
        let html = `
        <div class="alert alert-info">
          <strong>${json.rows.length}</strong> consulta(s) encontrada(s)
        </div>
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead class="table-dark">
              <tr>
                <th>Paciente</th>
                <th>Idade</th>
                <th>Tipo Sanguíneo</th>
                <th>Convênio</th>
                <th>Médico</th>
                <th>CRM</th>
                <th>Especialidades</th>
                <th>Data Consulta</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
      `;

        json.rows.forEach((row) => {
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
          let dataConsultaFormatada = "-";
          if (row.data_consulta) {
            const dataConsulta = new Date(row.data_consulta);
            dataConsultaFormatada = dataConsulta.toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
          }
          const convenioClass =
            row.tem_convenio === "Sim"
              ? "bg-success"
              : row.tem_convenio === "Não"
              ? "bg-warning"
              : "bg-secondary";
          const tipoSanguineoClass =
            row.tipo_sanguineo !== "Não informado"
              ? "bg-danger"
              : "bg-secondary";

          html += `
          <tr>
            <td><strong>${row.paciente}</strong></td>
            <td>${idade}</td>
            <td><span class="badge ${tipoSanguineoClass}">${
            row.tipo_sanguineo
          }</span></td>
            <td><span class="badge ${convenioClass}">${
            row.tem_convenio
          }</span></td>
            <td>${row.medico}</td>
            <td><small class="text-muted">${row.crm}</small></td>
            <td><em>${row.especialidades || "Não informado"}</em></td>
            <td><small>${dataConsultaFormatada}</small></td>
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
          <h6>Nenhuma consulta encontrada</h6>
          <p class="mb-0">Cadastre pacientes, médicos, especialidades e consultas para visualizar o relatório.</p>
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
  relatorioRefreshBtn.addEventListener("click", loadRelatorioCompleto);
  document
    .getElementById("relatorio-tab")
    .addEventListener("shown.bs.tab", () => {
      loadRelatorioCompleto();
    });
})();
