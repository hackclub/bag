import type {
  Block,
  KnownBlock,
  PlainTextOption,
  View,
  ViewStateValue
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

const splitDropdown = (
  options: PlainTextOption[],
  initial_options: PlainTextOption[],
  element: {
    action_id: string
    type: 'multi_static_select' | 'static_select'
    placeholder: {
      type: 'plain_text'
      text: string
    }
  },
  extra: {
    label: {
      type: 'plain_text'
      text: string
    }
    optional?: boolean
  }
): (Block | KnownBlock)[] => {
  // Split dropdown with > 100 items into multiple dropdowns
  options = sortDropdown(options)
  let dropdowns: (Block | KnownBlock)[] = []
  let i = 0
  while (options.length) {
    i++
    if (options.length > 100) {
      const slice = options.splice(0, 100)
      const starting = initial_options.filter(option =>
        slice.find(possible => possible.value === option.value)
      )
      dropdowns.push({
        type: 'input',
        element: {
          ...{
            ...element,
            action_id: `${element.action_id}${i}`
          },
          options: slice,
          initial_options: starting.length ? starting : undefined
        },
        ...extra
      })
    } else {
      const starting = initial_options.filter(option =>
        options.find(possible => possible.value === option.value)
      )
      dropdowns.push({
        type: 'input',
        element: {
          ...{
            ...element,
            action_id: `${element.action_id}${i}`
          },
          options,
          initial_options: starting.length ? starting : undefined
        },
        ...extra,
        hint: {
          type: 'plain_text',
          text: `We've separated the dropdowns above into ${i} separate ones because of Slack's dropdown limits.`
        }
      })
      break
    }
  }
  return dropdowns
}

const readFields = (values: {
  [blockId: string]: {
    [actionId: string]: ViewStateValue
  }
}): any => {
  let fields = {}
  for (let field of Object.values(values)) {
    if (field[Object.keys(field)[0]].value === null) continue
    fields[Object.keys(field)[0]] =
      field[Object.keys(field)[0]]?.value ||
      Object.values(field)[0].selected_option?.value ||
      ''
    if (fields[Object.keys(field)[0]] === 'true')
      fields[Object.keys(field)[0]] = true
    else if (fields[Object.keys(field)[0]] === 'false')
      fields[Object.keys(field)[0]] = false
  }
  return fields
}

export default {
  error,
  helpDialog,
  loadingDialog,
  sortDropdown,
  splitDropdown,
  readFields
}
