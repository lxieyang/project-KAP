/* global chrome */
import queryString from 'query-string';
import { APP_NAME_SHORT } from '../../../../../shared-components/src/shared/constants';
import * as FirestoreManager from '../../../../../shared-components/src/firebase/firestore_wrapper';
import {
  getTaskLink,
  getAllTasksLink
} from '../../../../../shared-components/src/shared/utilities';

//
//
//
//
//
/* open pages & task switcher support */
// let isProduction = process.env.NODE_ENV === 'production' ? true : false;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'OPEN_SETTINGS_PAGE') {
    chrome.tabs.create(
      {
        url: chrome.extension.getURL('options.html')
      },
      tab => {
        // Tab opened.
      }
    );
  } else if (request.msg === 'Go_TO_ALL_TASKS_PAGE') {
    chrome.storage.local.get(['user'], result => {
      let user = result.user;
      if (user) {
        let url =
          getAllTasksLink() +
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
          getTaskLink(taskId) +
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

//
//
//
//
//
/* context menu */
function createNewTaskUponSelection(info, tab) {
  let taskName = info.selectionText;
  if (taskName !== null && taskName !== '') {
    FirestoreManager.createTaskWithName(taskName)
      .then(docRef => {
        FirestoreManager.updateCurrentUserCurrentTaskId(docRef.id);
        FirestoreManager.createNewTable({ taskId: docRef.id });
      })
      .catch(error => {
        console.log(error);
        alert(error);
      });
  }
}
chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create({
    title: `Create a new ${APP_NAME_SHORT} task named "%s"`,
    contexts: ['selection'],
    onclick: createNewTaskUponSelection
  });
});
