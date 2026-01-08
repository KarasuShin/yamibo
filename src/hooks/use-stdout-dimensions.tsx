import { useStdout } from 'ink'
import { useEffect } from 'react'
import { useSetState } from './use-set-state'

export function useStdoutDimensions(): [number, number] {
  const { stdout } = useStdout()
  const dimensions = useSetState<[number, number]>([
    stdout.columns,
    stdout.rows,
  ])

  useEffect(() => {
    const handler = () => dimensions.setState([stdout.columns, stdout.rows])
    stdout.on('resize', handler)
    return () => {
      stdout.off('resize', handler)
    }
  }, [stdout])

  return dimensions.state
}
