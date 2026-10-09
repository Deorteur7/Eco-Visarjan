import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { startTestServer } from './helpers.js';

let server;
before(async () => { server = await startTestServer(); });
after(async () => { await server.close(); });

const get = (path) => fetch(`${server.baseUrl}${path}`);
const post = (path, body) =>
  fetch(`${server.baseUrl}${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });

describe('API', () => {
  it('GET /api/health reports the data store', async () => {
    const body = await (await get('/api/health')).json();
    assert.equal(body.dataStore.kind, 'memory');
  });

  it('GET /api/immersion-points returns seeded points, sorted by distance when located', async () => {
    const res = await get('/api/immersion-points?lat=17.4239&lng=78.4738');
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.ok(body.items.length >= 7);
    assert.equal(body.items[0].name, 'Hussain Sagar');
    for (let i = 1; i < body.items.length; i += 1) {
      assert.ok(body.items[i].distanceKm >= body.items[i - 1].distanceKm);
    }
  });

  it('rejects an invalid query', async () => {
    const res = await get('/api/immersion-points?lat=999&lng=78');
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error.code, 'VALIDATION_ERROR');
  });

  it('GET /api/flower-points returns points with distance', async () => {
    const body = await (await get('/api/flower-points?lat=17.43&lng=78.47')).json();
    assert.ok(body.items.length > 0);
    assert.equal(typeof body.items[0].distanceKm, 'number');
  });

  it('POST /api/recommendation ranks a plaster of Paris idol to an artificial pond', async () => {
    const res = await post('/api/recommendation', { lat: 17.4325, lng: 78.4551, material: 'PLASTER_OF_PARIS', heightFt: 3 });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.recommended.isArtificialPond, true);
    assert.ok(body.explanation.length > 10);
  });

  it('POST /api/recommendation excludes sites that cannot take a tall idol', async () => {
    const body = await (await post('/api/recommendation', { lat: 17.4325, lng: 78.4551, material: 'CLAY', heightFt: 9 })).json();
    assert.ok(body.recommended);
    assert.equal(body.recommended.isArtificialPond, false);
    assert.ok(body.excluded.length > 0);
  });

  it('POST /api/idol/options offers home immersion only for small clay idols', async () => {
    const small = await (await post('/api/idol/options', { material: 'CLAY', heightFt: 1.5 })).json();
    const pop = await (await post('/api/idol/options', { material: 'PLASTER_OF_PARIS', heightFt: 1.5 })).json();
    assert.equal(small.homeImmersionEligible, true);
    assert.equal(pop.homeImmersionEligible, false);
  });

  it('POST /api/idol/classify requires an image', async () => {
    const form = new FormData();
    form.set('heightFt', '2');
    const res = await fetch(`${server.baseUrl}/api/idol/classify`, { method: 'POST', body: form });
    assert.equal(res.status, 400);
    assert.equal((await res.json()).error.code, 'IMAGE_REQUIRED');
  });

  it('POST /api/idol/classify rejects non-image bytes', async () => {
    const form = new FormData();
    form.set('heightFt', '2');
    form.set('image', new Blob(['not an image at all'], { type: 'image/jpeg' }), 'x.jpg');
    const res = await fetch(`${server.baseUrl}/api/idol/classify`, { method: 'POST', body: form });
    assert.equal(res.status, 415);
  });

  it('POST /api/pollution/predict works with the fallback when the ML service is down', async () => {
    const res = await post('/api/pollution/predict', { idolCount: 200, material: 'PLASTER_OF_PARIS', heightFt: 5, flowerKg: 100 });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.ok(['LOW', 'MEDIUM', 'HIGH'].includes(body.level));
    assert.ok(body.disclaimer.length > 0);
  });

  it('clay in an artificial pond scores lower than PoP in a natural lake', async () => {
    const base = { idolCount: 50, heightFt: 4 };
    const bad = await (await post('/api/pollution/predict', { ...base, material: 'PLASTER_OF_PARIS', waterBodyType: 'NATURAL_LAKE' })).json();
    const good = await (await post('/api/pollution/predict', { ...base, material: 'CLAY', waterBodyType: 'ARTIFICIAL_POND' })).json();
    assert.ok(good.score < bad.score);
  });

  it('records activity and keeps app metrics separate from government statistics', async () => {
    const created = await post('/api/activity', { type: 'DESIGNATED_GUIDED', idolCount: 2, material: 'PLASTER_OF_PARIS', heightFt: 3, destinationId: 'demo-artificial-pond-1' });
    assert.equal(created.status, 201);
    await post('/api/activity', { type: 'FLOWER_DISPOSAL', destinationId: 'demo-flower-1', flowerKg: 3.5 });
    const dash = await (await get('/api/dashboard')).json();
    assert.equal(dash.appGenerated.label, 'Prototype / estimated impact');
    assert.equal(dash.appGenerated.metrics.usersGuidedToDesignatedFacilities, 1);
    assert.equal(dash.appGenerated.metrics.idolsRedirectedFromNaturalWaterBodies, 2);
    assert.equal(dash.appGenerated.metrics.flowerWasteKg, 3.5);
    assert.equal(dash.government.label, 'Government-reported statistics');
    assert.equal(dash.simulatedDemo, null);
  });

  it('rejects activity for an unknown destination', async () => {
    const res = await post('/api/activity', { type: 'FLOWER_DISPOSAL', destinationId: 'nope', flowerKg: 1 });
    assert.equal(res.status, 404);
  });

  it('returns JSON 404 for unknown API routes', async () => {
    const res = await get('/api/does-not-exist');
    assert.equal(res.status, 404);
    assert.equal((await res.json()).error.code, 'NOT_FOUND');
  });
});
