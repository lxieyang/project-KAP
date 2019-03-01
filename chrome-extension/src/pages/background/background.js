/* global chrome */
import queryString from 'query-string';
import { APP_NAME_SHORT } from '../../../../shared-components/src/shared/constants';
import firebase from '../../../../shared-components/src/firebase/firebase';
import * as FirestoreManager from '../../../../shared-components/src/firebase/firestore_wrapper';
import imageClipper from './image-clipper.js';
import {
  getImageDimensions,
  makeScreenshotWithCoordinates
} from './captureScreenshot';

/* global variables */
let loggedIn = false;
let userTasks = [];
let userTaskCount = 0;
let userCurrentTaskId = null;

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
/* keep track of the active tab */
let activeTabId = null;
let activeTabHostname = null;
let activeTabUrl = null;
chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  activeTabId = tabs[0].id;
});

const activeTabListener = activeInfo => {
  activeTabId = activeInfo.tabId;
  console.log(`switch to ${activeTabId}`);
  activeTabHostname = null;
  activeTabUrl = null;
  chrome.tabs.sendMessage(activeTabId, {
    msg: `GET_ACTIVE_TAB_HOSTNAME`
  });
};

chrome.tabs.onActivated.addListener(activeTabListener);

chrome.windows.onFocusChanged.addListener(windowId => {
  console.log(`switched to window ${windowId}`);
  chrome.tabs.onActivated.removeListener(activeTabListener);
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    activeTabId = tabs[0].id;
    console.log(`switch to ${activeTabId}`);
    activeTabHostname = null;
    activeTabUrl = null;
    chrome.tabs.sendMessage(activeTabId, {
      msg: `GET_ACTIVE_TAB_HOSTNAME`
    });
  });

  chrome.tabs.onActivated.addListener(activeTabListener);
});

const switchKAPSidebarStatus = (trackingIsActive, hostname = null) => {
  // toggle tracking status on all tables
  chrome.tabs.query({}, function(tabs) {
    for (var i = 0; i < tabs.length; ++i) {
      chrome.tabs.sendMessage(tabs[i].id, {
        msg: `TURN_${trackingIsActive ? 'ON' : 'OFF'}_KAP_SIDEBAR`,
        hostname
      });
    }
  });
};

const updateTrackingStatus = (trackingIsActive, hostname) => {
  if (loggedIn) {
    if (trackingIsActive === true) {
      chrome.browserAction.setIcon({
        path: 'icon-128.png'
      });
      // chrome.browserAction.setTitle({
      //   title: `${APP_NAME_SHORT} is active.`
      // });

      // clear badge
      chrome.browserAction.setBadgeBackgroundColor({
        color: [255, 255, 255, 0]
      });
      chrome.browserAction.setBadgeText({
        text: ''
      });
    } else {
      chrome.browserAction.setIcon({
        path: 'icon-inactive-128.png'
      });
      // chrome.browserAction.setTitle({
      //   title: `${APP_NAME_SHORT} is inactive.`
      // });

      // display badge
      chrome.browserAction.setBadgeBackgroundColor({
        color: [215, 91, 78, 1]
      });
      chrome.browserAction.setBadgeText({
        text: 'off'
      });
    }
    switchKAPSidebarStatus(trackingIsActive, hostname);
  } else {
    chrome.browserAction.setIcon({
      path: 'icon-128.png'
    });
  }
};

