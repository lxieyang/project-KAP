export const getImageDimensions = file => {
  return new Promise(function(resolved, rejected) {
    var img = new Image();
    img.onload = function() {
      resolved({ w: img.width, h: img.height });
    };
    img.src = file;
  });
};
