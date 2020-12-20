# next

The next version of material-table-core

# yarn

-   `yarn build`
    -   Bundles code using [`esbuild`](https://github.com/evanw/esbuild)
    -   Entry `src/index.ts`
    -   Bundle output `bundle/material-table-core.next.js`
-   `yarn serve:app`
    -   Source can be found at `test/app/*`
    -   Launches `webpack serve` (dev server) for testing
    -   Use for quick and dirty testing on the fly
    -   While you are able to build this code, there shouldn't be a need to (currently, we do not provide a `yarn` command to build this code)
