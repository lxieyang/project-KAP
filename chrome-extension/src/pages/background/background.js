/* global chrome */
import '../../../../shared-components/src/assets/images/icon-128.png';
import '../../../../shared-components/src/assets/images/icon-34.png';
import * as actionTypes from '../../../../shared-components/src/shared/actionTypes';
import { DEFAULT_SETTINGS } from '../../../../shared-components/src/shared/constants';

import { 
  // database,
  tasksRef,
  currentTaskIdRef,
  isDisabledRef,
  userId,
  userName,
  userProfilePhotoURL,
  setUserIdAndName,
  userPathInFirestore
} from '../../../../shared-components/src/firebase/index';
import firebase from '../../../../shared-components/src/firebase/firebase';
// import * as FirebaseStore from '../../../../shared-components/src/firebase/store';


let userIdCached = localStorage.getItem('userId');
let userNameCached = localStorage.getItem('userName');
let userProfilePhotoURLCached = localStorage.getItem('userProfilePhotoURL');

const updateBrowserIcon = (isLoggedIn) => {
  if (isLoggedIn) {
    chrome.browserAction.setIcon({path: 'icon-128.png'});
  } else {
    chrome.browserAction.setIcon({path: 'icon-inactive-128.png'});
  }
}
    
if (userIdCached !== null && userIdCached !== 'invalid') {
  setUserIdAndName(userIdCached, userNameCached, userProfilePhotoURLCached);
  updateBrowserIcon(true);
} else {
  updateBrowserIcon(false);
}

let popPort;
let optionsPort;
let contentPort;

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.msg === 'RESET_USER_ID') {
      setUserIdAndName(
        request.payload.userId,
        request.payload.userName,
        request.payload.userProfilePhotoURL
      );

      if (request.payload.userId !== null && request.payload.userId !== 'invalid') {
        updateBrowserIcon(true);
      } else {
        updateBrowserIcon(false);
      }

      localStorage.setItem('userId', userId);
      localStorage.setItem('userName', userName);
      localStorage.setItem('userProfilePhotoURL', userProfilePhotoURL);
      
      console.log("USERID: " + request.payload.userId);
      try {
        popPort.postMessage({
          msg: 'USER_INFO',
          payload: {
            userId,
            userName,
            userProfilePhotoURL
          }
        });
      } catch (error) {
        // console.log(error);
      }

      try {
        optionsPort.postMessage({
          msg: 'USER_INFO',
          payload: {
            userId,
            userName,
            userProfilePhotoURL
          }
        });
      } catch (error) {
        // console.log(error);
      }

      try {
        contentPort.postMessage({
          msg: 'USER_INFO',
          payload: {
            userId,
            userName,
            userProfilePhotoURL
          }
        });
      } catch (error) {
        // console.log(error);
      }
    } else if (request.msg === 'OPEN_IN_NEW_TAB') {
      chrome.tabs.create({
        url: chrome.extension.getURL('newtab.html')
      }, (tab) => {
          // Tab opened.
      });
    } else if (request.msg === 'OPEN_SETTINGS_PAGE') {
      chrome.tabs.create({
        url: chrome.extension.getURL('options.html')
      }, (tab) => {
          // Tab opened.
      });
    } else if (request.msg === 'SIGN_OUT') {
      console.log('should sign out');
      chrome.tabs.create({
        url: chrome.extension.getURL('newtab.html') + '?shouldSignOut=true',
        active: false
      }, (tab) => {
        // Tab opened.
      });
    }
  }
);


chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log(activeInfo);
  chrome.tabs.sendMessage(activeInfo.tabId, {
    msg: 'USER_INFO',
    payload : {
      userId,
      userName,
      userProfilePhotoURL
    }
  });
});


// conditionally replace newtab
// https://kushagragour.in/blog/2017/07/conditional-newtab-override-chrome-extension/
let shouldOverrideNewtab = DEFAULT_SETTINGS.shouldOverrideNewtab;

