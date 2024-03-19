const protoLoader = require('@grpc/proto-loader')
const path = require('path')
const fs = require('fs')

let template = `
---
title: Methods
order: 2
---

## Types

{{ types }}

## Methods

{{ methods }}`.trim()

const types = {
  TYPE_STRING: 'string',
  TYPE_BOOL: 'boolean',
  TYPE_INT32: 'number'
}

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
  let methodDocs = []
  let methods = { types: [] }
  for (let [method, service] of Object.entries(proto)) {
    if (service.type) {
      if (method.includes('Request') || method.includes('Response')) {
        const fields = service.type.field
          .filter(field => !['appId', 'key'].includes(field.name))
          .map(field => ({
            name: field.name,
            type:
              types[field.type] ||
              (field.typeName ? field.typeName : field.type),
            list: field.label === 'LABEL_REPEATED' ? true : false
          }))
        const toCamelCase = s => s[0].toLowerCase() + s.slice(1)
        methods[toCamelCase(method.replace('bag.', ''))] = { fields }
      } else {
        // Describes special message type
        const fields = service.type.field.map(field => ({
          name: field.name,
          type:
            types[field.type] || (field.typeName ? field.typeName : field.type),
          list: field.label === 'LABEL_REPEATED' ? true : false
        }))
        const toTitleCase = s => s[0].toUpperCase() + s.slice(1)
        methods.types.push({
          [toTitleCase(method.replace('bag.', ''))]: fields
        })
      }
    }
  }
  for (let [method, fields] of Object.entries(methods)) {
    if (method.endsWith('Response')) {
      // Attach to appropriate request
      method = method.replace('Response', '')
      methods[`${method}Request`] = {
        ...methods[`${method}Request`],
        response: fields.fields
      }

      // Now update template
      methodDocs.push(
        `
**<code style={{ margin: "1em 0", display: "block", width: "fit-content" }}>${method}</code>**

Arguments:

\`\`\`
${
  methods[`${method}Request`].fields.length
    ? methods[`${method}Request`].fields
        .map(field => `${field.name}: ${field.type}${field.list ? '[]' : ''}`)
        .join('\n')
    : 'No extra fields.'
}
\`\`\`

Returns:

\`\`\`gp
${methods[`${method}Request`].response
  .map(field => `${field.name}: ${field.type}${field.list ? '[]' : ''}`)
  .join('\n')}
\`\`\`
`.trim()
      )

      delete methods[`${method}Request`]
    } else if (method === 'types') {
      // Update type documentation
      for (let field of fields) {
        const type = Object.keys(field)[0]
        const properties = Object.values(field)[0]
        typeDocs.push(
          `**<code style={{ margin: "1em 0", display: "block", width: "fit-content" }}>${type}</code>**
    
Properties:

\`\`\`
${properties
  .map(field => `${field.name}: ${field.type}${field.list ? '[]' : ''}`)
  .join('\n')}
\`\`\`
`
        )
      }
    }
  }

  template = template.replace('{{ types }}', typeDocs.join('\n'))
  template = template.replace('{{ methods }}', methodDocs.join('\n'))
  fs.writeFile('content/client/methods.mdx', template, err => {
    if (err) throw new Error(err)
    console.log('Done writing API documentation')
  })
})()
