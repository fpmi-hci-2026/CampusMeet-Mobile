import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchCatalog } from '../src/api.mjs';

test('uses the shared events route from a configurable device host', async () => {
  const result = await fetchCatalog('http://10.0.2.2:8000/api/v1/', async url => {
    assert.equal(url, 'http://10.0.2.2:8000/api/v1/events');
    return Response.json({ items: [{ id: 'ev-01' }] });
  });
  assert.deepEqual(result, [{ id: 'ev-01' }]);
});
test('rejects failures instead of showing stale success', async () => {
  await assert.rejects(fetchCatalog('http://api', async () => new Response(null, { status: 503 })), /HTTP 503/);
});
test('requires a server address and valid response', async () => {
  await assert.rejects(fetchCatalog(''), /Укажите адрес/);
  await assert.rejects(fetchCatalog('http://api', async () => Response.json({})), /неверный формат/);
});
