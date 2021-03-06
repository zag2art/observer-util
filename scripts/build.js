const fs = require('fs')
const path = require('path')
const del = require('del')
const babel = require('babel-core')
const buble = require('buble')
const rollup = require('rollup')
const resolvePlugin = require('rollup-plugin-node-resolve')
const babelPlugin = require('rollup-plugin-babel')
const externalsPlugin = require('rollup-plugin-auto-external')

const bundles = [
  {
    input: {
      input: path.resolve('src/index.js'),
      plugins: [
        babelPlugin({
          exclude: 'node_modules/**'
        }),
        resolvePlugin(),
        externalsPlugin({ dependencies: true, peerDependecies: true })
      ]
    },
    output: {
      format: 'es'
    }
  },
  {
    input: {
      input: path.resolve('src/index.js'),
      plugins: [
        babelPlugin({
          exclude: 'node_modules/**'
        }),
        resolvePlugin(),
        externalsPlugin({ dependencies: true, peerDependecies: true })
      ]
    },
    output: {
      format: 'cjs'
    }
  }
]

async function build () {
  // Clean up the output directory
  await del(path.resolve('dist'))
  fs.mkdirSync(path.resolve('dist'))

  // Compile source code into a distributable format with Babel and Rollup
  for (const config of bundles) {
    const es6Path = path.resolve('dist', `${config.output.format}.es6.js`)
    const bundle = await rollup.rollup(config.input)
    const { code: es6Code } = await bundle.generate(config.output)
    fs.writeFileSync(es6Path, es6Code, 'utf-8')

    const es6MinPath = path.resolve(
      'dist',
      `${config.output.format}.es6.min.js`
    )
    const { code: es6MinCode } = babel.transform(es6Code, {
      // dead code elimination breaks the delete trap
      // by moving the hadKey part after the deletion, which always results in false
      presets: [['minify', { deadcode: false }]]
    })
    fs.writeFileSync(es6MinPath, es6MinCode, 'utf-8')

    const es5Path = path.resolve('dist', `${config.output.format}.es5.js`)
    const { code: es5Code } = buble.transform(es6Code, {
      transforms: {
        dangerousForOf: true,
        modules: false
      }
    })
    fs.writeFileSync(es5Path, es5Code, 'utf-8')

    const es5MinPath = path.resolve(
      'dist',
      `${config.output.format}.es5.min.js`
    )
    const { code: es5MinCode } = babel.transform(es5Code, {
      presets: [['minify', { deadcode: false }]]
    })
    fs.writeFileSync(es5MinPath, es5MinCode, 'utf-8')
  }
}

build()
