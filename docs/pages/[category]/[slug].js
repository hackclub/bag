import Content from '@/components/Content'
import Menu from '@/components/Menu'
import fs from 'fs'
import matter from 'gray-matter'
import 'highlight.js/styles/xcode.css'
import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import path from 'path'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkToc from 'remark-toc'
import { Grid, Box } from 'theme-ui'

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

export default function Doc({ source, toc, title, menu, menuHeaders }) {
  return (
    <Grid
      sx={{ bg: 'snow', position: 'relative', alignItems: 'flex-start' }}
      columns={['', '2fr 4fr', '2fr 4fr', '2fr 6fr 1fr']}>
      {menu && menuHeaders && <Menu menu={menu} headers={menuHeaders} />}
      <Box
        sx={{
          bg: 'white',
          borderLeft: '1px solid',
          borderRight: '1px solid',
          borderColor: 'border',
          boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.1)',
          paddingTop: [4, 0],
          minHeight: '100vh'
        }}
        p={[3, 4]}>
        <Content>
          <h1>{title}</h1>
          {source && <MDXRemote {...source} />}
        </Content>
      </Box>
    </Grid>
  )
}

export async function getStaticProps({ params }) {
  async function generateToc(content) {
    const headings = [
      '## Table of contents',
      ...content.split('\n').filter(x => /^[#]{1,6} /.test(x))
    ].join('\n')
    const toc = String(await remark().use(remarkToc).process(headings))
    return toc
      .split('\n')
      .filter(x => !x.startsWith('#'))
      .join('\n')
  }

  const res = fs.readFileSync(
    path.join('content', params.category, params.slug),
    'utf-8'
  )
  const menu = fs
    .readdirSync('content', { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
  let gen = {}
  let pageTitle
  for (let title of menu) {
    let push = []
    let files = fs.readdirSync(path.join('content', title))
    for (let file of files) {
      const content = fs.readFileSync(path.join('content', title, file))
      const frontmatter = matter(content).data
      push.push([`${title}/${file}`, frontmatter.title, frontmatter.order])
      if (file === params.slug) pageTitle = frontmatter.title
    }
    push = push.sort((a, b) => {
      if (a[2] < b[2]) return -1
      return 1
    })
    gen[toTitleCase(title)] = push
  }
  return {
    props: {
      source: await serialize(res, {
        mdxOptions: { remarkGfm },
        parseFrontmatter: true
      }),
      title: pageTitle,
      toc: await serialize(await generateToc(res)),
      menu: gen,
      menuHeaders: ['Quickstart', 'Client']
    }
  }
}

export async function getStaticPaths() {
  const menu = fs
    .readdirSync('content', { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
  let push = []
  for (let title of menu) {
    let files = fs.readdirSync(path.join('content', title))
    push.push(...files.map(file => ({ title, file })))
  }
  return {
    paths: push.map(file => ({
      params: { category: file.title, slug: file.file }
    })),
    fallback: true
  }
}
