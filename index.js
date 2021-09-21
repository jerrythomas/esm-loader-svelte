import { compile, preprocess } from 'svelte/compiler'
import createLoader from 'create-esm-loader'
import { cwd } from 'process'
import { parse } from 'path'
import sveltePreprocess from 'svelte-preprocess'
import { URL, pathToFileURL } from 'url'

let sveltePreprocessConfig
try {
  sveltePreprocessConfig = (
    await import(`${cwd()}/svelte-preprocess.config.js`)
  ).default
} catch (error) {}

let svelteAliasConfig = {}
try {
  svelteAliasConfig = (await import(`${cwd()}/svelte.config.js`)).default

  svelteAliasConfig = svelteAliasConfig.vite?.resolve?.alias || {}
  svelteAliasConfig['$lib'] = `./src/lib` // add default alias for sveltekit lib
} catch (error) {}

const svelteExt = '\\.svelte'
const assetExts = [
  '\\.css',
  ...Object.keys(sveltePreprocessConfig || {})
    .filter(
      (ext) =>
        // https://github.com/sveltejs/svelte-preprocess/blob/main/src/autoProcess.ts#L50
        !['aliases', 'markupTagName', 'preserve', 'sourceMap'].includes(ext)
    )
    .map((ext) => `\\.${ext}`),
]
const svelteExtRegex = new RegExp(`${svelteExt}$`)
const svelteKitPathRegex = /\$app\//
const assetExtsRegex = new RegExp(`(${assetExts.join('|')})$`)
const allExtRegex = new RegExp(`(${[svelteExt, ...assetExts].join('|')})$`)
const aliasRegex = new RegExp('(\\$\\w*)/')

const svelteLoader = {
  resolve: (specifier, opts) => {
    // replace path aliases with actual paths
    if (specifier.match(aliasRegex)) {
      const alias = specifier.match(aliasRegex)[1]
      let name = specifier

      if (alias in svelteAliasConfig) {
        name = specifier.replace(alias, svelteAliasConfig[alias])
      } else if (alias !== '$app') {
        console.warn(
          `svelte.config.js does not contain configuration for alias "${alias}"`
        )
      }
      let url = pathToFileURL(name).href
      return { url }
    }

    // turn all our exts+paths into valid paths
    if (specifier.match(allExtRegex) || specifier.match(svelteKitPathRegex)) {
      const { parentURL } = opts
      const url = new URL(specifier, parentURL).href
      return { url }
    }
  },

  format: (url, opts) => {
    // turn all our exts+paths into modules
    if (url.match(allExtRegex) || url.match(svelteKitPathRegex)) {
      return { format: 'module' }
    }
  },

  fetch: (url, opts) => {
    // sveltekit paths built-in aliases mocks
    if (url.match(svelteKitPathRegex)) {
      if (url.match(/\/navigation/)) {
        return {
          source: Buffer.from(
            `
            const goto = () => {}
            export { goto }
          `.trim(),
            'utf8'
          ),
        }
      }
    }

    // turn assets exts into valid empty sources instead of failing
    if (url.match(assetExtsRegex)) {
      return { source: '' }
    }
  },

  transform: async (source, opts) => {
    // turn svelte templates into valid preprocessed and compiled js code
    if (opts.url.match(svelteExtRegex)) {
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
  },
}

const { resolve, getFormat, getSource, transformSource } =
  createLoader(svelteLoader)

export { resolve, getFormat, getSource, transformSource }
