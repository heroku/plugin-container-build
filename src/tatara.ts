import * as path from 'path'
const pjson = require('../package.json')

export class Tatara {
  platform: string

  constructor(platform: string) {
    this.platform = platform
  }

  path(): string {
    let bin
    if (this.platform === 'win32') {
      bin = path.join(__dirname, '..', 'bin', `tatara-${pjson.tatara.version}-windows.exe`)
    } else if (this.platform === 'darwin') {
      bin = path.join(__dirname, '..', 'bin', `tatara-${pjson.tatara.version}-macos`)
    } else if (this.platform === 'linux') {
      bin = path.join(__dirname, '..', 'bin', `tatara-${pjson.tatara.version}-linux`)
    } else {
      throw new Error(`Unsupported platform: ${this.platform}`)
    }
    return bin
  }
}
