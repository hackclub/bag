import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import fs from 'fs'
import path from 'path'
import { Container, Grid, Box, Flex } from 'theme-ui'
import Content, { Toc } from '@/components/Content'
import convertMDX, { generateToc } from '@/utils'
import 'highlight.js/styles/xcode.css'
import Menu from '@/components/Menu'
import matter from 'gray-matter'

export default function Doc({ source, toc, menu, menuHeaders }) {
  return (
    <Grid
      sx={{ bg: 'snow', position: 'relative', alignItems: 'flex-start' }}
      columns={['', '2fr 4fr', '2fr 4fr', '2fr 6fr 2fr']}>
      <Menu menu={menu} headers={menuHeaders} />
      <Box
        sx={{
          bg: 'white',
          borderLeft: '1px solid',
          borderRight: '1px solid',
          borderColor: 'border',
          boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.1)',
          paddingTop: [4, 0]
        }}
        p={[3, 4]}>
        <Content>
          <MDXRemote {...source} />
        </Content>
      </Box>
    </Grid>
  )
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

export async function getStaticProps({ params }) {
  const res = fs.readFileSync(
    path.join(process.cwd(), 'content', params.category, params.slug)
  )
  let menu = fs
    .readdirSync(path.join(process.cwd(), 'content'), { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => {
      return dirent.name
    })
  let gen = {}
  for (let title of menu) {
    let push = []
    let files = fs.readdirSync(path.join(process.cwd(), 'content', title))
    for (let file of files) {
      const content = fs.readFileSync(
        path.join(process.cwd(), 'content', title, file)
      )
      push.push([`${title}/${file}`, matter(content).data.title])
    }
    push = push.sort((a, b) => {
      if (a[2] < b[2]) return -1
      return 1
    })
    gen[toTitleCase(title)] = push
  }
  return {
    props: {
      source: await convertMDX(res),
      toc: await serialize(await generateToc(res.toString())),
      menu: gen,
      menuHeaders: ['Quickstart', 'Bot', 'Client']
    }
  }
}

export async function getStaticPaths() {
  let menu = fs
    .readdirSync(path.join(process.cwd(), 'content'), { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => {
      return dirent.name
    })
  let push = []
  for (let title of menu) {
    let files = fs.readdirSync(path.join(process.cwd(), 'content', title))
    push.push(...files.map(file => ({ title, file })))
  }
  return {
    paths: push.map(file => ({
      params: { category: file.title, slug: file.file }
    })),
    fallback: true
  }
}
