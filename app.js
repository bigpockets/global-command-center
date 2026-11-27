const translations = {"U.S. market · Intraday":"Bolsa de EE. UU. · Intradía","SPY tracks the S&P 500. Quotes may be delayed. Outside market hours, the chart can show the previous session.":"SPY sigue al S&P 500. Las cotizaciones pueden tener retraso. Fuera del horario de mercado, el gráfico puede mostrar la sesión anterior.","Open SPY on TradingView ↗":"Abrir SPY en TradingView ↗","Market chart unavailable.":"Gráfico de bolsa no disponible.","Operations intelligence":"Inteligencia operativa","Public service health":"Estado público de servicios","Theme":"Tema","Light":"Claro","Dark":"Oscuro","System":"Sistema","Language":"Idioma","Global service health":"Estado regional","Select a region to filter the service matrix.":"Seleccioná una región para filtrar el detalle.","Cloud & Telecom Service Health":"Estado de Cloud y Telecom","Region":"Región","All regions":"Todas las regiones","Service":"Servicio","Status":"Estado","Reported incident":"Incidente reportado","Official status page ↗":"Página oficial de estado ↗","Active public incidents":"Incidentes públicos activos","Last successful check · local time":"Última consulta exitosa · hora local","Green indicates no reported public issues. Gray indicates unverified status. Global-only reports are labeled.":"Verde indica que no hay incidentes públicos reportados. Gris indica estado sin verificar. Los estados globales están identificados.","● No public incidents":"● Sin incidentes públicos","● Advisory":"● Aviso","● Degraded":"● Degradado","● Outage":"● Caída","● Unknown":"● Sin verificar","No public incidents":"Sin incidentes públicos","Advisory":"Aviso","Degraded":"Degradado","Outage":"Caída","Unknown":"Sin verificar","Regional incident reports":"Incidentes regionales","Feed pending":"Fuente pendiente","Organization access required":"Requiere acceso de la organización","Global status only":"Solo estado global","Global":"Global","services":"servicios","Component status is unavailable. Open the official status page for details.":"Estado sin verificar. Consultá la página oficial para más detalles.","Atlassian publishes these component states globally.":"Atlassian publica estos estados a nivel global.","Catalog with":"Catálogo con reportes públicos para","public incident reports. Regional availability varies by service.":"La disponibilidad regional varía por servicio.","Not reported":"Sin informar","See the official incident page for updates.":"Consultá la página oficial para ver actualizaciones.","Google Cloud public incidents":"Incidentes públicos de Google Cloud","All statuses":"Todos los estados","Select an incident when one appears to see the latest provider update.":"Seleccioná un incidente para ver la última actualización.","Incident / products":"Incidente / productos","Updated · local time":"Actualizado · hora local","Close":"Cerrar","Affected products":"Productos afectados","Affected locations":"Ubicaciones afectadas","Started · local time":"Inicio · hora local","Last provider update · local time":"Última actualización · hora local","Latest update from Google Cloud":"Última actualización de Google Cloud","View incident on Google Cloud ↗":"Ver incidente en Google Cloud ↗","No matching incidents in the last available snapshot.":"No hay incidentes coincidentes en la última lectura.","Public incident data unavailable.":"Datos de incidentes no disponibles.","Loading public incident data…":"Cargando datos de incidentes…","No incidents match these filters.":"Ningún incidente coincide con estos filtros.","No active public incidents reported.":"Sin incidentes públicos activos.","public incident(s) in view":"incidente(s) público(s) en vista","No public incidents reported for this region":"Sin incidentes públicos reportados en esta región","04 | Business Risk Intelligence":"04 | Inteligencia de riesgos","05 | Executive Action Center":"05 | Centro de acción ejecutiva","Cybersecurity":"Ciberseguridad","Compliance / FinCEN":"Cumplimiento / FinCEN","FAA / Aviation":"FAA / Aviación","Financial Markets":"Mercados financieros","Energy":"Energía","Geopolitics":"Geopolítica","P1 | Critical Response":"P1 | Respuesta crítica","P2 | Telecom & Contact Center":"P2 | Telecom y centro de contacto","P2 | Infrastructure & Security":"P2 | Infraestructura y seguridad","P3 | Change Management":"P3 | Gestión de cambios","Executive summary":"Resumen ejecutivo","Sources":"Fuentes","Category":"Categoría","Assessment":"Evaluación","Source":"Fuente","Review pending":"Pendiente de revisión","Monitoring sources for editorial review.":"Fuentes de seguimiento para revisión editorial.","Assess activation once a critical incident and its operational impact are confirmed.":"Evaluar activación cuando se confirme un incidente crítico y su impacto operativo.","Telecom Operations · Verify inbound calls, IVR, queues and agent availability.":"Telecom Operations · Validar llamadas entrantes, IVR, colas y disponibilidad de agentes.","Systems, Network & InfoSec · Verify availability with internal telemetry and review security alerts.":"Systems, Network & InfoSec · Corroborar la disponibilidad con telemetría interna y revisar alertas de seguridad.","Infrastructure Leadership · Assess whether to defer nonessential changes during peak demand.":"Infrastructure Leadership · Evaluar si corresponde posponer cambios no esenciales durante períodos de alta demanda."};
const english = {"Resumen ejecutivo":"Executive summary","Fuentes":"Sources","Categoría":"Category","Evaluación":"Assessment","Fuente":"Source","Pendiente de revisión":"Review pending","Fuentes de seguimiento para revisión editorial.":"Monitoring sources for editorial review.","Evaluar activación cuando se confirme un incidente crítico y su impacto operativo.":"Assess activation once a critical incident and its operational impact are confirmed.","Telecom Operations · Validar llamadas entrantes, IVR, colas y disponibilidad de agentes.":"Telecom Operations · Verify inbound calls, IVR, queues and agent availability.","Systems, Network & InfoSec · Corroborar la disponibilidad con telemetría interna y revisar alertas de seguridad.":"Systems, Network & InfoSec · Verify availability with internal telemetry and review security alerts.","Infrastructure Leadership · Evaluar si corresponde posponer cambios no esenciales durante períodos de alta demanda.":"Infrastructure Leadership · Assess whether to defer nonessential changes during peak demand."};
const language = document.getElementById('language');
const themeButtons = [...document.querySelectorAll('[data-theme-choice]')];
function preference(key, next) {
  try {
    if (next !== undefined) localStorage.setItem('gcc-' + key, next);
    else return localStorage.getItem('gcc-' + key);
  } catch { /* Preferences are optional. */ }
}
const savedLanguage = preference('language');
language.value = savedLanguage === 'es' ? 'es' : 'en';
const t = value => language.value === 'es' ? translations[value] || value : value;
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
const labels = [];
while (walker.nextNode()) {
  const node = walker.currentNode;
  const key = english[node.textContent.trim()] || node.textContent.trim();
  if (!node.parentElement.closest('#status') && translations[key]) labels.push({node, key});
}
function translatePage() {
  document.documentElement.lang = language.value;
  for (const {node, key} of labels) node.textContent = t(key);
  for (const option of document.querySelectorAll('#status option')) {
    if (!option.dataset.label) {
      option.dataset.label = option.textContent;
      option.value = option.hasAttribute('value') ? option.value : option.textContent;
    }
    option.textContent = t(option.dataset.label);
  }
  document.querySelector('.theme-control').setAttribute('aria-label', t('Theme'));
}
function setTheme(choice) {
  const theme = ['light','dark','system'].includes(choice) ? choice : 'system';
  document.documentElement.dataset.theme = theme;
  for (const button of themeButtons) button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
  preference('theme', theme);
}
for (const button of themeButtons) button.addEventListener('click', () => setTheme(button.dataset.themeChoice));
setTheme(preference('theme'));
translatePage();
language.addEventListener('change', () => {
  preference('language', language.value);
  translatePage();
  render();
});

