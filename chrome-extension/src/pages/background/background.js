/* global chrome */
import '../../../../shared-components/src/assets/images/icon-128.png';
import '../../../../shared-components/src/assets/images/icon-34.png';
import * as actionTypes from '../../../../shared-components/src/shared/actionTypes';
import {
  DEFAULT_SETTINGS,
  APP_NAME_LONG,
  APP_NAME_SHORT
} from '../../../../shared-components/src/shared/constants';

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
import * as FirebaseStore from '../../../../shared-components/src/firebase/store';

let trackingIsActive = false;

const updateTrackingStatus = () => {
  if (trackingIsActive === true) {
    chrome.browserAction.setIcon({
      path: 'icon-128.png'
    });
    chrome.browserAction.setTitle({
      title: `${APP_NAME_SHORT} is active`
    });
  } else {
    chrome.browserAction.setIcon({
      path: 'icon-inactive-128.png'
    });
    chrome.browserAction.setTitle({
      title: `${APP_NAME_SHORT} is inactive`
    });
  }
};

updateTrackingStatus();

chrome.browserAction.onClicked.addListener(function(tab) {
  trackingIsActive = !trackingIsActive;
  updateTrackingStatus();
});
