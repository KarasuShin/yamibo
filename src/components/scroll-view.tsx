import type { ScrollViewProps, ScrollViewRef } from 'ink-scroll-view'
import { useInput, useStdout } from 'ink'
import { ScrollView as InkScrollView } from 'ink-scroll-view'
import { useEffect, useRef } from 'react'

export function ScrollView(props: ScrollViewProps) {
  const { children } = props

  const scrollViewRef = useRef<ScrollViewRef>(null)

  const { stdout } = useStdout()

  useEffect(() => {
    const handleResize = () => scrollViewRef.current?.remeasure()
    stdout?.on('resize', handleResize)
    return () => {
      stdout?.off('resize', handleResize)
    }
  }, [stdout])

  useInput((input, key) => {
    if (key.upArrow) {
      scrollViewRef.current?.scrollBy(-1)
    }
    else if (key.downArrow) {
      scrollViewRef.current?.scrollBy(1)
    }
    else if (key.pageUp) {
      const height = scrollViewRef.current?.getViewportHeight() || 1
      scrollViewRef.current?.scrollBy(-height)
    }
    else if (key.pageDown) {
      const height = scrollViewRef.current?.getViewportHeight() || 1
      scrollViewRef.current?.scrollBy(height)
    }
  })

  return (
    <InkScrollView
      ref={scrollViewRef}
      {...props}
    >
      {children}
    </InkScrollView>
  )
}
