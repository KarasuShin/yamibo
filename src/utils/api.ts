import type { CheerioAPI } from 'cheerio'
import process from 'node:process'
import { load } from 'cheerio'
import { ConfigManagerAtom, loginStatusAtom, store } from '~/store'
import { getCookie, http } from './http'
import { queryClient } from './query'

export async function getProfile() {
  const configManager = store.get(ConfigManagerAtom)
  if (!configManager.getConfig('auth') || !configManager.getConfig('saltkey')) {
    throw new Error('auth or saltkey not found')
  }
  const $ = await http('https://bbs.yamibo.com/home.php?mod=space&do=profile', {
    method: 'GET',
  })

  store.set(loginStatusAtom, 'active')

  const userElement = $('.u_profile')
  const username = userElement
    .find('.pbm.mbm.bbda.cl')
    .find('h2')
    .contents()
    .filter((_, el) => el.type === 'text')
    .first()
    .text()
    .trim()

  const uid = userElement
    .find('.pbm.mbm.bbda.cl')
    .find('h2')
    .text()
    .match(/\((UID:\d+)\)/)?.[1]

  const group = userElement
    .find('.pbm.mbm.bbda.cl font')
    .text()

  const [
    onlineTime,
    registerTime,
    lastLoginTime,
    registerIP,
    lastLoginIP,
    lastActivityTime,
    lastPublishTime,
  ] = $('#pbbs li').toArray().map((element) => {
    const $element = $(element)
    $element.find('em').remove()
    return $element.text().trim()
  })

  const [
    storage,
    score,
    _score,
    couple,
  ] = $('#psts li').toArray().map((element) => {
    const $element = $(element)
    $element.find('em').remove()
    return $element.text().trim()
  })

  return {
    username,
    uid,
    group,
    onlineTime,
    registerTime,
    lastLoginTime,
    registerIP,
    lastLoginIP,
    lastActivityTime,
    lastPublishTime,
    storage,
    score,
    couple,
  }
}

export async function getForumCategories() {
  const $ = await http('https://bbs.yamibo.com/forum.php', {
    method: 'GET',
  })

  const list = $('.bm.bmw.cl').toArray().map((category) => {
    const $categoryAnchor = $(category).find('.bm_h.cl h2 a')
    const categoryTitle = $categoryAnchor.text()
    const cid = $categoryAnchor.attr('href')?.match(/\?gid=(\d+)/)?.[1]
    return {
      title: categoryTitle,
      id: cid,
      children: $(`#category_${cid} tr`).toArray().map((forum) => {
        const $forum = $(forum)
        const forumTitle = $forum.find('h2 a').text()
        const forumDesc = $forum.find('.xg2').text()
        const fid = $forum.find('h2 a').attr('href')?.match(/forum-(\d+)-/)?.[1]
        return {
          id: fid,
          title: forumTitle,
          desc: forumDesc,
        }
      }),
    }
  })

  return list
}

export type ForumCategoryItem = Awaited<ReturnType<typeof getForumCategories>>[number]

export async function getThreadList(fid: string, page = 1) {
  const $ = await http(`https://bbs.yamibo.com/forum.php?mod=forumdisplay&fid=${fid}&page=${page}`, {
    method: 'GET',
  })

  const threads = $('#threadlisttableid tbody').toArray().map((row) => {
    const $row = $(row)
    const tid = $row.attr('id')?.match(/normalthread_(\d+)/)?.[1]

    if (!tid)
      return null

    const $titleElement = $row.find('th')
    const title = $titleElement.find('.s.xst').text().trim()
    const type = $titleElement.find('em').text().trim()
    const $authorElement = $row.find('.by cite a').first()
    const authorUID = $authorElement.attr('href')?.match(/uid-(\d+)/)?.[1]
    const authorName = $authorElement.text().trim()
    const replyCount = $row.find('.num .xi2').text().trim()
    const viewCount = $row.find('.num em').text().trim()

    const isHot = $row.find('.theatlevel').length > 0

    return {
      tid,
      title,
      type,
      author: {
        name: authorName,
        uid: authorUID,
      },
      replyCount: replyCount || '0',
      viewCount: viewCount || '0',
      isHot,
    }
  }).filter(thread => thread !== null)

  const pagination = {
    currentPage: page,
    totalPages: Number($('[totalpage]').attr('totalpage')),
  }

  const subForum = $(`#subforum_${fid} tr h2 a`).toArray().map((element) => {
    const $element = $(element)
    const title = $element.text()
    const fid = $element.attr('href')?.match(/forum-(\d+)-/)?.[1]
    return {
      title,
      fid: fid!,
    }
  }).filter(i => !!i.fid)

  return {
    threads,
    pagination,
    subForum,
  }
}

export type ThreadItem = Exclude<Awaited<ReturnType<typeof getThreadList>>['threads'][number], null>

