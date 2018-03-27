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
  isDisabledRef
} from '../../../../shared-components/src/firebase/index';
import * as FirebaseStore from '../../../../shared-components/src/firebase/store';


/* create context menu items */
// chrome.contextMenus.removeAll();
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

