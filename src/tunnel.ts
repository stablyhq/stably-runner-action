export async function startTunnel(localEndpoint: string) {
  // process.env.TUNNELMOLE_QUIET_MODE = '1';
  const { tunnelmole } = await import('tunnelmole');
  const port = new URL(localEndpoint).port;
  const url = await tunnelmole({
    port: Number(port) || 80
  });

  return url;
}
