const apiEndpoint = 'https://api.stably.ai/v1';

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
  options: RunTestOptions
): Promise<RunTestResponse> {
  const body = options.urlReplacement
    ? { urlReplacements: [options.urlReplacement] }
    : {};

  const response = await fetch(buildEndpoint(`/testGroup/${testGroup}/run`), {
    method: 'POST',
    body: JSON.stringify(body)
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
  return new URL(path, apiEndpoint).href;
}
