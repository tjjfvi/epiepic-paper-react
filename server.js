/* eslint-disable no-console */

const browserify = require("browserify");
const babelify = require("babelify");
const watchify = require("watchify");
const fs = require("fs-extra");
const stylus = require("stylus");
const watch = require("node-watch");
const { promisify } = require("util");

const b = browserify(__dirname + "/static/js/index.js", {
  entries: [
    "node_modules/babel-polyfill",
    __dirname + "/static/js/index.js",
  ],
  cache: {},
  packageCache: {},
  transform: [ babelify.configure({
    presets: [
      "@babel/preset-env",
      "@babel/preset-react",
      "@babel/preset-flow",
    ],
    plugins: [
      "@babel/plugin-proposal-class-properties",
      "@babel/plugin-proposal-nullish-coalescing-operator",
      "@babel/plugin-proposal-optional-chaining",
    ],
  }) ],
  debug: true,
  plugin: [ watchify ],
});

b.on("update", bundle);
bundle();

function bundle(){
  console.log("Bundling client JS...");
  b.bundle()
    .on("end", () => console.log("Bundled client JS"))
    .on("error", e => console.error(e))
    .pipe(fs.createWriteStream(__dirname + "/static/bundle.js"));
}

async function bundleStylus(){
  console.log("Bundling stylus...");
  let css = await promisify(stylus.render)(
    `@import '${__dirname + "/static/stylus/"}*'`,
    {
      filename: "_.styl",
      sourcemap: {
        comment: false,
        inline: true,
        basePath: __dirname + "/static/",
      },
    }
  );
  await fs.writeFile(__dirname + "/static/bundle.css", css);
  console.log("Bundled stylus");
}

bundleStylus();
watch(__dirname + "/static/stylus/", {
  persistent: false,
  recursive: true,
}, bundleStylus);

const express = require("express");
const app = express();
app.use(express.static(__dirname + "/static/"));
app.listen(8080);
