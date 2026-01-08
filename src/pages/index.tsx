import { useQuery } from '@tanstack/react-query'
import { Box } from 'ink'
import { useAtomValue } from 'jotai'
import { currentPageAtom } from '~/store'
import { getProfile } from '~/utils/api'
import { Expired } from './expired'
import { Home } from './home'
import { Login } from './login'
import { Start } from './start'
import { ThreadDetail } from './thread-detail'
import { ThreadList } from './thread-list'

export function Pages() {
  const currentPage = useAtomValue(currentPageAtom)

  useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  return (
    <Box flexGrow={1} width="100%">
      {currentPage === 'start' && <Start />}
      {currentPage === 'home' && <Home />}
      {currentPage === 'login' && <Login />}
      {currentPage === 'thread-list' && <ThreadList />}
      {currentPage === 'thread-detail' && <ThreadDetail />}
      {currentPage === 'expired' && <Expired />}
    </Box>
  )
}
