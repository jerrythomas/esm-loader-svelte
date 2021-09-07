import { compile } from 'svelte/compiler'
import createLoader from 'create-esm-loader'
import { parse } from 'path'
import { URL } from 'url'

const svelteExt = '\\.svelte'
const styleExts = ['\\.css', '\\.postcss']
const svelteRegex = new RegExp(`${svelteExt}$`)
const styleRegex = new RegExp(`(${styleExts.join('|')})$`)
const allRegex = new RegExp(`(${[svelteExt, ...styleExts].join('|')})$`)

const svelteLoader = {
  resolve: (specifier, opts) => {
    if (specifier.match(allRegex)) {
      const { parentURL } = opts
      const url = new URL(specifier, parentURL).href
      return { url }
    }
  },

  format: (url, opts) => {
    if (url.match(allRegex)) {
      return { format: 'module' }
    }
  },

  transform: (source, opts) => {
    // .css | .postcss => no-op
    if (opts.url.match(styleRegex)) {
      return { source: '' }
    }

    // .svelte => compile
    if (opts.url.match(svelteRegex)) {
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

      return { source: js.code }
    }
  }
}

const { resolve, getFormat, getSource, transformSource } =
  createLoader(svelteLoader)

export { resolve, getFormat, getSource, transformSource }
