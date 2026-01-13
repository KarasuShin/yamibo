import type { SelectItem } from '~/components/select-view'
import { useQuery } from '@tanstack/react-query'
import { Box, Text, useInput } from 'ink'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useMemo } from 'react'
import { SelectView } from '~/components/select-view'
import { useStdoutDimensions } from '~/hooks/use-stdout-dimensions'
import { currentPageAtom, store, threadDetailStateAtom, threadListStateAtom } from '~/store'
import { getThreadList } from '~/utils/api'
import { queryClient } from '~/utils/query'
import { sw } from '~/utils/sw'

export function ThreadList() {
  const threadListState = useAtomValue(threadListStateAtom)!
  const setThreadListState = useSetAtom(threadListStateAtom)
  const setThreadDetailState = useSetAtom(threadDetailStateAtom)
  const [width, height] = useStdoutDimensions()

  const query = useQuery({
    queryKey: ['thread-list', threadListState.fid, threadListState.pagination.current],
    queryFn: () => getThreadList(threadListState.fid, threadListState.pagination.current),
  })

  useEffect(() => {
    if (query.data?.pagination.totalPages) {
      setThreadListState({
        ...threadListState,
        pagination: {
          ...threadListState.pagination,
          total: query.data.pagination.totalPages,
        },
      })
    }
  }, [query.data?.pagination.totalPages])

  useEffect(() => {
    if (!threadListState.subForm && query.data?.subForum) {
      setThreadListState(state => ({
        ...state!,
        subForm: query.data.subForum,
      }))
    }
  }, [query.data?.subForum])

  const subForums = useMemo(() => {
    const forums = threadListState.subForm
    if (forums?.length) {
      return [{
        title: '全部',
        fid: threadListState.defaultFid,
      }, ...forums]
    }
    return []
  }, [threadListState.subForm])

  useInput((input, key) => {
    if (key.escape) {
      store.set(threadListStateAtom, null)
      store.set(currentPageAtom, 'home')
    }
    else if (key.tab) {
      if (subForums.length > 0) {
        setThreadListState(state => ({
          ...state!,
          focusMode: state!.focusMode === 'thread' ? 'subforum' : 'thread',
        }))
      }
    }
    else if (threadListState.focusMode === 'subforum') {
      if (key.leftArrow || key.upArrow) {
        setThreadListState(state => ({
          ...state!,
          subForumIndex: Math.max(0, state!.subForumIndex - 1),
        }))
      }
      else if (key.rightArrow || key.downArrow) {
        setThreadListState(state => ({
          ...state!,
          subForumIndex: Math.min(subForums.length - 1, state!.subForumIndex + 1),
        }))
      }
      else if (key.return) {
        const target = subForums[threadListState.subForumIndex]
        if (target) {
          setThreadListState({
            ...threadListState,
            fid: target.fid,
            pagination: { ...threadListState.pagination, current: 1 },
            focusMode: 'thread',
          })
        }
      }
    }
    else if (input === 'r') {
      queryClient.removeQueries({
        queryKey: ['thread-list', threadListState.fid],
      })
      query.refetch()
    }
  })

  const items = useMemo(() => {
    if (!query.data?.threads)
      return []

    const result = query.data.threads.map((thread, threadIndex): SelectItem => {
      const prefix = []
      if (thread.isHot)
        prefix.push('🔥')

      const prefixStr = prefix.length > 0 ? `${prefix.join(' ')} ` : ''
      const replyInfo = thread.replyCount ? ` [${thread.replyCount} 回复]` : ''

      return {
        label: `${threadIndex + 1}. ${thread.type ? `${thread.type}` : ''} ${prefixStr}${thread.title}${replyInfo}`,
        value: `thread-${thread.tid}`,
        tid: thread.tid,
        threadTitle: thread.title,
      }
    })

    if (!threadListState.tid || !result.find(item => item.tid === threadListState.tid)) {
      setThreadListState({ ...threadListState, tid: result[0].tid })
    }

    return result
  }, [query.data])

  const handleSelect = (item: SelectItem) => {
    if (item.value.startsWith('thread-')) {
      const tid = item.value.split('-')[1]
      setThreadListState({ ...threadListState, tid })
      setThreadDetailState({
        tid,
        pagination: { current: 1, total: 1 },
        detailMode: false,
      })
      store.set(currentPageAtom, 'thread-detail')
    }
  }

  const handleChange = (item: SelectItem) => {
    setThreadListState({ ...threadListState, tid: item.value.split('-')[1] })
  }

  const selectedIndex = useMemo(() => {
    const index = items.findIndex(item => item.tid === threadListState.tid)
    return index > 0 ? index : 0
  }, [items, threadListState.tid])

  const subForumBar = useMemo(() => {
    if (!subForums.length)
      return null

    const selected = subForums[threadListState.subForumIndex]
    if (!selected)
      return null

    let leftIndex = threadListState.subForumIndex - 1
    let rightIndex = threadListState.subForumIndex + 1
    const itemsToShow = [{ index: threadListState.subForumIndex, ...selected }]
    let usedWidth = sw(`[${selected.title}] `)
    const limit = width - 4

    while (usedWidth < limit) {
      let added = false
      if (leftIndex >= 0) {
        const item = subForums[leftIndex]
        const w = sw(` ${item.title} `)
        if (usedWidth + w < limit) {
          itemsToShow.unshift({ index: leftIndex, ...item })
          usedWidth += w
          leftIndex--
          added = true
        }
      }
      if (rightIndex < subForums.length) {
        const item = subForums[rightIndex]
        const w = sw(` ${item.title} `)
        if (usedWidth + w < limit) {
          itemsToShow.push({ index: rightIndex, ...item })
          usedWidth += w
          rightIndex++
          added = true
        }
      }
      if (!added)
        break
    }

    return (
      <Box paddingBottom={1}>
        {itemsToShow.map(item => (
          <Text
            key={item.fid}
            color={item.index === threadListState.subForumIndex ? (threadListState.focusMode === 'subforum' ? 'green' : 'cyan') : 'gray'}
            bold={item.index === threadListState.subForumIndex}
          >
            {item.index === threadListState.subForumIndex ? `[${item.title}]` : ` ${item.title} `}
          </Text>
        ))}
      </Box>
    )
  }, [subForums, threadListState.subForumIndex, threadListState.focusMode])

  return (
    <Box width="100%" height="100%" flexDirection="column">
      <Text bold color="cyan">
        📝
        {' '}
        {threadListState.forumName}
      </Text>
      {subForumBar}
      <Box flexGrow={1} paddingTop={subForumBar ? 0 : 1}>
        { query.isLoading || query.isError || !query.data?.threads.length
          ? (
              <Box height="100%" width="100%" justifyContent="center" alignItems="center">
                {
                  query.isLoading
                    ? (
                        <Text>加载中...</Text>
                      )
                    : query.isError
                      ? (
                          <Text color="red">加载失败</Text>
                        )
                      : (
                          <Text>暂无内容</Text>
                        )
                }
              </Box>
            )
          : (
              <SelectView
                items={items}
                onSelect={handleSelect}
                limit={Math.max(5, height - 7 - (subForumBar ? 2 : 0))}
                isActive={threadListState.focusMode === 'thread'}
                onChange={handleChange}
                selectedIndex={selectedIndex}
              />
            )}

      </Box>
    </Box>
  )
}
