import { Box, Text } from 'ink'
import SelectInput from 'ink-select-input'
import { useSetAtom } from 'jotai'
import { currentPageAtom } from '~/store'

export function Expired() {
  const setCurrentPage = useSetAtom(currentPageAtom)

  const handleSelect = (item: { label: string, value: string }) => {
    if (item.value === 'home') {
      setCurrentPage('home')
    }
    else if (item.value === 'login') {
      setCurrentPage('login')
    }
  }

  return (
    <Box
      height="100%"
      width="100%"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      flexGrow={1}
    >
      <Box marginBottom={2}>
        <Text bold color="red">
          ⚠️  登录已过期
        </Text>
      </Box>
      <SelectInput
        items={[
          { label: '重新登录', value: 'login' },
        ]}
        onSelect={handleSelect}
      />
    </Box>
  )
}
