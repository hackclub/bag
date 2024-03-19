const protoLoader = require('@grpc/proto-loader')
const path = require('path')
const fs = require('fs')

let template = `---
title: Methods
order: 2
---

## Types

{{ types }}

## Methods 

{{ methods }}
`

const protoLoad = async location =>
  new Promise((resolve, reject) =>
    protoLoader
      .load(location)
      .then(packageDefinition => resolve(packageDefinition))
  )

;(async () => {
  const proto = await protoLoad(
    path.join(process.cwd(), '..', 'proto/bag.proto')
  )

  let typeDocs = []
  let methodsDocs = []
  let methods = { types: [] }
  for (let [method, service] of Object.entries(proto)) {
    if (service.type) {
      if (method.includes('Request') || method.includes('Response')) {
        const fields = service.type.field.map(field => ({
          name: field.name,
          type: field.type
        }))
        const toCamelCase = s => s[0].toLowerCase() + s.slice(1)
        methods[toCamelCase(method.replace('bag.', ''))] = { fields }
      } else {
        // Describes special message type
        const toTitleCase = s => s[0].toUpperCase() + s.slice(1)
        const fields = service.type.field.map(field => ({
          name: field.name,
          type: field.type
        }))
        methods.types.push({
          [toTitleCase(method.replace('bag.', ''))]: fields
        })
      }
    }
  }
  for (let [method, fields] of Object.entries(methods)) {
    if (method.endsWith('Response')) {
      // Attach to appropriate request
      delete methods[method]
      method = method.replace('Response', '')
      methods[method] = {
        ...methods[`${method}Request`],
        response: fields.fields
      }

      // Now update template
      methodsDocs.push(`### \`${method}\`\n\nReturns\n`)

      console.log(methods[method])

      delete methods[`${method}Request`]
    } else if (method === 'types') {
      // Update type documentation
      methods
    }
  }

  template = template.replace('{{ types }}', 'TODO')
  template = template.replace('{{ methods }}', methodsDocs.join('\n'))
  fs.writeFile('content/client/methods.mdx', template, err => {
    if (err) throw new Error(err)
    console.log('Done writing API documentation')
  })
})()
