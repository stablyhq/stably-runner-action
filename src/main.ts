import { debug, setFailed, setOutput } from '@actions/core';
import { HttpClient } from '@actions/http-client';
import { BearerCredentialHandler } from '@actions/http-client/lib/auth';
import { upsertGitHubComment } from './github_comment';
import { parseInput } from './input';
import { fetchSSE } from './fetch-sse';

export type RunResponse = {
  projectId: string;
  testSuiteRunId: string;
  testSuiteName: string;
  results: { testId: string; testName: string; success?: boolean }[];
};

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const {
      apiKey,
      urlReplacement,
      githubComment,
      githubToken,
      runInAsyncMode,
      testSuiteId
    } = parseInput();

    const httpClient = new HttpClient('stably-runner-action', [
      new BearerCredentialHandler(apiKey)
    ]);
    const respPromise = fetchSSE({
      httpClient,
      url: 'https://app.stably.ai/api/runner/run',
      payload: {
        testSuiteId,
        ...(urlReplacement ? { domainOverrides: [urlReplacement] } : {})
      }
    });

    if (runInAsyncMode) {
      setOutput('success', true);
      return;
    } else {
      // We insert some status code to mimic earlier code
      const resp = await respPromise
        .then(x => ({
          result: x as RunResponse,
          statusCode: 200
        }))
        .catch(e => ({
          result: undefined,
          statusCode: 500,
          error: `${e}`
        }));

      debug(`resp statusCode: ${resp.statusCode}`);
      if (resp.statusCode !== 200 && 'error' in resp) {
        debug(`resp error: ${resp.error}`);
        setFailed(
          `Request failed with status code ${resp.statusCode}: ${JSON.stringify(
            resp.error,
            null,
            2
          )}`
        );
        return;
      }
      debug(`resp raw: ${JSON.stringify(resp.result)}`);

      const numFailedTests = (resp.result?.results || []).filter(
        x => x.success === false
      ).length;

      setOutput('success', resp.statusCode === 200 && numFailedTests === 0);

      // Github Commnet Code
      if (githubComment && githubToken) {
        await upsertGitHubComment(testSuiteId, githubToken, resp);
      }
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) setFailed(error.message);
  }
}
