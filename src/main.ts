import { debug, setFailed, setOutput } from '@actions/core';
import { HttpClient } from '@actions/http-client';
import { BearerCredentialHandler } from '@actions/http-client/lib/auth';
import { upsertGitHubComment } from './github_comment';
import { parseInput } from './input';
import { fetchSSE } from './fetch-sse';
import { runTestGroup } from './api';
import { startTunnel } from './tunnel';

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

    const shouldTunnel =
      urlReplacement?.replacement.startsWith('http://localhost');

    console.info(`is local replacement: ${shouldTunnel}`);

    if (urlReplacement && shouldTunnel) {
      const tunnelUrl = await startTunnel(urlReplacement.replacement);
      urlReplacement.replacement = tunnelUrl;
    }

    const response = await runTestGroup(testSuiteId, {
      urlReplacement
    });
    const success = response.results.every(result => result.success);
    setOutput('success', success);

    // Github Commnet Code
    if (githubComment && githubToken) {
      await upsertGitHubComment(testSuiteId, githubToken, response);
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) setFailed(error.message);
  }
}
