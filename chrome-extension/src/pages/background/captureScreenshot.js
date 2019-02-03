/* global chrome */

export function getImageDimensions(file) {
  return new Promise(function(resolved, rejected) {
    var i = new Image();
    i.onload = function() {
      resolved({ w: i.width, h: i.height });
    };
    i.src = file;
  });
}