const regions = [
  { code: 'AMER', name: 'Americas', x: 25, y: 42 },
  { code: 'EMEA', name: 'Europe, Middle East & Africa', x: 50, y: 38 },
  { code: 'APAC', name: 'Asia Pacific', x: 79, y: 48 }
];
const prefixes = { AMER: /^(us|northamerica|southamerica)-/, EMEA: /^(europe|me|africa)-/, APAC: /^(asia|australia)-/ };
const priority = ['Outage', 'Degraded', 'Advisory', 'Unknown'];
const byId = id => document.getElementById(id);
const regionFilter = byId('region');
const statusFilter = byId('status');
const matrix = byId('services');
let snapshot;
let fetchFailed = false;
const snapshotKey = 'gcc-public-health-v022';
try {
  const cached = JSON.parse(localStorage.getItem(snapshotKey));
  if (cached && Array.isArray(cached.incidents) && Array.isArray(cached.services)) {
    snapshot = cached;
    fetchFailed = true;
  }
} catch {
  // The dashboard can operate without browser storage.
}

const markers = regions.map(({ code, name, x, y }) => {
  regionFilter.add(new Option(code, code));
  const marker = document.createElement('button');
  marker.type = 'button';
  marker.style.left = x + '%';
  marker.style.top = y + '%';
  marker.addEventListener('click', () => {
    regionFilter.value = regionFilter.value === code ? '' : code;
    render();
  });
  byId('map').append(marker);
  return { code, name, marker };
});

