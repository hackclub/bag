// Easter Egg app
import { createPromiseClient } from '@connectrpc/connect'
import { ElizaService } from '../gen/proto/eliza_connect'
import { subtype } from '@slack/bolt'

const transport = createConnectTrans

// Must pass in key somewhere that defines permission
// In our case, the easter egg bot should have the permission to give away a specific instance and also be able to read info, but not edit anything else
const client = createPromiseClient(ElizaService)

client.addSlackAction('message', subtype('message_me'), ({ event, logger }) => {
  /*
    if (event.channelId == channelId("#baggie") && event.message == "Hello world!") {
      award(Items.find("(id of easter egg)"))
      logToChannel("Hm... it's an egg, I wonder what it'll hatch into?")
    }
   */
})
