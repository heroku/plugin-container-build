import {expect, test} from '@oclif/test'
import * as fs from 'fs'
const child = require('child_process')
const tmp = require('tmp')

describe('local:build', () => {
  test
    .add('cwd', () => process.cwd())
    .add('tmpdir', () => {
      let tmpdir = tmp.dirSync({unsafeCleanup: true, prefix: 'heroku_local_'})
      process.chdir(tmpdir.name)
      return tmpdir
    })
    .do(ctx => {
      child.spawnSync("git", ["clone", "https://github.com/heroku/node-js-getting-started", "."])
    })
    .add('app', () => {
      return "foo"
    })
    .command(['local:build', '--app=foo'])
    .finally(ctx => {
      ctx.tmpdir.removeCallback()
      process.chdir(ctx.cwd)
    })
    .it('bootstraps new buildpack', (ctx) => {
      expect(fs.existsSync(`${ctx.app}.slug`)).to.equal(true)
      expect(fs.existsSync(`.${ctx.app}.cache`)).to.equal(true)
    })
})
