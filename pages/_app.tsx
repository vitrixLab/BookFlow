import type { AppProps } from 'next/app'
import Head from 'next/head'
import Script from 'next/script'
import '../styles/globals.css'
import { NotificationProvider } from '../lib/notifications'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head> 
      <NotificationProvider>
        <Component {...pageProps} />
      </NotificationProvider>
    </>
  )
}