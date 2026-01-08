import type { CheerioAPI } from 'cheerio'
import { load } from 'cheerio'
import {
  ConfigManagerAtom,
  currentPageAtom,
  loginStatusAtom,
  store,
} from '~/store'
import { ConfigManager } from './config'

export const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export async function http(url: string, options?: RequestInit & { cheerio?: true }): Promise<CheerioAPI>
export async function http(url: string, options: RequestInit & { cheerio: false }): Promise<Response>
export async function http(url: string, { cheerio = true, ...options }: RequestInit & { cheerio?: boolean } = {}): Promise<CheerioAPI | Response> {
  let configManager: ConfigManager
  try {
    configManager = store.get(ConfigManagerAtom)
  }
  catch {
    configManager = new ConfigManager()
  }
  const saltkey = configManager.getConfig('saltkey')
  const auth = configManager.getConfig('auth')

  if (cheerio === false) {
    return await fetch(url, {
      ...options,
      headers: {
        'User-Agent': UA,
        'Cookie': `EeqY_2132_saltkey=${saltkey};EeqY_2132_auth=${auth}`,
        ...options.headers,
      },
    })
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': UA,
      'Cookie': `EeqY_2132_saltkey=${saltkey};EeqY_2132_auth=${auth}`,
      ...options.headers,
    },
  }).then(res => res.text())

  const $ = load(res)

  if ($('#messagelogin').length) {
    store.set(currentPageAtom, 'expired')
    store.set(loginStatusAtom, 'expired')
    configManager.removeConfig('auth')
    configManager.removeConfig('saltkey')
    throw new Error('login expired')
  }

  return $
}

export function getCookie(cookies: string[], key: string) {
  return cookies.map(item => item.split(';')[0])
    .map(item => item.split('='))
    .find(item => item[0] === key)?.[1]
}
