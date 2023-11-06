import { info } from '@actions/core';
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

  // let { ref, sha } = context;
  // let commit = execSync('git log -1 --pretty=format:%B').toString().trim();
  // if (context.payload.pull_request) {
  //   const pullRequestPayload = context.payload;
  //   const pr =
  //     pullRequestPayload.pull_request || pullRequestPayload.pull_request_target;
  //   ref = pr.head.ref;
  //   sha = pr.head.sha;

  //   const { data: commitData } = await octokit.rest.git.getCommit({
  //     ...context.repo,
  //     commit_sha: sha
  //   });
  //   commit = commitData.message;
  // }
  // info(`commit: ${commit}`);

  const body = `
  🪐 Stably Runner
  
  # Does markdown work?
  
  num results: ${resp.result?.results.length}
  
  This comment is generated from [stably-runner-action](https://github.com/marketplace/actions/stably-runner)
`;

  if (context.payload.pull_request) {
    info('Adding GitHub comment to PR');
    await octokit.rest.issues.createComment({
      ...context.repo,
      body,
      issue_number: context.payload.pull_request.number
    });
  } else if (context.eventName === 'push') {
    info('Adding GitHub comment to Commit');
    await octokit.rest.repos.createCommitComment({
      ...context.repo,
      body,
      commit_sha: context.payload.after
    });
  }
  info('Done Adding GitHub comment');
}
