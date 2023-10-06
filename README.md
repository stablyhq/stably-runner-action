# Stably-runner-action

Use this GitHub action to run tests on https://stably.ai/

## Usage
```yaml
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v3

  - name: Stably Runner Action
    id: stably-runner
    uses: actions/stably-runner-action@v1
    with:
         api_key: ${{ secrets.API_KEY }}
         project_id: YOUR_PROJECT_ID
         test_ids: |-
            TEST_ID_TO_FILTER_1
            TEST_ID_TO_FILTER_2
         domain_overrides: |-
            ORIGINAL_DOMAIN:REPLACEMENT_DOMAIN

  - name: Print Output
    id: output
    run: echo "${{ steps.test-action.outputs.success }}"
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

Your action is now published

For information about versioning your action, see
[Versioning](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

## Validating the Action
You can now validate the action by referencing it in a workflow file. For
example, [`ci.yml`](./.github/workflows/ci.yml) demonstrates how to reference an
action in the same repository. 


</details>

