#!/usr/bin/env node

const tools = require("@iconify/tools");
const path = require("path");
const chalk = require("chalk");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const args = yargs(hideBin(process.argv))
  .usage(
    "Usage: iconify-packager -d <directory> -o <output filename> -p <pack>"
  )
  .option("d", {
    alias: "directory",
    describe: "The svg source path",
    type: "string",
    default: ".",
  })
  .option("o", {
    alias: "output",
    describe: "The output filename",
    type: "string",
    default: "pack.json",
  })
  .option("p", {
    alias: "pack",
    describe: "The icon's pack name",
    type: "string",
    demandOption: true,
  }).argv;

let SVGOOptions = {
  convertShapeToPath: true,
  mergePaths: false,
};

let collection;

const target = args.output;

tools
  .ImportDir(path.join(process.cwd(), args.directory), {
    prefix: args.pack,
  })
  .then((result) => {
    if (result.length() === 0) {
      console.log(chalk.yellow("Empty directory"));
      process.exit(0);
    }

    collection = result;

    console.log(chalk.green("Imported", collection.length(), "icons."));

    // Optimize SVG files
    return collection.promiseEach(
      (svg, key) =>
        new Promise((fulfill, _reject) => {
          tools
            .SVGO(svg, SVGOOptions)
            .then((res) => {
              fulfill(res);
            })
            .catch((_err) => {
              console.log(chalk.red("Error optimizing icon " + key));
              collection.remove(key);
              console.log(chalk.blue("Removed bad icon."));
              fulfill(null);
            });
        }),
      true
    );
  })
  .then(() => {
    // Clean up tags
    return collection.promiseEach(
      (svg, key) =>
        new Promise((fulfill, reject) => {
          tools
            .Tags(svg)
            .then((res) => {
              fulfill(res);
            })
            .catch((err) => {
              reject(
                "Error checking tags in icon " + key + "\n" + util.format(err)
              );
            });
        }),
      true
    );
  })
  .then(() => {
    // Move icons origin to 0,0
    // This is not needed for most collections, but its useful to know how to do it
    let promises = [];
    collection.forEach((svg, key) => {
      if (svg.top !== 0 || svg.left !== 0) {
        let body = svg.getBody();
        if (body.indexOf("<defs") !== -1) {
          return;
        }

        let content = "<svg";
        content += ' width="' + svg.width + '"';
        content += ' height="' + svg.height + '"';
        content += ' viewBox="0 0 ' + svg.width + " " + svg.height + '"';
        content += ' xmlns="http://www.w3.org/2000/svg">\n';
        content +=
          '<g transform="translate(' +
          (0 - svg.left) +
          " " +
          (0 - svg.top) +
          ')">' +
          body +
          "</g>";
        content += "</svg>";

        svg.load(content);
        promises.push(
          new Promise((fulfill, reject) => {
            // Use SVGO to optimize icon. It will get apply transformation to shapes
            tools
              .SVGO(svg, SVGOOptions)
              .then((res) => {
                fulfill(res);
              })
              .catch((err) => {
                reject(
                  "Error changing icon origin for " +
                    key +
                    "\n" +
                    util.format(err)
                );
              });
          })
        );
      }
    });
    return Promise.all(promises);
  })
  .then(() => {
    // Change color to "currentColor" to all icons to monotone collections:
    let options = {
      default: "currentColor", // change all colors to "currentColor"
      add: "currentColor", // add "currentColor" to shapes that are missing color value
    };

    /*
    //TODO: use this to clean up icons with multicolor icons:
    let options = {
        add: 'currentColor',
    };
    */

    return collection.promiseEach(
      (svg) => tools.ChangePalette(svg, options),
      true
    );
  })
  .then(() => {
    // Export JSON collection
    console.log("Exporting collection to", target);
    return tools.ExportJSON(collection, target, {
      optimize: true,
    });
  })
  .catch((err) => {
    console.error(err);
  });
