const $ = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => Array.from(el.querySelectorAll(q));

const APP_ROLE = (document.body?.dataset?.appRole === "kam") ? "kam" : "medico";
try{ localStorage.setItem("sanare_last_app", APP_ROLE); }catch(e){}

const screens = $$("[data-screen]");
const navBtns = $$("[data-nav]");
const bottomNav = $(".bottomnav");
const btnNavToggle = $("#btnNavToggle");

const topTitle = $("#topTitle");
const rolePill = $("#rolePill");
const navPointsLabel = $("#navPointsLabel");

const globalSearch = $("#globalSearch");

// Home KPIs
const monthLabel = $("#monthLabel");
const kpi1 = $("#kpi1");
const kpi2 = $("#kpi2");
const kpi1l = $("#kpi1l");
const kpi2l = $("#kpi2l");
const kpiHint = $("#kpiHint");

// News
const newsGrid = $("#newsGrid");
const newsCount = $("#newsCount");

// Profile
const profileDisplayName = $("#profileDisplayName");
const profileEmailDisplay = $("#profileEmailDisplay");
const profileAvatar = $("#profileAvatar");
const btnTheme = $("#btnTheme");
const themeLabel = $("#themeLabel");
const accentPalette = $("#accentPalette");

// KAM commissions screen (only exists in KAM page)
const inpGoal = $("#inpGoal");
const inpSales = $("#inpSales");
const btnSaveKam = $("#btnSaveKam");
const kamGoal = $("#kamGoal");
const kamSales = $("#kamSales");
const kamProgress = $("#kamProgress");
const kamMissing = $("#kamMissing");

// Native quote
const qPatient = $("#qPatient");
const qDoctor = $("#qDoctor");
const qInsurance = $("#qInsurance");
const qKam = $("#qKam");
const qIssueDate = $("#qIssueDate");
const qValidDate = $("#qValidDate");
const qScheduleDate = $("#qScheduleDate");
const qAddress = $("#qAddress");
const qPhone = $("#qPhone");
const qDx = $("#qDx");
const qScheme = $("#qScheme");
const qMedSearch = $("#qMedSearch");
const qMedSort = $("#qMedSort");
const qMedSelect = $("#qMedSelect");
const qMedQty = $("#qMedQty");
const qAddMed = $("#qAddMed");
const qMedTableBody = $("#qMedTable tbody");
const qServSelect = $("#qServSelect");
const qServQty = $("#qServQty");
const qServDiscount = $("#qServDiscount");
const qAddServ = $("#qAddServ");
const qServTableBody = $("#qServTable tbody");
const qSubtotal = $("#qSubtotal");
const qIVA = $("#qIVA");
const qTotal = $("#qTotal");
const statMedCount = $("#statMedCount");
const statServCount = $("#statServCount");
const statTotal = $("#statTotal");
const btnQuoteReset = $("#btnQuoteReset");
const btnQuotePrint = $("#btnQuotePrint");
const btnQuoteImg = $("#btnQuoteImg");
const quotePreparedBy = $("#quotePreparedBy");
const quoteStatus = $("#quoteStatus");

const LS_PROFILE = "sanare_app_profile_v2";
const LS_THEME = "sanare_app_theme_v1";
const LS_NAV = "sanare_nav_collapsed_v1";
const LS_QUOTE = "sanare_native_quote_v1";

function nowMonthLabel(){
  const d = new Date();
  const m = d.toLocaleDateString("es-MX",{month:"long"});
  const y = d.getFullYear();
  return `${m.charAt(0).toUpperCase()+m.slice(1)} ${y}`;
}
function money(n){
  const v = Number(n || 0);
  return v.toLocaleString("es-MX",{style:"currency", currency:"MXN", maximumFractionDigits:0});
}
function pct(n){
  return `${Math.max(0, Math.min(100, Math.round(n)))}%`;
}

function loadJSON(key){
  try{ return JSON.parse(localStorage.getItem(key) || "{}"); }catch(e){ return {}; }
}
function saveJSON(key, obj){
  try{ localStorage.setItem(key, JSON.stringify(obj)); }catch(e){}
}

