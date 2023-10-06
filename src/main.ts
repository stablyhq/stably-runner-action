import { debug, getInput, setFailed, setOutput } from '@actions/core';
import { HttpClient } from '@actions/http-client';
import { BearerCredentialHandler } from '@actions/http-client/lib/auth';

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const apiKey = getInput('api_key', {required: true});
    const projectId = getInput('project_id', {required: true});

    const httpClient = new HttpClient('stably-runner-action', [new BearerCredentialHandler(apiKey)]);

    const resp = await httpClient.postJson("https://app.stably.ai/run/v1", {
      projectId
    });

    debug(`resp statusCode: ${resp.statusCode}`);

    // Set outputs for other workflow steps to use
    setOutput('success', resp.statusCode === 200)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) setFailed(error.message)
  }
}
