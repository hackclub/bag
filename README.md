## Bag

A whole RPG system within the [Hack Club Slack](https://hackclub.com/slack)!

## Setup

To run locally, make sure you have the following installed:

- [Yarn](https://yarnpkg.com)
- [PostgreSQL](https://www.postgresql.org/): Either install it locally or set up a database in the cloud and get the database URL. More information at [https://www.prisma.io/docs/concepts/database-connectors/postgresql](https://www.prisma.io/docs/concepts/database-connectors/postgresql). Your database URL should look something like `postgres:://<user>@<location>/<db>`, this is what `DATABASE_URL` is. Nest has a built-in cli to get postgres DBs, try that.
- Set up a Slack app. More information at [api.slack.com](https://api.slack.com). You should have `SLACK_SIGNING_SECRET`, `SLACK_APP_TOKEN` (starts with `xapp`), and `SLACK_BOT_TOKEN` (starts with `xoxb`). Use ngrok to expose port 3001. (tip: use your ngrok-free domain to avoid having to change urls every time you restart). Put `https://ngrok-url.ngrok-free.app/slack/events` in the interactivity and shortcuts page, the event subscriptions page (subscribe to app_mention), then create all the slash commands (with your prefix) and put the url there too. Make sure you hit the save changes button on each page.
- A running Redis instance.

Once you have these, you'll need to `git clone` this repo, and then:

1. `yarn install && yarn run db:migrate-deploy`
2. Fill out `.env.sample` and rename it to `.env`.
3. Add yourself to the the list of maintainers in `maintainers.yaml`.
4. Run `yarn dev`!
5. Add the bot to the #bag-approvals channel.
6. Start playing with the Slack bot! The first thing you should do is run `/bot` and create an ADMIN app, then approve its request.
7. Clone the rivques/bag-manifest repo (hopefully merged into mainline soon). Make a .env in the workflow directory and set APP_ID and APP_KEY from the bot you just made, and set BASE_URL to port 3000 of wherever your bag instance is running (probably `http://localhost:3000`).
8. `cd` into the workflow directory and run `npm i`, then `node update.js`. This will pull all the items into your DB.
9. You should now have a local copy of Bag, ready to play with!