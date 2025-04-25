/**
 * Custom webpack loader to normalize SCSS asset urls
 **/
module.exports = function normalizeAssets(source) {
  const { baseUrl } = this.getOptions();

  return source.replace(/url\(['".\/]*(.*?)['"]?\)/gim, (match, path) =>
    path.indexOf('assets') !== -1 ? `url("${baseUrl}/${path}")` : match
  );
};
