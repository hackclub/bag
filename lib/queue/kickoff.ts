import config from '../../config'
import { Scheduler, ms } from './queue'
import { App } from '@hackclub/bag'

export const scheduler = Scheduler(
  'kickoff',
  ms(1),
  async ({ slack, day }: { slack: string; day: number }) => {
    const app = await App.connect({
      appId: config.APP_ID,
      key: config.APP_KEY,
      baseUrl:
        config.NODE_ENV === 'development' ? 'http://0.0.0.0:3000' : undefined
    })

    // Get all common items
    const items = (
      await app.getItems({
        query: JSON.stringify({})
      })
    ).filter(item => {
      if (item.metadata.rarity >= 0.4) return true
      return false
    })

    day++

    for (let item of items.sort((a, b) => (Math.random() < 0.5 ? 1 : -1))) {
      const prob = Math.random()
      if (prob < item.metadata.rarity) {
        let note
        switch (day) {
          case 2:
            note = `The old man appears again, kicking up dust as he shuffles down the road. He carefully places ${item.reaction} on your doorstep. You are suddently overcome with the urge to type \`/item ${item.name}\` to learn about this curious object.`
            break
          case 3:
            note = `This time the old man is tap-dancing. He executes a perfect one-armed handstand on your doorstep, and ${item.reaction} falls out of his pocket. What a strange person. He moonwalks away, screaming at the top of his lungs: "You can trade! Use the \`/trade\` command! This is a very important skill!!!"`
            break
          case 4:
            note = `The old man is back. He seems a little less spry this time, huffing and puffing between skips and jumps. He drops ${item.reaction} outside your door, darts away gleefully, and shouts "The \`/give\` command lets you give stuff! Isn't that neat?? Get out there and do some altruism!" You are filled with the desire to do an altruistic act.`
            break
          case 5:
            note = `The mysterious figure appears on the horizon once again, groaning and holding his back. He lies down in front of your door, sobbing, clutching ${item.reaction} in his gnarled hands. He leaves it behind, wailing, "I just want people to use the four sacred commands... \`/bag\`, \`/item\`, \`/trade\`, \`/give\`... why can't people just understand that?" Your pity for the man compels you to try these strange commands for yourself.`
        }

        await app.createInstance({
          itemId: item.name,
          identityId: slack,
          quantity: 1,
          note
        })
        break
      }
    }

    return true
  },
  async ({ slack, day }: { slack: string; day: number }) => {
    if (day !== 5) {
      scheduler.schedule(
        {
          slack,
          day
        },
        new Date().getTime() + ms(24)
      )
    }
  }
)

scheduler.start()

export async function kickoff(slack: string) {
  const app = await App.connect({
    appId: config.APP_ID,
    key: config.APP_KEY
  })

  // Get all common items
  const items = (
    await app.getItems({
      query: JSON.stringify({})
    })
  ).filter(item => {
    if (item.metadata.rarity >= 0.4) return true
    return false
  })

  let instances = []
  for (let item of items.sort((a, b) => (Math.random() < 0.5 ? 1 : -1))) {
    const prob = Math.random()
    if (prob < item.metadata.rarity) {
      // Give it to them!
      instances.push({
        itemId: item.name,
        identityId: slack,
        quantity: 1
      })
      if (instances.length === 3) break
    }
  }

  console.log(
    'Kickoff: ',
    await app.createInstances({
      instances,
      identityId: slack,
      show: false,
      note: 'An mysterious old man comes by your home with a jaunty stroll, whistling as he goes. He throws a bag at your door, which bounces off and lands on your doorstep. You pick the bag up, feeling three objects inside. Some instructions are printed on the outside: *This is your bag. Use `/bag` to see what it holds.*'
    })
  )

  scheduler.schedule(
    {
      slack,
      day: 1
    },
    new Date().getTime() + ms(24)
  )
}
