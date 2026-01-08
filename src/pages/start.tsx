import process from 'node:process'
import { Box, Text } from 'ink'
import BigText from 'ink-big-text'
import SelectInput from 'ink-select-input'
import { useSetAtom } from 'jotai'
import { currentPageAtom } from '~/store'
import pkg from '../../package.json'

export function Start() {
  const setCurrentPage = useSetAtom(currentPageAtom)

  const handleSelect = async (item: { label: string, value: string }) => {
    if (item.value === 'enter') {
      setCurrentPage('home')
    }
    else if (item.value === 'login') {
      setCurrentPage('login')
    }
    else if (item.value === 'exit') {
      process.exit(0)
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
      <BigText
        text="YAMIBO"
        font="block"
        colors={['yellow', 'red', 'blue', 'magenta', 'cyan', 'white']}
      />
      <Text color="gray" dimColor>
        v
        {pkg.version}
      </Text>
      <Box marginLeft={-2} marginTop={1}>
        <SelectInput
          items={[
            { label: '进入', value: 'enter' },
            { label: '登录', value: 'login' },
            { label: '退出', value: 'exit' },
          ]}
          onSelect={handleSelect}
        />
      </Box>
    </Box>
  )
}
