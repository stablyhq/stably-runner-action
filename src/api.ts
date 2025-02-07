import { debug } from '@actions/core';
import { HttpClient } from '@actions/http-client';
import { BearerCredentialHandler } from '@actions/http-client/lib/auth';
import { GithubMetadata } from './fetch-metadata';

export enum TestStatus {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  RUNNING = 'RUNNING',
  ERROR = 'ERROR',
  FLAKY = 'FLAKY',
  CANCELLED = 'CANCELLED',
  SKIPPED = 'SKIPPED'
}

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
  const httpClient = new HttpClient(
    'github-action',
    [new BearerCredentialHandler(apiKey)],
    { socketTimeout: 24 * 60 * 60 * 1000 } // 24h timeout
  );

  debug(`Github Metadata: ${JSON.stringify(githubMetadata)}`);

  const body = options.urlReplacement
    ? { urlReplacements: [options.urlReplacement] }
    : {};

  const url = new URL(`/v1/testSuite/${testSuiteId}/run`, API_ENDPOINT).href;
  const response = await httpClient.post(url, JSON.stringify(body), {
    'Content-Type': 'application/json'
  });
  const result = await response.readBody();

  debug(`runTestSuite Response StatusCode: ${response.message.statusCode}`);
  // Check for invalid status code or no result
  if (
    (response.message.statusCode &&
      (response.message.statusCode < 200 ||
        response.message.statusCode >= 300)) ||
    !result
  ) {
    // Throw nicer message for auth issues
    if (response.message.statusCode === 401) {
      throw new Error('Invalid API key (unable to authenticate)');
    }
    throw new Error(
      `runTestSuite failed with status code ${response.message.statusCode}`
    );
  }

  return JSON.parse(result);
}
