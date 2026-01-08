import { Box, Text, useInput } from 'ink'
import { useEffect, useRef } from 'react'
import { useSetState } from '~/hooks/use-set-state'

interface Props {
  current: number
  total: number
  onPageChange: (page: number) => void
  debounceMs?: number
}

export function Pagination({ current, total, onPageChange, debounceMs = 300 }: Props) {
  const displayPage = useSetState(current)
  const onPageChangeRef = useRef(onPageChange)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    onPageChangeRef.current = onPageChange
  }, [onPageChange])

  useEffect(() => {
    displayPage.setState(current)
  }, [current])

  const handlePageChange = (newPage: number) => {
    displayPage.setState(newPage)

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      onPageChangeRef.current(newPage)
    }, debounceMs)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  useInput((input, key) => {
    if (key.leftArrow) {
      if (displayPage.state === 1)
        return
      handlePageChange(displayPage.state - 1)
    }
    else if (key.rightArrow) {
      if (displayPage.state === total)
        return
      handlePageChange(displayPage.state + 1)
    }
  })

  return (
    <Box paddingX={1} flexDirection="column">
      <Text dimColor>
        第
        {' '}
        {displayPage.state}
        {' '}
        页 / 共
        {' '}
        {total}
        {' '}
        页
      </Text>
    </Box>
  )
}
