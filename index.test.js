import * as assert from 'uvu/assert'
import { resolve, getFormat, getSource, transformSource } from './index.js'
import { suite } from 'uvu'
import { cwd } from 'process'
import { copyFileSync, unlinkSync } from 'fs'

const test = suite('esm-loader-svelte')
const files = {
  svelte: 'file:///src/components/Counter.svelte',
  style: 'file:///static/styles/layout.css',
  svelteKitAlias: 'file:///$app/navigation',
  svelteKitLibAlias: 'file:///$lib/count.js',
}

test('resolve', async () => {
  const result = await resolve(files.svelte)
  assert.match(result.url, new RegExp(files.svelte))
})

test('resolve svelte/kit $alias', async () => {
  copyFileSync('fixture/svelte.config.js', './svelte.config.js')
  const result = await resolve(files.svelteKitLibAlias)
  assert.match(result.url, `file://${cwd()}/file:/src/lib/count.js`)
  unlinkSync('./svelte.config.js')
})

test('getFormat', async () => {
  const result = await getFormat(files.svelte)
  assert.is(result.format, 'module')
})

test('getSource on svelte-kit $app/navigation alias', async () => {
  const result = await getSource(files.svelteKitAlias)
  const source = result.source.toString()
  assert.match(source, 'export { goto }')
})

test('getSource on .css', async () => {
  const result = await getSource(files.style)
  assert.match(result.source, '')
})

test('transformSource on .svelte', async () => {
  const source = `
    <script>
      const hello = 1
    </script>
    <div>
      <span>{hello}</span>
    </div>
    <style>
      span { color: red }
    </style>
  `
  const result = await transformSource(source, { url: files.svelte })
  assert.match(result.source, new RegExp(files.svelte))
  assert.match(result.source, /generated by Svelte/)
})

test('transformSource on preprocessed .svelte', async () => {
  const source = `
    <script>
      const hello = 1
    </script>
    <template>
      <div class="first">
        <span class="second">{hello}</span>
      </div>
    </template>
    <style lang="postcss">
      .first {
        .second {
          color: red;
        }
      }
    </style>
  `
  const result = await transformSource(source, { url: files.svelte })
  assert.match(result.source, new RegExp(files.svelte))
  assert.match(result.source, /generated by Svelte/)
})

test.run()
