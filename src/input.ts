import { InputOptions, getInput, setFailed } from '@actions/core';

const NEWLINE_REGEX = /\r|\n/;
const TRUE_VALUES = new Set(['true', 'yes', '1']);

function getBoolInput(name: string, options?: InputOptions) {
  return TRUE_VALUES.has(getInput(name, options).toLowerCase().trim());
}

function getList(name: string, options?: InputOptions) {
  return getInput(name, options).split(NEWLINE_REGEX).filter(Boolean);
}

export function parseInput() {
  const apiKey = getInput('api-key', { required: true });

  // Supporting deprecating of runGroupIds
  const runGroupIdsInput = getList('run-group-ids');
  const testGroupIdInput = getInput('test-group-id');
  const testGroupId = testGroupIdInput ?? runGroupIdsInput.at(0);
  if (!testGroupId) {
    setFailed('the `testGroupId` input is required');
  }

  const rawDomainOverrideInput = getList('domain-override');
  if (
    rawDomainOverrideInput.length > 0 &&
    rawDomainOverrideInput.length !== 2
  ) {
    setFailed(
      `Domain override can only be given as a single pair. Given: ${JSON.stringify(
        rawDomainOverrideInput
      )}`
    );
  }
  const [domainOverrideOriginal, domainOverrideReplacement] =
    rawDomainOverrideInput;
  const domainOverride =
    rawDomainOverrideInput.length === 2
      ? {
          original: domainOverrideOriginal,
          replacement: domainOverrideReplacement
        }
      : undefined;

  const githubToken = getInput('github-token');
  const githubComment = getBoolInput('github-comment');

  return {
    apiKey,
    testGroupId,
    domainOverride,
    githubToken: githubToken || process.env.GITHUB_TOKEN,
    githubComment
  };
}
