import { Block, KnownBlock } from '@slack/bolt'

const error = (err: string) => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: err
      }
    }
  ]
}

export const cascadingPermissions = [
  {
    text: {
      type: 'plain_text',
      text: 'Read',
      emoji: true
    },
    value: 'READ'
  },
  {
    text: {
      type: 'plain_text',
      text: 'Read private',
      emoji: true
    },
    value: 'READ_PRIVATE'
  },
  {
    text: {
      type: 'plain_text',
      text: 'Write specific',
      emoji: true
    },
    value: 'WRITE_SPECIFIC'
  },
  {
    text: {
      type: 'plain_text',
      text: 'Write all',
      emoji: true
    },
    value: 'WRITE'
  },
  {
    text: {
      type: 'plain_text',
      text: 'Admin',
      emoji: true
    },
    value: 'ADMIN'
  }
]

const helpDialog: (Block | KnownBlock)[] = [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Hi! I am a bag. Here's a list of available commands.

\`/bag-item\`: Options for items.
\`/bag-app\`: Options for apps.
\`/bag-request-perms\`: Request permissions for yourself. 
\`/bag-inventory me/@<person>\`: Same functionality as mentioning me, but you can also do this in DMs! 
\`/bag-trade\`: Start a trade with someone else!

And of course, if you ever mention me, the @bag, I will help in any way possible! (Although I am just a measly bag.) Here is a list of things you can call me for:

* \`help\`: Call me for help!
* \`me\`: Check out your inventory! This will list all public items. You can also list private items with \`me private\` instead.
* \`@<person>\`: Check out another Hack Clubber's inventory! This will list all their public items.

By the way, I come with a bunch of ~magic tricks~ apps! You can check out all the (public) apps by calling \`/bag-apps\`. *Interested in writing an app? Check out this super cool jam!*`
    }
  }
]

export default {
  error,
  helpDialog
}
