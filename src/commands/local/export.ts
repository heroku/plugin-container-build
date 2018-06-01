// note that we are using @heroku-cli/command instead of @oclif/command
// this inherits from @oclif/command but extends it with Heroku-specific functionality
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {cli} from 'cli-ux'

import {Tatara} from '../../tatara'

const child = require('child_process');

export default class Export extends Command {
  static description = 'Export a build to a Docker image'
  static examples = [`
$ heroku local:export`,
  ]
  static flags = {
    remote: flags.remote(),
    app: flags.app({required: true}),
    tag: flags.string({description: 'the tag for the Docker image'}),
  }

  async run () {
    const {flags} = this.parse(Export)

    let bin = (new Tatara(process.platform)).path()

    let cmdArgs = ['export', flags.app]

    if (flags.tag) {
      cmdArgs.push('--tag')
      cmdArgs.push(flags.tag)
    }

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