function navigate(id){
  screens.forEach(s => s.classList.toggle("active", s.dataset.screen === id));
  navBtns.forEach(b => b.classList.toggle("active", b.dataset.nav === id));

  const titles = {
    home: "SANARÉ",
    quote: "Cotizador",
    wearable: "Pulsera",
    points: (APP_ROLE === "medico" ? "Puntos" : "Comisiones"),
    profile: "Perfil"
  };
  if(topTitle) topTitle.textContent = titles[id] || "SANARÉ";

  if(globalSearch) globalSearch.value = "";
  window.scrollTo({top:0, behavior:"smooth"});

  // ensure iframes fit after nav changes
  requestAnimationFrame(resizeEmbeds);
}

function initNav(){
  navBtns.forEach(btn => btn.addEventListener("click", () => navigate(btn.dataset.nav)));
}

function applyHeaderUI(){
  if(rolePill) rolePill.textContent = (APP_ROLE === "medico") ? "Médico" : "KAM";
  if(navPointsLabel) navPointsLabel.textContent = (APP_ROLE === "medico") ? "Puntos" : "Comisiones";
}

function applyHomeKpis(){
  if(monthLabel) monthLabel.textContent = nowMonthLabel();

  if(APP_ROLE === "medico"){
    if(kpi1) kpi1.textContent = "Puntos";
    if(kpi2) kpi2.textContent = "Pulsera";
    if(kpi1l) kpi1l.textContent = "Recompensas";
    if(kpi2l) kpi2l.textContent = "Monitoreo";
    if(kpiHint) kpiHint.textContent = "Entra a Puntos o Pulsera para ver tu panel clínico.";
    return;
  }

  // KAM
  const p = loadJSON(LS_PROFILE);
  const goal = Number(p.kamGoal || 0);
  const sales = Number(p.kamSales || 0);

  if(kpi1) kpi1.textContent = money(goal);
  if(kpi2) kpi2.textContent = money(sales);
  if(kpi1l) kpi1l.textContent = "Meta del mes";
  if(kpi2l) kpi2l.textContent = "Ventas del mes";

  const missing = Math.max(0, goal - sales);
  const progress = goal > 0 ? (sales/goal)*100 : 0;
  if(kpiHint) kpiHint.textContent = goal > 0
    ? `Avance: ${pct(progress)} · Faltante: ${money(missing)}`
    : "Configura tu meta del mes en Comisiones.";
}

function initProfile(){
  const p = loadJSON(LS_PROFILE);
  const nameCandidates = [
    p.name,
    p.displayName,
    p.userName,
    p.nombre,
    p.fullName,
    p.kamName
  ].filter(Boolean);
  const emailCandidates = [
    p.email,
    p.userEmail,
    p.correo,
    p.loginEmail,
    p.username
  ].filter(Boolean);

  const name = (nameCandidates[0] || '').trim();
  const email = (emailCandidates[0] || '').trim();
  const finalName = name || (email ? email.split('@')[0].replace(/[._-]+/g,' ') : 'KAM SANARÉ');
  const prettyName = finalName.replace(/\b\w/g, m => m.toUpperCase());

  if(profileDisplayName) profileDisplayName.textContent = prettyName;
  if(profileEmailDisplay) profileEmailDisplay.textContent = email || 'Sesión iniciada correctamente';
  if(profileAvatar) profileAvatar.textContent = (prettyName || 'K').trim().charAt(0).toUpperCase();

  $$('[data-quick-nav]').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.quickNav || 'home'));
  });
}

function applyTheme(){
  const t = loadJSON(LS_THEME);
  const theme = (t.theme === "dark") ? "dark" : "light";
  const accent = (typeof t.accent === "string" && t.accent.trim()) ? t.accent.trim() : "#0b1e33";
  document.body.dataset.theme = theme;
  document.documentElement.style.setProperty("--accent", accent);

  if(themeLabel) themeLabel.textContent = theme === "dark" ? "Oscuro" : "Claro";
  if(btnTheme){
    const icon = btnTheme.querySelector("i");
    if(icon) icon.className = (theme === "dark") ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }

  // active swatch
  if(accentPalette){
    $$(".swatch", accentPalette).forEach(b => b.classList.toggle("active", b.dataset.accent === accent));
  }
}

