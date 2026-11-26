// redeploy(exec, form): the boot protocol's redeploy, teardown then deploy (README.md beside it).
import { child } from '../../internal/child.js'
import { deploy } from '../deploy/index.js'
import { teardown } from '../teardown/index.js'

export async function redeploy (exec, form) {
  const c = await child(exec, form.uri)
  const was = await c.recorded()
  exec.log('verbose', 'again', `${c.at} again, from ${form.args?.[0] ?? was?.package ?? 'no package'}${was?.package ? ` (it was from ${was.package})` : ''}.`)
  const down = await teardown(exec, form)
  await exec.commit('torn down')
  // (the link keeps its key: the same link, its mrepo built again)
  // (a pair is deployed again as one: into a container)
  const flags = was?.how === 'container' ? { ...(form.flags ?? {}), container: true } : form.flags
  return [down, await deploy(exec, { ...form, flags, args: [form.args?.[0] ?? was?.package] }, { link: was?.link ?? null })].join('\n')
}
