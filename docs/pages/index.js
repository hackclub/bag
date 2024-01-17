import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import fs from 'fs'
import path from 'path'
import { Container, Flex, Box } from 'theme-ui'
import Content, { Toc } from '@/components/Content'
import convertMDX, { generateToc } from '@/utils'
import 'highlight.js/styles/xcode.css'
import Menu from '@/components/Menu'

export default function Index({ source, toc }) {
  return (
    <Flex py={3} sx={{ justifyContent: 'center' }}>
      <Menu />
      <Container variant="copy" sx={{ border: '1px solid' }}>
        <Content>
          <MDXRemote {...source} />
        </Content>
      </Container>
      <Box sx={{ border: '1px solid' }}>
        <Toc>
          <MDXRemote {...toc} />
        </Toc>
      </Box>
    </Flex>
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
