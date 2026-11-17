import { readFile } from 'node:fs/promises';
import { server as superstatic } from 'superstatic';
import { prepareHosting } from './prepare-hosting.mjs';

export async function startFirebasePreview() {
  await prepareHosting();
  const { hosting } = JSON.parse(
    await readFile('firebase.generated.json', 'utf8'),
  );
  const server = superstatic({
    config: hosting,
    port: 0,
    hostname: '127.0.0.1',
    debug: false,
    compression: true,
    stack: 'strict',
  }).listen();
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  return {
    baseURL: `http://127.0.0.1:${server.address().port}`,
    close: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}
