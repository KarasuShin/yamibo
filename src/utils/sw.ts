import stringWidth from 'string-width'

export function sw(char: string) {
  return stringWidth(char) || 1
}
