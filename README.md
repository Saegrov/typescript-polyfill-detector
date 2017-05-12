

# ES6 Built in feature detection

A small prototype to show that it is possible to detect the usage of built-ins like Array.includes() using `TypeScript`.

The output from a program like this can be used to decide which polyfills to include your application.

## Running

```
npm run compile-includes
npm run compile-no-includes

# OR

yarn run compile-includes
yarn run compile-no-includes
```



# Related work and discussions
https://github.com/babel/babel-preset-env/issues/294
https://github.com/babel/babel-preset-env/pull/298