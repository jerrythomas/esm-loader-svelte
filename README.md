# esm-loader-svelte

Node esmodules [loader][loaders] for Svelte (Experimental).

This allows you to `import` any `.svelte` components from `.js` files if you 
use `type: 'module'` in `package.json`. Or, from any `.mjs` files, otherwise.

This is like [svelte/register][register], but for esmodules (`import`) 
instead of the older commonjs (`require`). 

This is experimental, based on new things, and expected to change a lot. Not
good for production usage. It requires recent versions of Node.js which support
esmodules and experimental loader flags.

## Install

```shell
npm install esm-loader-svelte
```

## Usage

Ordinarily this would fail, because Node doesn't know what a `.svelte` file is:

```js
// Component.test.js
import Component from './Component.svelte'
```

Our problem is solved by using our loader:

```shell
NODE_OPTIONS="--loader esm-loader-svelte" npm run test
```

## TODO

* Pre-processing?
* Caching?
* etc?

[loaders]: https://nodejs.org/api/esm.html#esm_loaders
[register]: https://svelte.dev/docs#svelte_register 
