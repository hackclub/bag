import '@/styles/globals.css'
import Meta from '@hackclub/meta'
import theme from '@hackclub/theme'
import '@hackclub/theme/fonts/reg-bold.css'
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
          },
          blockquote: {
            borderLeft: '3px solid black',
            px: 3
          }
        }
      }}>
      <Meta as={Head} name="Hack Club" title="bag" color="#ec3750" />
      <Component {...pageProps} />
    </ThemeUIProvider>
  )
}
