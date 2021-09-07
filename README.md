# esm-loader-svelte

Node esmodules [loader][loaders] for Svelte (Experimental).

I'm using this to test my [SvelteKit][sveltekit] apps with [UVU][uvu] in
full ES6/ESM/import glory.

This allows you to `import` any `.svelte` components from `.js` files if you
use `type: 'module'` in `package.json`. Or, from any `.mjs` files, otherwise.
`.svelte` components will be run through `svelte/compile`. It does not do any
pre-processing, etc.

This will also allow `import` for any `.css` or `.postcss` stylesheet files.
No styles will actually be handled, this is basically a NO-OP for testing,
so that Node won't throw any errors on imported styles.

This is experimental, based on new things, and expected to change a lot. Not
good for production usage. It requires recent versions of Node.js which support
esmodules and experimental loader flags.

## Install

```shell
npm install esm-loader-svelte
```

## Usage

Ordinarily this would fail, because Node doesn't know what `.svelte`
or `.css` files are:

```js
// Component.test.js
import Component from './Component.svelte'
import './styles/layout.css'
```

Our problem is solved by using our loader:

```shell
NODE_OPTIONS="--experimental-loader esm-loader-svelte" npm run test
```

## Notes

* `.json` imports can be handled with experimental node
  flag `--experimental-json-modules`.
* An esm DOM can be loaded into tests by importing `global-jsdom/register`
  from [global-jsdom][jsdom].
* After Node ESM loader hooks are [able to chain well][chain], this module
  should be split between Svelte and Styles.

## TODO

* Svelte Preprocessing?
* CommonJS registers apparently usually do some caching, do we need that? How?

[chain]: https://www.npmjs.com/package/esm-loader-chaining-polyfill
[jsdom]: https://github.com/modosc/global-jsdom
[loaders]: https://nodejs.org/api/esm.html#esm_loaders
[register]: https://svelte.dev/docs#svelte_register
[sveltekit]: https://github.com/sveltejs/kit
[uvu]: https://github.com/lukeed/uvu

