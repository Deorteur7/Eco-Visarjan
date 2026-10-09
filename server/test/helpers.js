import './setup.js';
import { createApp } from '../src/app.js';
import { initStore } from '../src/db/index.js';

/** Starts the real app on a random port using the in-memory store. */
export async function startTestServer() {
  await initStore();
  const app = createApp();
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  const { port } = server.address();
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
