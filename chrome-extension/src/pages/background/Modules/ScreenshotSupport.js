/* global chrome */
import imageClipper from '../image-clipper.js';
import { getImageDimensions } from '../captureScreenshot';
import * as FirestoreManager from '../../../../../shared-components/src/firebase/firestore_wrapper';

//
//
//
//
//
/* Screenshot support */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.msg === 'SCREENSHOT_WITH_COORDINATES') {
    let rect = request.rect;
    let windowSize = request.windowSize;
    chrome.tabs.captureVisibleTab(screenshotUrl => {
      getImageDimensions(screenshotUrl).then(imageDimensions => {
        let scale = imageDimensions.w / windowSize.width;
        let x = Math.floor(rect.x * scale);
        let y = Math.floor(rect.y * scale);
        let width = Math.floor(rect.width * scale);
        let height = Math.floor(rect.height * scale);
        imageClipper(screenshotUrl, function() {
          this.crop(x, y, width, height).toDataURL(dataUrl => {
            getImageDimensions(dataUrl).then(croppedImageDimensions => {
              let dimensions = {
                trueWidth: croppedImageDimensions.w,
                trueHeight: croppedImageDimensions.h,
                rectWidth: rect.width,
                rectHeight: rect.height,
                rectX: rect.x,
                rectY: rect.y
              };
              FirestoreManager.addScreenshotToPieceById(
                request.pieceId,
                dataUrl,
                { dimensions }
              );
            });
            // // see for yourself the screenshot during testing
            // chrome.tabs.create(
            //   {
            //     url: dataUrl
            //   },
            //   tab => {
            //     // Tab opened.
            //   }
            // );
          });
        });
      });
    });
  } else if (request.msg === 'SCREENSHOT_MODAL_SHOULD_DISPLAY') {
    chrome.tabs.sendMessage(sender.tab.id, {
      msg: `SCREENSHOT_MODAL_SHOULD_DISPLAY`,
      pieceId: request.pieceId,
      imageDataUrl: request.imageDataUrl
    });
  }
});
