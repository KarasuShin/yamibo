import { Box, Text, useInput } from 'ink'
import { useMemo } from 'react'
import { useSetState } from '~/hooks/use-set-state'
import { useStdoutDimensions } from '~/hooks/use-stdout-dimensions'
import { sw } from '~/utils/sw'

export interface SelectItem {
  label: string
  value: string
  selectable?: boolean
  [key: string]: any
}

interface Props {
  items: SelectItem[]
  onSelect: (item: SelectItem) => void
  onChange: (index: SelectItem) => void
  selectedIndex: number
  limit?: number
  isActive?: boolean
}

export function SelectView({ items, onSelect, onChange, selectedIndex, limit, isActive = true }: Props) {
  const scrollOffset = useSetState(0)
  const [columns] = useStdoutDimensions()
  const maxWidth = columns - 2

  const truncateText = (text: string): string => {
    const textWidth = sw(text)
    if (textWidth <= maxWidth) {
      return text
    }

    const targetWidth = maxWidth - sw('…')
    let currentWidth = 0
    let result = ''

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const charWidth = sw(char)

      if (currentWidth + charWidth > targetWidth) {
        break
      }

      result += char
      currentWidth += charWidth
    }

    return `${result}…`
  }

  const findNextSelectableIndex = (currentIndex: number): number => {
    for (let i = currentIndex + 1; i < items.length; i++) {
      if (items[i].selectable !== false) {
        return i
      }
    }
    return currentIndex
  }

  const findPrevSelectableIndex = (currentIndex: number): number => {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (items[i].selectable !== false) {
        return i
      }
    }
    return currentIndex
  }

  const visibleLimit = limit || items.length

  const visibleItems = useMemo(() => {
    return items.slice(scrollOffset.state, scrollOffset.state + visibleLimit)
      .map((i, index) => {
        const actualIndex = scrollOffset.state + index
        const isSelected = actualIndex === selectedIndex
        const prefix = isSelected ? '❯ ' : '  '
        const displayLabel = truncateText(`${prefix}${i.label}`)
        return {
          ...i,
          isSelected,
          displayLabel,
        }
      })
  }, [items, scrollOffset, visibleLimit, columns, selectedIndex])

  useInput((_, key) => {
    if (!isActive)
      return
    if (key.upArrow) {
      if (selectedIndex > 0) {
        const newIndex = findPrevSelectableIndex(selectedIndex)
        if (newIndex !== selectedIndex) {
          onChange(items[newIndex])

          if (newIndex < scrollOffset.state) {
            scrollOffset.setState(newIndex)
          }
        }
      }
    }
    else if (key.downArrow) {
      if (selectedIndex < items.length - 1) {
        const newIndex = findNextSelectableIndex(selectedIndex)
        if (newIndex !== selectedIndex) {
          onChange(items[newIndex])
          if (newIndex >= scrollOffset.state + visibleLimit) {
            scrollOffset.setState(newIndex - visibleLimit + 1)
          }
        }
      }
    }
    else if (key.return) {
      onSelect(items[selectedIndex])
    }
  })

  return (
    <Box flexDirection="column">
      {visibleItems.map((item) => {
        return (
          <Box key={item.value}>
            <Text color={item.isSelected ? 'cyan' : undefined} bold={item.isSelected}>
              {item.displayLabel}
            </Text>
          </Box>
        )
      })}
    </Box>
  )
}