firebase.auth().onAuthStateChanged(() => {
  userPathInFirestore.onSnapshot((doc) => {
    if (doc.exists) {
      const { userSettings } = doc.data();
      if (userSettings !== undefined && userSettings.shouldOverrideNewtab !== undefined) {
        shouldOverrideNewtab = userSettings.shouldOverrideNewtab;
      }
    } else {
      shouldOverrideNewtab = DEFAULT_SETTINGS.shouldOverrideNewtab;
    }
  });
});



chrome.tabs.onCreated.addListener((tab) => {
  if (tab.url === 'chrome://newtab/') {
    if (shouldOverrideNewtab === true) {
      console.log('Replacing new tab');
      chrome.tabs.update(
        tab.id, {
          url: chrome.extension.getURL('newtab.html')
        }
      );
    }
  }
});


chrome.runtime.onConnect.addListener(function(port) {
  console.log(port.name);
  if (port.name === 'FROM_POPUP') {
    popPort = port;
    popPort.onMessage.addListener((request) => {
      if (request.msg === 'GET_USER_INFO') {
        console.log('send back to popup');
        popPort.postMessage({
          msg: 'USER_INFO',
          payload: {
            userId,
            userName,
            userProfilePhotoURL
          }
        });
      }
    });
  } 
  if (port.name === 'FROM_OPTIONS') {
    optionsPort = port;
    optionsPort.onMessage.addListener((request) => {
      if (request.msg === 'GET_USER_INFO') {
        console.log('send back to options');
        optionsPort.postMessage({
          msg: 'USER_INFO',
          payload: {
            userId,
            userName,
            userProfilePhotoURL
          }
        });
      }
    });
  } 
  if (port.name === 'FROM_CONTENT') {
    contentPort = port;
    contentPort.onMessage.addListener((request) => {
      if (request.msg === 'GET_USER_INFO') {
        console.log('send back to content');
        contentPort.postMessage({
          msg: 'USER_INFO',
          payload: {
            userId,
            userName,
            userProfilePhotoURL
          }
        });
      }
    });
  }
});



/* create context menu items */
chrome.contextMenus.removeAll();
chrome.contextMenus.create({
  title: 'Add an Option',
  onclick: (_, tab) => {
    console.log(tab);
    // send to content scripts
    chrome.tabs.sendMessage(tab.id, {
      msg: actionTypes.ADD_OPTION_CONTEXT_MENU_CLICKED
    }, () => {});
  }
});


chrome.contextMenus.create({
  title: 'Add a Criterion',
  onclick: (_, tab) => {
    console.log(tab);
    // send to content scripts
    chrome.tabs.sendMessage(tab.id, {
      msg: actionTypes.ADD_REQUIREMENT_CONTEXT_MENU_CLICKED
    }, () => {});
  }
});


chrome.contextMenus.create({
  title: 'Add "%s" as an Option',
  "contexts": ["selection"],
  onclick: (_, tab) => {
    console.log(tab);
    // send to content scripts
    chrome.tabs.sendMessage(tab.id, {
      msg: actionTypes.ADD_OPTION_CONTEXT_MENU_CLICKED
    }, () => {});
  }
});


chrome.contextMenus.create({
  title: 'Add "%s" as a Criterion',
  "contexts": ["selection"],
  onclick: (_, tab) => {
    console.log(tab);
    // send to content scripts
    chrome.tabs.sendMessage(tab.id, {
      msg: actionTypes.ADD_REQUIREMENT_CONTEXT_MENU_CLICKED
    }, () => {});
  }
});


chrome.contextMenus.create({
  title: 'Collect it as a Snippet',
  "contexts": ["selection"],
  onclick: (_, tab) => {
    console.log(tab);
    // send to content scripts
    chrome.tabs.sendMessage(tab.id, {
      msg: actionTypes.ADD_PIECE_CONTEXT_MENU_CLICKED
    }, () => {});
  }
});
