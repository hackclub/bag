import slack, { execute } from '../slack'

slack.command('/test', async props => {
  return await execute(props, async props => {
    return await props.respond('Not for you, sorry :/')
  })
})
