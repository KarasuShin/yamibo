import fs from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { z } from 'zod'

const configSchema = z.object({
  username: z.string().optional(),
  saltkey: z.string().optional(),
  auth: z.string().optional(),
})

export type Config = z.infer<typeof configSchema>

export class ConfigManager {
  private config: Config
  private configPath = path.join(homedir(), '.yamibo', 'config.json')

  constructor() {
    this.config = this.loadConfig()
  }

  private loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      fs.mkdirSync(path.dirname(this.configPath), { recursive: true })
      fs.writeFileSync(this.configPath, JSON.stringify({}, null, 2))
    }
    try {
      const config = configSchema.parse(JSON.parse(fs.readFileSync(this.configPath, 'utf-8')))
      return config
    }
    catch {
      fs.writeFileSync(this.configPath, JSON.stringify({}, null, 2))
    }
    return {}
  }

  getConfig(configName?: keyof Config) {
    if (configName) {
      return this.config[configName]
    }
    return this.config
  }

  setConfig(configName: keyof Config, value: string) {
    this.config[configName] = value
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
  }

  removeConfig(configName: keyof Config) {
    delete this.config[configName]
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
  }
}