export async function getThreadDetail(tid: string, page: number = 1) {
  const $ = await http(`https://bbs.yamibo.com/forum.php?mod=viewthread&tid=${tid}&page=${page}`, {
    method: 'GET',
  })

  const title = $('#thread_subject').text().trim()

  const posts = $('#postlist>div[id^="post_"]').toArray().map((postElement) => {
    const $post = $(postElement)

    const postId = $post.attr('id')!.match(/\d+/)![0]
    const isOP = !!$post.has('#fj').length
    const $tr = $post.find('table').find('tr').first()
    const profileBlock = $tr.find(`#favatar${postId}`)
    const authorName = profileBlock.find('.authi').text().trim()
    const floor = isOP ? '楼主' : $tr.find(`#postnum${postId} em`).text().trim()

    const postTime = $tr
      .find(`#authorposton${postId}`)
      .text()
      .match(/\d{4}(?:-\d{1,2}){2} \d{2}:\d{2}/)![0]

    const $content = $post.find(`#postmessage_${postId}`)

    // 移除不需要的元素（签名、评分等）
    $content.find('.sign').remove()
    $content.find('.rate').remove()
    $content.find('.pstatus').remove()
    $content.find('.modact').remove()
    $content.find('script').remove()
    $content.find('style').remove()

    // 处理图片 - 转换为文字提示
    $content.find('img').each(function () {
      const src = $(this).attr('src') || $(this).attr('file') || $(this).attr('zoomfile')
      if (src) {
        $(this).replaceWith(`[图片: ${src}]`)
      }
      else {
        $(this).replaceWith('[图片]')
      }
    })

    // 处理链接
    $content.find('a').each(function () {
      const href = $(this).attr('href')
      const text = $(this).text()
      if (href && href !== text) {
        $(this).replaceWith(`${text}(${href})`)
      }
    })

    const content = $content.text().trim()

    return {
      postId,
      authorName,
      floor,
      postTime,
      content,
    }
  }).filter(post => post !== null)

  const pagination = {
    currentPage: page,
    totalPages: Number($('.pg label span').text().match(/\/ (\d+) 页/)?.[1]),
  }

  return {
    title,
    posts,
    pagination,
  }
}

export type PostItem = Awaited<ReturnType<typeof getThreadDetail>>['posts'][number]

export async function login(username: string, password: string) {
  const configManager = store.get(ConfigManagerAtom)
  const loginFormResponse = await http(`https://bbs.yamibo.com/member.php?mod=logging&action=login&infloat=yes&handlekey=login&inajax=1&ajaxtarget=fwin_content_login`, {
    method: 'GET',
    cheerio: false,
    headers: {
      Cookie: '',
    },
  })

  const saltkey = getCookie(loginFormResponse.headers.getSetCookie(), 'EeqY_2132_saltkey')
  if (!saltkey) {
    throw new Error('saltkey cookie not found')
  }

  const loginFormXml = await loginFormResponse.text()
  const $loginForm = load(loginFormXml)

  const formhash = $loginForm('input[name="formhash"]').val() as string

  if (!formhash) {
    throw new Error('formhash not found')
  }

  const formData = new FormData()
  formData.append('formhash', formhash)
  formData.append('username', username)
  formData.append('password', password)
  formData.append('questionid', '0')
  formData.append('answer', '')
  const loginResponse = await http(`https://bbs.yamibo.com/member.php?mod=logging&action=login&loginsubmit=yes&handlekey=login&loginhash=${formhash}&inajax=1`, {
    method: 'POST',
    body: formData,
    headers: {
      Cookie: `EeqY_2132_saltkey=${saltkey};`,
    },
    cheerio: false,
  })

  const auth = getCookie(loginResponse.headers.getSetCookie(), 'EeqY_2132_auth')

  if (auth) {
    configManager.setConfig('auth', auth)
    configManager.setConfig('saltkey', saltkey)
    queryClient.refetchQueries({
      queryKey: ['profile'],
    })
  }
  else {
    const text = await loginResponse.text()
    const errorText = text.match(/errorhandle_login\('(.*)',/)?.[1]
    if (errorText) {
      throw new Error(errorText)
    }
    throw new Error('auth cookie not found')
  }
}

export async function sign() {
  const $loginHtml = await http('https://bbs.yamibo.com/plugin.php?id=zqlj_sign', {
    method: 'GET',
  })

  const outputSignInfo = ($html: CheerioAPI) => {
    const signInfo = $html('.sd .bm').eq(2).find('ul').text().trim()
    console.info('签到统计\n', signInfo)
  }

  const loginBtn = $loginHtml('.btna')

  if (loginBtn.text() === '点击打卡') {
    const signKey = loginBtn.attr('href')?.match(/&sign=(.*)/)?.[1]
    const response = await http(`https://bbs.yamibo.com/plugin.php?id=zqlj_sign&sign=${signKey}`, {
      method: 'GET',
      cheerio: false,
    }).then(res => res.text())

    if (response.includes('恭喜您，打卡成功！')) {
      console.info('签到成功')
    }
    else if (response.includes('您今天已经打过卡了，请勿重复操作！')) {
      console.info('今日已签到')
    }
    else {
      console.error('签到失败')
      process.exit(1)
    }
    const $ = await http('https://bbs.yamibo.com/plugin.php?id=zqlj_sign', {
      method: 'GET',
    })
    outputSignInfo($)
  }
  else if (loginBtn.text() === '今日已打卡') {
    console.info('今日已签到')
  }
  else {
    console.error('签到失败')
  }
  process.exit(0)
}
