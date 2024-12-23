const apiEndpoint = 'https://api.stably.ai';

type RunTestResponse = {
  projectId: string;
  groupRunId: string;
  testGroupName: string;
  results: {
    testId: string;
    testName: string;
    success: boolean;
  }[];
};

type RunTestOptions = {
  urlReplacement?: { original: string; replacement: string };
};

export async function runTestGroup(
  testGroup: string,
  apiKey: string,
  options: RunTestOptions
): Promise<RunTestResponse> {
  const body = options.urlReplacement
    ? { urlReplacements: [options.urlReplacement] }
    : {};

  const url = buildEndpoint(`/v1/testGroup/${testGroup}/run`);
  console.info(`executing POST to ${url}. Body: ${JSON.stringify(body)}`);
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  if (response.status !== 200) {
    throw new Error(
      `Test group execution failed. Got status ${
        response.status
      } and response: ${await response.text()}`
    );
  }

  return (await response.json()) satisfies RunTestResponse;
}

function buildEndpoint(path: string) {
  const url = new URL(path, apiEndpoint);

  console.log(url.href);
  return url.href;
}
