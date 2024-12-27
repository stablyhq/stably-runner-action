import { setFailed, setOutput } from '@actions/core';
import { upsertGitHubComment } from './github_comment';
import { parseInput } from './input';
import { runTestGroup } from './api';
import { startTunnel } from '@stablyhq/runner-sdk';

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
      testSuiteId,
      runInAsyncMode
    } = parseInput();
    const shouldTunnel =
      urlReplacement?.replacement.startsWith('http://localhost');

    if (urlReplacement && shouldTunnel) {
      const tunnelUrl = await startTunnel(urlReplacement.replacement);
      urlReplacement.replacement = tunnelUrl;
    }

    const response = await runTestGroup(testSuiteId, apiKey, {
      urlReplacement
    });

    if (!runInAsyncMode) {
      const success = response.execution!.results.every(
        result => result.success
      );
      setOutput('success', success);
    }

    // Github Comment Code
    if (githubComment && githubToken) {
      await upsertGitHubComment(testSuiteId, githubToken, {
        statusCode: response.statusCode,
        result: response.execution
      });
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) setFailed(error.message);
  } finally {
    // Make sure the process exits
    // This is done to prevent the tunnel from hanging the thread
    process.exit(0);
  }
}
