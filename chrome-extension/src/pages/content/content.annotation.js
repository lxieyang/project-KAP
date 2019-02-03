/* global chrome */
import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import { dragElement } from './content.utility';
import firebase from '../../../../shared-components/src/firebase/firebase';
import * as FirestoreManager from '../../../../shared-components/src/firebase/firestore_wrapper';
import { ANNOTATION_TYPES } from '../../../../shared-components/src/shared/types';
import Frame from './frame';
import SelectTooltipButton from './SelectTooltipButton/SelectTooltipButton';
import SiphonTools from 'siphon-tools';
import {
  Highlight,
  HighlightSelector,
  Snippet,
  SnippetSelector,
  Store
} from 'siphon-tools';

/** Inject Fontawesome stylesheet
 * Previous using: https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css
 */
let link = document.createElement('link');
link.href = 'https://use.fontawesome.com/releases/v5.0.8/css/all.css';
link.type = 'text/css';
link.rel = 'stylesheet';
document.head.appendChild(link);

//
//
//
//
//
/* Set up popover box anchor */
const popOverAnchor = document.body.appendChild(document.createElement('div'));
popOverAnchor.style.zIndex = '33333';
popOverAnchor.style.position = 'absolute';
popOverAnchor.setAttribute('id', 'popover-box');

function displayTooltipButtonBasedOnRectPosition(rect, props) {
  popOverAnchor.top = '0px';
  popOverAnchor.style.left = `0px`;

  ReactDOM.render(<SelectTooltipButton {...props} />, popOverAnchor);

  // adjusting position of popover box after mounting
  popOverAnchor.style.top = `${rect.bottom + 5 + window.scrollY}px`;
  let leftPosition = Math.floor(
    rect.left + rect.width - popOverAnchor.clientWidth
  );
  leftPosition = leftPosition >= 10 ? leftPosition : 10;
  popOverAnchor.style.left = `${leftPosition}px`;
}

// TODO: enable store functionality later
// let store = new Store({
//   [ANNOTATION_TYPES.Highlight]: Highlight,
//   [ANNOTATION_TYPES.Snippet]: Snippet
// });
// store.init();

// init selectors
SiphonTools.initializeSelectors([
  HighlightSelector({
    onTrigger: (range, e) => {
      let rect = range.getBoundingClientRect();
      displayTooltipButtonBasedOnRectPosition(rect, {
        annotationType: ANNOTATION_TYPES.Highlight,
        range
      });

      // let highlight = new Highlight(range);
      // console.log(highlight);
    }
  }),
  SnippetSelector({
    onTrigger: (cptrWindow, e) => {
      captureWindow = cptrWindow;
      let rect = cptrWindow.getBoundingClientRect();
      displayTooltipButtonBasedOnRectPosition(rect, {
        annotationType: ANNOTATION_TYPES.Snippet,
        captureWindow,
        windowSize: { width: window.innerWidth, height: window.innerHeight }
      });

      // let snippet = new Snippet(rect);
      // console.log(snippet);
    }
  })
]);

//
//
//
//
//
/* log in / out */
// check id token from background
chrome.runtime.sendMessage({ msg: 'GET_USER_INFO' }, response => {
  signInOutUserWithCredential(response.idToken);
});
// authenticate upon signin
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'USER_LOGIN_STATUS_CHANGED') {
    signInOutUserWithCredential(request.idToken);
  }
});

const signInOutUserWithCredential = idToken => {
  if (idToken !== null) {
    // logged in
    firebase
      .auth()
      .signInAndRetrieveDataWithCredential(
        firebase.auth.GoogleAuthProvider.credential(idToken)
      )
      .then(result => {
        console.log(
          `[CONTENT_ANNOTATION] User ${result.user.displayName} (${
            result.user.uid
          }) logged in.`
        );

        SiphonTools.enable();
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
        console.log('[CONTENT_ANNOTATION] User logged out.');
        SiphonTools.disable();
      })
      .catch(error => {
        console.log(error);
      });
  }
};

let captureWindow;

//
//
//
//
//
/* Sidebar manager & tracking status manager */
let shouldShrinkBody = false;
let shouldUseEscapeKeyToToggleSidebar = true;
chrome.runtime.sendMessage({ msg: 'SHOULD_SHRINK_BODY' }, response => {
  shouldShrinkBody = response.SHOULD_SHRINK_BODY;
  document.body.style.transition = 'all 0.25s ease-in';
});

chrome.runtime.sendMessage(
  { msg: 'SHOULD_TOGGLE_SIDEBAR_WITH_ESC_KEY' },
  response => {
    shouldUseEscapeKeyToToggleSidebar =
      response.SHOULD_TOGGLE_SIDEBAR_WITH_ESC_KEY;
  }
);

let sidebarRoot = document.createElement('div');
document.body.appendChild(sidebarRoot);
sidebarRoot.setAttribute('id', 'kap-sidebar-root');

function shrinkBody(isOpen) {
  if (shouldShrinkBody) {
    if (isOpen) {
      document.body.style.marginRight = '400px';
    } else {
      document.body.style.marginRight = '0px';
    }
  }
}

function mountSidebar() {
  const App = (
    <Frame
      url={chrome.extension.getURL('popup.html')}
      shrinkBody={shrinkBody}
    />
  );
  ReactDOM.render(App, sidebarRoot);
  SiphonTools.enable();
}

function unmountSidebar() {
  ReactDOM.unmountComponentAtNode(sidebarRoot);
  SiphonTools.disable();
}

chrome.runtime.sendMessage({ msg: 'SHOULD_I_TRACK' }, response => {
  if (response.SHOULD_I_TRACK === false) {
    unmountSidebar();
  } else if (response.SHOULD_I_TRACK === true) {
    mountSidebar();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'TURN_OFF_KAP_TRACKING') {
    unmountSidebar();
  } else if (request.msg === 'TURN_ON_KAP_TRACKING') {
    mountSidebar();
  } else if (request.msg === 'TURN_ON_BODY_SHRINK') {
    shouldShrinkBody = true;
  } else if (request.msg === 'TURN_OFF_BODY_SHRINK') {
    shouldShrinkBody = false;
  } else if (request.msg === 'TURN_ON_TOGGLE_SIDEBAR_WITH_ESC_KEY') {
    shouldUseEscapeKeyToToggleSidebar = true;
  } else if (request.msg === 'TURN_OFF_TOGGLE_SIDEBAR_WITH_ESC_KEY') {
    shouldUseEscapeKeyToToggleSidebar = false;
  }
});

window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !event.ctrlKey) {
    if (
      captureWindow !== undefined &&
      document.querySelector('.siphon-selection-window') !== null
    ) {
      captureWindow.remove();
      ReactDOM.unmountComponentAtNode(popOverAnchor);
    }
  }

  if (event.ctrlKey && event.key === 'Escape') {
    if (shouldUseEscapeKeyToToggleSidebar) {
      // Frame.toggle(true);
      Frame.toggle();
    }
  }
});
