import { useAtom } from 'jotai'
import { threadDetailStateAtom } from '~/store'
import { Pagination } from './pagination'

export function ThreadDetailPagination() {
  const [threadDetailState, setThreadDetailState] = useAtom(threadDetailStateAtom)

  if (!threadDetailState)
    return null

  return (
    <Pagination
      current={threadDetailState.pagination.current}
      total={threadDetailState.pagination.total}
      onPageChange={current => setThreadDetailState({ ...threadDetailState, pagination: { ...threadDetailState.pagination, current } })}
    />
  )
}
