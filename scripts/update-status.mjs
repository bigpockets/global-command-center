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

const catalogUrl = process.argv[4] || new URL('/products.json', source).href;
const catalogResponse = await fetch(catalogUrl, { signal: AbortSignal.timeout(20000) });
if (!catalogResponse.ok) throw new Error('Google Cloud catalog returned HTTP ' + catalogResponse.status);
const catalog = await catalogResponse.json();
const entries = Array.isArray(catalog) ? catalog : catalog?.products;
if (!Array.isArray(entries) || !entries.length || entries.some(product =>
  typeof product?.id !== 'string' || typeof product?.title !== 'string')) {
  throw new Error('Unexpected Google Cloud product catalog format');
}
const services = [...new Map(entries.map(({ id, title }) => [id, { id, title }])).values()]
  .sort((a, b) => a.title.localeCompare(b.title));

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
    productIds: textValues(item.affected_products, product => product?.id),
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

async function readJira() {
  const url = 'https://jira-software.status.atlassian.com/';
  const levels = new Map([
    ['none', 'No public incidents'], ['minor', 'Degraded'], ['major', 'Outage'],
    ['critical', 'Outage'], ['maintenance', 'Advisory']
  ]);
  try {
    const response = await fetch(new URL('api/v2/summary.json', url), {
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const { status, components } = await response.json();
    if (typeof status?.description !== 'string' || !levels.has(status.indicator)) {
      throw new Error('Unrecognized Jira status');
    }
    const componentLevels = new Map([
      ['operational', 'No public incidents'], ['degraded_performance', 'Degraded'],
      ['partial_outage', 'Outage'], ['major_outage', 'Outage'], ['under_maintenance', 'Advisory']
    ]);
    const services = (Array.isArray(components) ? components : [])
      .filter(component => !component.group && typeof component.name === 'string')
      .map(component => ({
        title: component.name, status: componentLevels.get(component.status) || 'Unknown'
      }));
    return { status: levels.get(status.indicator), description: status.description, services };
  } catch (error) {
    console.warn('Jira status unavailable:', error.message);
    return { status: 'Unknown', description: 'Public status unavailable' };
  }
}

const jira = await readJira();

async function readMarket() {
  try {
    const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=5m&range=5d', {
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const result = (await response.json()).chart?.result?.[0];
    if (result?.meta?.symbol !== 'SPY') throw new Error('Unexpected symbol');
    const closes = result.indicators.quote[0].close;
    const date = new Intl.DateTimeFormat('en-CA', {timeZone:'America/New_York',dateStyle:'short'});
    const points = result.timestamp.map((at,i) => ({at:at*1000,price:closes[i]}))
      .filter(({at,price}) => Number.isFinite(at) && Number.isFinite(price));
    if (!points.length) throw new Error('No quotes');
    const session = date.format(points.at(-1).at);
    const current = points.filter(({at}) => date.format(at) === session);
    const previous = points.findLast(({at}) => date.format(at) !== session);
    return { points:current, previousClose:previous?.price ?? null };
  } catch (error) {
    console.warn('SPY unavailable:', error.message);
    return null;
  }
}

const market = await readMarket();

await writeFile(target, JSON.stringify({ checkedAt: new Date().toISOString(), incidents, services, jira, market }, null, 2) + '\n');
console.log('Published snapshot with ' + incidents.length + ' active public incident(s).');

