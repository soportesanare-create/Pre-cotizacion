(function() {
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => Array.from(el.querySelectorAll(q));

  // 🔐 LOGIN USERS
  const USERS = {
    "admin": "g84k$2H*9Xl!",
    "bere": "Bere1102",
    "alain": "Ala1103",
    "oscar": "Osca1104",
    "anayely": "Ana1105",
    "dayana": "Daya1106",
    "maky": "Mak1107"
  };

  // State keys
  const LS_QUOTE = "sanare_pre_quote_v1";
  const LS_THEME = "sanare_pre_theme_v1";

  // Login handler
  window.checkLogin = function() {
    const rawUser = $('#user').value.trim();
    const u = rawUser.toLowerCase();
    const p = $('#pass').value.trim();
    if (USERS[u] && USERS[u] === p) {
      $('#overlay').style.display = 'none';
      // Use original casing if they typed it nicely, or capitalized version
      state.info.kam = rawUser.charAt(0).toUpperCase() + rawUser.slice(1).toLowerCase();
      $('#qKam').value = state.info.kam;
      if ($('#quotePreparedBy')) {
        $('#quotePreparedBy').textContent = `Pre cotización preparada por ${state.info.kam}`;
      }
      saveState();
    } else {
      alert("Usuario o contraseña incorrectos");
    }
  };

  // Helper formatting functions
  function formatMoney(n) {
    return Number(n || 0).toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function getTodayString(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  function getPhoneForAddress(address) {
    const val = String(address || "");
    if (val.includes("Toluca")) return "722 197 08 36";
    if (val.includes("Narvarte")) return "55 5255 8403";
    if (val.includes("Morelia")) return "4433249063";
    return "";
  }

  // State Definition
  let state = {
    info: {
      patient: "",
      doctor: "",
      insurance: "",
      kam: "CORPORATIVO",
      issueDate: getTodayString(0),
      validDate: getTodayString(30),
      scheduleDate: "",
      address: "",
      phone: "",
      dx: "",
      scheme: ""
    },
    meds: [],
    services: []
  };

  // Load state from localStorage
  function loadState() {
    try {
      const data = JSON.parse(localStorage.getItem(LS_QUOTE));
      if (data && typeof data === "object") {
        state = {
          info: { ...state.info, ...(data.info || {}) },
          meds: data.meds || [],
          services: data.services || []
        };
      }
    } catch (e) {
      console.warn("Could not load quote state:", e);
    }
  }

  // Save state to localStorage
  function saveState() {
    try {
      localStorage.setItem(LS_QUOTE, JSON.stringify(state));
    } catch (e) {
      console.warn("Could not save quote state:", e);
    }
  }

  // Bind input elements to state keys
  function bindField(selector, key) {
    const el = $(selector);
    if (!el) return;
    el.addEventListener("input", () => {
      state.info[key] = el.value;
      saveState();
      updatePreparedBy();
      updateStatus();
    });
    el.addEventListener("change", () => {
      state.info[key] = el.value;
      saveState();
      updatePreparedBy();
      updateStatus();
    });
  }

  function updatePreparedBy() {
    const el = $('#quotePreparedBy');
    if (el) {
      el.textContent = `Pre cotización preparada por ${state.info.kam || "Corporativo"}`;
    }
  }

  function updateStatus() {
    const el = $('#quoteStatus');
    if (!el) return;
    const hasData = state.info.patient.trim() && (state.meds.length > 0 || state.services.length > 0);
    el.textContent = hasData ? "Pre cotización en progreso" : "Lista para capturar";
  }

  // Render elements & logic
  function renderAll() {
    // Populate simple inputs
    if ($('#qPatient')) $('#qPatient').value = state.info.patient;
    if ($('#qDoctor')) $('#qDoctor').value = state.info.doctor;
    if ($('#qInsurance')) $('#qInsurance').value = state.info.insurance;
    if ($('#qKam')) $('#qKam').value = state.info.kam;
    if ($('#qIssueDate')) $('#qIssueDate').value = state.info.issueDate;
    if ($('#qValidDate')) $('#qValidDate').value = state.info.validDate;
    if ($('#qScheduleDate')) $('#qScheduleDate').value = state.info.scheduleDate;
    if ($('#qPhone')) $('#qPhone').value = state.info.phone;
    if ($('#qDx')) $('#qDx').value = state.info.dx;
    if ($('#qScheme')) $('#qScheme').value = state.info.scheme;

    updatePreparedBy();
    updateStatus();
    renderTables();
  }

  function renderTables() {
    const medTableBody = $('#qMedTable tbody');
    const servTableBody = $('#qServTable tbody');

    // 1. Medicines
    if (medTableBody) {
      medTableBody.innerHTML = state.meds.map((item, idx) => {
        const itemSubtotal = (Number(item.precio) || 0) * (Number(item.qty) || 0);
        return `
          <tr>
            <td>${item.nombre}</td>
            <td>${item.ean || "—"}</td>
            <td>${item.qty}</td>
            <td>${formatMoney(item.precio)}</td>
            <td>${formatMoney(itemSubtotal)}</td>
            <td><button class="quote-remove" type="button" data-del-med="${idx}">✕</button></td>
          </tr>
        `;
      }).join("");

      // Bind delete events
      $$('[data-del-med]').forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.dataset.delMed);
          state.meds.splice(idx, 1);
          saveState();
          renderTables();
          updateStatus();
        });
      });
    }

    // 2. Services
    if (servTableBody) {
      servTableBody.innerHTML = state.services.map((item, idx) => {
        const itemSubtotal = (Number(item.precio) || 0) * (Number(item.qty) || 0) * (1 - (Number(item.discount) || 0) / 100);
        return `
          <tr>
            <td>${item.servicio}</td>
            <td>${item.qty}</td>
            <td>${formatMoney(item.precio)}</td>
            <td>${item.discount}%</td>
            <td>${formatMoney(itemSubtotal)}</td>
            <td><button class="quote-remove" type="button" data-del-serv="${idx}">✕</button></td>
          </tr>
        `;
      }).join("");

      // Bind delete events
      $$('[data-del-serv]').forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.dataset.delServ);
          state.services.splice(idx, 1);
          saveState();
          renderTables();
          updateStatus();
        });
      });
    }

    // Recalculate totals
    const medTotal = state.meds.reduce((sum, item) => sum + (Number(item.precio) || 0) * (Number(item.qty) || 0), 0);
    const servTotal = state.services.reduce((sum, item) => sum + (Number(item.precio) || 0) * (Number(item.qty) || 0) * (1 - (Number(item.discount) || 0) / 100), 0);
    const subtotalVal = medTotal + servTotal;
    const ivaVal = servTotal * 0.16; // IVA calculated ONLY on services
    const grandTotalVal = subtotalVal + ivaVal;

    if ($('#qSubtotal')) $('#qSubtotal').textContent = formatMoney(subtotalVal);
    if ($('#qIVA')) $('#qIVA').textContent = formatMoney(ivaVal);
    if ($('#qTotal')) $('#qTotal').textContent = formatMoney(grandTotalVal);

    // Quick Stats Card updates
    if ($('#statMedCount')) $('#statMedCount').textContent = String(state.meds.length);
    if ($('#statServCount')) $('#statServCount').textContent = String(state.services.length);
    if ($('#statTotal')) $('#statTotal').textContent = formatMoney(grandTotalVal);
  }

  // Populate Dropdowns from pre-cotizador-data.js
  function initDropdowns() {
    const DATA = window.SANARE_PRE_COT_DATA || { direcciones: [], medicamentos: [], servicios: [] };

    // Sede Dropdown
    const addressSelect = $('#qAddress');
    if (addressSelect) {
      addressSelect.innerHTML = "";
      (DATA.direcciones || []).forEach(addr => {
        const opt = document.createElement("option");
        opt.value = addr;
        opt.textContent = addr;
        addressSelect.appendChild(opt);
      });

      if (!state.info.address && DATA.direcciones.length > 0) {
        state.info.address = DATA.direcciones[0];
      }
      addressSelect.value = state.info.address;
      state.info.phone = getPhoneForAddress(state.info.address);
      if ($('#qPhone')) $('#qPhone').value = state.info.phone;

      addressSelect.addEventListener("change", () => {
        state.info.address = addressSelect.value;
        state.info.phone = getPhoneForAddress(state.info.address);
        if ($('#qPhone')) $('#qPhone').value = state.info.phone;
        saveState();
      });
    }

    // Medicine Dropdowns (loaded with search/sort)
    const medSource = (DATA.medicamentos || []).filter(m => m && m.nombre && !String(m.nombre).includes("Nombre del Artículo"));
    const servSource = (DATA.servicios || []).filter(s => s && s.servicio);

    function updateMedDropdown() {
      const select = $('#qMedSelect');
      if (!select) return;
      const term = ($('#qMedSearch')?.value || "").toLowerCase().trim();
      const sort = $('#qMedSort')?.value || "nombre";

      let list = medSource.filter(m => 
        String(m.nombre).toLowerCase().includes(term) || 
        String(m.ean || "").toLowerCase().includes(term)
      );

      if (sort === "precio") {
        list.sort((a, b) => Number(b.precio || 0) - Number(a.precio || 0));
      } else {
        list.sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es"));
      }

      select.innerHTML = "";
      list.slice(0, 300).forEach(m => {
        const opt = document.createElement("option");
        opt.value = JSON.stringify({ ean: m.ean, nombre: m.nombre, precio: Number(m.precio || 0) });
        opt.textContent = `${m.ean || "—"} — ${m.nombre} — ${formatMoney(m.precio || 0)}`;
        select.appendChild(opt);
      });
    }

    $('#qMedSearch')?.addEventListener("input", updateMedDropdown);
    $('#qMedSort')?.addEventListener("change", updateMedDropdown);
    updateMedDropdown();

    // Services Dropdown
    const handleServiceDiscount = () => {
      const servSelect = $('#qServSelect');
      if (!servSelect || !servSelect.value) return;
      try {
        const sObj = JSON.parse(servSelect.value);
        const isInfusion = String(sObj.servicio || "").toUpperCase().includes("INSUMOS Y SERVICIO DE INFUSIÓN");
        if ($('#qServDiscount')) {
          $('#qServDiscount').value = isInfusion ? "50" : "0";
        }
      } catch (e) {}
    };

    function updateServDropdown() {
      const select = $('#qServSelect');
      if (!select) return;
      const term = ($('#qServSearch')?.value || "").toLowerCase().trim();
      const sort = $('#qServSort')?.value || "nombre";

      let list = servSource.filter(s => 
        String(s.servicio).toLowerCase().includes(term)
      );

      if (sort === "precio") {
        list.sort((a, b) => Number(b.precio || 0) - Number(a.precio || 0));
      } else {
        list.sort((a, b) => String(a.servicio).localeCompare(String(b.servicio), "es"));
      }

      select.innerHTML = "";
      list.forEach(s => {
        const opt = document.createElement("option");
        opt.value = JSON.stringify({ servicio: s.servicio, precio: Number(s.precio || 0) });
        opt.textContent = `${s.servicio} — ${formatMoney(s.precio || 0)}`;
        select.appendChild(opt);
      });

      handleServiceDiscount();
    }

    $('#qServSearch')?.addEventListener("input", updateServDropdown);
    $('#qServSort')?.addEventListener("change", updateServDropdown);
    $('#qServSelect')?.addEventListener("change", handleServiceDiscount);
    updateServDropdown();


    // Add row button events
    $('#qAddMed')?.addEventListener("click", () => {
      const select = $('#qMedSelect');
      if (!select || !select.value) return;
      try {
        const item = JSON.parse(select.value);
        const qtyVal = Math.max(1, Number($('#qMedQty')?.value || 1));
        state.meds.push({ ...item, qty: qtyVal });
        saveState();
        renderTables();
        updateStatus();
        // Reset qty
        if ($('#qMedQty')) $('#qMedQty').value = "1";
      } catch (e) {
        console.error("Could not add medicine:", e);
      }
    });

    $('#qAddServ')?.addEventListener("click", () => {
      const select = $('#qServSelect');
      if (!select || !select.value) return;
      try {
        const item = JSON.parse(select.value);
        const qtyVal = Math.max(1, Number($('#qServQty')?.value || 1));
        const discVal = Math.max(0, Math.min(100, Number($('#qServDiscount')?.value || 0)));
        state.services.push({ ...item, qty: qtyVal, discount: discVal });
        saveState();
        renderTables();
        updateStatus();
        // Reset inputs
        if ($('#qServQty')) $('#qServQty').value = "1";
        if ($('#qServDiscount')) $('#qServDiscount').value = "0";
      } catch (e) {
        console.error("Could not add service:", e);
      }
    });
  }

  // Reset function
  function initReset() {
    $('#btnQuoteReset')?.addEventListener("click", () => {
      state.info = {
        patient: "",
        doctor: "",
        insurance: "",
        kam: state.info.kam || "CORPORATIVO",
        issueDate: getTodayString(0),
        validDate: getTodayString(30),
        scheduleDate: "",
        address: window.SANARE_PRE_COT_DATA?.direcciones?.[0] || "",
        phone: getPhoneForAddress(window.SANARE_PRE_COT_DATA?.direcciones?.[0] || ""),
        dx: "",
        scheme: ""
      };
      state.meds = [];
      state.services = [];
      saveState();
      renderAll();
      if ($('#qAddress')) $('#qAddress').value = state.info.address;
    });
  }

  // Firebase Log Helper
  function logToFirebase(exportType) {
    if (typeof window.saveQuoteToFirebase === "function") {
      window.saveQuoteToFirebase({
        tipo_exportacion: exportType,
        paciente: state.info.patient || "No especificado",
        medico: state.info.doctor || "No especificado",
        kam: state.info.kam || "No especificado",
        sede: state.info.address || "No especificado",
        total: $('#qTotal') ? $('#qTotal').textContent : "$ 0.00",
        medicamentos_count: state.meds.length,
        servicios_count: state.services.length,
        detalles_completos: JSON.stringify({ info: state.info, meds: state.meds, services: state.services })
      });
    }
  }

  // PDF Export Logic using html2pdf.js
  function initPdfExport() {
    const btn = $('#btnQuotePrint');
    if (!btn) return;

    function getPdfFileName() {
      let sede = (state.info.address || "Sede").trim().split(" ")[0];
      let patient = (state.info.patient || "Paciente").trim();
      let date = (state.info.issueDate || getTodayString(0));
      
      sede = sede.replace(/[^a-z0-9]/gi, "_");
      patient = patient.replace(/[^a-z0-9]/gi, "_");
      date = date.replace(/[^0-9\-]/g, "_");
      return `${sede}_${patient}_${date}.pdf`;
    }

    btn.addEventListener("click", function() {
      const element = document.getElementById("cotizador");
      if (!element || typeof html2pdf === "undefined") {
        alert("La librería PDF no se cargó correctamente. Revisa tu conexión.");
        return;
      }

      const ww = (element.scrollWidth || 980) + 120;
      const wh = (element.scrollHeight || 1600) + 120;

      const opt = {
        margin: [10, 10, 10, 10],
        filename: getPdfFileName(),
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: false,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
          windowWidth: ww,
          windowHeight: wh,
          onclone: (clonedDoc) => {
            // Add print/pdf export markers
            clonedDoc.body.classList.add("pdf-export");
            clonedDoc.body.style.padding = "12px";

            // Inject custom overrides for print layout (keep table structure, fit on single page if possible)
            const style = clonedDoc.createElement("style");
            style.textContent = `
              .pdf-export #cotizador { padding: 14px !important; margin: 0 !important; }
              .pdf-export .topbar-pre { display: none !important; }
              .pdf-export .quote-head-actions { display: none !important; }
              .pdf-export .quote-hint { display: none !important; }
              .pdf-export .mini-list { display: none !important; }
              .pdf-export .quote-remove { display: none !important; }
              .pdf-export .toolbar-grid { display: none !important; }
              .pdf-export table button { display: none !important; }
              .pdf-export .quote-stats { display: none !important; }
              .pdf-export #overlay { display: none !important; }
              .pdf-export .pre-cotizador-container { padding: 0 !important; }
              .pdf-export .quote-shell { box-shadow: none !important; border: none !important; padding: 0 !important; }
              .pdf-export .quote-grid { grid-template-columns: 1fr !important; }
              .pdf-export .card-flat { box-shadow: none !important; border: 1px solid #d8cdc7 !important; background: #fff !important; margin-bottom: 12px !important; }

              /* Convert interactive fields into flat structured blocks for clean PDF rendering */
              .pdf-export .pdf-static {
                padding: 10px 12px !important;
                border: 1px solid #d8cdc7 !important;
                border-radius: 12px !important;
                background: #fffaf8 !important;
                font-size: 13px !important;
                min-height: 40px !important;
                display: flex;
                align-items: center;
                color: #1e1b1a !important;
                box-sizing: border-box;
              }
              .pdf-export .pdf-static.multiline {
                align-items: flex-start;
                white-space: pre-wrap;
                min-height: 60px !important;
              }
            `;
            clonedDoc.head.appendChild(style);

            // Replace inputs, selects, textareas with flat text divs
            clonedDoc.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(el => {
              if (el.style.display === 'none') return;
              const originalEl = document.getElementById(el.id);
              if (!originalEl) return;

              const div = clonedDoc.createElement('div');
              div.className = originalEl.tagName === 'TEXTAREA' ? 'pdf-static multiline' : 'pdf-static';
              div.textContent = originalEl.tagName === 'SELECT' ? (originalEl.options[originalEl.selectedIndex]?.text || '') : (originalEl.value || '');
              div.style.width = '100%';

              el.parentNode.replaceChild(div, el);
            });
          }
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      };

      html2pdf().set(opt).from(element).save();
      setTimeout(() => logToFirebase("PDF"), 1000);
    });
  }

  // Image Export Logic using html2canvas & premium preview modal
  function initImageExport() {
    const btn = $('#btnQuoteImg');
    if (!btn) return;

    function getFileName() {
      let sede = (state.info.address || "Sede").trim().split(" ")[0];
      let patient = (state.info.patient || "Paciente").trim();
      let date = (state.info.issueDate || getTodayString(0));
      
      sede = sede.replace(/[^a-z0-9]/gi, "_");
      patient = patient.replace(/[^a-z0-9]/gi, "_");
      date = date.replace(/[^0-9\-]/g, "_");
      return `${sede}_${patient}_${date}.png`;
    }

    function showImageModal(dataURL, nombreArchivo) {
      const modal = document.createElement("div");
      modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(11,30,51,0.95);z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;overflow-y:auto;";

      const card = document.createElement("div");
      card.style.cssText = "background:var(--bg2);padding:24px;border-radius:24px;max-width:500px;width:100%;box-shadow:0 20px 40px rgba(0,0,0,0.3);text-align:center;color:var(--text);border:1px solid var(--stroke);";

      const title = document.createElement("h3");
      title.textContent = "Pre Cotización Generada";
      title.style.cssText = "margin:0 0 10px 0;font-size:18px;font-weight:800;";
      card.appendChild(title);

      const img = document.createElement("img");
      img.src = dataURL;
      img.style.cssText = "max-width:100%;max-height:40vh;border-radius:12px;border:1px solid var(--stroke);margin-bottom:14px;object-fit:contain;box-shadow:var(--shadow2);";
      card.appendChild(img);

      const msg = document.createElement("p");
      msg.textContent = "La imagen se ha preparado correctamente. Puedes descargarla o compartirla directamente desde aquí.";
      msg.style.cssText = "font-size:13px;color:var(--muted);margin:0 0 18px 0;line-height:1.4;";
      card.appendChild(msg);

      const btnContainer = document.createElement("div");
      btnContainer.style.cssText = "display:flex;gap:10px;justify-content:center;flex-wrap:wrap;";

      const downloadBtn = document.createElement("button");
      downloadBtn.textContent = "⬇️ Descargar";
      downloadBtn.style.cssText = "padding:12px 20px;border:none;border-radius:12px;background:#0b1e33;color:#fff;font-weight:700;cursor:pointer;font-size:14px;";
      downloadBtn.onclick = function() {
        const a = document.createElement("a");
        a.href = dataURL;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };
      btnContainer.appendChild(downloadBtn);

      const shareBtn = document.createElement("button");
      shareBtn.textContent = "📤 Compartir";
      shareBtn.style.cssText = "padding:12px 20px;border:none;border-radius:12px;background:#25D366;color:#fff;font-weight:700;cursor:pointer;font-size:14px;";
      shareBtn.onclick = function() {
        try {
          fetch(dataURL)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], nombreArchivo, { type: 'image/png' });
              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({
                  files: [file],
                  title: 'Pre Cotización SANARÉ',
                  text: 'Adjunto Pre Cotización SANARÉ'
                }).catch(err => {
                  if (err.name !== 'AbortError') alert("No se pudo compartir de forma nativa.");
                });
              } else {
                alert("Tu dispositivo o navegador no soporta compartir este tipo de archivo directamente.");
              }
            });
        } catch (e) {
          alert("Error al intentar compartir la imagen.");
        }
      };
      btnContainer.appendChild(shareBtn);

      const closeBtn = document.createElement("button");
      closeBtn.textContent = "✕ Cerrar";
      closeBtn.style.cssText = "padding:12px 20px;border:none;border-radius:12px;background:#555;color:#fff;font-weight:700;cursor:pointer;font-size:14px;";
      closeBtn.onclick = function() {
        document.body.removeChild(modal);
      };
      btnContainer.appendChild(closeBtn);

      card.appendChild(btnContainer);
      modal.appendChild(card);
      document.body.appendChild(modal);
    }

    btn.addEventListener("click", function() {
      const originalText = btn.innerText;
      btn.innerText = "⏳ Generando...";
      btn.disabled = true;

      // Select target element
      const target = document.querySelector(".quote-shell");

      html2canvas(target, {
        scale: 3,
        useCORS: false,
        windowWidth: 1100,
        onclone: (clonedDoc) => {
          // Hide capturing UI
          clonedDoc.querySelectorAll('.quote-head-actions, .toolbar-grid, .quote-remove, .topbar-pre').forEach(el => el.style.display = 'none');
          
          const qShell = clonedDoc.querySelector(".quote-shell");
          if (qShell) {
            qShell.style.width = "1100px";
            qShell.style.maxWidth = "none";
            qShell.style.boxShadow = "none";
            qShell.style.border = "none";
            qShell.style.margin = "0";
            qShell.style.padding = "24px";
            qShell.style.background = "#ffffff";
          }

          // Flat static text styling
          clonedDoc.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(el => {
            if (el.style.display === 'none') return;
            const originalEl = document.getElementById(el.id);
            if (!originalEl) return;

            const div = clonedDoc.createElement('div');
            div.textContent = originalEl.tagName === 'SELECT' ? (originalEl.options[originalEl.selectedIndex]?.text || '') : (originalEl.value || '');
            
            const compStyle = window.getComputedStyle(originalEl);
            div.style.width = originalEl.offsetWidth ? originalEl.offsetWidth + 'px' : '100%';
            div.style.minHeight = originalEl.offsetHeight ? originalEl.offsetHeight + 'px' : '40px';
            div.style.padding = compStyle.padding || '10px';
            div.style.border = compStyle.border || '1px solid #d8cdc7';
            div.style.borderRadius = compStyle.borderRadius || '10px';
            div.style.background = '#fffaf8';
            div.style.fontFamily = 'Poppins, sans-serif';
            div.style.fontSize = compStyle.fontSize || '14px';
            div.style.color = '#1e1b1a';
            div.style.boxSizing = 'border-box';
            div.style.display = 'flex';
            div.style.alignItems = originalEl.tagName === 'TEXTAREA' ? 'flex-start' : 'center';
            div.style.overflowWrap = 'break-word';
            div.style.whiteSpace = originalEl.tagName === 'TEXTAREA' ? 'pre-wrap' : 'nowrap';
            div.style.overflow = 'hidden';

            el.parentNode.replaceChild(div, el);
          });
        }
      }).then(canvas => {
        const dataURL = canvas.toDataURL("image/png");
        btn.innerText = originalText;
        btn.disabled = false;
        showImageModal(dataURL, getFileName());
        logToFirebase("IMAGEN");
      }).catch(err => {
        console.error("Image generation failed:", err);
        btn.innerText = originalText;
        btn.disabled = false;
        alert("Ocurrió un error al generar la imagen.");
      });
    });
  }

  // Theme Controller
  function initTheme() {
    const btn = $('#toggleThemeBtn');
    if (!btn) return;

    function applyTheme(theme) {
      document.body.dataset.theme = theme;
      const themeLabel = btn.querySelector('.theme-label');
      const themeIcon = btn.querySelector('i');
      if (themeLabel) themeLabel.textContent = theme === "dark" ? "Oscuro" : "Claro";
      if (themeIcon) themeIcon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    }

    // Default load
    let currentTheme = "light";
    try {
      currentTheme = localStorage.getItem(LS_THEME) || "light";
    } catch(e) {}
    applyTheme(currentTheme);

    btn.addEventListener("click", () => {
      currentTheme = currentTheme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(LS_THEME, currentTheme);
      } catch(e) {}
      applyTheme(currentTheme);
    });
  }

  // Document Loaded entry point
  document.addEventListener("DOMContentLoaded", () => {
    loadState();
    initDropdowns();
    initTheme();
    renderAll();
    initReset();
    initPdfExport();
    initImageExport();

    // Bind other inputs
    bindField('#qPatient', 'patient');
    bindField('#qDoctor', 'doctor');
    bindField('#qInsurance', 'insurance');
    bindField('#qKam', 'kam');
    bindField('#qIssueDate', 'issueDate');
    bindField('#qValidDate', 'validDate');
    bindField('#qScheduleDate', 'scheduleDate');
    bindField('#qDx', 'dx');
    bindField('#qScheme', 'scheme');
  });

})();
