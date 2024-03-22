## Bag

A whole RPG system within the [Hack Club Slack](https://hackclub.com/slack)!

## Setup

To run locally, make sure you have the following installed:

- [Yarn](https://yarnpkg.com)
- [PostgreSQL](https://www.postgresql.org/): Either install it locally or set up a database in the cloud and get the database URL. More information at [https://www.prisma.io/docs/concepts/database-connectors/postgresql](https://www.prisma.io/docs/concepts/database-connectors/postgresql). Your database URL should look something like `postgres:://<user>@<location>/<db>`, this is what `DATABASE_URL` is.
- Set up a Slack app. More information at [api.slack.com](https://api.slack.com). You should have `SLACK_SIGNING_SECRET`, `SLACK_APP_TOKEN` (starts with `xapp`), and `SLACK_BOT_TOKEN` (starts with `xoxb`).

Once you have these, you'll need to `git clone` this repo, and then:

1. `yarn install && yarn run db:migrate-deploy`
2. Fill out `.env.sample` and rename it to `.env`.
3. Add yourself to the the list of maintainers in `maintainers.yaml`.
4. Run `yarn dev`!
5. Start playing with the Slack bot! The first thing you should do is run `/bot` and create a app, and then add `APP_ID` and `APP_KEY` variables to your `.env` file.