function initThemeControls(){
  // Set defaults once
  const t = loadJSON(LS_THEME);
  if(!t.theme) t.theme = "light";
  if(!t.accent) t.accent = "#0b1e33";
  saveJSON(LS_THEME, t);
  applyTheme();

  btnTheme?.addEventListener("click", () => {
    const cur = loadJSON(LS_THEME);
    cur.theme = (cur.theme === "dark") ? "light" : "dark";
    saveJSON(LS_THEME, cur);
    applyTheme();
    resizeEmbeds();
  });

  if(accentPalette){
    $$(".swatch", accentPalette).forEach(b => {
      b.addEventListener("click", () => {
        const cur = loadJSON(LS_THEME);
        cur.accent = b.dataset.accent;
        saveJSON(LS_THEME, cur);
        applyTheme();
      });
    });
  }
}

function initKamCommissions(){
  if(APP_ROLE !== "kam") return;
  // If the commissions UI is not present, do nothing
  if(!kamGoal || !kamSales) return;

  const p = loadJSON(LS_PROFILE);
  if(inpGoal) inpGoal.value = p.kamGoal ?? "";
  if(inpSales) inpSales.value = p.kamSales ?? "";

  const repaint = () => {
    const pp = loadJSON(LS_PROFILE);
    const goal = Number(pp.kamGoal || 0);
    const sales = Number(pp.kamSales || 0);
    if(kamGoal) kamGoal.textContent = money(goal);
    if(kamSales) kamSales.textContent = money(sales);
    const missing = Math.max(0, goal - sales);
    const progress = goal > 0 ? (sales/goal)*100 : 0;
    if(kamMissing) kamMissing.textContent = money(missing);
    if(kamProgress) kamProgress.textContent = pct(progress);
  };

  btnSaveKam?.addEventListener("click", () => {
    const pp = loadJSON(LS_PROFILE);
    pp.kamGoal = Number(inpGoal?.value || 0);
    pp.kamSales = Number(inpSales?.value || 0);
    saveJSON(LS_PROFILE, pp);
    repaint();
    applyHomeKpis();
  });

  repaint();
}


