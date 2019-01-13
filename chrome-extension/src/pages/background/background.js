/* global chrome */
import { APP_NAME_SHORT } from '../../../../shared-components/src/shared/constants';

// chrome.storage.local.set({key: value}, function() {
//   console.log('Value is set to ' + value);
// });

/* Enable / Disable Tracking */
let trackingIsActive = false;

const updateTrackingStatus = () => {
  if (trackingIsActive === true) {
    chrome.browserAction.setIcon({
      path: 'icon-128.png'
    });
    chrome.browserAction.setTitle({
      title: `${APP_NAME_SHORT} is active. Click to deactivate.`
    });
  } else {
    chrome.browserAction.setIcon({
      path: 'icon-inactive-128.png'
    });
    chrome.browserAction.setTitle({
      title: `${APP_NAME_SHORT} is inactive. Click to activate.`
    });
  }

  // toggle tracking status on all tables
  chrome.tabs.query({}, function(tabs) {
    for (var i = 0; i < tabs.length; ++i) {
      chrome.tabs.sendMessage(tabs[i].id, {
        msg: `TURN_${trackingIsActive ? 'ON' : 'OFF'}_KAP_TRACKING`
      });
    }
  });
};

// check chrome storage to see if should enable tracking
chrome.storage.local.get(['trackingIsActive'], function(result) {
  console.log('trackingIsActive:', result.trackingIsActive);
  if (result.trackingIsActive !== undefined) {
    trackingIsActive = result.trackingIsActive;
  }
  updateTrackingStatus();
});

// toggle tracking status upon browser icon click
chrome.browserAction.onClicked.addListener(function(tab) {
  trackingIsActive = !trackingIsActive;
  updateTrackingStatus();
  // update in chrome storage
  chrome.storage.local.set({ trackingIsActive: trackingIsActive }, function() {
    //  Data's been saved boys and girls, go on home
    console.log('trackingIsActive has been set to:', trackingIsActive);
  });
});

chrome.tabs.onCreated.addListener(tab => {
  chrome.tabs.sendMessage(tab.id, {
    msg: `TURN_${trackingIsActive ? 'ON' : 'OFF'}_KAP_TRACKING`
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'SHOULD_I_TRACK') {
    sendResponse({ SHOULD_I_TRACK: trackingIsActive });
  }
});

/* Choose to shrink body / cover content */
let shouldShrinkBody = true;
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.msg === 'SHOULD_SHRINK_BODY') {
    sendResponse({ SHOULD_SHRINK_BODY: shouldShrinkBody });
  }
});
