import type { PostItem } from '~/utils/api'
import { useQuery } from '@tanstack/react-query'
import { Box, Text, useInput } from 'ink'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useMemo } from 'react'
import { useSetState } from '~/hooks/use-set-state'
import { useStdoutDimensions } from '~/hooks/use-stdout-dimensions'
import { currentPageAtom, store, threadDetailStateAtom, threadListStateAtom } from '~/store'
import { getThreadDetail } from '~/utils/api'
import { queryClient } from '~/utils/query'
import { sw } from '~/utils/sw'

function PostCard({ post, isFirst, maxHeight, isTruncated }: { post: PostItem, isFirst: boolean, maxHeight?: number, isTruncated?: boolean }) {
  return (
    <Box flexDirection="column" borderStyle="single" borderColor={isFirst ? 'cyan' : 'gray'}>
      <Box marginX={1} flexDirection="row" justifyContent="space-between">
        <Text bold color={isFirst ? 'cyan' : 'white'}>
          {post.floor}
          {' '}
          -
          {' '}
          {post.authorName}
        </Text>
        <Text dimColor>{post.postTime}</Text>
      </Box>
      <Box marginX={1} overflow="hidden" height={maxHeight}>
        <Text>{post.content}</Text>
      </Box>
      {isTruncated && (
        <Box marginX={1} marginBottom={1}>
          <Text dimColor italic>
            ⚠️ 内容过长已截断，按 [Enter] 进入详情模式查看完整内容
          </Text>
        </Box>
      )}
    </Box>
  )
}

function calculatePostHeight(post: PostItem, terminalWidth: number): number {
  // 边框占 2 行
  let lines = 2
  // 头部占 1 行（楼层 - 作者  时间）
  lines += 1

  const content = post.content || '[无内容]'
  const contentWidth = terminalWidth - 4

  const contentLines = content.split('\n')

  for (const line of contentLines) {
    if (line.length === 0) {
      lines += 1
    }
    else {
      let lineWidth = 0
      for (const char of line) {
        lineWidth += sw(char)
      }

      lines += Math.max(1, Math.ceil(lineWidth / contentWidth))
    }
  }

  return lines
}

function calculatePostContentHeight(post: PostItem, terminalWidth: number): number {
  const content = post.content || '[无内容]'
  const contentWidth = terminalWidth - 4

  let lines = 0
  const contentLines = content.split('\n')

  for (const line of contentLines) {
    if (line.length === 0) {
      lines += 1
    }
    else {
      let lineWidth = 0
      for (const char of line) {
        lineWidth += sw(char)
      }
      lines += Math.max(1, Math.ceil(lineWidth / contentWidth))
    }
  }

  return lines
}

