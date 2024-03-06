import { debug, setFailed, setOutput } from '@actions/core';
import { HttpClient } from '@actions/http-client';
import { BearerCredentialHandler } from '@actions/http-client/lib/auth';
import { upsertGitHubComment } from './github_comment';
import { parseInput } from './input';

export type RunResponse = {
  projectId: string;
  groupRunId: string;
  testGroupName: string;
  results: { testId: string; testName: string; success?: boolean }[];
};

const ONE_MIN_IN_MS = 60000;

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const {
      apiKey,
      domainOverride,
      githubComment,
      githubToken,
      runInAsyncMode,
      testGroupId
    } = parseInput();

    const httpClient = new HttpClient('stably-runner-action', [
      new BearerCredentialHandler(apiKey)
    ]);
    const respPromise = httpClient.postJson<RunResponse>(
      'https://us-west1-lovecaster-f3c68.cloudfunctions.net/run',
      {
        testGroupId,
        ...(domainOverride ? { domainOverrides: [domainOverride] } : {})
      },
      // We add a little buffer to our server timeout just in case
      { socketTimeout: 60 * ONE_MIN_IN_MS + 5000 }
    );

    if (runInAsyncMode) {
      setOutput('success', true);
      return;
    } else {
      const resp = await respPromise;
      debug(`resp statusCode: ${resp.statusCode}`);
      debug(`resp raw: ${JSON.stringify(resp.result)}`);

      const numFailedTests = (resp.result?.results || []).filter(
        x => x.success === false
      ).length;

      setOutput('success', resp.statusCode === 200 && numFailedTests === 0);

      // Github Commnet Code
      if (githubComment && githubToken) {
        await upsertGitHubComment(testGroupId, githubToken, resp);
      }
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) setFailed(error.message);
  }
}
