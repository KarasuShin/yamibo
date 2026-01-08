#!/usr/bin/env node
import process from 'node:process'
import { render } from 'ink'
import { createElement } from 'react'
import yargsParser from 'yargs-parser'
import pkg from '../package.json'
import { App } from './app'
// import { sign } from './utils/api'

interface Argv {
  _: string[]
  help: boolean
  version: boolean
}

function printHelp() {
  console.log(
    `
Usage:
  yamibo [options] [command]

Options:
  -h, --help                    显示帮助
  -v, --version                 显示版本

Commands:
  sign                          签到
    `.trimEnd(),
  )
}

async function main() {
  const argv = yargsParser(process.argv.slice(2), {
    alias: {
      help: 'h',
      version: 'v',
    },
    boolean: ['h', 'v'],
  }) as Argv

  if (argv.version) {
    console.log(pkg.version)
    return
  }
  else if (argv.help) {
    printHelp()
    return
  }

  const command = argv._[0]

  if (command === 'sign') {
    // await sign()
    return
  }

  render(createElement(App), {
    patchConsole: false,
    exitOnCtrlC: true,
  })
}

main()
