import { debug } from '@actions/core';
import { GithubMetadata } from './fetch-metadata';

export type TestStatus =
  | 'PASSED'
  | 'FAILED'
  | 'RUNNING'
  | 'ERROR'
  | 'FLAKY'
  | 'CANCELLED'
  | 'SKIPPED';

export type RunResponse = {
  projectId: string;
  testSuiteRunId: string;
  testSuiteName: string;
  results: { testId: string; testName: string; status?: TestStatus }[];
};

const API_ENDPOINT = 'https://api.stably.ai';

export async function runTestSuite({
  testSuiteId,
  apiKey,
  options,
  githubMetadata
}: {
  testSuiteId: string;
  apiKey: string;
  options: {
    urlReplacement?: { original: string; replacement: string };
    asyncMode?: boolean;
  };
  githubMetadata?: GithubMetadata;
}): Promise<RunResponse> {
  debug(`Github Metadata: ${JSON.stringify(githubMetadata)}`);

  const body = options.urlReplacement
    ? { urlReplacements: [options.urlReplacement] }
    : {};

  const url = new URL(`/v1/testSuite/${testSuiteId}/run`, API_ENDPOINT).href;
  // 24h timeout
  const timeout = 24 * 60 * 60 * 1000;
  const signal = AbortSignal.timeout(timeout);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
    signal
  });

  debug(`runTestSuite Response StatusCode: ${response.status}`);

  // Check for invalid status code
  if (!response.ok) {
    // Throw nicer message for auth issues
    if (response.status === 401) {
      throw new Error('Invalid API key (unable to authenticate)');
    }
    throw new Error(`runTestSuite failed with status code ${response.status}`);
  }

  return response.json();
}
