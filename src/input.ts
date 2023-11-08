import { InputOptions, getInput } from '@actions/core';

const NEWLINE_REGEX = /\r|\n/;
const TRUE_VALUES = new Set(['true', 'yes', '1']);

function getBoolInput(name: string, options?: InputOptions) {
  const rawBool = getInput(name, options).toLowerCase().trim();
  return TRUE_VALUES.has(rawBool);
}

export function parseInput() {
  const apiKey = getInput('api-key', { required: true });
  const runGroupIds = getInput('run-group-ids', { required: true })
    .split(NEWLINE_REGEX)
    .filter(Boolean);
  const githubToken = getInput('github-token');
  const githubComment = getBoolInput('github-comment');

  return {
    apiKey,
    runGroupIds,
    githubToken: githubToken || process.env.GITHUB_TOKEN,
    githubComment
  };
}
