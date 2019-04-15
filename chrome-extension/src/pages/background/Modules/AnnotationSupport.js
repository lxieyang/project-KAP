/* global chrome */
import imageClipper from '../image-clipper.js';
import { getImageDimensions } from '../captureScreenshot';
import * as FirestoreManager from '../../../../../shared-components/src/firebase/firestore_wrapper';
import { PIECE_TYPES } from '../../../../../shared-components/src/shared/types';

let showSuccessStatusInIconBadgeTimeout = 0;
function showSuccessStatusInIconBadge(success = true) {
  // change to success
  chrome.browserAction.setBadgeText({ text: success ? '✓' : '✕' });
  chrome.browserAction.setBadgeBackgroundColor({
    color: success ? [31, 187, 45, 1] : [251, 11, 32, 1]
  });
  clearTimeout(showSuccessStatusInIconBadgeTimeout);
  showSuccessStatusInIconBadgeTimeout = setTimeout(() => {
    chrome.browserAction.setBadgeText({ text: '' });
  }, 6000);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'SHOW_SUCCESS_STATUS_BADGE') {
    if (request.success) {
      showSuccessStatusInIconBadge(true);
    } else {
      showSuccessStatusInIconBadge(false);
    }
  }
});

//
//
//
//
//
/* annotation sidebar support */
let annotation_selected = false;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'ANNOTATION_SELECTED') {
    // console.log('annotation selected');
    annotation_selected = true;
    chrome.runtime.sendMessage({
      msg: 'ANNOTATION_SELECTED'
    });
  } else if (request.msg === 'SELECTED_ANNOTATION_ID_UPDATED') {
    // console.log('annotation unselected');
    chrome.runtime.sendMessage({
      msg: 'SELECTED_ANNOTATION_ID_UPDATED',
      pieceId: request.pieceId
    });
  } else if (request.msg === 'ANNOTATION_UNSELECTED') {
    // console.log('annotation unselected');
    annotation_selected = false;
    chrome.runtime.sendMessage({
      msg: 'ANNOTATION_UNSELECTED'
    });
  } else if (request.msg === 'ANNOTATION_LOCATION_SELECTED_IN_TABLE') {
    chrome.tabs.sendMessage(sender.tab.id, {
      msg: `ANNOTATION_LOCATION_SELECTED_IN_TABLE`,
      payload: request.payload
    });
  }
});

//
//
//
//
//
/* selectTooltip support */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'CREATE_NEW_ANNOTATION_BY_TOOLTIP_BUTTON_CLICKED') {
    const {
      annotation,
      contextData,
      annotationType,
      type,
      timer
    } = request.payload;

    FirestoreManager.createPiece(
      annotation,
      contextData,
      annotationType,
      type,
      timer
    )
      .then(pieceId => {
        // chrome.runtime.sendMessage({
        //   msg: 'SHOW_SUCCESS_STATUS_BADGE',
        //   success: true
        // });
        showSuccessStatusInIconBadge(true);

        if (type === PIECE_TYPES.option) {
          FirestoreManager.putOptionIntoDefaultTable({ pieceId });
        } else if (type === PIECE_TYPES.criterion) {
          FirestoreManager.putCriterionIntoDefaultTable({ pieceId });
        }
      })
      .catch(error => {
        console.log(error);
        // chrome.runtime.sendMessage({
        //   msg: 'SHOW_SUCCESS_STATUS_BADGE',
        //   success: false
        // });
        showSuccessStatusInIconBadge(false);
      });
  } else if (request.msg === 'CREATE_NEW_ANNOTATION_AND_PUT_IN_TABLE') {
    const {
      annotation,
      contextData,
      annotationType,
      type,
      timer,
      tableId,
      cellId,
      cellType,
      ratingType
    } = request.payload;

    FirestoreManager.createPiece(
      annotation,
      contextData,
      annotationType,
      type,
      timer
    )
      .then(pieceId => {
        // chrome.runtime.sendMessage({
        //   msg: 'SHOW_SUCCESS_STATUS_BADGE',
        //   success: true
        // });
        showSuccessStatusInIconBadge(true);

        // put into the table
        // if (cellType === TABLE_CELL_TYPES.regularCell) {
        FirestoreManager.addPieceToTableCellById(
          tableId,
          cellId,
          pieceId,
          ratingType
        );
        // } else if (cellType === TABLE_CELL_TYPES.rowHeader) {
        //   console.log('should put as option');
        // } else if (cellType === TABLE_CELL_TYPES.columnHeader) {
        //   console.log('should put as criterion');
        // }

        chrome.runtime.sendMessage({
          msg: 'SELECTED_ANNOTATION_ID_UPDATED',
          pieceId
        });
      })
      .catch(error => {
        console.log(error);
        // chrome.runtime.sendMessage({
        //   msg: 'SHOW_SUCCESS_STATUS_BADGE',
        //   success: false
        // });
        showSuccessStatusInIconBadge(false);
      });
  } else if (request.msg === 'PUT_EXISTING_ANNOTATION_IN_TABLE') {
    const { tableId, cellId, pieceId, ratingType } = request.payload;
    FirestoreManager.addPieceToTableCellById(
      tableId,
      cellId,
      pieceId,
      ratingType
    );
  }
});

//
//
//
//
//
/* annotation tracking support */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'ANNOTATION_HIGHTLIGHTED') {
    let { url, text, html } = request.payload;
    FirestoreManager.Piece__HightlightContent(text, url, html);
  } else if (request.msg === 'ANNOTATION_SNAPSHOTTED') {
    let { url, text, html, rect, windowSize } = request.payload;
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
              FirestoreManager.Piece__SnapshotContent(
                text,
                url,
                html,
                dataUrl,
                dimensions
              );
            });
          });
        });
      });
    });
  } else if (request.msg === 'ANNOTATION_HIGHTLIGHTED_SAVED') {
    let { pieceId, url, text, html } = request.payload;
    FirestoreManager.Piece__CreateHighlightPiece(pieceId, text, url, html);
  } else if (request.msg === 'ANNOTATION_SNAPSHOTTED_SAVED') {
    let { pieceId, url, text, html, rect, windowSize } = request.payload;
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
              FirestoreManager.Piece__CreateSnapshotPiece(
                pieceId,
                text,
                url,
                html,
                dataUrl,
                dimensions
              );
            });
          });
        });
      });
    });
  }
});