function matchesRegion(incident, code) {
  return !code || incident.locations.some(({ id }) => id === 'global' || prefixes[code].test(id));
}

const detail = byId('incident-detail');
const formatDate = value => Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString(language.value === 'es' ? 'es' : 'en') : t("Not reported");

function openIncident(incident, trigger) {
  const badge = byId('detail-status');
  badge.textContent = t(incident.status);
  badge.className = incident.status.toLowerCase();
  byId('detail-title').textContent = incident.summary;
  byId('detail-products').textContent = incident.products.join(', ');
  byId('detail-locations').textContent = incident.locations.map(({ title }) => title).join(', ') || t("Not reported");
  byId('detail-started').textContent = formatDate(incident.startedAt);
  byId('detail-updated').textContent = formatDate(incident.updatedAt);
  byId('detail-update').textContent = incident.latestUpdate || t("See the official incident page for updates.");
  byId('detail-source').href = incident.url;
  detail.showModal();
  detail.addEventListener('close', () => {
    if (trigger.isConnected) trigger.focus();
    else regionFilter.focus();
  }, { once: true });
}

const providers = [
  { id: 'google', title: 'Google Cloud', url: 'https://status.cloud.google.com/', scope: 'Regional incident reports' },
  { id: 'webex', title: 'Webex', url: 'https://status.webex.com/', scope: 'Feed pending', services: ['Webex Calling','Webex Meetings','Webex Contact Center','Webex Messaging'] },
  { id: 'aws', title: 'AWS', url: 'https://health.aws.amazon.com/health/status', scope: 'Feed pending', services: ['Amazon EC2','Amazon S3','Amazon RDS','AWS Lambda'] },
  { id: 'azure', title: 'Azure', url: 'https://azure.status.microsoft/en-us/status', scope: 'Feed pending', services: ['Virtual Machines','Azure Storage','Azure SQL Database','Azure Functions'] },
  { id: 'm365', title: 'Microsoft 365', url: 'https://status.cloud.microsoft/m365', scope: 'Organization access required', services: ['Exchange Online','Microsoft Teams','SharePoint Online','OneDrive for Business'] },
  { id: 'jira', title: 'Jira Cloud', url: 'https://jira-software.status.atlassian.com/', scope: 'Global status only' }
];
const clear = 'No public incidents';
const statusClass = status => status === clear ? 'operational' : status.toLowerCase();
let selectedProvider;

function googleRows(incidents, stale) {
  const services = snapshot?.services || [];
  const regional = regionFilter.value;
  const unassigned = incidents.some(incident =>
    (!regional || matchesRegion(incident, regional) || !incident.locations.length) &&
    (!incident.productIds?.length || (regional && !incident.locations.length))
  );
  const byProduct = new Map();
  for (const incident of incidents.filter(item => matchesRegion(item, regional))) {
    for (const id of incident.productIds || []) {
      if (!byProduct.has(id)) byProduct.set(id, []);
      byProduct.get(id).push(incident);
    }
  }
  return services.map(({id, title}) => {
    const related = byProduct.get(id) || [];
    const status = stale ? 'Unknown' : priority.find(level => related.some(item => item.status === level))
      || (unassigned ? 'Unknown' : clear);
    return { title, status, incidents: stale ? [] : related };
  });
}

const statusForRegion = (provider, code, incidents, stale) => {
  if (stale || !snapshot) return 'Unknown';
  if (provider.id === 'jira' && !code) return snapshot.jira?.status || 'Unknown';
  if (provider.id !== 'google' || !snapshot.services?.length) return 'Unknown';
  const relevant = incidents.filter(incident => matchesRegion(incident, code));
  return priority.find(level => relevant.some(incident => incident.status === level))
    || (code && incidents.some(incident => !incident.locations.length) ? 'Unknown' : clear);
};

