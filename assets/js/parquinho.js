(function () {
  const STORAGE_KEY = "parquinho_email";
  const API_URL = "https://micha6555.c44.integrator.host/api/sql";

  const emailInput = document.getElementById("email");
  const sqlTextarea = document.getElementById("sql");
  const previewCode = document.getElementById("sql-preview");
  const form = document.getElementById("sql-form");
  const runBtn = document.getElementById("run-btn");
  const clearBtn = document.getElementById("clear-btn");
  const rawJson = document.getElementById("raw-json");
  const responseSummary = document.getElementById("response-summary");
  const rowsTableWrapper = document.getElementById("rows-table-wrapper");

  function safe(fn) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (e) {
        /* ignore */
      }
    };
  }

  function debounce(fn, wait = 120) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  // Highlight helper com fallback para highlightAuto
  function highlightElement(el, preferLang = "sql") {
    if (!el) return;
    if (window.hljs) {
      try {
        if (hljs.getLanguage && hljs.getLanguage(preferLang)) {
          hljs.highlightElement(el);
        } else {
          const code = el.textContent || "";
          const result = hljs.highlightAuto(code);
          el.innerHTML = result.value;
        }
      } catch (e) {
        // silent
      }
    }
  }

  function updatePreview() {
    if (!previewCode || !sqlTextarea) return;
    previewCode.textContent = sqlTextarea.value.trim() || "-- sem conteúdo --";
    highlightElement(previewCode, "sql");
  }
  const debouncedPreview = debounce(updatePreview, 120);

  function renderRowsTable(rows) {
    if (!rowsTableWrapper) return;
    if (!Array.isArray(rows) || rows.length === 0) {
      rowsTableWrapper.innerHTML =
        '<div class="text-muted">Nenhuma linha retornada.</div>';
      return;
    }
    const keys = Object.keys(rows[0]);
    const table = document.createElement("table");
    table.className = "table table-sm table-bordered table-striped";
    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");
    keys.forEach((k) => {
      const th = document.createElement("th");
      th.textContent = k;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      keys.forEach((k) => {
        const td = document.createElement("td");
        const v = r[k];
        td.textContent = v === null || v === undefined ? "NULL" : String(v);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    rowsTableWrapper.innerHTML = "";
    rowsTableWrapper.appendChild(table);
  }

  function clearResponseAreas() {
    if (responseSummary) responseSummary.innerHTML = "";
    if (rawJson) rawJson.textContent = "";
    if (rowsTableWrapper) rowsTableWrapper.innerHTML = "";
  }

  // mostra resultado detalhado (sucesso/erro)
  function showResponse(json) {
    if (!responseSummary) return;

    // raw JSON display
    if (rawJson) {
      rawJson.textContent = JSON.stringify(json, null, 2);
      highlightElement(rawJson, "json");
    }

    // sucesso
    if (json && json.success === true) {
      responseSummary.innerHTML = `
        <div class="alert alert-success p-2 mb-2" role="alert">
          <strong>Sucesso</strong> — comando executado.
          <div><small>Email: ${json.email || ""} | Schema: ${
        json.schema || ""
      } | Command: ${json.command || ""} | RowCount: ${
        json.rowCount ?? 0
      }</small></div>
        </div>
      `;
      if (Array.isArray(json.rows)) renderRowsTable(json.rows);
      return;
    }

    // erro ou sucesso=false
    const err = json || {};
    const msg = err.error || err.message || "Erro desconhecido";
    const detail = err.detail
      ? `<div><strong>Detail:</strong> ${err.detail}</div>`
      : "";
    const hint = err.hint
      ? `<div><strong>Hint:</strong> ${err.hint}</div>`
      : "";

    responseSummary.innerHTML = `
      <div class="alert alert-danger p-2 mb-2" role="alert">
        <strong>Erro</strong> — ${msg}
        ${detail}
        ${hint}
        <div><small>Revise seu comando, se tiver dúvidas, olhe na Colinha.</small></div>
      </div>
    `;

    // se houver rows mesmo em erro, ainda mostra (opcional)
    if (Array.isArray(err.rows) && err.rows.length) renderRowsTable(err.rows);
  }

  // envia X-Aluno no header além do body
  async function sendSQL(email, sql) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-aluno": email,
      },
      body: JSON.stringify({ email, sql }),
    });
    if (!res.ok) {
      // tenta ler corpo com JSON de erro do servidor
      let body = null;
      try {
        body = await res.json();
      } catch (e) {
        /* ignore */
      }
      const statusText = `${res.status} ${res.statusText}`;
      if (body) {
        // normaliza para objeto com success:false se necessário
        return { success: false, ...body, _httpStatus: statusText };
      }
      throw new Error(statusText);
    }
    return await res.json();
  }

  // eventos
  document.addEventListener(
    "DOMContentLoaded",
    safe(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && emailInput) emailInput.value = saved;
      updatePreview();
    })
  );

  if (emailInput) {
    emailInput.addEventListener(
      "input",
      safe(() => {
        const v = emailInput.value.trim();
        if (v) localStorage.setItem(STORAGE_KEY, v);
        else localStorage.removeItem(STORAGE_KEY);
      })
    );
  }

  if (sqlTextarea) {
    sqlTextarea.addEventListener("input", debouncedPreview);
  }

  if (clearBtn) {
    clearBtn.addEventListener(
      "click",
      safe(() => {
        if (sqlTextarea) sqlTextarea.value = "";
        if (
          typeof editor !== "undefined" &&
          editor &&
          typeof editor.setValue === "function"
        ) {
          editor.setValue("");
        }
        updatePreview();
        clearResponseAreas();
      })
    );
  }

  if (form) {
    form.addEventListener(
      "submit",
      safe(async (ev) => {
        ev.preventDefault();
        const email = emailInput?.value?.trim();
        const sql = sqlTextarea?.value?.trim();
        if (!email || !sql) return;

        runBtn.disabled = true;
        runBtn.textContent = "Executando...";

        clearResponseAreas();

        try {
          const json = await sendSQL(email, sql);
          showResponse(json);
        } catch (err) {
          if (responseSummary)
            responseSummary.innerHTML = `<div class="alert alert-danger p-2">Erro na requisição: ${err.message}</div>`;
          if (rawJson) rawJson.textContent = "";
        } finally {
          runBtn.disabled = false;
          runBtn.textContent = "Executar";
        }
      })
    );
  }

  // Transforma textarea em editor CodeMirror com highlight
  const sqlTextareaEl = document.getElementById("sql");

  const editor = CodeMirror.fromTextArea(sqlTextareaEl, {
    mode: "text/x-sql",
    theme: "default",
    lineNumbers: true,
    indentWithTabs: true,
    smartIndent: true,
    matchBrackets: true,
    autofocus: true,
  });

  // Quando o usuário digita, atualiza o preview (se quiser)
  editor.on("change", () => {
    sqlTextareaEl.value = editor.getValue();
  });
})();
