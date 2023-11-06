import { debug, getInput, setFailed, setOutput } from '@actions/core';
import { HttpClient } from '@actions/http-client';
import { BearerCredentialHandler } from '@actions/http-client/lib/auth';
import { parseInput } from './input';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const {
      apiKey,
      domainOverrides,
      projectId,
      runGroupIds,
      testIds,
      githubComment,
      githubToken
    } = parseInput();

    const httpClient = new HttpClient('stably-runner-action', [
      new BearerCredentialHandler(apiKey)
    ]);

    const resp = await httpClient.postJson<{
      results: { testId: string; success?: boolean }[];
    }>('https://app.stably.ai/api/run/v1', {
      projectId,
      domainOverrides,
      filter: {
        ...(testIds.length ? { testIds } : {}),
        ...(runGroupIds.length ? { runGroupIds } : {})
      }
    });

    debug(`resp statusCode: ${resp.statusCode}`);

    const numFailedTests = (resp.result?.results || []).filter(
      x => x.success === false
    ).length;

    // Set outputs for other workflow steps to use
    setOutput('success', resp.statusCode === 200 && numFailedTests === 0);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) setFailed(error.message);
  }
}
