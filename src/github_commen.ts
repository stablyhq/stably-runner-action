import { context, getOctokit } from '@actions/github';
import { TypedResponse } from '@actions/http-client/lib/interfaces';

export async function addGitHubComment(
  githubToken: string,
  resp: TypedResponse<{
    results: {
      testId: string;
      success?: boolean;
    }[];
  }>
) {
  const octokit = getOctokit(githubToken);

  const results = resp.result?.results || [];
  const failedTests = results.filter(x => x.success === false);
  const successTests = results.filter(x => x.success === true);
  const undefinedTests = results.filter(x => x.success === undefined);

  const body = `
  # [Stably](https://stably.ai/) Runner

  
  Test Run Result: ${
    resp.statusCode !== 200
      ? '❌ Error - The Action ran into an error while calling the Stably backend. Please re-run'
      : failedTests.length === 0
      ? `🟢 Success (${successTests.length} / ${results.length} tests passed)`
      : `🔴 Failure (${failedTests.length} / ${results.length} tests failed)`
  }
  

  ${
    failedTests.length > 0
      ? `Failed Tests:\n
      ${listTestMarkDown(failedTests)}`
      : ''
  }

  ${
    undefinedTests.length > 0
      ? `##Unnable to run tests:
      ${listTestMarkDown(undefinedTests)}`
      : ''
  }
  
  ---
  _This comment was generated from [stably-runner-action](https://github.com/marketplace/actions/stably-runner)_
`;

  if (context.payload.pull_request) {
    await octokit.rest.issues.createComment({
      ...context.repo,
      body,
      issue_number: context.payload.pull_request.number
    });
  } else if (context.eventName === 'push') {
    await octokit.rest.repos.createCommitComment({
      ...context.repo,
      body,
      commit_sha: context.payload.after
    });
  }
}

function listTestMarkDown(
  tests: {
    testId: string;
    success?: boolean | undefined;
  }[]
) {
  return tests
    .map(x => `\t* [${x.testId}](http://app.stably.ai/test/${x.testId})`)
    .join('\n');
}
