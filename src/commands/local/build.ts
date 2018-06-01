// note that we are using @heroku-cli/command instead of @oclif/command
// this inherits from @oclif/command but extends it with Heroku-specific functionality
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {cli} from 'cli-ux'

const child = require('child_process');
// const tty = require('tty');
const fs = require('fs');
const stream = require('stream');
const os = require('os');
const path = require('path');

export default class Build extends Command {
  static description = 'Build an app locally'
  static examples = [`
$ heroku local:build`,
  ]
  static flags = {
    remote: flags.remote(),
    app: flags.app({required: true})
  }

  async run () {
    const {flags} = this.parse(Build)

    let bin = path.join(__dirname, '..', '..', '..', 'bin', `tatara-${os.platform()}`)
    if (!fs.existsSync(bin)) {
      this.error(`Unsupported platform: ${os.platform()}`);
    }

    let cmdArgs = ['build', process.cwd(), flags.app]

    let spawned = child.spawn(bin, cmdArgs, {stdio: 'pipe'})
      .on('error', (err: any) => {
        cli.log(err)
        this.error(err)
      })
      .on('close', (code: any) => {
        if (code) this.error(code);
      });
    spawned.stdout.on('data', (chunk: any) => {
      process.stdout.write(chunk.toString());
    });
    spawned.stderr.on('data', (chunk: any) => {
      process.stderr.write(chunk.toString());
    });
  }
}
