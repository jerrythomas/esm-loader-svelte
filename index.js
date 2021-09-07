import { compile } from 'svelte/compiler'
import createLoader from 'create-esm-loader'
import { parse } from 'path'
import { URL } from 'url'

const svelteExt = '.svelte'

const svelteLoader = {
  resolve: (specifier, opts) => {
    if (specifier.endsWith(svelteExt)) {
      const { parentURL } = opts
      const url = new URL(specifier, parentURL).href
      return { url }
    }
  },

  format: (url, opts) => {
    if (url.endsWith(svelteExt)) {
      return { format: 'module' }
    }
  },

  transform: (source, opts) => {
    if (opts.url.endsWith(svelteExt)) {
      let { name } = parse(opts.url)
      name = name.replace(/[^A-Za-z0-9]/g, '')

      const { js, warnings } = compile(source.toString(), {
        name: name[0].toUpperCase() + name.substring(1),
        filename: opts.url,
      })

      warnings.forEach((warning) => {
        console.warn(`\nSvlete compile() warnings for ${warning.filename}:`)
        console.warn(warning.message)
        console.warn(warning.frame)
      })

      return {
        source: js.code,
      }
    }
  },
}

const { resolve, getFormat, getSource, transformSource } =
  createLoader(svelteLoader)

export { resolve, getFormat, getSource, transformSource }
