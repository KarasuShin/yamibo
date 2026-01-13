import type { SelectItem } from '~/components/select-view'
import type { ForumCategoryItem } from '~/utils/api'
import { useQuery } from '@tanstack/react-query'
import { Box, Text, useInput } from 'ink'
import { useAtom, useSetAtom } from 'jotai'
import { useMemo } from 'react'
import { SelectView } from '~/components/select-view'
import { useStdoutDimensions } from '~/hooks/use-stdout-dimensions'
import { currentPageAtom, homeStateAtom, threadListStateAtom } from '~/store'
import { getForumCategories } from '~/utils/api'

interface ForumSelectItem extends SelectItem {
  fid?: string
  forumName?: string
}

export function Home() {
  const setCurrentPage = useSetAtom(currentPageAtom)
  const setThreadListState = useSetAtom(threadListStateAtom)
  const [homeState, setHomeState] = useAtom(homeStateAtom)

  const [, height] = useStdoutDimensions()
  const query = useQuery({
    queryKey: ['forum-categories'],
    queryFn: getForumCategories,
  })

  const items = useMemo(() => {
    if (!query.data)
      return []

    const result: ForumSelectItem[] = []

    query.data.forEach((category: ForumCategoryItem) => {
      result.push({
        label: `━━ ${category.title} ━━`,
        value: `category-${category.id}`,
        selectable: false,
      })

      category.children.forEach((forum) => {
        if (forum.id && forum.title) {
          result.push({
            label: `  ${forum.title}`,
            value: forum.id,
            fid: forum.id,
            forumName: forum.title,
            selectable: true,
          })
        }
      })
    })

    return result
  }, [query.data])

  const handleSelect = (item: ForumSelectItem) => {
    if (item.value.startsWith('category-'))
      return

    if (item.fid && item.forumName) {
      setCurrentPage('thread-list')
      setThreadListState({
        fid: item.fid,
        defaultFid: item.fid,
        forumName: item.forumName,
        pagination: { current: 1, total: 1 },
        tid: '',
        focusMode: 'thread',
        subForm: null,
        subForumIndex: 0,
      })
    }
  }

  const selectedIndex = useMemo(() => {
    if (homeState?.fid) {
      const index = items.findIndex(item => item.fid === homeState.fid)
      if (index >= 0)
        return index
    }

    const firstSelectableIndex = items.findIndex(item => item.fid)
    return firstSelectableIndex >= 0 ? firstSelectableIndex : 0
  }, [items, homeState?.fid])

  useInput((_, key) => {
    if (key.escape) {
      setCurrentPage('start')
    }
  })

  if (query.isLoading) {
    return (
      <Box height="100%" width="100%" justifyContent="center" alignItems="center">
        <Text>加载中...</Text>
      </Box>
    )
  }

  if (query.isError) {
    return (
      <Box height="100%" width="100%" justifyContent="center" alignItems="center" flexDirection="column">
        <Text color="red">加载失败</Text>
        <Text dimColor>{String(query.error)}</Text>
      </Box>
    )
  }

  const onSelectChange = (item: ForumSelectItem) => {
    if (item.fid) {
      setHomeState({ fid: item.fid })
    }
  }

  return (
    <Box width="100%" height="100%" flexDirection="column">
      <Box paddingX={1} paddingTop={1} marginBottom={1}>
        <Text bold color="cyan">
          📋 版块列表
        </Text>
      </Box>
      <Box paddingX={1}>
        <SelectView
          items={items}
          onSelect={handleSelect}
          limit={Math.max(5, height - 7)}
          selectedIndex={selectedIndex}
          onChange={onSelectChange}
        />
      </Box>
    </Box>
  )
}
