import { serialize } from 'next-mdx-remote/serialize'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import { remark } from 'remark'
import remarkToc from 'remark-toc'

export async function generateToc(content) {
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

export default async function convertMDX(content) {
  return await serialize(content, {
    mdxOptions: {
      rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings, rehypeHighlight]
    },
    parseFrontmatter: false
  })
}
