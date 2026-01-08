import { Box, Text } from 'ink'
import { useAtom, useAtomValue } from 'jotai'
import { useMemo } from 'react'
import { currentPageAtom, loginStateAtom, loginStatusAtom, threadDetailStateAtom } from '~/store'
import { queryClient } from '~/utils/query'
import { ThreadDetailPagination } from './thread-detail-pagination'
import { ThreadListPagination } from './thread-list-pagination'

export function Footer() {
  const [currentPage] = useAtom(currentPageAtom)
  const threadDetailState = useAtomValue(threadDetailStateAtom)
  const loginStatus = useAtomValue(loginStatusAtom)
  const profile = queryClient.getQueryData(['profile'])
  const loginState = useAtomValue(loginStateAtom)

  const threadDetailHelpText = useMemo(() => {
    return `${!threadDetailState?.detailMode ? '[r] 刷新 ' : ''}[←→] 翻页 [↑↓] 滚动 [Esc] 返回`
  }, [threadDetailState?.detailMode])

  const loginHelpText = useMemo(() => {
    if (loginState?.errorText) {
      return '[Esc/Enter] 返回'
    }
    if (profile) {
      return '[Enter] 登录 [Esc] 返回'
    }
    return '[Tab/↑↓] 切换 [Enter] 登录 [Esc] 返回'
  }, [profile, loginState?.errorText])

  const helpText = useMemo(() => {
    switch (currentPage) {
      case 'home':
        return '[↑↓] 导航 [Enter] 进入版块 [Esc] 退出'
      case 'thread-list':
        return '[r] 刷新 [←→] 翻页 [↑↓] 导航 [Enter] 查看 [Esc] 返回'
      case 'thread-detail':
        return threadDetailHelpText
      case 'start':
        return '[Enter] 选择'
      case 'login':
        return loginHelpText
      default:
        return ''
    }
  }, [currentPage, threadDetailHelpText, loginHelpText])

  const loginStatusText = useMemo(() => {
    switch (loginStatus) {
      case 'active':
        return '已登录'
      case 'inactive':
        return '未登录'
      case 'expired':
        return '已过期'
      default:
        return '未登录'
    }
  }, [loginStatus])

  const loginStatusColor = useMemo(() => {
    switch (loginStatus) {
      case 'active':
        return 'green'
      case 'inactive':
        return 'gray'
      case 'expired':
        return 'red'
      default:
        return 'gray'
    }
  }, [loginStatus])

  return (
    <Box flexDirection="row" justifyContent="space-between">
      <Box gap={1} flexDirection="row" alignItems="center">
        {currentPage === 'thread-list' && <ThreadListPagination />}
        {currentPage === 'thread-detail' && <ThreadDetailPagination />}
        <Text color={loginStatusColor}>{loginStatusText}</Text>
      </Box>
      <Box gap={1} flexDirection="row" alignItems="center">
        <Text dimColor>{helpText}</Text>
      </Box>
    </Box>
  )
}
