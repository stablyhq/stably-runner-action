import { setFailed, setOutput } from '@actions/core';
import { startTunnel } from '@stablyhq/runner-sdk';
import { runTestSuite } from './api';
import { upsertGitHubComment } from './github_comment';
import { parseInput } from './input';

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
      urlReplacement &&
      new URL(urlReplacement.replacement).hostname === 'localhost';

    if (urlReplacement && shouldTunnel) {
      const tunnel = await startTunnel(urlReplacement.replacement);
      urlReplacement.replacement = tunnel.url;
    }

    const runResultPromise = runTestSuite({
      testSuiteId,
      apiKey,
      options: {
        urlReplacement
      }
    });

    if (!runInAsyncMode) {
      try {
        const runResult = await runResultPromise;
        const success = runResult.results.every(x => x.success);
        setOutput('success', success);

        // Github Comment Code
        if (githubComment && githubToken) {
          await upsertGitHubComment(testSuiteId, githubToken, {
            result: runResult
          });
        }
      } catch (e) {
        if (githubComment && githubToken) {
          await upsertGitHubComment(testSuiteId, githubToken, {
            error: true
          });
        }
      }
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
