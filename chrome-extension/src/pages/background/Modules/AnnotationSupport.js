/* global chrome */

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
  } else if (request.msg === 'ANNOTATION_UNSELECTED') {
    // console.log('annotation unselected');
    annotation_selected = false;
    chrome.runtime.sendMessage({
      msg: 'ANNOTATION_UNSELECTED'
    });
  } else if (request.msg === 'ANNOTATION_LOCATION_SELECTED') {
    chrome.tabs.sendMessage(sender.tab.id, {
      msg: `ANNOTATION_LOCATION_SELECTED_IN_TABLE`,
      payload: request.payload
    });
  }
});
