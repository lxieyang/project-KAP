/* global chrome */
import '../../../../shared-components/src/assets/images/icon-128.png';
import '../../../../shared-components/src/assets/images/icon-34.png';
import * as actionTypes from '../../../../shared-components/src/shared/actionTypes';
import { uniq, isEqual } from 'lodash';

import { 
  // database,
  sampleActionRef,
  sampleListRef,
  tasksRef,
  currentTaskIdRef,
  isDisabledRef,
  userId,
  setUserIdAndName
} from '../../../../shared-components/src/firebase/index';
import * as FirebaseStore from '../../../../shared-components/src/firebase/store';

let userIdCached = localStorage.getItem('userId');
if (userIdCached !== null) {
  setUserIdAndName(userIdCached, 'Master ' + userIdCached);
}

let popPort;
let contentPort;

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.msg === 'RESET_USER_ID') {
      setUserIdAndName(request.payload.userId);
      localStorage.setItem('userId', userId);
      console.log("USERID: " + request.payload.userId);
      console.log(tasksRef.path.pieces_);
      try {
        popPort.postMessage({
          msg: 'USER_INFO',
          payload: {
            userId
          }
        });
      } catch (error) {
        console.log(error);
      }

      try {
        contentPort.postMessage({
          msg: 'USER_INFO',
          payload: {
            userId
          }
        });
      } catch (error) {
        console.log(error);
      }
    }
  }
);

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log(activeInfo);
  chrome.tabs.sendMessage(activeInfo.tabId, {
    msg: 'USER_INFO',
    payload : {userId}
  })
})


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
            userId
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
            userId
          }
        });
      }
    });
  }
});


/* create context menu items */
chrome.contextMenus.removeAll();
chrome.contextMenus.create({
  title: 'Add an option',
  onclick: (_, tab) => {
    console.log(tab);
    // send to content scripts
    chrome.tabs.sendMessage(tab.id, {
      msg: actionTypes.ADD_OPTION_CONTEXT_MENU_CLICKED
    }, () => {});
  }
});

chrome.contextMenus.create({
  title: 'Add a requirement',
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
  title: 'Add "%s" as a Requirement',
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
  title: 'Collect it as a Piece',
  "contexts": ["selection"],
  onclick: (_, tab) => {
    console.log(tab);
    // send to content scripts
    chrome.tabs.sendMessage(tab.id, {
      msg: actionTypes.ADD_PIECE_CONTEXT_MENU_CLICKED
    }, () => {});
  }
});

export {
  tasksRef,
  currentTaskIdRef,
  isDisabledRef,
  FirebaseStore
}