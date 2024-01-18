import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import fs from 'fs'
import path from 'path'
import { Container, Grid, Box, Flex } from 'theme-ui'
import Content, { Toc } from '@/components/Content'
import convertMDX, { generateToc } from '@/utils'
import 'highlight.js/styles/xcode.css'
import Menu from '@/components/Menu'

export default function Index({ source, toc }) {
  return (
    <Grid columns={['2fr 6fr 2fr']}>
      <Menu />
      <Box
        sx={{
          borderLeft: '1px solid',
          borderRight: '1px solid',
          borderColor: 'border',
          boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.1)'
        }}
        p={4}>
        <Content>
          <MDXRemote {...source} />
        </Content>
      </Box>
      <Flex sx={{ border: '1px solid' }}>
        <Toc>
          <MDXRemote {...toc} />
        </Toc>
      </Flex>
    </Grid>
  )
}

export async function getStaticProps() {
  const res = fs.readFileSync(path.join(process.cwd(), 'content/main.mdx'))
  return {
    props: {
      source: await convertMDX(res),
      toc: await serialize(await generateToc(res.toString()))
    }
  }
}