const cards = providers.map(provider => {
  const row = byId('provider-cards').insertRow();
  const header = document.createElement('th');
  header.scope = 'row';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'incident-trigger';
  button.textContent = provider.title;
  button.setAttribute('aria-controls', 'provider-detail');
  header.append(button);
  const scope = document.createElement('small');
  scope.className = 'muted';
  scope.textContent = provider.scope;
  header.append(scope);
  row.append(header);
  function select(code) {
    if (selectedProvider === provider.id && regionFilter.value === code) {
      selectedProvider = undefined;
    } else {
      selectedProvider = provider.id;
      regionFilter.value = code;
    }
    render();
  }
  button.addEventListener('click', () => select(provider.id === 'jira' ? '' : regionFilter.value));
  const regional = regions.map(({code}) => {
    const indicator = document.createElement('button');
    indicator.type = 'button';
    indicator.textContent = '●';
    indicator.setAttribute('aria-controls', 'provider-detail');
    indicator.addEventListener('click', () => select(code));
    row.insertCell().append(indicator);
    return {code, indicator};
  });
  return { provider, button, scope, regional };
});

function renderProviderDetails(incidents, stale) {
  for (const {provider, button, scope, regional} of cards) {
    const google = provider.id === 'google';
    const jira = provider.id === 'jira';
    const rows = google ? googleRows(incidents, stale) :
      jira ? (snapshot?.jira?.services || []).map(row => ({...row, status: stale ? 'Unknown' : row.status})) : (provider.services || []).map(title => ({ title, status: 'Unknown' }));
    scope.textContent = jira ? t('Global') + ' · ' + t(statusForRegion(provider, '', incidents, stale)) : t(provider.scope);
    for (const {code, indicator} of regional) {
      const status = statusForRegion(provider, code, incidents, stale);
      indicator.className = statusClass(status);
      indicator.title = provider.title + ' · ' + code + ' · ' + t(status);
      indicator.setAttribute('aria-label', indicator.title);
      indicator.setAttribute('aria-expanded', String(selectedProvider === provider.id && regionFilter.value === code));
    }
    const expanded = selectedProvider === provider.id;
    button.setAttribute('aria-expanded', String(expanded));
    if (!expanded) continue;

    byId('provider-detail-title').textContent = provider.title + ' · ' + t('services');
    byId('provider-source').href = provider.url;
    byId('provider-detail-note').textContent = (google || jira) && rows.length
      ? google
        ? language.value === 'es' ? 'Reportes públicos para ' + (regionFilter.value || 'todas las regiones') + '. La disponibilidad regional varía por servicio.' : 'Public incident reports for ' + (regionFilter.value || 'all regions') + '. Regional availability varies by service.'
        : t("Atlassian publishes these component states globally.")
      : t("Component status is unavailable. Open the official status page for details.");
    const table = byId('provider-services');
    table.replaceChildren();
    for (const {title, status: serviceStatus, incidents: related = []} of rows) {
      const row = table.insertRow();
      row.insertCell().textContent = title;
      const state = row.insertCell();
      state.className = statusClass(serviceStatus);
      state.textContent = '● ' + t(serviceStatus);
      const details = row.insertCell();
      for (const incident of related) {
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'incident-trigger';
        trigger.textContent = incident.summary;
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.addEventListener('click', () => openIncident(incident, trigger));
        details.append(trigger);
      }
      if (!related.length) details.textContent = '—';
    }
    table.closest('.provider-table').hidden = rows.length === 0;
  }
  byId('provider-detail').hidden = !selectedProvider;
  byId('google-incidents').hidden = selectedProvider !== 'google';
}

