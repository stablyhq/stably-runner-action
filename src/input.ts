import { InputOptions, getInput, setFailed } from '@actions/core';

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

  const rawDomainOverrideInput = getInput('domain_overrides')
    .split(NEWLINE_REGEX)
    .filter(Boolean);
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
  const domainOverride = {
    original: domainOverrideOriginal,
    replacement: domainOverrideReplacement
  };

  const githubToken = getInput('github-token');
  const githubComment = getBoolInput('github-comment');

  return {
    apiKey,
    runGroupIds,
    domainOverride,
    githubToken: githubToken || process.env.GITHUB_TOKEN,
    githubComment
  };
}
