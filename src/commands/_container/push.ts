// note that we are using @heroku-cli/command instead of @oclif/command
// this inherits from @oclif/command but extends it with Heroku-specific functionality
import {Command, flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'
import * as debug from 'debug'
import {HTTP} from 'http-call'

import Build from './build'
import Export from './export'

const fs = require('fs')
const Sanbashi = require('../../sanbashi')
const streamer = require('../../streamer')
const procfileParse = require('parse-procfile')
const YAML = require('yamljs')

type ReleaseBody = {
  addon_plan_names: [string],
  app: {
    id: string,
    name: string
  },
  created_at: Date,
  description: string,
  status: 'succeeded' | 'pending' | 'failded',
  id: string,
  slug?: string,
  updated_at: Date,
  user: {
    email: string,
    id: string
  },
  version: number,
  current: boolean,
  output_stream_url?: string,
}

type ProcessTypes = {
  [property: string]: string
}

export default class Push extends Command {
  static description = 'Deploy an app'
  static examples = [`
$ heroku _container:push`,
  ]
  static flags = {
    remote: flags.remote(),
    app: flags.app({required: true}),
    'skip-stack-pull': flags.boolean()
  }

  async run() {
    const {flags} = this.parse(Push)

    // build
    if (!fs.existsSync(`${flags.app}.slug`)) {
      cli.styledHeader(`No slug detected, building slug for ${flags.app}`)
      let buildArgs = []
      if (flags['skip-stack-pull']) {
        buildArgs.push('--skip-stack-pull')
      }
      await Build.run(buildArgs)
    }

    // export
    let exportArgs = []
    if (flags['skip-stack-pull']) {
      exportArgs.push('--skip-stack-pull')
    }
    cli.styledHeader(`Export docker image for ${flags.app}`)
    await Export.run(exportArgs)

    await Sanbashi.cmd('tar', ['-xf', `${flags.app}.slug`, './app/release.yml'])
    let processes: ProcessTypes = {}
    let releaseYml = YAML.load('app/release.yml')
    for (let processType in releaseYml.default_process_types) {
      processes[processType] = ''
    }
    if (fs.existsSync('Procfile')) {
      let procfile = procfileParse(fs.readFileSync('Procfile', 'utf8'))
      for (let processType in procfile) {
        processes[processType] = ''
      }
    }

    for (let processType in processes) {
      cli.styledHeader(`Deploying process '${processType}'`)
      let registryImage = `registry.heroku.com/${flags.app}/${processType}`
      cli.action.start(`Tagging image ${registryImage}`)
      await Sanbashi.tag(flags.app, registryImage)
      cli.action.stop()

      // push
      let pushMessage = `Pushing ${processType}`
      if (debug('_container:push').enabled) {
        cli.log(pushMessage)
        await Sanbashi.pushImage(registryImage, {output: false})
      } else {
        cli.action.start(pushMessage)
        await Sanbashi.pushImage(registryImage, {output: true})
        cli.action.stop()
      }

      // release
      let imageID = await Sanbashi.imageID(registryImage)
      let updateData = [{
        type: processType,
        docker_image: imageID
      }]

      cli.action.start(`Releasing ${processType}`)
      await this.heroku.patch(`/apps/${flags.app}/formation`, {
        body: {updates: updateData},
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.docker-releases'
        }
      })
      cli.action.stop()
    }

    let release: ReleaseBody = await this.heroku.request(`/apps/${flags.app}/releases`, {
      partial: true,
      headers: {Range: 'version ..; max=2, order=desc'}
    }).then((releases: HTTP<any>): ReleaseBody => releases.body[0])

    if (release.output_stream_url && release.status === 'pending') {
      cli.action.start('Running release command')
      await streamer(release.output_stream_url, process.stdout)
      cli.action.stop()
    }
  }
}
