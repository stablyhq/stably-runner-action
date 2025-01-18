import { debug } from '@actions/core';
import { context, getOctokit } from '@actions/github';

export type GithubMetadata = {
  branch: string;
  commit: {
    sha: string;
    timestamp?: string;
    message: string;
  };
};

export async function fetchMetadata(
  githubToken?: string
): Promise<GithubMetadata | undefined> {
  if (!githubToken) {
    return;
  }

  const octokit = getOctokit(githubToken);

  const branchName = context.ref.replace('refs/heads/', '');
  const commitSha = context.sha;

  let commitData;
  try {
    const response = await octokit.rest.repos.getCommit({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: commitSha
    });
    commitData = response.data;
  } catch (error) {
    debug(`Failed to fetch commit data: ${error}`);
    return;
  }

  return {
    branch: branchName,
    commit: {
      sha: commitSha,
      timestamp: commitData.commit.author?.date,
      message: commitData.commit.message
    }
  };
}
