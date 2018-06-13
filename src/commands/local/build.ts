// note that we are using @heroku-cli/command instead of @oclif/command
// this inherits from @oclif/command but extends it with Heroku-specific functionality
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {cli} from 'cli-ux'
import * as ShellEscape from 'shell-escape'
import * as debug from 'debug'

import {Tatara} from '../../tatara'

const child = require('child_process');

export default class Build extends Command {
  static description = 'Build an app locally'
  static examples = [`
$ heroku local:build`,
  ]
  static flags = {
    remote: flags.remote(),
    app: flags.app({required: true}),
    'skip-stack-pull': flags.boolean(),
    config: flags.boolean()
  }

  async run () {
    const {flags} = this.parse(Build)

    let bin = (new Tatara(process.platform).path())

    let cmdArgs = ['build', process.cwd(), flags.app]
    if (flags['skip-stack-pull']) {
      cmdArgs.push('--skip-stack-pull')
    }

    let envVars
    if (flags.config) {
      let envVars = await this.heroku.get<Heroku.App>(`/apps/${flags.app}/config-vars`)
      for (var name in envVars.body) {
        let value = envVars.body[name]
        cmdArgs.push(`--env=${name}=${ShellEscape([value])}`)
      }
    }

    if (debug('local:build').enabled) {
      cmdArgs.push(`--debug`)
    }

    cli.debug(`Executing ${bin}`)
    let spawned = child.spawn(bin, cmdArgs, {stdio: 'pipe'})
      .on('error', (err: any) => {
        cli.debug(err)
        this.error(`Failed to build ${flags.app}`)
      })
      .on('close', (code: any) => {
        if (code) this.error(`Failed to build ${flags.app}`)
      });
    spawned.stdout.on('data', (chunk: any) => {
      process.stdout.write(chunk.toString());
    });
    spawned.stderr.on('data', (chunk: any) => {
      process.stderr.write(chunk.toString());
    });
  }
}
