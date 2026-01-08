import React, { useEffect, useRef } from 'react'

export function useSetState<S>(initialState: S | (() => S)): {
  state: S
  setState: React.Dispatch<React.SetStateAction<S>>
  reset: () => void
  ref: React.RefObject<S>
}
export function useSetState<S = undefined>(): {
  state: S | undefined
  setState: React.Dispatch<React.SetStateAction<S | undefined>>
  reset: () => void
}

export function useSetState<S>(initialState?: S | (() => S)) {
  const [state, setState] = React.useState(initialState)
  const ref = useRef(initialState)

  useEffect(() => {
    ref.current = state
  }, [state])

  const reset = () => {
    setState(initialState)
  }

  return { state, setState, reset, ref }
}
