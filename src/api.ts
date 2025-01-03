const API_ENDPOINT = 'https://api.stably.ai';

import { HttpClient } from '@actions/http-client';

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
  const httpClient = new HttpClient('github-action');

  const body = options.urlReplacement
    ? { urlReplacements: [options.urlReplacement] }
    : {};

  const url = new URL(`/v1/testSuite/${testSuiteId}/run`, API_ENDPOINT).href;
  const apiCallPromise = httpClient.post(url, JSON.stringify(body), {
    'Content-Type': 'application/json',
    authorization: apiKey
  });

  if (!options.asyncMode) {
    const response = await apiCallPromise;
    const result = await response.readBody();
    const resultJson = JSON.parse(result);

    return {
      statusCode: response.message.statusCode || 0,
      execution: resultJson
    };
  }

  // in async mode, we don't wait for the response, so we consider it's Ok
  return { statusCode: 200 };
}
