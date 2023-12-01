import { View } from '@slack/bolt'

const createItem: View = {
  callback_id: 'create',
  title: {
    type: 'plain_text',
    text: 'Craft item'
  },
  submit: {
    type: 'plain_text',
    text: 'Craft item'
  },
  type: 'modal',
  blocks: [
    {
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'name',
        placeholder: {
          type: 'plain_text',
          text: 'Name of item'
        }
      },
      label: {
        type: 'plain_text',
        text: 'Name',
        emoji: true
      }
    },
    {
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'image',
        placeholder: {
          type: 'plain_text',
          text: 'Link to image'
        }
      },
      label: {
        type: 'plain_text',
        text: 'Image',
        emoji: true
      }
    },
    {
      type: 'input',
      optional: true,
      element: {
        type: 'plain_text_input',
        multiline: true,
        action_id: 'description',
        placeholder: {
          type: 'plain_text',
          text: "What's up with this item?"
        }
      },
      label: {
        type: 'plain_text',
        text: 'Description',
        emoji: true
      }
    }
  ]
}

export default {
  createItem
}
