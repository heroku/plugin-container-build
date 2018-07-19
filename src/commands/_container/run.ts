// note that we are using @heroku-cli/command instead of @oclif/command
// this inherits from @oclif/command but extends it with Heroku-specific functionality
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as debug from 'debug'
import * as execa from 'execa'

import {Tatara} from '../../tatara'

export default class Run extends Command {
  static description = 'Run a locally built app'
  static examples = [`
$ heroku _container:run`,
  ]
  static flags = {
    remote: flags.remote(),
    app: flags.app({required: true}),
    'skip-stack-pull': flags.boolean(),
    type: flags.string({char: 't'}),
    config: flags.boolean()
  }

  static args = [
    {
      name: 'command',
      required: false,
    }
  ]

  async run() {
    const {args, flags} = this.parse(Run)

    let bin = (new Tatara(process.platform)).path()

    let cmdArgs = ['run', flags.app]

    if (args.command) {
      if (args.command === 'bash') {
        cmdArgs.push('--shell')
      } else {
        throw new Error('Custom run commands are not yet supported!')
      }
    }

    if (flags['skip-stack-pull']) {
      cmdArgs.push('--skip-stack-pull')
    }

    if (flags.type) {
      cmdArgs.push(`--process-type=${flags.type}`)
    }

    if (debug('_container:run').enabled) {
      cmdArgs.push('--debug')
    }

    if (flags.config) {
      let envVars = await this.heroku.get<Heroku.App>(`/apps/${flags.app}/config-vars`)
      for (let [k, v] of Object.entries(envVars.body)) {
        cmdArgs.push(`--env=${k}=${v}`)
      }
    }

    await execa(bin, cmdArgs, {stdio: 'inherit'})
  }
}
