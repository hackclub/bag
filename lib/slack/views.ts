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

\`/item get <item>\`: Get info about an item.
\`/inventory me/@<person>\`: Check out your inventory, or view somebody else's!
\`/trade\`: Start a trade with someone else!
\`/give\`: Start a trade with someone else!

And of course, here is a list of things of things you can mention me for:

* \`help\`: Call me for help!
* \`me\`: Check out your inventory! This will list all public items. You can also list private items with \`me private\` instead.
* \`@<person>\`: Check out another Hack Clubber's inventory! This will list all their public items.`
    }
  }
]

export default {
  error,
  helpDialog
}
