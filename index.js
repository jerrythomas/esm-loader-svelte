import { compile } from 'svelte/compiler'
import createLoader from 'create-esm-loader'
import { parse } from 'path'
import { URL } from 'url'

const EXT = '.svelte'

const svelteLoader = {
  resolve: (specifier, opts) => {
    if (specifier.endsWith(EXT)) {
      const { parentURL } = opts
      const url = new URL(specifier, parentURL).href
      return { url }  
    }
  },
  format: (url, opts) => {
    if (url.endsWith(EXT)) {
      return { format: 'module' }
    }
  },
  transform: (source, opts) => {
    if (opts.url.endsWith(EXT)) {
      const { name } = parse(opts.url)
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
