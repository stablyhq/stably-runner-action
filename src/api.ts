const API_ENDPOINT = 'https://api.stably.ai';

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
  asyncMode?: boolean;
};

export async function runTestGroup(
  testSuiteId: string,
  apiKey: string,
  options: RunTestOptions
): Promise<{ statusCode: number; execution?: RunTestResponse }> {
  const body = options.urlReplacement
    ? { urlReplacements: [options.urlReplacement] }
    : {};

  const url = new URL(`/v1/testSuite/${testSuiteId}/run`, API_ENDPOINT).href;
  const apiCallPromise = fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', authorization: apiKey }
  });

  if (!options.asyncMode) {
    const response = await apiCallPromise;
    const result = await response.json();

    return {
      statusCode: response.status,
      execution: result
    };
  }

  // in async mode, we don't wait for the response, so we consider it's Ok
  return { statusCode: 200 };
}
