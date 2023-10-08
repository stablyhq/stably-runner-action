# Stably-runner-action

Use this GitHub action to run tests on [stably.ai](https://stably.ai)

## Inputs

| **Name** | **Required** | **Description** |
| --- | --- | --- |
| project_id | X | Your project ID |
| api_key | X | Your API key |
| test_ids |  | Newline separated list of test IDs. Use to run a subset of tests |
| domain_overrides |  | Newline-separated list of domain overrides (given in pairs -- original first, replacement second). Use to replace origin URLs when running tests |


## Outputs

| **Name** | **Description** |
| --- | --- |
| success | Bool if run was successful |


## Example Usage

```yaml
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v3

  - name: Stably Runner Action
    id: stably-runner
    uses: stablyhq/stably-runner-action@v2
    with:
         api_key: ${{ secrets.API_KEY }}
         project_id: YOUR_PROJECT_ID
         test_ids: |-
            TEST_ID_TO_FILTER_1
            TEST_ID_TO_FILTER_2
         domain_overrides: |-
            ORIGINAL_DOMAIN_1
            REPLACEMENT_DOMAIN_1
            ORIGINAL_DOMAIN_2
            REPLACEMENT_DOMAIN_2

  - name: Print Output
    id: output
    run: echo "${{ steps.stably-runner.outputs.success }}"
```


<details>

<summary>Development</summary>

## Setup

1. :hammer_and_wrench: Install the dependencies

   ```bash
   npm install
   ```

2. :building_construction: Package the TypeScript for distribution

   ```bash
   npm run bundle
   ```

3. :white_check_mark: Run the tests

   ```bash
   npm test
   ```

## Publishing

1. Create a new branch

   ```bash
   git checkout -b releases/v1
   ```

2. Format, test, and build the action

   ```bash
   npm run all
   ```

3. Commit your changes

4. Push them to your repository

   ```bash
   git push -u origin releases/v1
   ```

6. Merge the pull request into the `master` branch

7. Release
     1. Draft a release via the GitHub UI and ensure you select to also publish to the marketplace. Use SEMVAR
     2. Make the new release available to those binding to the major version tag: Move the major version tag (v1, v2, etc.) to point to the ref of the current releas

         ```bash
         git tag -fa v2 -m "Update v2 tag"
         git push origin v2 --force
         ```
   
   For information more info see [Versioning](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

## Validating the Action

[`ci.yml`](./.github/workflows/ci.yml) is a workflow that runs and validates the action


</details>