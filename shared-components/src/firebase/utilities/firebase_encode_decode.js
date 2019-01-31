const URI = require('urijs');
var Base64 = require('js-base64').Base64;

var encodeUrl = function(url) {
  if (url === undefined) {
    return undefined;
  }
  //Remove any unnecessary parameters from the URL
  let uri = new URI(url);
  uri.removeQuery([
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content'
  ]);
  url = uri.toString();

  return Base64.encode(url).replace(/\//g, '_');
};

var decodeUrl = function(url) {
  if (url === undefined) {
    return undefined;
  }

  return Base64.decode(url.replace(/_/g, '/'));
};

module.exports = {
  encode: encodeUrl,
  decode: decodeUrl
};
