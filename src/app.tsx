import { QueryClientProvider } from '@tanstack/react-query'
import { Box } from 'ink'
import { Provider } from 'jotai'
import { useEffect } from 'react'
import { Footer } from '~/components/footer'
import { useStdoutDimensions } from '~/hooks/use-stdout-dimensions'
import { ConfigManagerAtom, loginStatusAtom, store } from '~/store'
import { getProfile } from '~/utils/api'
import { queryClient } from '~/utils/query'
import { Pages } from './pages/index'

export function App() {
  const [width, height] = useStdoutDimensions()

  useEffect(() => {
    const configManager = store.get(ConfigManagerAtom)
    const auth = configManager.getConfig('auth')
    const saltkey = configManager.getConfig('saltkey')

    if (auth && saltkey) {
      // Silently validate credentials
      getProfile()
        .then(() => store.set(loginStatusAtom, 'active'))
        .catch(() => store.set(loginStatusAtom, 'expired'))
    }
    else {
      store.set(loginStatusAtom, 'inactive')
    }
  }, [])

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Box
          width={width}
          height={height}
          padding={1}
          flexDirection="column"
        >
          <Pages />
          <Footer />
        </Box>
      </QueryClientProvider>
    </Provider>

  )
}
