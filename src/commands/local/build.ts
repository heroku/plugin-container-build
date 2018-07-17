// note that we are using @heroku-cli/command instead of @oclif/command
// this inherits from @oclif/command but extends it with Heroku-specific functionality
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {cli} from 'cli-ux'
import * as debug from 'debug'
import * as execa from 'execa'

import {Tatara} from '../../tatara'

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

  async run() {
    const {flags} = this.parse(Build)

    let bin = (new Tatara(process.platform).path())

    let cmdArgs = ['build', process.cwd(), flags.app]
    if (flags['skip-stack-pull']) {
      cmdArgs.push('--skip-stack-pull')
    }

    if (flags.config) {
      let envVars = await this.heroku.get<Heroku.App>(`/apps/${flags.app}/config-vars`)
      for (let [k, v] of Object.entries(envVars.body)) {
        cmdArgs.push(`--env=${k}=${v}`)
      }
    }

    if (debug('local:build').enabled) {
      cmdArgs.push('--debug')
    }

    cli.debug(`Executing ${bin}`)
    await execa(bin, cmdArgs, {stdio: 'inherit'})
  }
}
