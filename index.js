import { compile, preprocess } from 'svelte/compiler'
import createLoader from 'create-esm-loader'
import { cwd } from 'process'
import { parse } from 'path'
import sveltePreprocess from 'svelte-preprocess'
import { URL } from 'url'

let sveltePreprocessConfig
try {
  sveltePreprocessConfig = (
    await import(`${cwd()}/svelte-preprocess.config.js`)
  ).default
} catch(error) {}

const svelteExt = '\\.svelte'
const assetExts = [
  '\\.css',
  ...Object.keys(sveltePreprocessConfig || {})
    .filter((ext) =>
      // https://github.com/sveltejs/svelte-preprocess/blob/main/src/autoProcess.ts#L50
      !['aliases', 'markupTagName', 'preserve', 'sourceMap'].includes(ext)
    )
    .map((ext) => `\\.${ext}`)
]
const svelteRegex = new RegExp(`${svelteExt}$`)
const assetRegex = new RegExp(`(${assetExts.join('|')})$`)
const allRegex = new RegExp(`(${[svelteExt, ...assetExts].join('|')})$`)

const svelteLoader = {
  resolve: (specifier, opts) => {
    // turn all our exts into valid paths
    if (specifier.match(allRegex)) {
      const { parentURL } = opts
      const url = new URL(specifier, parentURL).href
      return { url }
    }
  },

  format: (url, opts) => {
    // turn all our exts into modules
    if (url.match(allRegex)) {
      return { format: 'module' }
    }
  },

  fetch: (url, opts) => {
    // turn assets exts into valid empty sources instead of failing
    if (url.match(assetRegex)) {
      return { source: '' }
    }
  },

  transform: async (source, opts) => {
    // turn svelte templates into valid preprocessed and compiled js code
    if (opts.url.match(svelteRegex)) {
      let { name } = parse(opts.url)
      name = name.replace(/[^A-Za-z0-9]/g, '')

      if (sveltePreprocessConfig) {
        const processed = await preprocess(
          source.toString(),
          sveltePreprocess(sveltePreprocessConfig)
        )
        source = processed.code
      }

      const { js, warnings } = compile(source.toString(), {
        name: name[0].toUpperCase() + name.substring(1),
        filename: opts.url,
      })
      warnings.forEach((warning) => {
        console.warn(`\nSvelte compile() warnings for ${warning.filename}:`)
        console.warn(warning.message)
        console.warn(warning.frame)
      })

      return { source: js.code }
    }
  }
}

const { resolve, getFormat, getSource, transformSource } =
  createLoader(svelteLoader)

export { resolve, getFormat, getSource, transformSource }
