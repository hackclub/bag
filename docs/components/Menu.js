import { Box, Container, Flex, Link } from 'theme-ui'
import Content from './Content'

export default function Menu({ menu, headers }) {
  return (
    <Flex
      sx={{
        alignItems: 'flex-end',
        flexDirection: 'column',
        position: { md: 'sticky' },
        top: 0
      }}
      px={3}
      pt={4}>
      <h1>💰 Bag</h1>
      {headers.map(title => (
        <Flex
          key={title}
          sx={{ flexDirection: 'column', alignItems: 'flex-end' }}>
          <h2 style={{ marginBottom: '0 !important' }}>{title}</h2>
          {menu[title].map(([link, title]) => (
            <p style={{ margin: '0 !important', textAlign: 'right' }}>
              <Link color="primary" href={`/${link}`}>
                {title}
              </Link>
            </p>
          ))}
        </Flex>
      ))}
    </Flex>
  )
}
