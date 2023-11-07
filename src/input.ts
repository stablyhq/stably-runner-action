import { InputOptions, getInput, info } from '@actions/core';

const NEWLINE_REGEX = /\r|\n/;
const TRUE_VALUES = new Set(['true', 'yes', '1']);

function getBoolInput(name: string, options?: InputOptions) {
  const rawBool = getInput(name, options).toLowerCase().trim();
  return TRUE_VALUES.has(rawBool);
}

export function parseInput() {
  const apiKey = getInput('api-key', { required: true });
  const projectId = getInput('project-id', { required: true });
  const testIds = getInput('test-ids').split(NEWLINE_REGEX).filter(Boolean);
  const runGroupIds = getInput('run-group-ids')
    .split(NEWLINE_REGEX)
    .filter(Boolean);

  const domainOverrides = getInput('domain-overrides')
    .split(NEWLINE_REGEX)
    .reduce<{
      res: { original: string; replacement: string }[];
      tempOrig?: string;
    }>(
      ({ res, tempOrig }, cur) =>
        tempOrig
          ? { res: res.concat({ original: tempOrig, replacement: cur }) }
          : { res, tempOrig: cur },
      { res: [] }
    ).res;

  const githubToken = getInput('github-token');
  const githubComment = getBoolInput('github-comment');

  return {
    apiKey,
    projectId,
    testIds,
    runGroupIds,
    domainOverrides,
    githubToken: githubToken || process.env.GITHUB_TOKEN,
    githubComment
  };
}
