import {cli} from 'cli-ux'

const path = require('path');

export class Tatara {
  platform: string

  constructor(platform: string) {
    this.platform = platform
  }

  path(): string {
    let bin
    if (this.platform === 'win32') {
      bin = path.join(__dirname, '..', 'bin', `tatara-windows.exe`)
    } else if (this.platform === 'darwin') {
      bin = path.join(__dirname, '..', 'bin', `tatara-macos`)
    } else if (this.platform === 'linux') {
      bin = path.join(__dirname, '..', 'bin', `tatara-linux`)
    } else {
      throw new Error(`Unsupported platform: ${this.platform}`)
    }
    return bin
  }
}