function getQuoteState(){
  const empty = {
    info: {
      patient:"", doctor:"", insurance:"", kam:"", issueDate:"", validDate:"", scheduleDate:"",
      address:"", phone:"", dx:"", scheme:""
    },
    meds: [],
    services: []
  };
  try{
    const parsed = JSON.parse(localStorage.getItem(LS_QUOTE) || "null");
    return parsed && typeof parsed === "object" ? { ...empty, ...parsed, info: { ...empty.info, ...(parsed.info || {}) }, meds: parsed.meds || [], services: parsed.services || [] } : empty;
  }catch(e){
    return empty;
  }
}
function saveQuoteState(state){
  try{ localStorage.setItem(LS_QUOTE, JSON.stringify(state)); }catch(e){}
}
function quoteMoney(n){
  const v = Number(n || 0);
  return v.toLocaleString("es-MX",{style:"currency", currency:"MXN", maximumFractionDigits:2, minimumFractionDigits:2});
}
function quotePhoneForAddress(address){
  const val = String(address || "");
  if(val.includes("Toluca")) return "722 197 08 36";
  if(val.includes("Narvarte")) return "55 5255 8403";
  return "";
}
function quoteToday(offsetDays=0){
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function initNativeQuote(){
  if(!qAddress || !window.SANARE_COT_DATA) return;
  const DATA = window.SANARE_COT_DATA;
  const state = getQuoteState();

  const profile = loadJSON(LS_PROFILE);
  if(!state.info.issueDate) state.info.issueDate = quoteToday(0);
  if(!state.info.validDate) state.info.validDate = quoteToday(15);
  if(!state.info.kam){
    state.info.kam = (profile.name || profile.email || "Corporativo").trim();
  }

  qAddress.innerHTML = "";
  (DATA.direcciones || []).forEach(d => {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    qAddress.appendChild(opt);
  });

  if(!state.info.address && DATA.direcciones?.length){
    state.info.address = DATA.direcciones[0];
  }
  state.info.phone = quotePhoneForAddress(state.info.address);

  const applyInfoToFields = () => {
    qPatient && (qPatient.value = state.info.patient || "");
    qDoctor && (qDoctor.value = state.info.doctor || "");
    qInsurance && (qInsurance.value = state.info.insurance || "");
    qKam && (qKam.value = state.info.kam || "");
    qIssueDate && (qIssueDate.value = state.info.issueDate || "");
    qValidDate && (qValidDate.value = state.info.validDate || "");
    qScheduleDate && (qScheduleDate.value = state.info.scheduleDate || "");
    qAddress && (qAddress.value = state.info.address || "");
    qPhone && (qPhone.value = state.info.phone || "");
    qDx && (qDx.value = state.info.dx || "");
    qScheme && (qScheme.value = state.info.scheme || "");
    if(quotePreparedBy){
      quotePreparedBy.textContent = `Cotización preparada por ${state.info.kam || "Corporativo"}`;
    }
  };

  const bindInfo = (el, key, formatter=null) => {
    el?.addEventListener("input", () => {
      state.info[key] = formatter ? formatter(el.value) : el.value;
      if(key === "kam" && quotePreparedBy){
        quotePreparedBy.textContent = `Cotización preparada por ${state.info.kam || "Corporativo"}`;
      }
      saveQuoteState(state);
      updateQuoteStatus();
    });
    el?.addEventListener("change", () => {
      state.info[key] = formatter ? formatter(el.value) : el.value;
      if(key === "kam" && quotePreparedBy){
        quotePreparedBy.textContent = `Cotización preparada por ${state.info.kam || "Corporativo"}`;
      }
      saveQuoteState(state);
      updateQuoteStatus();
    });
  };

  const medSource = (DATA.medicamentos || []).filter(m => m && m.nombre && !String(m.nombre).includes("Nombre del Artículo"));
  const servSource = (DATA.servicios || []).filter(s => s && s.servicio);

  function renderMedOptions(){
    if(!qMedSelect) return;
    const term = (qMedSearch?.value || "").toLowerCase().trim();
    const sort = qMedSort?.value || "nombre";
    let list = medSource.filter(m => String(m.nombre).toLowerCase().includes(term) || String(m.ean || "").toLowerCase().includes(term));
    list.sort((a,b) => sort === "precio" ? Number(b.precio||0) - Number(a.precio||0) : String(a.nombre).localeCompare(String(b.nombre), "es"));
    qMedSelect.innerHTML = "";
    list.slice(0, 250).forEach(m => {
      const opt = document.createElement("option");
      opt.value = JSON.stringify({ean:m.ean, nombre:m.nombre, precio:Number(m.precio||0)});
      opt.textContent = `${m.ean || "—"} — ${m.nombre} — ${quoteMoney(m.precio || 0)}`;
      qMedSelect.appendChild(opt);
    });
  }

  function renderServOptions(){
    if(!qServSelect) return;
    qServSelect.innerHTML = "";
    servSource
      .slice()
      .sort((a,b)=> String(a.servicio).localeCompare(String(b.servicio), "es"))
      .forEach(s => {
        const opt = document.createElement("option");
        opt.value = JSON.stringify({servicio:s.servicio, precio:Number(s.precio||0)});
        opt.textContent = `${s.servicio} — ${quoteMoney(s.precio || 0)}`;
        qServSelect.appendChild(opt);
      });
  }

  function totals(){
    const medSub = state.meds.reduce((acc, x) => acc + (Number(x.precio)||0) * (Number(x.qty)||0), 0);
    const servSub = state.services.reduce((acc, x) => acc + ((Number(x.precio)||0) * (Number(x.qty)||0) * (1 - (Number(x.discount)||0) / 100)), 0);
    const iva = servSub * 0.16;
    const total = medSub + servSub + iva;
    return { medSub, servSub, iva, total };
  }

  function renderTables(){
    if(qMedTableBody){
      qMedTableBody.innerHTML = state.meds.map((item, idx) => `
        <tr>
          <td>${item.nombre}</td>
          <td>${item.ean || "—"}</td>
          <td>${item.qty}</td>
          <td>${quoteMoney(item.precio)}</td>
          <td>${quoteMoney((Number(item.precio)||0) * (Number(item.qty)||0))}</td>
          <td><button class="quote-remove" type="button" data-del-med="${idx}">✕</button></td>
        </tr>
      `).join("");
    }

    if(qServTableBody){
      qServTableBody.innerHTML = state.services.map((item, idx) => {
        const lineTotal = (Number(item.precio)||0) * (Number(item.qty)||0) * (1 - (Number(item.discount)||0) / 100);
        return `
          <tr>
            <td>${item.servicio}</td>
            <td>${item.qty}</td>
            <td>${quoteMoney(item.precio)}</td>
            <td>${Number(item.discount)||0}%</td>
            <td>${quoteMoney(lineTotal)}</td>
            <td><button class="quote-remove" type="button" data-del-serv="${idx}">✕</button></td>
          </tr>
        `;
      }).join("");
    }

    const t = totals();
    qSubtotal && (qSubtotal.textContent = quoteMoney(t.medSub + t.servSub));
    qIVA && (qIVA.textContent = quoteMoney(t.iva));
    qTotal && (qTotal.textContent = quoteMoney(t.total));
    statMedCount && (statMedCount.textContent = String(state.meds.length));
    statServCount && (statServCount.textContent = String(state.services.length));
    statTotal && (statTotal.textContent = quoteMoney(t.total));

    qMedTableBody?.querySelectorAll("[data-del-med]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.meds.splice(Number(btn.dataset.delMed), 1);
        saveQuoteState(state);
        renderTables();
        updateQuoteStatus();
      });
    });
    qServTableBody?.querySelectorAll("[data-del-serv]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.services.splice(Number(btn.dataset.delServ), 1);
        saveQuoteState(state);
        renderTables();
        updateQuoteStatus();
      });
    });
  }

  function updateQuoteStatus(){
    const ready = Boolean((state.info.patient || "").trim()) && (state.meds.length > 0 || state.services.length > 0);
    if(quoteStatus){
      quoteStatus.textContent = ready ? "Cotización en progreso" : "Lista para capturar";
    }
  }

  qMedSearch?.addEventListener("input", renderMedOptions);
  qMedSort?.addEventListener("change", renderMedOptions);

  qAddMed?.addEventListener("click", () => {
    if(!qMedSelect?.value) return;
    const item = JSON.parse(qMedSelect.value);
    state.meds.push({ ...item, qty: Math.max(1, Number(qMedQty?.value || 1)) });
    saveQuoteState(state);
    renderTables();
    updateQuoteStatus();
  });

  qServSelect?.addEventListener("change", () => {
    try{
      const item = JSON.parse(qServSelect.value || "{}");
      qServDiscount.value = String(String(item.servicio || "").toUpperCase().includes("INSUMOS Y SERVICIO DE INFUSIÓN") ? 50 : 0);
    }catch(e){}
  });
  qAddServ?.addEventListener("click", () => {
    if(!qServSelect?.value) return;
    const item = JSON.parse(qServSelect.value);
    state.services.push({
      ...item,
      qty: Math.max(1, Number(qServQty?.value || 1)),
      discount: Math.max(0, Math.min(100, Number(qServDiscount?.value || 0)))
    });
    saveQuoteState(state);
    renderTables();
    updateQuoteStatus();
  });

  btnQuoteReset?.addEventListener("click", () => {
    const profileData = loadJSON(LS_PROFILE);
    state.info = {
      patient:"", doctor:"", insurance:"",
      kam: (profileData.name || profileData.email || "Corporativo").trim(),
      issueDate: quoteToday(0),
      validDate: quoteToday(15),
      scheduleDate:"",
      address: DATA.direcciones?.[0] || "",
      phone: quotePhoneForAddress(DATA.direcciones?.[0] || ""),
      dx:"", scheme:""
    };
    state.meds = [];
    state.services = [];
    saveQuoteState(state);
    applyInfoToFields();
    renderTables();
    updateQuoteStatus();
  });

  btnQuotePrint?.addEventListener("click", () => window.print());

  btnQuoteImg?.addEventListener("click", () => {
    if(typeof html2canvas === 'undefined') return alert("Librería no cargada");
    
    // Contenedor principal de la cotización para la captura
    const target = document.querySelector(".quote-shell");
    
    html2canvas(target, {
      scale: 3,
      useCORS: true,
      windowWidth: 1100,
      onclone: (clonedDoc) => {
        // Ocultar botones de acción y controles durante la captura
        clonedDoc.querySelectorAll('.quote-head-actions, .toolbar-grid, .quote-remove, .bottomnav').forEach(el => el.style.display = 'none');
        
        // Quitar sombras y forzar vista de escritorio
        const qShell = clonedDoc.querySelector(".quote-shell");
        if(qShell){
           qShell.style.width = "1100px";
           qShell.style.maxWidth = "none";
           qShell.style.boxShadow = "none";
           qShell.style.border = "none";
           qShell.style.margin = "0";
           qShell.style.padding = "24px";
           qShell.style.background = "#ffffff";
        }

        // Transformar inputs, select y textareas en divs para evitar que el texto se corte
        clonedDoc.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(el => {
          if (el.style.display === 'none') return;
          const originalEl = document.getElementById(el.id);
          if (!originalEl) return;

          const div = clonedDoc.createElement('div');
          div.textContent = originalEl.tagName === 'SELECT' ? (originalEl.options[originalEl.selectedIndex]?.text || '') : (originalEl.value || originalEl.placeholder || '');
          
          // Copiar estilos de forma manual para evitar fallos de html2canvas con inputs
          const compStyle = window.getComputedStyle(originalEl);
          div.style.width = originalEl.offsetWidth ? originalEl.offsetWidth + 'px' : '100%';
          div.style.minHeight = originalEl.offsetHeight ? originalEl.offsetHeight + 'px' : '40px';
          div.style.padding = compStyle.padding || '10px';
          div.style.border = compStyle.border || '1px solid #d8cdc7';
          div.style.borderRadius = compStyle.borderRadius || '10px';
          div.style.background = compStyle.backgroundColor || 'transparent';
          div.style.fontFamily = compStyle.fontFamily || 'Poppins, sans-serif';
          div.style.fontSize = compStyle.fontSize || '14px';
          div.style.fontWeight = compStyle.fontWeight || 'normal';
          div.style.color = compStyle.color || '#1e1b1a';
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
      canvas.toBlob(blob => {
         let paciente = state.info.patient || "Paciente";
         let fecha = state.info.issueDate || new Date().toISOString().split("T")[0];
         paciente = paciente.replace(/[^a-z0-9]/gi, "_");
         fecha = fecha.replace(/[^0-9\-]/g, "_");
         const nombreArchivo = `Cotizacion_${paciente}_${fecha}.png`;
         
         const file = new File([blob], nombreArchivo, { type: 'image/png' });
         if (navigator.canShare && navigator.canShare({ files: [file] })) {
             navigator.share({
                 files: [file],
                 title: 'Cotización SANARÉ',
                 text: 'Adjunto cotización generada en la app.'
             }).catch(console.error);
         } else {
             const url = URL.createObjectURL(blob);
             const a = document.createElement("a");
             a.href = url;
             a.download = nombreArchivo;
             document.body.appendChild(a);
             a.click();
             document.body.removeChild(a);
             URL.revokeObjectURL(url);
         }
      }, "image/png");
    });
  });

  qAddress?.addEventListener("change", () => {
    state.info.address = qAddress.value;
    state.info.phone = quotePhoneForAddress(qAddress.value);
    qPhone && (qPhone.value = state.info.phone);
    saveQuoteState(state);
  });

  bindInfo(qPatient, "patient");
  bindInfo(qDoctor, "doctor");
  bindInfo(qInsurance, "insurance");
  bindInfo(qKam, "kam");
  bindInfo(qIssueDate, "issueDate");
  bindInfo(qValidDate, "validDate");
  bindInfo(qScheduleDate, "scheduleDate");
  bindInfo(qDx, "dx");
  bindInfo(qScheme, "scheme");

  applyInfoToFields();
  renderMedOptions();
  renderServOptions();
  renderTables();
  updateQuoteStatus();
}

function initNews(){
  if(!newsGrid || !newsCount) return;

  const items = [
    { img:"assets/img/news/slide1.png?v=7", title:"Noticias Sanaré", sub:"Novedades clínicas, sedes y logística." },
    { img:"assets/img/news/slide2.png?v=7", title:"Disponibilidad de medicamentos", sub:"Inventario y alternativas terapéuticas." },
    { img:"assets/img/news/slide3.png?v=7", title:"Protocolos de infusión", sub:"Seguridad del paciente y operación." },
    { img:"assets/img/news/slide4.png?v=7", title:"Agenda de sedes", sub:"Horarios y coordinación de atención." }
  ];

  newsCount.textContent = String(items.length);

  newsGrid.innerHTML = `
    <div class="carousel" id="newsCarousel">
      <button class="carBtn prev" type="button" aria-label="Anterior">
        <i class="fa-solid fa-chevron-left"></i>
      </button>

      <div class="carTrack" id="newsTrack" tabindex="0" aria-label="Carrusel de noticias">
        ${items.map((x, idx) => `
          <div class="news carSlide" role="article" data-idx="${idx}">
            <img src="${x.img}" alt="${x.title}">
            <div class="meta">
              <p class="t">${x.title}</p>
              <p class="s">${x.sub}</p>
            </div>
          </div>
        `).join("")}
      </div>

      <button class="carBtn next" type="button" aria-label="Siguiente">
        <i class="fa-solid fa-chevron-right"></i>
      </button>

      <div class="carDots" id="newsDots" aria-label="Indicadores">
        ${items.map((_, idx) => `<button class="carDot ${idx===0?'active':''}" type="button" aria-label="Ir a noticia ${idx+1}" data-dot="${idx}"></button>`).join("")}
      </div>
    </div>
  `;

  const track = $("#newsTrack");
  const dots = $$("#newsDots .carDot");

  const goTo = (idx) => {
    const slide = track?.querySelector(`.carSlide[data-idx="${idx}"]`);
    if(!slide) return;
    slide.scrollIntoView({behavior:"smooth", inline:"start", block:"nearest"});
    dots.forEach(d => d.classList.toggle("active", Number(d.dataset.dot) === idx));
    currentIdx = idx;
  };

  const nearestIndex = () => {
    if(!track) return 0;
    const slides = $$(".carSlide", track);
    if(!slides.length) return 0;
    const left = track.scrollLeft;
    let best = 0, bestDist = Infinity;
    slides.forEach((s, i) => {
      const dist = Math.abs(s.offsetLeft - left);
      if(dist < bestDist){ bestDist = dist; best = i; }
    });
    return best;
  };

  let currentIdx = 0;
  $(".carBtn.prev")?.addEventListener("click", () => goTo(Math.max(0, currentIdx - 1)));
  $(".carBtn.next")?.addEventListener("click", () => goTo(Math.min(items.length - 1, currentIdx + 1)));
  dots.forEach(d => d.addEventListener("click", () => goTo(Number(d.dataset.dot))));

  let scrollT;
  track?.addEventListener("scroll", () => {
    clearTimeout(scrollT);
    scrollT = setTimeout(() => {
      const idx = nearestIndex();
      dots.forEach(d => d.classList.toggle("active", Number(d.dataset.dot) === idx));
      currentIdx = idx;
    }, 80);
  }, {passive:true});

  // Auto-advance
  let timer = null;
  const start = () => {
    stop();
    timer = setInterval(() => goTo((currentIdx + 1) % items.length), 6500);
  };
  const stop = () => { if(timer){ clearInterval(timer); timer=null; } };

  const carousel = $("#newsCarousel");
  carousel?.addEventListener("mouseenter", stop);
  carousel?.addEventListener("mouseleave", start);
  carousel?.addEventListener("focusin", stop);
  carousel?.addEventListener("focusout", start);

  start();
}

function initSearch(){
  if(!globalSearch) return;
  globalSearch.addEventListener("input", () => {
    const q = globalSearch.value.toLowerCase().trim();
    if(!q){
      $$(".news").forEach(n => n.style.display="");
      return;
    }
    $$(".news").forEach(n => {
      const t = n.innerText.toLowerCase();
      n.style.display = t.includes(q) ? "" : "none";
    });
  });
}

/* ===== Bottom nav collapse + responsive embeds ===== */
function syncNavSpace(){
  if(!bottomNav) return;
  const h = bottomNav.getBoundingClientRect().height;
  document.documentElement.style.setProperty("--nav-space", `${Math.ceil(h)}px`);
}

function setNavCollapsed(collapsed, isUserAction=false){
  if(!bottomNav) return;
  bottomNav.classList.toggle("is-collapsed", !!collapsed);
  if(isUserAction){
    try{ localStorage.setItem(LS_NAV, collapsed ? "1" : "0"); }catch(e){}
    bottomNav.classList.add("user-expanded"); // marker so CSS doesn't fight user choice
  }
  syncNavSpace();
  resizeEmbeds();
}

function initNavCollapse(){
  // Mantener etiquetas visibles por defecto.
  let pref = null;
  try{ pref = localStorage.getItem(LS_NAV); }catch(e){}
  if(pref === "1" || pref === "0"){
    setNavCollapsed(pref === "1", false);
  }else{
    setNavCollapsed(false, false);
  }

  btnNavToggle?.addEventListener("click", () => {
    const collapsed = bottomNav?.classList.contains("is-collapsed");
    setNavCollapsed(!collapsed, true);
  });

  window.addEventListener("resize", () => {
    syncNavSpace();
    resizeEmbeds();
  }, {passive:true});
}

function styleSeamlessEmbed(frame){
  if(!frame || frame.dataset.styled === "1") return;
  try{
    const doc = frame.contentDocument;
    if(!doc) return;
    const style = doc.createElement("style");
    style.textContent = `
      html, body{background:transparent !important; margin:0 !important; overflow:visible !important;}
      body{padding:0 !important;}
      main#cotizador{max-width:none !important; margin:0 !important; border-radius:20px !important; box-shadow:none !important; border:1px solid rgba(101,61,46,.10) !important;}
      #btnPDF{position:sticky; bottom:12px;}
    `;
    doc.head.appendChild(style);
    frame.dataset.styled = "1";
  }catch(e){}
}

function resizeEmbeds(){
  const embeds = $$(".embed");
  if(!embeds.length) return;

  embeds.forEach(el => {
    const screen = el.closest("[data-screen]");
    if(screen && !screen.classList.contains("active")) return;

    let applied = false;
    if(el.dataset.seamless === "true"){
      try{
        styleSeamlessEmbed(el);
        const doc = el.contentDocument;
        if(doc?.body){
          const body = doc.body;
          const html = doc.documentElement;
          const inner = Math.max(
            body.scrollHeight || 0,
            body.offsetHeight || 0,
            html.scrollHeight || 0,
            html.offsetHeight || 0,
            720
          );
          el.style.height = `${inner + 12}px`;
          applied = true;
        }
      }catch(e){}
    }

    if(applied) return;

    const navH = bottomNav ? bottomNav.getBoundingClientRect().height : 0;
    const safeBottom = Math.ceil(navH) + 18;
    const r = el.getBoundingClientRect();
    const available = Math.floor(window.innerHeight - r.top - safeBottom);
    const h = Math.max(320, available);
    el.style.height = `${h}px`;
  });
}

function main(){
  initNav();
  applyHeaderUI();
  initProfile();
  initThemeControls();
  initKamCommissions();
  initNativeQuote();
  initNews();
  initSearch();
  initNavCollapse();
  applyHomeKpis();

  // default screen
  navigate("home");
  syncNavSpace();
  resizeEmbeds();

  // resize embeds after iframes load
  $$(".embed").forEach(f => f.addEventListener("load", () => { styleSeamlessEmbed(f); setTimeout(resizeEmbeds, 80); setTimeout(resizeEmbeds, 300); }));

  setTimeout(resizeEmbeds, 250);
  setTimeout(resizeEmbeds, 1000);
}


document.addEventListener("DOMContentLoaded", main);