export function ThreadDetail() {
  const threadListState = useAtomValue(threadListStateAtom)!
  const threadDetailState = useAtomValue(threadDetailStateAtom)!
  const setThreadDetailState = useSetAtom(threadDetailStateAtom)
  const tid = threadListState.tid
  const [width, height] = useStdoutDimensions()
  const selectedIndex = useSetState(0)
  const detailScrollOffset = useSetState(0)
  const detailMode = threadDetailState.detailMode

  const query = useQuery({
    queryKey: ['thread-detail', tid, threadDetailState.pagination.current],
    queryFn: () => getThreadDetail(tid, threadDetailState.pagination.current),
  })

  const totalPosts = query.data?.posts.length || 0
  const maxIndex = Math.max(0, totalPosts - 1)

  const titleLines = query.data?.pagination ? 3 : 2
  const viewportHeight = height - titleLines - 5

  useInput((input, key) => {
    if (detailMode) {
      if (key.upArrow) {
        detailScrollOffset.setState(Math.max(0, detailScrollOffset.state - 1))
      }
      else if (key.downArrow) {
        if (query.data?.posts[selectedIndex.state]) {
          const currentPost = query.data.posts[selectedIndex.state]
          const contentViewportHeight = viewportHeight - 2
          const postContentHeight = calculatePostContentHeight(currentPost, width)
          const maxScrollOffset = Math.max(0, postContentHeight - contentViewportHeight)

          detailScrollOffset.setState(Math.min(maxScrollOffset, detailScrollOffset.state + 1))
        }
      }
      else if (key.return || key.escape) {
        setThreadDetailState({ ...threadDetailState, detailMode: false })
        detailScrollOffset.setState(0)
      }
    }
    else {
      if (key.upArrow) {
        selectedIndex.setState(Math.max(0, selectedIndex.state - 1))
      }
      else if (key.downArrow) {
        selectedIndex.setState(Math.min(maxIndex, selectedIndex.state + 1))
      }
      else if (key.return) {
        setThreadDetailState({ ...threadDetailState, detailMode: true })
        detailScrollOffset.setState(0)
      }
      else if (key.escape) {
        store.set(currentPageAtom, 'thread-list')
      }
      else if (input === 'r') {
        queryClient.removeQueries({
          queryKey: ['thread-detail', tid, threadDetailState.pagination.current],
        })
        query.refetch()
      }
    }
  })

  const visiblePosts = useMemo(() => {
    if (!query.data?.posts)
      return []

    const posts = query.data.posts
    const result: Array<PostItem & { actualIndex: number, isSelected: boolean, maxContentHeight?: number, isTruncated?: boolean }> = []

    const selectedPostHeight = calculatePostHeight(posts[selectedIndex.state], width)

    if (selectedPostHeight >= viewportHeight) {
      const maxContentHeight = Math.max(1, viewportHeight - 3)
      return [{
        ...posts[selectedIndex.state],
        actualIndex: selectedIndex.state,
        isSelected: true,
        maxContentHeight,
        isTruncated: true,
      }]
    }

    let accumulatedHeight = selectedPostHeight
    const upwardPosts: typeof result = []

    for (let i = selectedIndex.state - 1; i >= 0; i--) {
      const postHeight = calculatePostHeight(posts[i], width)
      if (accumulatedHeight + postHeight > viewportHeight)
        break
      accumulatedHeight += postHeight
      upwardPosts.unshift({
        ...posts[i],
        actualIndex: i,
        isSelected: false,
      })
    }

    result.push(...upwardPosts)

    result.push({
      ...posts[selectedIndex.state],
      actualIndex: selectedIndex.state,
      isSelected: true,
    })

    for (let i = selectedIndex.state + 1; i < totalPosts; i++) {
      const postHeight = calculatePostHeight(posts[i], width)
      if (accumulatedHeight + postHeight > viewportHeight)
        break
      accumulatedHeight += postHeight
      result.push({
        ...posts[i],
        actualIndex: i,
        isSelected: false,
      })
    }

    return result
  }, [query.data?.posts, selectedIndex, totalPosts, width, viewportHeight])

  useEffect(() => {
    if (query.data?.pagination.totalPages) {
      setThreadDetailState({
        ...threadDetailState,
        pagination: { ...threadDetailState.pagination, total: query.data.pagination.totalPages },
      })
    }
  }, [query.data?.pagination.totalPages])

  useEffect(() => {
    selectedIndex.setState(0)
    if (detailMode) {
      setThreadDetailState({ ...threadDetailState, detailMode: false })
      detailScrollOffset.setState(0)
    }
  }, [threadDetailState.pagination.current])

  useEffect(() => {
    return () => {
      queryClient.removeQueries({
        queryKey: ['thread-detail', tid],
      })
      if (detailMode) {
        setThreadDetailState({ ...threadDetailState, detailMode: false })
      }
    }
  }, [])

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

  if (!query.data?.posts.length) {
    return (
      <Box height="100%" width="100%" justifyContent="center" alignItems="center">
        <Text dimColor>暂无内容</Text>
      </Box>
    )
  }

  if (detailMode && query.data?.posts[selectedIndex.state]) {
    const currentPost = query.data.posts[selectedIndex.state]
    const contentViewportHeight = viewportHeight - 2

    return (
      <Box width="100%" height="100%" flexDirection="column">
        <Box paddingX={1} paddingTop={1} flexDirection="column">
          <Text bold color="cyan">
            📖
            {' '}
            {query.data.title || threadListState.forumName}
          </Text>
        </Box>

        <Box paddingX={1} flexDirection="column">
          <Box borderStyle="single" borderColor="cyan" flexDirection="column">
            <Box marginX={1} flexDirection="row" justifyContent="space-between">
              <Text bold color="cyan">
                {currentPost.floor}
                {' '}
                -
                {' '}
                {currentPost.authorName}
              </Text>
              <Text dimColor>{currentPost.postTime}</Text>
            </Box>

            <Box overflow="hidden" height={contentViewportHeight}>
              <Box marginTop={-detailScrollOffset.state}>
                <Box marginX={1}>
                  <Text>{currentPost.content}</Text>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Box width="100%" height="100%" flexDirection="column">
      <Box paddingX={1} paddingTop={1} flexDirection="column">
        <Text bold color="cyan">
          📖
          {' '}
          {query.data.title || threadListState.forumName}
        </Text>
      </Box>

      <Box flexDirection="column" paddingX={1} flexGrow={1}>
        {visiblePosts.map(post => (
          <PostCard
            key={post.postId || post.actualIndex}
            post={post}
            isFirst={post.isSelected}
            maxHeight={post.maxContentHeight}
            isTruncated={post.isTruncated}
          />
        ))}
      </Box>
    </Box>
  )
}
