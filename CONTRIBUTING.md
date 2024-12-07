<!-- omit in toc -->

# Contributing to ai-project-template

First off, thanks for taking the time to contribute! ❤️

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).
By participating, you are expected to uphold this code. Please report unacceptable behavior.

## Contributing

### Team members:
- Amine Djeghri

###  ⚙️ Steps for Installation (Contributors and maintainers)

- The first step is [to install to read and test the project as a user](README.md#-steps-for-installation-users)
- To install the dev dependencies (pre-commit, pytest, ruff...), run ``make install-dev``
- run ``make pre-commit install`` to install pre-commit hooks
- To install the GitHub actions locally, run ``make install-act``
- To install the gitlab ci locally, run ``make install-ci``

- Before you start working on an issue, please comment on (or create) the issue and wait for it to be assigned to you. If
someone has already been assigned but didn't have the time to work on it lately, please communicate with them and ask if
they're still working on it. This is to avoid multiple people working on the same issue.
Once you have been assigned an issue, you can start working on it. When you are ready to submit your changes, open a
pull request. For a detailed pull request tutorial, see this guide.

1. Create a branch from the dev branch and respect the naming convention: `feature/your-feature-name`
   or `bugfix/your-bug-name`.
2. Before commiting your code :
   - Run ``make test`` to run the tests
   - Run ``make pre-commit`` to check the code style & linting. If it fails because gitguardien api key is not in your secret, add it in .secret. ggshield provides it for free.
   - Run `make deploy-doc-local` to update the documentation
   - (optional) Commit Messages: This project uses [Gitmoji](https://gitmoji.dev/) for commit messages. It helps to
     understand the purpose of the commit through emojis. For example, a commit message with a bug fix can be prefixed with
     🐛. There are also [Emojis in GitHub](https://github.com/ikatyang/emoji-cheat-sheet/blob/master/README.md)
   - Manually, merge dev branch into your branch to solve and avoid any conflicts. Merging strategy: merge : dev →
     your_branch
   - After merging, run ``make test`` and ``make pre-commit`` again to ensure that the tests are still passing.
   - (if your project is a python package) Update the package’s version, in pyproject.toml & build the wheel
3. Depending on the platform you use, run `make act` for GitHub Actions or `make gitlab-ci-local` for GitLab CI.
4. Create a pull request. If the GitHub actions pass, the PR will be accepted and merged to dev.

### (For repository maintainers) Merging strategies & GitHub actions guidelines**

- Once the dev branch is tested, the pipeline is green, and the PR has been accepted, you can merge with a 'merge'
  strategy.
- DEV → MAIN: Then, you should create a merge from dev to main with Squash strategy.
- MAIN → RELEASE: The status of the ticket will change then to 'done.'
