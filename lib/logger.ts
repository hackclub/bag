export const err = (...text: any[]) => {
  text = text.map(arg => arg.toString())
  console.error(`[INVENTORY] (err) ${text.join('')}`)
}

export const log = (...text: any[]) => {
  text = text.map(arg => arg.toString())
  console.log(`[INVENTORY] (log) ${text.join('')}`)
}
