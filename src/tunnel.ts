export async function startTunnel(localEndpoint: string) {
  const { tunnelmole } = await import('tunnelmole');
  const port = new URL(localEndpoint).port;
  const url = await tunnelmole({
    port: Number(port) || 80
  });

  return url;
}
