import { writeFile } from 'node:fs/promises';

const source = 'https://status.cloud.google.com/incidents.json';
const input = process.argv[2] || source;
const target = process.argv[3] || 'status.json';
const response = await fetch(input, { signal: AbortSignal.timeout(20000) });
if (!response.ok) throw new Error('Google Cloud feed returned HTTP ' + response.status);
const feed = await response.json();
if (!Array.isArray(feed) || feed.some(item => !item || typeof item.id !== 'string' ||
  !Number.isFinite(Date.parse(item.begin)) ||
  (item.end != null && item.end !== '' && !Number.isFinite(Date.parse(item.end))))) {
  throw new Error('Unexpected Google Cloud feed format');
}

const textValues = (items, pick) => [...new Set(
  (Array.isArray(items) ? items : []).map(pick).filter(value => typeof value === 'string' && value.trim())
)];
const incidents = feed.filter(item => !item.end).map(item => {
  const products = textValues(item.affected_products, product => product?.current_title || product?.title);
  const locations = (item.currently_affected_locations || item.most_recent_update?.affected_locations || [])
    .filter(location => typeof location?.id === 'string')
    .map(({ id, title }) => ({ id, title: typeof title === 'string' ? title : id }));
  const impact = item.most_recent_update?.status || item.status_impact;
  const statuses = { SERVICE_OUTAGE: 'Outage', SERVICE_DISRUPTION: 'Degraded', SERVICE_INFORMATION: 'Advisory' };
  return {
    products: products.length ? products : [item.service_name || 'Google Cloud'],
    locations,
    status: statuses[impact] || 'Unknown',
    summary: item.external_desc || 'Google Cloud incident',
    url: new URL('/incidents/' + encodeURIComponent(item.id), source).href,
    startedAt: item.begin,
    updatedAt: item.most_recent_update?.when || item.modified || item.begin,
    latestUpdate: typeof item.most_recent_update?.text === 'string'
      ? item.most_recent_update.text.trim() : ''
  };
}).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

await writeFile(target, JSON.stringify({ checkedAt: new Date().toISOString(), incidents }, null, 2) + '\n');
console.log('Published snapshot with ' + incidents.length + ' active public incident(s).');

