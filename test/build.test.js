import test from 'brittle'
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'bare-fs'
import { join } from 'bare-path'
import { tmpdir } from 'bare-os'
import { openRepo } from 'mycelium-git'
import { open } from 'mrepo-base-runtime'
import { build } from '../index.js'

// (a preloaded request: its offset its author's, before anything arrives)
const PRELOADED = '0000000000001'
// A boot mrepo's structure, written here (the module's tests stand on their
// own): its layers, a .layer.json each, a preloaded boot deploy /host.
const BOOT = mkdtempSync(join(tmpdir(), 'boot-structure-'))
for (const l of ['main', 'runtime', 'protocols', 'inbox', 'outbox', 'packages', 'request/pending/default', 'request/execute', 'request/done']) {
  mkdirSync(join(BOOT, l), { recursive: true })
  // (the boxes and request/done: streaming layers, their structure declared)
  writeFileSync(join(BOOT, l, '.layer.json'), JSON.stringify({ mode: l.startsWith('request') || l.endsWith('box') ? 'non-atomic' : 'atomic', description: l, ...(l.endsWith('box') || l === 'request/done' ? { structure: { type: 'offset-files', levels: [5, 6], batch: 50 } } : {}) }))
}
// a boot hook, as a defining package would drop it: crud active from boot
mkdirSync(join(BOOT, 'runtime', 'hooks'), { recursive: true })
writeFileSync(join(BOOT, 'runtime', 'hooks', 'boot.haicc'), 'protocol/activate . crud\n')
const preloaded = { api: 'boot', protocol: 'boot', action: 'deploy', uri: ['main', 'host'], args: ['haiccing/base-package-runtime'] }
writeFileSync(join(BOOT, 'request', 'pending', 'default', `${PRELOADED}.json`), JSON.stringify({ topic: '/request/pending/default', offset: Number(PRELOADED), timestamp: '2026-11-11T00:00:00.000Z', headers: {}, value: { topic: null, offset: Number(PRELOADED), timestamp: '2026-11-11T00:00:00.000Z', headers: {}, value: preloaded } }))

test('the boot mrepo: built from its folder, the same twice', async (t) => {
  const a = mkdtempSync(join(tmpdir(), 'build-a-'))
  const b = mkdtempSync(join(tmpdir(), 'build-b-'))
  try {
    const one = await build({ from: BOOT, work: a, name: 'boot', time: 1762732800 })
    const two = await build({ from: BOOT, work: b, name: 'boot', time: 1762732800 })
    t.alike(Object.keys(one.layers).sort(), ['inbox', 'main', 'outbox', 'packages', 'protocols', 'request/done', 'request/execute', 'request/pending/default', 'runtime'], 'a layer per leaf')
    t.alike(one.layers, two.layers, 'the same folder, the same commits')
    t.alike(JSON.parse(readFileSync(join(a, 'mrepo.json'))), { storage: 'filesystem', name: 'boot' }, 'the setting: every layer on the filesystem')
    t.ok(existsSync(join(a, 'mrepos', 'boot', 'inbox', '.layer.json')), 'the inbox\'s working tree')
    t.ok(existsSync(join(a, 'mrepos', 'boot', 'outbox', '.layer.json')), 'the outbox\'s working folder, there before any record')
    const r = await open(a)
    const repo = openRepo(r.backend)
    t.is(JSON.parse((await repo.read('/runtime/.layer.json')).toString()).mode, 'atomic', '.layer.json committed with its layer')
    t.is((await repo.read('/runtime/hooks/boot.haicc')).toString(), 'protocol/activate . crud\n', 'a hook file dropped into the runtime layer: committed with it')
    t.is((await repo.select(`/request/pending/default/${PRELOADED}.json`)).length, 1, 'the request preloaded')
    await t.exception(build({ from: BOOT, work: a, name: 'boot' }), /exists/, 'never over an existing one')
  } finally {
    rmSync(a, { recursive: true, force: true })
    rmSync(b, { recursive: true, force: true })
  }
})

test('the structure written for the tests removed', () => rmSync(BOOT, { recursive: true, force: true }))
