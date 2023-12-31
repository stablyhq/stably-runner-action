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
    const { apiKey, testGroupId, domainOverride, githubComment, githubToken } =
      parseInput();

    const httpClient = new HttpClient('stably-runner-action', [
      new BearerCredentialHandler(apiKey)
    ]);
    const resp = await httpClient.postJson<RunResponse>(
      'https://app.stably.ai/api/run/v1',
      {
        testGroupId,
        ...(domainOverride ? { domainOverrides: [domainOverride] } : {})
      },
      // We add a little buffer to our server timeout just in case
      { socketTimeout: 5 * ONE_MIN_IN_MS + 5000 }
    );

    debug(`resp statusCode: ${resp.statusCode}`);
    debug(`resp raw: ${JSON.stringify(resp.result)}`);

    const numFailedTests = (resp.result?.results || []).filter(
      x => x.success === false
    ).length;

    // Set outputs for other workflow steps to use
    setOutput('success', resp.statusCode === 200 && numFailedTests === 0);

    // Github Commnet Code
    if (githubComment && githubToken) {
      await upsertGitHubComment(testGroupId, githubToken, resp);
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) setFailed(error.message);
  }
}
