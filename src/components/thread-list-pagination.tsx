import { useAtom } from 'jotai'
import { threadListStateAtom } from '~/store'
import { Pagination } from './pagination'

export function ThreadListPagination() {
  const [threadListState, setThreadListState] = useAtom(threadListStateAtom)

  if (!threadListState)
    return null

  return (
    <Pagination
      current={threadListState.pagination.current}
      total={threadListState.pagination.total}
      onPageChange={current => setThreadListState({ ...threadListState, pagination: { ...threadListState.pagination, current } })}
      disabled={threadListState.focusMode === 'subforum'}
    />
  )
}
