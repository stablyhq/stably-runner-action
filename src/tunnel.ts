const tunnelmole = require('tunnelmole/cjs');

export async function startTunnel(localEndpoint: string) {
  const port = new URL(localEndpoint).port;
  const url = await tunnelmole({
    port: port
  });

  return url;
}
