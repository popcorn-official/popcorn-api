# Contributing

So you're interested in giving us a hand? That's awesome! We've put together
some brief guidelines that should help you get started quickly and easily.

There are lots and lots of ways to get involved, this document covers:
 - [Raising Issues](#raising-issues)
   - [Report  A Bug](#report-a-bug)
   - [Feature Requests](#feature-requests)
   - [Pull Requests](#pull-requests)
 - [Commit Messages](#commit-messages)
 - [Styleguides](#styleguides)
   - [JavaScript Styleguide](#javascript-styleguide)
   - [Tests Styleguide](#tests-styleguide)
   - [Documentation Styleguide](#documentation-styleguide)
 - [Setting up for development](#setting-up-for-development)
   - [npm scripts](#npm-scripts)
   - [Git hooks](#git-hooks)

## Raising Issues

If you're about to raise an issue because you think that you've found a problem
with the application, or you'd like to make a request for a new feature in the
codebase, or any other reason… please read this first.

The GitHub issue tracker is the preferred channel for
[bug reports](#report-a-bug), [feature requests](#feature-requests), and
[pull requests](#pull-requests) but respect the following restrictions:

* Please **do not** use the issue tracker for personal support requests.
* Please **do not** derail or troll issues. Keep the discussion on topic and
respect the opinions of others.

### Report A Bug

A bug is a _demonstrable problem_ that is caused by the code in the repository.
Good bug reports are extremely helpful - thank you!

Guidelines for bug reports:
1. **Use the GitHub issue search** &mdash; check if the issue has already been
reported.
2. **Check if the issue has been fixed** &mdash; try to reproduce it using the
latest `master` or look for [closed issues](https://github.com/popcorn-official/popcorn-api/issues?q=is%3Aissue+is%3Aclosed).
3. **Include a screencast if relevant** - Is your issue about a design or front
end feature or bug? The most helpful thing in the world is if we can *see* what
you're talking about. Just drop the picture after writing your issue, it'll be
uploaded and shown to the developers.
3. Use the Issue tab on GitHub to start [creating a bug report](https://github.com/popcorn-official/popcorn-api/issues/new).
A good bug report shouldn't leave others needing to chase you up for more
information. Be sure to include all the possible required details and the steps
to take to reproduce the issue.

### Feature Requests

Feature requests are welcome. Before you submit one be sure to:
1. **Use the [GitHub Issues search](https://github.com/popcorn-official/popcorn-api/issues)**
and check the feature hasn't already been requested.
2. Take a moment to think about whether your idea fits with the scope and aims
of the project, or if it might better fit being an app/plugin.
3. Remember, it's up to *you* to make a strong case to convince the project's
leaders of the merits of this feature. Please provide as much detail and
context as possible, this means explaining the use case and why it is likely to
be common.
4. Clearly indicate whether this is a feature request for the application
itself, or for packages like Providers, Metadatas, or other.

### Pull Requests

Pull requests are awesome. If you're looking to raise a PR for something which
doesn't have an open issue, please think carefully about
[raising an issue](#report-a-bug) which your PR can close, especially if you're
fixing a bug. This makes it more likely that there will be enough information
available for your PR to be properly tested and merged. To make sure your PR is
accepted as quickly as possible, you should be sure to have read all the
guidelines on:

* [Commit Messages](#commit-messages)
* [Stylesguides](#styleguides)

## Commit Messages

This project uses the [Conventional Commits](https://conventionalcommits.org/)
convention. If you are not familiar with this convention please read about it
first before creating a commit message or a PR.

## Styleguides

### JavaScript Styleguide

All JavaScript must adhere to [JavaScript Standard Style](http://standardjs.com/).

* Inline `export`s with expressions whenever possible
  ```js
  // Use this:
  export default class ClassName {

  }

  // Instead of:
  class ClassName {

  }
  export default ClassName
  ```

### Tests Styleguide

- Include thoughtfully-worded, well-structured [Mocha](https://mochajs.org/) tests in the `./test` folder.
- Treat `describe` as a noun or situation.
- Treat `it` as a statement about state or how an operation changes state.

### Documentation Styleguide

 * Use [Markdown](https://daringfireball.net/projects/markdown).
 * Reference methods and classes in markdown with the custom `{}` notation:
   * Reference classes with `{ClassName}`
   * Reference instance methods with `{ClassName.methodName}`
   * Reference class methods with `{ClassName#methodName}`

## Setting up for development

To setup your local machine to start working on the project you can follow these
steps:

1. Install [MongoDB](https://www.mongodb.com/) including `mongoexport` and `mongoimport`
2. Install [NodeJS](https://nodejs.org/) (at least Node v7.10.1 or greater)
3. Clone the repository with: `git clone https://github.com/popcorn-official/popcorn-api.git`
4. Install dependencies `npm i`
5. Install the flow-typed libraries with `npm run flow-typed`

### npm scripts

The following [`npm-scripts`](https://docs.npmjs.com/misc/scripts) are available in order to help you with the
development of the project.

```
 $ npm run build    # Transform the code with 'babel'
 $ npm run docs     # Generate the documentation with 'esdoc'
 $ npm run debug    # Run the application in debug mode
 $ npm run dev      # Run the application in development mode
 $ npm run flow     # Check flow typings
 $ npm run lint     # Check javascript style
 $ npm run test     # Run unit tests
```

### Git hooks

The following `git` hooks are available to ensure the changes you are about to
make follow the [styleguides](#styleguides) and make sure your changes pass the
tests.

```
pre-commit          # npm run lint && npm run flow
pre-push            # npm run test
```