let trackingStatusDict = {};
chrome.storage.sync.get(['trackingStatusDict'], function(result) {
  let dict = result.trackingStatusDict;
  if (dict === undefined) {
    chrome.storage.sync.set({ trackingStatusDict }, function() {});
  } else {
    trackingStatusDict = dict;
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.msg === 'ACTIVE_TAB_HOSTNAME') {
    if (sender.tab.id === activeTabId) {
      let hostname = request.hostname;
      let url = request.cleanUrl;
      activeTabHostname = hostname;
      activeTabUrl = url;

      // check tracking status dict
      let shouldTrack = true;
      if (
        trackingStatusDict[hostname] !== undefined &&
        trackingStatusDict[hostname] === false
      ) {
        shouldTrack = false;
      }

      // send turn on/off instructions to the tabs
      updateTrackingStatus(shouldTrack, hostname);
    }
  }

  if (
    request.msg === 'GET_TRACKING_STATUS' &&
    request.from === 'browserTooltip'
  ) {
    // check tracking status dict
    let shouldTrack = true;
    if (
      trackingStatusDict[activeTabHostname] !== undefined &&
      trackingStatusDict[activeTabHostname] === false
    ) {
      shouldTrack = false;
    }
    // send hostname and tracking status to browserTooltip
    sendResponse({
      hostname: activeTabHostname,
      url: activeTabUrl,
      shouldTrack
    });
  }

  if (request.msg === 'SHOULD_TRACK' && request.from === 'contentScript') {
    let hostname = request.hostname;
    // check tracking status dict
    let shouldTrack = true;
    if (
      trackingStatusDict[hostname] !== undefined &&
      trackingStatusDict[hostname] === false
    ) {
      shouldTrack = false;
    }
    // send hostname and tracking status to browserTooltip
    sendResponse({
      shouldTrack
    });
  }

  if (request.msg === 'TRACKING_STATUS_CHANGED_BY_USER') {
    let hostname = request.hostname;
    let setTo = request.setTo;
    if (setTo === false) {
      trackingStatusDict[hostname] = false;
    } else {
      delete trackingStatusDict[hostname];
    }
    chrome.storage.sync.set({ trackingStatusDict }, function() {});

    // send turn on/off instructions to the tabs
    updateTrackingStatus(setTo, hostname);
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
/* Log in / out + tasks */
const updateTasks = () => {
  FirestoreManager.getCurrentUserCreatedTasks()
    .orderBy('updateDate', 'desc')
    .onSnapshot(querySnapshot => {
      let tasks = [];
      let taskCount = 0;
      querySnapshot.forEach(function(doc) {
        tasks.push({
          id: doc.id,
          ...doc.data()
        });
        taskCount += 1;
      });
      userTasks = tasks;
      userTaskCount = taskCount;
      chrome.storage.local.set({
        tasks,
        taskCount
      });
    });

  // set up current task listener
  FirestoreManager.getCurrentUserCurrentTaskId().onSnapshot(
    doc => {
      if (doc.exists) {
        userCurrentTaskId = doc.data().id;
        chrome.storage.local.set({
          currentTaskId: doc.data().id
        });
      } else {
        userCurrentTaskId = null;
        chrome.storage.local.set({
          currentTaskId: null
        });
      }
    },
    error => {
      console.log(error);
    }
  );
};

const alertAllTabs = idToken => {
  chrome.tabs.query({}, function(tabs) {
    for (var i = 0; i < tabs.length; ++i) {
      chrome.tabs.sendMessage(tabs[i].id, {
        msg: `USER_LOGIN_STATUS_CHANGED`,
        idToken
      });
    }
  });
};

const signInOutUserWithCredential = idToken => {
  if (idToken !== null && idToken !== undefined) {
    // logged in
    firebase
      .auth()
      .signInAndRetrieveDataWithCredential(
        firebase.auth.GoogleAuthProvider.credential(idToken)
      )
      .then(result => {
        console.log(`[BACKGROUND] User ${result.user.displayName} logged in.`);

        FirestoreManager.updateUserProfile();

        updateTasks();

        chrome.storage.local.set(
          {
            user: {
              idToken: idToken,
              displayName: result.user.displayName,
              photoURL: result.user.photoURL
            }
          },
          function() {
            console.log('user info update in chrome.storage.local');
            // update loggedIn status
            loggedIn = true;

            // clear title
            chrome.browserAction.setTitle({
              title: ''
            });

            alertAllTabs(idToken);
          }
        );
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

        chrome.storage.local.set(
          {
            user: null
          },
          function() {
            console.log('user info update in chrome.storage.local');
            // update loggedIn status
            loggedIn = false;

            // set icon
            chrome.browserAction.setIcon({
              path: 'icon-128.png'
            });

            // set title
            chrome.browserAction.setTitle({
              title: `${APP_NAME_SHORT} not logged in.`
            });

            // clear badge
            chrome.browserAction.setBadgeBackgroundColor({
              color: [255, 255, 255, 0]
            });
            chrome.browserAction.setBadgeText({
              text: ''
            });

            alertAllTabs(idToken);
          }
        );
      })
      .catch(error => {
        console.log(error);
      });
  }
};

/* Logging in/out on all tabs*/
const updateLogInStatus = idToken => {
  signInOutUserWithCredential(idToken);
};

// handle login/out request
let lastActiveTabId = -1;
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.msg === 'USER_LOGGED_IN') {
    localStorage.setItem('idToken', request.credential.idToken);
    updateLogInStatus(request.credential.idToken);

    // auth page
    if (request.from === 'auth_page') {
      try {
        chrome.tabs.update(lastActiveTabId, { active: true });
      } catch (e) {}
      chrome.tabs.remove(sender.tab.id);
    }
  }

  if (request.msg === 'USER_LOGGED_OUT') {
    localStorage.removeItem('idToken');
    updateLogInStatus(null);

    // auth page
    if (request.from === 'auth_page') {
      try {
        chrome.tabs.update(lastActiveTabId, { active: true });
      } catch (e) {}
      chrome.tabs.remove(sender.tab.id);
    }
  }

  if (request.msg === 'GET_USER_INFO') {
    sendResponse({
      idToken: localStorage.getItem('idToken')
    });
  }

  if (request.msg === 'GO_TO_AUTH_PAGE') {
    lastActiveTabId = activeTabId;
    chrome.tabs.create(
      {
        url: chrome.extension.getURL('auth.html')
      },
      tab => {
        // Tab opened.
      }
    );
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

//
//
//
//
//
/* connect to unakite-v2.com & task switcher support */
let isProduction = process.env.NODE_ENV === 'production' ? true : false;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'Go_TO_ALL_TASKS_PAGE') {
    chrome.storage.local.get(['user'], result => {
      let user = result.user;
      if (user) {
        let url =
          (isProduction
            ? `https://unakite-v2.firebaseapp.com/alltasks`
            : `http://localhost:3001/alltasks`) +
          `?${queryString.stringify({ idToken: user.idToken })}`;
        chrome.tabs.create(
          {
            url
          },
          tab => {
            // Tab opened.
          }
        );
      }
    });
  } else if (request.msg === 'Go_TO_SINGLE_TASK_PAGE') {
    let taskId = request.taskId;
    chrome.storage.local.get(['user'], result => {
      let user = result.user;
      if (user) {
        let url =
          (isProduction
            ? `https://unakite-v2.firebaseapp.com/tasks/`
            : `http://localhost:3001/tasks/`) +
          `${taskId}` +
          `?${queryString.stringify({ idToken: user.idToken })}`;
        chrome.tabs.create(
          {
            url
          },
          tab => {
            // Tab opened.
          }
        );
      }
    });
  } else if (request.msg === 'UPDATE_CURRENT_USER_CURRENT_TASK_ID') {
    FirestoreManager.updateCurrentUserCurrentTaskId(request.taskId);
  }
});
