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

function render() {
  const incidents = snapshot?.incidents ?? [];
  const stale = snapshot && (fetchFailed || Date.now() - Date.parse(snapshot.checkedAt) > 75 * 60 * 1000);
  const visible = incidents.filter(incident => matchesRegion(incident, regionFilter.value) &&
    (!statusFilter.value || incident.status === statusFilter.value));
  byId('active-count').textContent = snapshot ? incidents.length : '—';
  byId('freshness').textContent = snapshot ? new Date(snapshot.checkedAt).toLocaleString() : '—';
  byId('feed-state').textContent = stale ? 'Desactualizado' : snapshot ? 'Actualizado' : fetchFailed ? 'Sin datos' : 'Consultando';
  byId('brief-text').textContent = stale
    ? 'Datos desactualizados. Se conserva la última lectura disponible.'
    : snapshot
      ? (incidents.length ? 'Google Cloud informa ' + incidents.length + ' incidente(s) público(s) activo(s).' : 'Sin incidentes públicos activos en Google Cloud.')
      : (fetchFailed ? 'Todavía no hay una lectura disponible de Google Cloud.' : 'Consultando el estado público de Google Cloud.');

  matrix.replaceChildren();
  for (const incident of visible) {
    const row = matrix.insertRow();
    const link = document.createElement('a');
    link.href = incident.url;
    link.textContent = incident.summary;
    const incidentCell = row.insertCell();
    incidentCell.append(link);
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
    ) || 'No public incidents reported for this region';
    marker.className = 'region-marker ' + (priority.includes(status) ? status.toLowerCase() : 'unknown');
    marker.textContent = '● ' + code;
    marker.setAttribute('aria-label', name + ' — ' + status);
    marker.setAttribute('aria-pressed', String(regionFilter.value === code));
  }
}

async function refresh() {
  try {
    const response = await fetch('./status.json', { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Status snapshot unavailable');
    const latest = await response.json();
    if (!Array.isArray(latest.incidents) || !Number.isFinite(Date.parse(latest.checkedAt))) {
      throw new Error('Invalid status snapshot');
    }
    snapshot = latest;
    fetchFailed = false;
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

