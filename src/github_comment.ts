import { context, getOctokit } from '@actions/github';
import { TypedResponse } from '@actions/http-client/lib/interfaces';
import { RunResponse } from './main';
import dedent from 'ts-dedent';

export async function addGitHubComment(
  githubToken: string,
  resp: TypedResponse<RunResponse>
) {
  const octokit = getOctokit(githubToken);

  const projectId = resp.result?.projectId || '';
  const groupRunId = resp.result?.groupRunId || '';
  const results = resp.result?.results || [];
  const failedTests = results.filter(x => x.success === false);
  const successTests = results.filter(x => x.success === true);
  const undefinedTests = results.filter(x => x.success === undefined);

  // prettier-ignore
  const body = dedent`
  # [Stably](https://stably.ai/) Runner

  // TODO: Link to the group run result stuff here
  [Test Group Run Result](https://app.stably.ai/project/${projectId}/history/g_${groupRunId}): ${
    resp.statusCode !== 200
      ? '❌ Error - The Action ran into an error while calling the Stably backend. Please re-run'
      : failedTests.length === 0
      ? `🟢 Success (${successTests.length}/${results.length} tests passed)`
      : `🔴 Failure (${failedTests.length}/${results.length} tests failed)`
  }
  

  ${
    failedTests.length > 0
      ? dedent`Failed Tests:
      ${listTestMarkDown(failedTests, projectId)}`
      : ''
  }

  ${
    undefinedTests.length > 0
      ? dedent`Unable to run tests:
      ${listTestMarkDown(undefinedTests, projectId)}`
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
    testName: string;
    testId: string;
    success?: boolean | undefined;
  }[],
  projectId: string
) {
  return tests
    .map(
      x =>
        `  * [${x.testName}](http://app.stably.ai/project/${projectId}/test/${x.testId})`
    )
    .join('\n');
}
