const singleSpaAngularWebpack =
  require('single-spa-angular/lib/webpack').default;
const path = require('path');
const fs = require('fs');

/**
 * Customize the Angular Webpack object for use with SingleSpa
 *
 * This is a hack to modify the live webpack object before building
 * the application. It installs loaders to modify the .scss and .ts
 * files during the build process. The loaders just
 **/
module.exports = function customizeWebpackConfig(config, options) {
  const newConfig = singleSpaAngularWebpack(config, options);
  const baseUrl = process.env.WEBPACK_PUBLIC_PATH || 'http://localhost:4200';

  findALoader('style-loader', newConfig, true).push({
    options: { baseUrl },
    loader: path.resolve('./webpack-loader-scss.sspa.js')
  });
  findALoader('webpack-loader', newConfig, true).push({
    options: { baseUrl },
    loader: path.resolve('./webpack-loader-ts.sspa.js')
  });

  const styleLoader = findALoader('style-loader', newConfig, false);
  styleLoader.options = {
    attributes: { name: 'crmgrow' }
  };

  const postCssLoader = findALoader('postcss-loader', newConfig, false);
  const ogPostCssOptions = postCssLoader.options.postcssOptions;

  postCssLoader.options.postcssOptions = function (loaderContext) {
    let originalOptions = {};

    if (typeof ogPostCssOptions === 'function') {
      originalOptions = ogPostCssOptions(loaderContext);
    } else if (ogPostCssOptions) {
      originalOptions = ogPostCssOptions;
    }

    return {
      ...originalOptions,
      plugins: [
        ...(originalOptions.plugins || {}),
        [
          'postcss-prefix-selector',
          {
            prefix: '#single-spa-application\\:crm',
            transform: function (
              prefix,
              selector,
              prefixedSelector,
              filePath,
              rule
            ) {
              if (filePath.includes('globalScope')) {
                return selector;
              }
              if (/.*\b(?<!-)body(?!-)\b.*/.test(selector)) {
                // This will transform usages of the body tag into the MFE root element id.
                return selector.replace(/\b(?<!-)body(?!-)\b/g, prefix);
              } else {
                return prefixedSelector;
              }
            }
          }
        ]
      ]
    };
  };

  return { ...newConfig, externals: ['@redx/api-ui'] };
};

/**
 * Used to get a loader or its parent.
 *
 * @param {String} loaderName - The string name of the loader.
 * @param {any} value - The thing we are examining to see if we are on a loader or near a loader. (recursively traversed)
 * @param {Boolean} shouldGetParent - Whether to return the parent object or the object for the loader itself.
 * @param {null|Object|Array} parent - The object that we traversed from.
 *
 * @returns {any|null}
 */
function findALoader(loaderName, value, shouldGetParent = true, parent = null) {
  if (!value || typeof value !== 'object') return;
  if (new RegExp(`.*\\b${loaderName}\\b.*`).test(value.loader))
    return shouldGetParent ? parent : value;
  if (!Array.isArray(value)) value = Object.values(value);

  return value.reduce(
    (out, entry) =>
      out || findALoader(loaderName, entry, shouldGetParent, value),
    null
  );
}

// function findLoader(name, node, parent = null) {
//   if (!node || typeof node !== 'object') {
//     return;
//   }
//   if (typeof node.loader === 'string' && node.loader.indexOf(name) >= 0) {
//     return parent;
//   }
//   if (!Array.isArray(node)) {
//     node = Object.values(node);
//   }
//   return node.reduce(
//     (out, entry) => out || findLoader(name, entry, node),
//     null
//   );
// }
