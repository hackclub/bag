import '@/styles/globals.css'
import '@hackclub/theme/fonts/reg-bold.css'
import theme from '@hackclub/theme'
import Meta from '@hackclub/meta'
import Head from 'next/head'
import { ThemeUIProvider } from 'theme-ui'

export default function App({ Component, pageProps }) {
  return (
    <ThemeUIProvider
      theme={{
        ...theme,
        colors: { ...theme.colors, modes: {} },
        styles: {
          ...theme.styles,
          code: {
            fontFamily: 'monospace',
            fontSize: 'inherit',
            color: 'black',
            bg: 'sunken',
            borderRadius: 'small',
            mx: 1,
            px: 1
          }
        }
      }}>
      <Meta
        as={Head}
        name="Hack Club"
        title="bag"
        description="TODO"
        color="#ec3750"
      />
      <Component {...pageProps} />
    </ThemeUIProvider>
  )
}
