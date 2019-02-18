/* global chrome */
import { APP_NAME_SHORT } from '../../../../shared-components/src/shared/constants';
import firebase from '../../../../shared-components/src/firebase/firebase';
import * as FirestoreManager from '../../../../shared-components/src/firebase/firestore_wrapper';
import imageClipper from './image-clipper.js';
import {
  getImageDimensions,
  makeScreenshotWithCoordinates
} from './captureScreenshot';

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
  chrome.storage.local.set({ trackingIsActive }, function() {
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

//
//
//
//
//
/* Choose to shrink body / cover content */
let shouldShrinkBody = true;
let shouldUseEscapeKeyToToggleSidebar = true;
const updateShouldShrinkBodyStatus = () => {
  chrome.tabs.query({}, function(tabs) {
    for (var i = 0; i < tabs.length; ++i) {
      chrome.tabs.sendMessage(tabs[i].id, {
        msg: `TURN_${shouldShrinkBody ? 'ON' : 'OFF'}_BODY_SHRINK`
      });
    }
  });
};

const updateShouldUseEscapeKeyToToggleSidebarStatus = () => {
  chrome.tabs.query({}, function(tabs) {
    for (var i = 0; i < tabs.length; ++i) {
      chrome.tabs.sendMessage(tabs[i].id, {
        msg: `TURN_${
          shouldUseEscapeKeyToToggleSidebar ? 'ON' : 'OFF'
        }_TOGGLE_SIDEBAR_WITH_ESC_KEY`
      });
    }
  });
};

// check chrome storage to see if should enable shouldShrinkBody
chrome.storage.sync.get(['shouldShrinkBody'], function(result) {
  console.log('shouldShrinkBody:', result.shouldShrinkBody);
  if (result.shouldShrinkBody !== undefined) {
    shouldShrinkBody = result.shouldShrinkBody;
  }
  updateShouldShrinkBodyStatus();
});

// check chrome storage to see if should enable shouldUseEscapeKeyToToggleSidebar
chrome.storage.sync.get(['shouldUseEscapeKeyToToggleSidebar'], function(
  result
) {
  console.log(
    'shouldUseEscapeKeyToToggleSidebar:',
    result.shouldUseEscapeKeyToToggleSidebar
  );
  if (result.shouldUseEscapeKeyToToggleSidebar !== undefined) {
    shouldUseEscapeKeyToToggleSidebar =
      result.shouldUseEscapeKeyToToggleSidebar;
  }
  updateShouldUseEscapeKeyToToggleSidebarStatus();
});

chrome.tabs.onCreated.addListener(tab => {
  chrome.tabs.sendMessage(tab.id, {
    msg: `TURN_${shouldShrinkBody ? 'ON' : 'OFF'}_BODY_SHRINK`
  });
  chrome.tabs.sendMessage(tab.id, {
    msg: `TURN_${shouldShrinkBody ? 'ON' : 'OFF'}_TOGGLE_SIDEBAR_WITH_ESC_KEY`
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.msg === 'SETTINGS_CHANGED_SIDEBAR_BEHAVIOR') {
    shouldShrinkBody = request.to === 'overlay' ? false : true;
    updateShouldShrinkBodyStatus();
    chrome.storage.sync.set({ shouldShrinkBody }, function() {
      //  Data's been saved boys and girls, go on home
      console.log('shouldShrinkBody has been set to:', shouldShrinkBody);
    });
  }

  if (request.msg === 'SETTINGS_CHANGED_SIDEBAR_ESCAPE_KEY_TOGGLE') {
    shouldUseEscapeKeyToToggleSidebar = request.to;
    updateShouldUseEscapeKeyToToggleSidebarStatus();
    chrome.storage.sync.set({ shouldUseEscapeKeyToToggleSidebar }, function() {
      //  Data's been saved boys and girls, go on home
      console.log(
        'shouldUseEscapeKeyToToggleSidebar has been set to:',
        shouldUseEscapeKeyToToggleSidebar
      );
    });
  }

  if (request.msg === 'SHOULD_SHRINK_BODY') {
    sendResponse({ SHOULD_SHRINK_BODY: shouldShrinkBody });
  }

  if (request.msg === 'SHOULD_TOGGLE_SIDEBAR_WITH_ESC_KEY') {
    sendResponse({
      SHOULD_TOGGLE_SIDEBAR_WITH_ESC_KEY: shouldUseEscapeKeyToToggleSidebar
    });
  }
});

//
//
//
//
//
/* Log in / out */
const signInOutUserWithCredential = idToken => {
  if (idToken !== null) {
    // logged in
    firebase
      .auth()
      .signInAndRetrieveDataWithCredential(
        firebase.auth.GoogleAuthProvider.credential(idToken)
      )
      .then(result => {
        console.log(`[BACKGROUND] User ${result.user.displayName} logged in.`);
        FirestoreManager.updateUserProfile();
      })
      .catch(error => {
        console.log(error);
      });
  } else {
    // logged out
    firebase
      .auth()
      .signOut()
      .then(() => {
        console.log('[BACKGROUND] User logged out.');
      })
      .catch(error => {
        console.log(error);
      });
  }
};

/* Logging in/out on all tabs*/
const updateLogInStatus = (idToken, user) => {
  signInOutUserWithCredential(idToken);
  chrome.tabs.query({}, function(tabs) {
    for (var i = 0; i < tabs.length; ++i) {
      chrome.tabs.sendMessage(tabs[i].id, {
        msg: `USER_LOGIN_STATUS_CHANGED`,
        idToken
      });
    }
  });
};

// handle login/out request
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.msg === 'USER_LOGGED_IN') {
    localStorage.setItem('idToken', request.credential.idToken);
    updateLogInStatus(request.credential.idToken);
  }

  if (request.msg === 'USER_LOGGED_OUT') {
    localStorage.removeItem('idToken');
    updateLogInStatus(null);
  }

  if (request.msg === 'GET_USER_INFO') {
    sendResponse({
      idToken: localStorage.getItem('idToken')
    });
  }
});

setTimeout(() => {
  signInOutUserWithCredential(localStorage.getItem('idToken'));
}, 5000);

//
//
//
//
//
/* Other Requests */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.msg === 'OPEN_SETTINGS_PAGE') {
    chrome.tabs.create(
      {
        url: chrome.extension.getURL('options.html')
      },
      tab => {
        // Tab opened.
      }
    );
  } else if (request.msg === 'SCREENSHOT_WITH_COORDINATES') {
    let rect = request.rect;
    let windowSize = request.windowSize;
    chrome.tabs.captureVisibleTab(function(screenshotUrl) {
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
  }
});

//
//
//
//
//
/* screenshot modal support */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'SCREENSHOT_MODAL_SHOULD_DISPLAY') {
    chrome.tabs.sendMessage(sender.tab.id, {
      msg: `SCREENSHOT_MODAL_SHOULD_DISPLAY`,
      pieceId: request.pieceId,
      imageDataUrl: request.imageDataUrl
    });
  }
});
