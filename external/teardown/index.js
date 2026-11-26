// teardown(exec, { uri }): the boot protocol's teardown (README.md beside it).
import { rmSync } from 'bare-fs'
import { stop, decommission } from 'mrepo-base-runtime'
import { child } from '../../internal/child.js'
import { teardownPair } from '../../internal/pair/index.js'

export async function teardown (exec, { uri }) {
  const c = await child(exec, uri)
  const recorded = await c.recorded()
  // Idempotent: not deployed (torn down already): allowed, a warning,
  // nothing done. Data at the position: not the boot protocol's, refused.
  if (!recorded) {
    await c.refuse()
    exec.log('warn', 'not deployed', `A repeat: ${c.at} is not deployed; nothing done.`)
    return `${c.at} is not deployed: nothing torn down.`
  }
  // A pair: torn down by the container's platform, the container and its
  // folder removed (internal/pair); this host never stops its runtime.
  // Else its runtime stopped first (when it runs), waited for until its
  // process has ended (mrepo-base-runtime's stop: asked, then SIGTERM, then
  // SIGKILL), and its folder removed.
  // Its decommission first, by its runtime (a pair's: by the container's
  // platform, its own teardown): what the mrepo does before it goes, what
  // it deployed torn down. A line that fails stops the teardown, nothing
  // removed. Its runtime not answering: nothing to ask, torn down all the same.
  if (recorded.how !== 'container') {
    const d = await exec.step('decommission', r => `Its decommission asked of its runtime: ${r ? (r.ok ? r.decommission : r.error) : 'its runtime not answering'}.`, () => decommission({ repo: c.dir }))
    if (d && !d.ok) throw new Error(`not torn down: ${c.at}: its ${d.error}`)
  }
  const pair = recorded.how === 'container' ? await teardownPair(exec, c, recorded) : null
  const stopped = pair ? null : await exec.step('runtime', r => (r ? `Its runtime stopped, pid ${r.pid} (${r.how}).` : 'No runtime of it running.'), () => stop({ repo: c.dir, pid: recorded.runtime?.pid }))
  if (!pair) await exec.step('folder', `Its folder removed: ${c.dir}.`, async () => rmSync(c.dir, { recursive: true, force: true }))
  // its link, the node it was made at, and what was local about it
  exec.remove(c.links)
  exec.remove(c.node)
  if (recorded.link && await exec.find(c.local(recorded.link)) !== null) exec.remove(c.local(recorded.link))
  return pair
    ? `Torn down ${c.at} (${c.mrepo}): its container ${pair.container?.name ?? pair.container} removed, its link out.`
    : `Torn down ${c.at} (${c.mrepo}): ${stopped ? `its runtime stopped, pid ${stopped.pid}` : 'no runtime of it running'}, its folder removed, its link out.`
}
