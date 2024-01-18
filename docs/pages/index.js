import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote } from 'next-mdx-remote'
import fs from 'fs'
import path from 'path'
import { Container, Grid, Box } from 'theme-ui'
import Content, { Toc } from '@/components/Content'
import convertMDX, { generateToc } from '@/utils'
import 'highlight.js/styles/xcode.css'
import Menu from '@/components/Menu'

export default function Index({ source, toc }) {
  return (
    <Grid columns={[1, 2, 1]}>
      <Menu />
      <Container variant="copy">
        <Content>
          <MDXRemote {...source} />
        </Content>
      </Container>
      <Box>
        <Toc>
          <MDXRemote {...toc} />
        </Toc>
      </Box>
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