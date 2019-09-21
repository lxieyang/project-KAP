/* global chrome */
import queryString from 'query-string';
import './Modules/AuthHandler';
import { APP_NAME_SHORT } from '../../../../shared-components/src/shared/constants';
import firebase from '../../../../shared-components/src/firebase/firebase';
import * as FirestoreManager from '../../../../shared-components/src/firebase/firestore_wrapper';
import imageClipper from './image-clipper.js';
import {
  getImageDimensions,
  makeScreenshotWithCoordinates
} from './captureScreenshot';

import './Modules/Settings';
import './Modules/AnnotationSupport';
import './Modules/ScreenshotSupport';
import './Modules/Misc';
import './Modules/GA';

window.FirestoreManager = FirestoreManager;

/* global variables */
let loggedIn = false;

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
    try {
      activeTabId = tabs[0].id;
    } catch (e) {
      // console.log(e);
    }

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
      let shouldTrack = false;
      if (
        trackingStatusDict[hostname] !== undefined &&
        trackingStatusDict[hostname] === true
      ) {
        shouldTrack = true;
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
    let shouldTrack = false;
    if (
      trackingStatusDict[activeTabHostname] !== undefined &&
      trackingStatusDict[activeTabHostname] === true
    ) {
      shouldTrack = true;
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
    let shouldTrack = false;
    if (
      trackingStatusDict[hostname] !== undefined &&
      trackingStatusDict[hostname] === true
    ) {
      shouldTrack = true;
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
      trackingStatusDict[hostname] = true;
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
      chrome.storage.local.set({
        tasks,
        taskCount
      });
    });

  // set up current task listener
  FirestoreManager.getCurrentUserCurrentTaskId().onSnapshot(
    doc => {
      if (doc.exists) {
        chrome.storage.local.set({
          currentTaskId: doc.data().id
        });
      } else {
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

const alertAllTabs = oauthIdToken => {
  chrome.tabs.query({}, tabs => {
    for (var i = 0; i < tabs.length; ++i) {
      chrome.tabs.sendMessage(tabs[i].id, {
        msg: `USER_LOGIN_STATUS_CHANGED`,
        oauthIdToken
      });
    }
  });
};

const signInOutUserWithCredential = oauthIdToken => {
  if (oauthIdToken !== null && oauthIdToken !== undefined) {
    // logged in
    firebase
      .auth()
      .signInAndRetrieveDataWithCredential(
        firebase.auth.GoogleAuthProvider.credential(oauthIdToken)
      )
      .then(result => {
        console.log(`[BACKGROUND] User ${result.user.displayName} logged in.`);

        FirestoreManager.updateUserProfile();

        updateTasks();

        chrome.storage.local.set(
          {
            user: {
              oauthIdToken: oauthIdToken,
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

            alertAllTabs(oauthIdToken);
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

        chrome.storage.local.set({ user: null }, function() {
          console.log('user info update in chrome.storage.local');
          // update loggedIn status
          loggedIn = false;

          // set icon
          chrome.browserAction.setIcon({ path: 'icon-128.png' });

          // set title
          chrome.browserAction.setTitle({
            title: `${APP_NAME_SHORT} not logged in.`
          });

          // clear badge
          chrome.browserAction.setBadgeBackgroundColor({
            color: [255, 255, 255, 0]
          });
          chrome.browserAction.setBadgeText({ text: '' });

          alertAllTabs(oauthIdToken);
        });
      })
      .catch(error => {
        console.log(error);
      });
  }
};

/* Logging in/out on all tabs*/
const updateLogInStatus = oauthIdToken => {
  signInOutUserWithCredential(oauthIdToken);
};

// handle login/out request
let lastActiveTabId = -1;
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.msg === 'USER_LOGGED_IN') {
    localStorage.setItem('oauthIdToken', request.credential.oauthIdToken);
    updateLogInStatus(request.credential.oauthIdToken);

    // auth page
    if (request.from === 'auth_page') {
      try {
        chrome.tabs.update(lastActiveTabId, { active: true });
      } catch (e) {}
      chrome.tabs.remove(sender.tab.id);
    }
  }

  if (request.msg === 'USER_LOGGED_OUT') {
    localStorage.removeItem('oauthIdToken');
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
    sendResponse({ oauthIdToken: localStorage.getItem('oauthIdToken') });
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
  signInOutUserWithCredential(localStorage.getItem('oauthIdToken'));
}, 3000);