function render() {
  const incidents = snapshot?.incidents ?? [];
  const stale = snapshot && (fetchFailed || Date.now() - Date.parse(snapshot.checkedAt) > 75 * 60 * 1000);
  const visible = incidents.filter(incident => matchesRegion(incident, regionFilter.value) &&
    (!statusFilter.value || incident.status === statusFilter.value));
  byId('active-count').textContent = snapshot && !stale ? incidents.length : '—';
  byId('freshness').textContent = snapshot ? new Date(snapshot.checkedAt).toLocaleString(language.value === 'es' ? 'es' : 'en') : '—';
  byId('feed-state').textContent = language.value === 'es' ? (stale ? 'Desactualizado' : snapshot ? 'Actualizado' : fetchFailed ? 'Sin datos' : 'Consultando') : (stale ? 'Out of date' : snapshot ? 'Updated' : fetchFailed ? 'Unavailable' : 'Checking');
  byId('brief-text').textContent = language.value === 'en' ? (stale ? 'The last reading has expired.' : snapshot ? (incidents.length ? 'Google Cloud reports ' + incidents.length + ' active public incident(s).' : 'Google Cloud reports no active public incidents.') : 'Google Cloud status is not yet available.') : stale
    ? 'Datos desactualizados. Se conserva la última lectura disponible.'
    : snapshot
      ? (incidents.length ? 'Google Cloud informa ' + incidents.length + ' incidente(s) público(s) activo(s).' : 'Sin incidentes públicos activos en Google Cloud.')
      : (fetchFailed ? 'Todavía no hay una lectura disponible de Google Cloud.' : 'Consultando el estado público de Google Cloud.');

  renderProviderDetails(incidents, !!stale);
  matrix.replaceChildren();
  for (const incident of visible) {
    const row = matrix.insertRow();
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'incident-trigger';
    trigger.textContent = incident.summary;
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.addEventListener('click', () => openIncident(incident, trigger));
    row.addEventListener('click', event => {
      if (!trigger.contains(event.target)) trigger.click();
    });
    row.className = 'incident-row';
    const incidentCell = row.insertCell();
    incidentCell.append(trigger);
    const products = document.createElement('div');
    products.className = 'muted';
    products.textContent = incident.products.join(', ');
    incidentCell.append(products);
    row.insertCell().textContent = incident.locations.map(({ title }) => title).join(', ') || t("Not reported");
    const state = row.insertCell();
    state.textContent = t(incident.status);
    state.className = incident.status.toLowerCase();
    row.insertCell().textContent = new Date(incident.updatedAt).toLocaleString(language.value === 'es' ? 'es' : 'en');
  }

  byId('result').textContent = visible.length ? visible.length + ' ' + t('public incident(s) in view')
    : stale ? t("No matching incidents in the last available snapshot.")
    : !snapshot ? (fetchFailed ? t("Public incident data unavailable.") : t("Loading public incident data…"))
    : incidents.length ? t("No incidents match these filters.") : t("No active public incidents reported.");

  for (const { code, name, marker } of markers) {
    const status = stale || !snapshot ? 'Unknown' : priority.find(value =>
      incidents.some(incident => incident.status === value && matchesRegion(incident, code))
    ) || (incidents.some(incident => !incident.locations.length) ? 'Unknown' : 'No public incidents reported for this region');
    marker.className = 'region-marker ' + (priority.includes(status) ? status.toLowerCase() : 'operational');
    marker.textContent = '● ' + code;
    marker.setAttribute('aria-label', name + ' — ' + t(status));
    marker.setAttribute('aria-pressed', String(regionFilter.value === code));
  }
}

async function refresh() {
  try {
    const response = await fetch('./status.json?v=0.2.7', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Status snapshot unavailable');
    const latest = await response.json();
    if (!Array.isArray(latest.incidents) || !Number.isFinite(Date.parse(latest.checkedAt))) {
      throw new Error('Invalid status snapshot');
    }
    snapshot = latest;
    fetchFailed = false;
    try { localStorage.setItem(snapshotKey, JSON.stringify(snapshot)); } catch {
      // Keep the reading in memory when browser storage is unavailable.
    }
  } catch {
    fetchFailed = true;
  }
  render();
}

regionFilter.addEventListener('change', render);
statusFilter.addEventListener('change', render);
render();
refresh();
setInterval(refresh, 5 * 60 * 1000);

if ('serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol)) {
  navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Offline setup failed', error));
}


const colorPreference = matchMedia('(prefers-color-scheme: dark)');
let marketAppearance;
function renderMarket() {
  const container = document.getElementById('market-chart');
  const theme = document.documentElement.dataset.theme;
  const dark = theme === 'dark' || (theme === 'system' && colorPreference.matches);
  const locale = language.value;
  const appearance = locale + ':' + dark;
  if (marketAppearance === appearance) return;
  marketAppearance = appearance;
  const widget = document.createElement('div');
  widget.className = 'tradingview-widget-container__widget';
  const script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
  script.async = true;
  script.textContent = JSON.stringify({
    symbol: 'AMEX:SPY', dateRange: '1D', width: '100%', height: 290,
    locale, colorTheme: dark ? 'dark' : 'light', isTransparent: true,
    autosize: false, largeChartUrl: ''
  });
  script.addEventListener('error', () => {
    if (marketAppearance !== appearance) return;
    widget.textContent = t('Market chart unavailable.');
  });
  container.replaceChildren(widget, script);
}
colorPreference.addEventListener('change', renderMarket);
for (const button of themeButtons) button.addEventListener('click', renderMarket);
language.addEventListener('change', renderMarket);
renderMarket();
