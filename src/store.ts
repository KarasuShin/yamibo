import { atom, createStore } from 'jotai'
import { ConfigManager } from './utils/config'

export const store = createStore()

export type Page = 'start' | 'home' | 'login' | 'expired' | 'thread-list' | 'thread-detail'

export const currentPageAtom = atom<Page>('start')

export const loginStatusAtom = atom<'active' | 'inactive' | 'expired'>('inactive')

export const ConfigManagerAtom = atom(new ConfigManager())

export const threadListStateAtom = atom<{
  defaultFid: string
  fid: string
  forumName: string
  pagination: {
    current: number
    total: number
  }
  tid: string
  subForumIndex: number
  focusMode: 'thread' | 'subforum'
  subForm: null | {
    title: string
    fid: string
  }[]
} | null>(null)

export const threadDetailStateAtom = atom<{
  tid: string
  pagination: {
    current: number
    total: number
  }
  detailMode: boolean
} | null>(null)

export const homeStateAtom = atom<{
  fid: string
} | null>(null)

export const loginStateAtom = atom<{
  errorText: string
} | null>(null)
