import { useMutation, useQuery } from '@tanstack/react-query'
import { Box, Text, useInput } from 'ink'
import { useAtom, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { SelectView } from '~/components/select-view'
import { useSetState } from '~/hooks/use-set-state'
import { ConfigManagerAtom, currentPageAtom, loginStateAtom, loginStatusAtom, store } from '~/store'
import { getProfile, login } from '~/utils/api'
import { queryClient } from '~/utils/query'

type FocusField = 'username' | 'password'

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Box
      height="100%"
      width="100%"
      justifyContent="center"
      alignItems="center"
      flexGrow={1}
      flexDirection="column"
    >
      {children}
    </Box>
  )
}

export function Login() {
  const username = useSetState('')
  const password = useSetState('')
  const focusField = useSetState<FocusField>('username')
  const setCurrentPage = useSetAtom(currentPageAtom)
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })
  const profile = profileQuery.data
  const [loginState, setLoginState] = useAtom(loginStateAtom)

  const loadingMutation = useMutation({
    mutationFn: () => login(username.state, password.state),
    onError: (error) => {
      if (error instanceof Error) {
        setLoginState({ errorText: error.message })
      }
    },
  })

  useInput(async (input, key) => {
    if (key.escape) {
      setCurrentPage('start')
      return
    }

    if (loginState?.errorText && key.return) {
      setCurrentPage('start')
      return
    }

    if (!profile && key.return) {
      loadingMutation.mutate()
      return
    }

    if (key.tab || key.upArrow || key.downArrow) {
      focusField.setState(focusField.state === 'username' ? 'password' : 'username')
      return
    }

    if (key.backspace || key.delete) {
      if (focusField.state === 'username') {
        username.setState(prev => prev.slice(0, -1))
      }
      else {
        password.setState(prev => prev.slice(0, -1))
      }
      return
    }

    if (input && !key.ctrl && !key.meta) {
      if (focusField.state === 'username') {
        username.setState(prev => prev + input)
      }
      else {
        password.setState(prev => prev + input)
      }
    }
  })

  useEffect(() => {
    return () => {
      setLoginState(null)
    }
  }, [])

  const displayUsername = username.state.length > 20
    ? username.state.slice(-20)
    : username.state.padEnd(20, ' ')
  const displayPassword = password.state.length > 20
    ? password.state.slice(-20).replace(/./g, '*')
    : password.state.replace(/./g, '*').padEnd(20, ' ')

  if (loadingMutation.isPending || profileQuery.isPending) {
    return (
      <PageWrapper>
        <Text>登录中...</Text>
      </PageWrapper>
    )
  }

  if (loginState?.errorText) {
    return (
      <PageWrapper>
        <Text color="red">{loginState.errorText}</Text>
      </PageWrapper>
    )
  }

  if (profile) {
    return (
      <PageWrapper>
        <Box flexDirection="column" alignItems="center">
          <Text bold color="cyan">
            {profile.username}
          </Text>
          <Text color="gray">
            用户组:
            {' '}
            <Text color="yellow">{profile.group}</Text>
          </Text>
        </Box>
        <Box gap={1}>
          <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1}>
            <Text>
              在线时长:
              <Text color="green">{profile.onlineTime}</Text>
            </Text>
            <Text>
              积分:
              <Text color="green">{profile.score}</Text>
            </Text>
            <Text>
              对象:
              <Text color="green">{profile.couple}</Text>
            </Text>
            <Text>
              已用空间:
              <Text color="green">{profile.storage}</Text>
            </Text>
          </Box>
          <Box flexDirection="column" borderStyle="round" borderColor="blue" paddingX={1}>
            <Text bold color="blue">
              最近访问时间
            </Text>
            <Text>{profile.lastLoginTime}</Text>
            <Text bold color="blue">
              最近访问IP
            </Text>
            <Text>{profile.lastLoginIP}</Text>
          </Box>

          <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={1}>
            <Text bold color="magenta">
              注册时间
            </Text>
            <Text>{profile.registerTime}</Text>
            <Text bold color="magenta">
              注册IP
            </Text>
            <Text>{profile.registerIP}</Text>
          </Box>
        </Box>
        <SelectView
          items={[
            { label: '退出登录', value: 'logout' },
          ]}
          onSelect={() => {
            const configManager = store.get(ConfigManagerAtom)
            configManager.setConfig('auth', '')
            configManager.setConfig('saltkey', '')
            queryClient.removeQueries({ queryKey: ['profile'] })
            store.set(loginStatusAtom, 'inactive')
            setCurrentPage('start')
          }}
          onChange={() => {}}
          selectedIndex={0}
        />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <Box marginBottom={1} alignItems="center">
        <Box marginRight={1}>
          <Text color={focusField.state === 'username' ? 'green' : undefined}>
            用户名:
          </Text>
        </Box>
        <Box width={22} height={3} borderStyle="single" borderColor={focusField.state === 'username' ? 'green' : 'gray'} overflow="hidden">
          <Text>{displayUsername}</Text>
        </Box>
      </Box>

      <Box marginBottom={2} alignItems="center">
        <Box marginRight={1}>
          <Text color={focusField.state === 'password' ? 'green' : undefined}>
            密码:
          </Text>
        </Box>
        <Box marginLeft={2} width={22} height={3} borderStyle="single" borderColor={focusField.state === 'password' ? 'green' : 'gray'} overflow="hidden">
          <Text>{displayPassword}</Text>
        </Box>
      </Box>
    </PageWrapper>
  )
}
