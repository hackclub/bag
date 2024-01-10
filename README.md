## Bag

A new, improved version of the old `bag`!

## Getting started

Create an app in the Slack with `/create-app`. You'll get the app ID and key.

To start using the bag with your app, create a JavaScript

```js

```

## Reference

For reference on commands in Slack, run `@bag help` in the Slack.

Here's what you can do with your app:

// TODO: Generate automatically

## Setup

To run locally, make sure you have the following installed:

- [PostgreSQL](https://www.postgresql.org/): Either install it locally or set up a database in the cloud and get the database URL. More information at [https://www.prisma.io/docs/concepts/database-connectors/postgresql](https://www.prisma.io/docs/concepts/database-connectors/postgresql). Your database URL should look something like ``.
- Set up a Slack app. More information at [api.slack.com](https://api.slack.com).

Once you have these, you'll need to `git clone` this repo, and then:

1. `yarn install`
2. Fill out `.env.sample` and rename it to `.env`.
3. Run `yarn dev`!
4. Start playing with the Slack bot or try writing an app with the client inside `./client`.
