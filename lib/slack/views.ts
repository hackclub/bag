import {
  Block,
  KnownBlock,
  PlainTextOption,
  View,
  directMention
} from '@slack/bolt'

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

\`/item <item>\`: Get info about an item.
\`/bag me/@<person>\`: Check out your bag, or view somebody else's!
\`/trade @<person>\`: Start a trade with someone else!
\`/give @<person>\`: Start a trade with someone else!

And of course, here is a list of things of things you can mention me for:

* \`me\`: Check out your bag! This will list all your public items.
* \`@<person>\`: Check out another Hack Clubber's bag! This will list all their public items.`
    }
  }
]

const loadingDialog = (title: string): View => {
  return {
    type: 'modal',
    title: {
      type: 'plain_text',
      text: title
    },
    close: {
      type: 'plain_text',
      text: 'Cancel'
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: ':spin-loading: Loading...'
        }
      }
    ]
  }
}

const sortDropdown = (
  dropdown: PlainTextOption[],
  func?: (a: PlainTextOption, b: PlainTextOption) => number
): PlainTextOption[] => {
  // Sort dropdowns that show items
  if (func) return dropdown.sort(func)
  return dropdown.sort((a, b) => {
    const aSplit = a.text.text.trim().split(' ')
    const bSplit = b.text.text.trim().split(' ')
    return aSplit.slice(1).join(' ').localeCompare(bSplit.slice(1).join(' '))
  })
}

export default {
  error,
  helpDialog,
  loadingDialog,
  sortDropdown
}
