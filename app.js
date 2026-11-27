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
  ? new Date(value).toLocaleString() : 'Not reported';

function openIncident(incident, trigger) {
  const badge = byId('detail-status');
  badge.textContent = incident.status;
  badge.className = incident.status.toLowerCase();
  byId('detail-title').textContent = incident.summary;
  byId('detail-products').textContent = incident.products.join(', ');
  byId('detail-locations').textContent = incident.locations.map(({ title }) => title).join(', ') || 'Not reported';
  byId('detail-started').textContent = formatDate(incident.startedAt);
  byId('detail-updated').textContent = formatDate(incident.updatedAt);
  byId('detail-update').textContent = incident.latestUpdate || 'See the official incident page for updates.';
  byId('detail-source').href = incident.url;
  detail.showModal();
  detail.addEventListener('close', () => {
    if (trigger.isConnected) trigger.focus();
    else regionFilter.focus();
  }, { once: true });
}

const providers = [
  { id: 'google', title: 'Google Cloud', url: 'https://status.cloud.google.com/', scope: 'Regional incident reports' },
  ...['Contact Center', 'Calling', 'Meetings', 'Messaging'].map(service => ({
    id: 'webex-' + service, title: 'Webex ' + service, url: 'https://status.webex.com/', scope: 'Feed pending'
  })),
  { id: 'aws', title: 'AWS', url: 'https://health.aws.amazon.com/health/status', scope: 'Feed pending' },
  { id: 'azure', title: 'Azure', url: 'https://azure.status.microsoft/en-us/status', scope: 'Feed pending' },
  { id: 'm365', title: 'Microsoft 365', url: 'https://status.cloud.microsoft/m365', scope: 'Organization access required' },
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
      jira ? (snapshot?.jira?.services || []).map(row => ({...row, status: stale ? 'Unknown' : row.status})) : [];
    scope.textContent = jira ? 'Global · ' + statusForRegion(provider, '', incidents, stale) : provider.scope;
    for (const {code, indicator} of regional) {
      const status = statusForRegion(provider, code, incidents, stale);
      indicator.className = statusClass(status);
      indicator.title = provider.title + ' · ' + code + ' · ' + status;
      indicator.setAttribute('aria-label', indicator.title);
      indicator.setAttribute('aria-expanded', String(selectedProvider === provider.id && regionFilter.value === code));
    }
    const expanded = selectedProvider === provider.id;
    button.setAttribute('aria-expanded', String(expanded));
    if (!expanded) continue;

    byId('provider-detail-title').textContent = provider.title + ' services';
    byId('provider-source').href = provider.url;
    byId('provider-detail-note').textContent = rows.length
      ? google
        ? 'Catalog with ' + (regionFilter.value || 'all regions') + ' public incident reports. Regional availability varies by service.'
        : 'Atlassian publishes these component states globally.'
      : 'Component status is unavailable. Open the official status page for details.';
    const table = byId('provider-services');
    table.replaceChildren();
    for (const {title, status: serviceStatus, incidents: related = []} of rows) {
      const row = table.insertRow();
      row.insertCell().textContent = title;
      const state = row.insertCell();
      state.className = statusClass(serviceStatus);
      state.textContent = '● ' + serviceStatus;
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
  byId('freshness').textContent = snapshot ? new Date(snapshot.checkedAt).toLocaleString() : '—';
  byId('feed-state').textContent = stale ? 'Desactualizado' : snapshot ? 'Actualizado' : fetchFailed ? 'Sin datos' : 'Consultando';
  byId('brief-text').textContent = stale
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
    row.insertCell().textContent = incident.locations.map(({ title }) => title).join(', ') || 'Not reported';
    const state = row.insertCell();
    state.textContent = incident.status;
    state.className = incident.status.toLowerCase();
    row.insertCell().textContent = new Date(incident.updatedAt).toLocaleString();
  }

  byId('result').textContent = visible.length ? visible.length + ' public incident(s) in view'
    : stale ? 'No matching incidents in the last available snapshot.'
    : !snapshot ? (fetchFailed ? 'Public incident data unavailable.' : 'Loading public incident data…')
    : incidents.length ? 'No incidents match these filters.' : 'No active public incidents reported.';

  for (const { code, name, marker } of markers) {
    const status = stale || !snapshot ? 'Unknown' : priority.find(value =>
      incidents.some(incident => incident.status === value && matchesRegion(incident, code))
    ) || (incidents.some(incident => !incident.locations.length) ? 'Unknown' : 'No public incidents reported for this region');
    marker.className = 'region-marker ' + (priority.includes(status) ? status.toLowerCase() : 'operational');
    marker.textContent = '● ' + code;
    marker.setAttribute('aria-label', name + ' — ' + status);
    marker.setAttribute('aria-pressed', String(regionFilter.value === code));
  }
}

async function refresh() {
  try {
    const response = await fetch('./status.json?v=0.2.5', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
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

