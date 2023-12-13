import { context, getOctokit } from '@actions/github';
import { TypedResponse } from '@actions/http-client/lib/interfaces';
import { RunResponse } from './main';
import dedent from 'ts-dedent';

export async function upsertGitHubComment(
  testGroupId: string,
  githubToken: string,
  resp: TypedResponse<RunResponse>
) {
  const octokit = getOctokit(githubToken);

  const projectId = resp.result?.projectId || '';
  const groupRunId = resp.result?.groupRunId || '';
  const testGroupName = resp.result?.testGroupName || '';
  const results = resp.result?.results || [];
  const failedTests = results.filter(x => x.success === false);
  const successTests = results.filter(x => x.success === true);
  const undefinedTests = results.filter(x => x.success === undefined);

  const commentIdentiifer = `<!-- stably_${testGroupId} -->`;

  // prettier-ignore
  const body = dedent`${commentIdentiifer}
  # [Stably](https://stably.ai/) Runner
  ## [Test Group - '${testGroupName}'](https://app.stably.ai/project/${projectId}/testGroup/${testGroupId})

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

  // Check if existing comment exists
  const { data: comments } = context.payload.pull_request
    ? await octokit.rest.issues.listComments({
        ...context.repo,
        issue_number: context.payload.pull_request.number
      })
    : await octokit.rest.repos.listCommentsForCommit({
        ...context.repo,
        commit_sha: context.payload.after
      });
  const existingCommentId = comments.find(
    comment => comment?.body?.startsWith(commentIdentiifer)
  )?.id;

  // Create or update commit/PR comment
  if (context.payload.pull_request) {
    if (existingCommentId) {
      await octokit.rest.issues.updateComment({
        ...context.repo,
        comment_id: existingCommentId,
        body
      });
    } else {
      await octokit.rest.issues.createComment({
        ...context.repo,
        body,
        issue_number: context.payload.pull_request.number
      });
    }
  } else if (context.eventName === 'push') {
    if (existingCommentId) {
      await octokit.rest.repos.updateCommitComment({
        ...context.repo,
        comment_id: existingCommentId,
        body
      });
    } else {
      await octokit.rest.repos.createCommitComment({
        ...context.repo,
        body,
        commit_sha: context.payload.after
      });
    }
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
