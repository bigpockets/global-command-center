const regions = [
  { code: 'AMER', name: 'Americas', x: 25, y: 42 },
  { code: 'EMEA', name: 'Europe, Middle East & Africa', x: 50, y: 38 },
  { code: 'APAC', name: 'Asia Pacific', x: 79, y: 48 }
];
const services = [
  ['Microsoft 365', 'AMER', 'Operational'],
  ['Microsoft Azure', 'EMEA', 'Degraded'],
  ['AWS', 'AMER', 'Operational'],
  ['AWS', 'EMEA', 'Operational'],
  ['Google Cloud', 'APAC', 'Operational'],
  ['Microsoft 365', 'APAC', 'Operational'],
  ['Webex Meetings', 'EMEA', 'Operational'],
  ['Webex Contact Center', 'AMER', 'Outage'],
  ['Webex Calling', 'APAC', 'Unknown']
];
const severity = ['Operational', 'Unknown', 'Degraded', 'Outage'];
const regionFilter = document.querySelector('#region');
const statusFilter = document.querySelector('#status');
const matrix = document.querySelector('#services');

const markers = regions.map(({ code, name, x, y }) => {
  const option = document.createElement('option');
  option.value = code;
  option.textContent = code;
  regionFilter.append(option);

  const regionalStatuses = services.filter(row => row[1] === code).map(row => row[2]);
  const regionalStatus = severity.findLast(status => regionalStatuses.includes(status));
  const marker = document.createElement('button');
  marker.type = 'button';
  marker.className = 'region-marker ' + regionalStatus.toLowerCase();
  marker.textContent = '● ' + code;
  marker.setAttribute('aria-label', name + ' — ' + regionalStatus);
  marker.style.left = x + '%';
  marker.style.top = y + '%';
  marker.addEventListener('click', () => {
    regionFilter.value = regionFilter.value === code ? '' : code;
    render();
  });
  document.querySelector('#map').append(marker);
  return { code, marker };
});

function render() {
  const visible = services.filter(([, region, status]) =>
    (!regionFilter.value || region === regionFilter.value) &&
    (!statusFilter.value || status === statusFilter.value)
  );
  matrix.replaceChildren();
  for (const [name, region, status] of visible) {
    const row = matrix.insertRow();
    row.insertCell().textContent = name;
    row.insertCell().textContent = region;
    const state = row.insertCell();
    state.textContent = '● ' + status;
    state.className = status.toLowerCase();
  }
  document.querySelector('#healthy').textContent = visible.filter(row => row[2] === 'Operational').length;
  document.querySelector('#disrupted').textContent = visible.filter(row => ['Degraded', 'Outage'].includes(row[2])).length;
  document.querySelector('#result').textContent = visible.length
    ? visible.length + ' service records in view'
    : 'No service records match these filters.';
  for (const { code, marker } of markers) {
    marker.setAttribute('aria-pressed', String(regionFilter.value === code));
  }
}

regionFilter.addEventListener('change', render);
statusFilter.addEventListener('change', render);
render();

if ('serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol)) {
  navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Offline setup failed', error));
}

