const apiEndpoint = 'https://api.stably.ai';

type RunTestResponse = {
  projectId: string;
  testSuiteRunId: string;
  testSuiteName: string;
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
): Promise<{ statusCode: number; execution: RunTestResponse }> {
  const body = options.urlReplacement
    ? { urlReplacements: [options.urlReplacement] }
    : {};

  const url = buildEndpoint(`/v1/testGroup/${testGroup}/run`);
  console.info(`executing POST to ${url}. Body: ${JSON.stringify(body)}`);
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'x-stably-api-key': apiKey }
  });

  const result = await response.json();

  return {
    statusCode: response.status,
    execution: result
  };
}

function buildEndpoint(path: string) {
  const url = new URL(path, apiEndpoint);

  console.log(url.href);
  return url.href;
}
