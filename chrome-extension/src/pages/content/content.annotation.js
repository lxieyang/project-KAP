/* global chrome */
import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import { dragElement } from './content.utility';
import ScreenshotModal from './components/ScreenshotModal';
// import firebase from '../../../../shared-components/src/firebase/firebase';
// import * as FirestoreManager from '../../../../shared-components/src/firebase/firestore_wrapper';
import { ANNOTATION_TYPES } from '../../../../shared-components/src/shared/types';
import { APP_NAME_SHORT } from '../../../../shared-components/src/shared/constants';
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

//
//
//
//
//
/* send host name to background to determine unakite operation status info */
const sendHostnameTobackground = () => {
  chrome.runtime.sendMessage({
    msg: 'ACTIVE_TAB_HOSTNAME',
    hostname: window.location.hostname,
    url: window.location.href,
    cleanUrl: window.location.origin + window.location.pathname
  });
};

sendHostnameTobackground();
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'GET_ACTIVE_TAB_HOSTNAME') {
    // console.log('get active tab hostname');
    sendHostnameTobackground();
  }
});

//
//
//
//
//
/* log in / out */
// check id token from background
let loggedIn = false;
let userIdToken = null;
chrome.runtime.sendMessage({ msg: 'GET_USER_INFO' }, response => {
  signInOutUserWithCredential(response.idToken);
});
// authenticate upon signin
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'USER_LOGIN_STATUS_CHANGED') {
    // console.log('logged in status changed');
    signInOutUserWithCredential(request.idToken);
  }
});

const signInOutUserWithCredential = idToken => {
  userIdToken = idToken;
  if (idToken !== null) {
    // logged in

    loggedIn = true;

    SiphonTools.enable();

    chrome.runtime.sendMessage(
      {
        msg: 'SHOULD_TRACK',
        from: 'contentScript',
        hostname: window.location.hostname
      },
      response => {
        let shouldTrack = response.shouldTrack;
        if (shouldTrack) {
          mountSidebar();
        } else {
          unmountSidebar();
        }
      }
    );
  } else {
    loggedIn = false;
    SiphonTools.disable();
    unmountSidebar();
  }
};

/* Prevent making the below cross-origin requests
  https://www.chromestatus.com/feature/5629709824032768
  https://www.chromium.org/Home/chromium-security/extension-content-script-fetches
*/
// const signInOutUserWithCredential = idToken => {
//   if (idToken !== null) {
//     // logged in
//     firebase
//       .auth()
//       .signInAndRetrieveDataWithCredential(
//         firebase.auth.GoogleAuthProvider.credential(idToken)
//       )
//       .then(result => {
//         // console.log(
//         //   `[CONTENT_ANNOTATION] User ${result.user.displayName} (${
//         //     result.user.uid
//         //   }) logged in.`
//         // );

//         loggedIn = true;

//         SiphonTools.enable();

//         chrome.runtime.sendMessage(
//           {
//             msg: 'SHOULD_TRACK',
//             from: 'contentScript',
//             hostname: window.location.hostname
//           },
//           response => {
//             let shouldTrack = response.shouldTrack;
//             if (shouldTrack) {
//               mountSidebar();
//             } else {
//               unmountSidebar();
//             }
//           }
//         );
//       })
//       .catch(error => {
//         console.log(error);
//       });
//   } else {
//     // logged out
//     firebase
//       .auth()
//       .signOut()
//       .then(() => {
//         // console.log('[CONTENT_ANNOTATION] User logged out.');

//         loggedIn = false;
//         SiphonTools.disable();
//         unmountSidebar();
//       })
//       .catch(error => {
//         console.log(error);
//       });
//   }
// };

//
//
//
//
//
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
/* Set up screenshot modal */
const screenshotModalAnchor = document.body.appendChild(
  document.createElement('div')
);
screenshotModalAnchor.setAttribute('id', 'kap-modal-anchor');
ReactDOM.render(<ScreenshotModal />, screenshotModalAnchor);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'SCREENSHOT_MODAL_SHOULD_DISPLAY') {
    ScreenshotModal.setDataSource(request.imageDataUrl);
    ScreenshotModal.toggleModalOpen();
  }
});

//
//
//
//
//
/* special fix for Cynthia's textbook */
let MathJaxUsed = false;
function injectScript(file, node) {
  var th = document.getElementsByTagName(node)[0];
  var s = document.createElement('script');
  s.setAttribute('type', 'text/javascript');
  s.setAttribute('src', file);
  th.appendChild(s);
}
injectScript(chrome.extension.getURL('inject.js'), 'body');

window.addEventListener('message', function(event) {
  if (event.source !== window) return;

  if (event.data.type && event.data.type === 'FROM_PAGE_MATHJAX_STATUS') {
    // console.log('Content script received message: ' + event.data.status);
    MathJaxUsed = event.data.status;
  }
});

// ScreenshotModal.toggleModalOpen();

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

  ReactDOM.render(
    <SelectTooltipButton
      idToken={userIdToken}
      MathJaxUsed={MathJaxUsed}
      windowSize={{ width: window.innerWidth, height: window.innerHeight }}
      removeTooltipButton={() => {
        try {
          if (
            captureWindow !== undefined &&
            document.querySelector('.siphon-selection-window') !== null
          ) {
            captureWindow.remove();
          }
          ReactDOM.unmountComponentAtNode(popOverAnchor);
        } catch (e) {
          // console.log(e);
        }
      }}
      {...props}
    />,
    popOverAnchor
  );

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
    }
  }),
  SnippetSelector({
    onTrigger: (cptrWindow, e) => {
      captureWindow = cptrWindow;
      let rect = cptrWindow.getBoundingClientRect();
      displayTooltipButtonBasedOnRectPosition(rect, {
        annotationType: ANNOTATION_TYPES.Snippet,
        captureWindow
      });
    }
  })
]);

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
      document.body.style.marginRight = '410px';
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
  // Frame.toggle();
  SiphonTools.enable();
}

function unmountSidebar() {
  try {
    document.body.style.marginRight = '0px';
    ReactDOM.unmountComponentAtNode(sidebarRoot);
    SiphonTools.disable();
  } catch (e) {
    console.log(e);
  }
}

// chrome.runtime.sendMessage({ msg: 'SHOULD_I_TRACK' }, response => {
//   if (response.SHOULD_I_TRACK === false) {
//     unmountSidebar();
//   } else if (response.SHOULD_I_TRACK === true) {
//     mountSidebar();
//   }
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'TURN_OFF_KAP_SIDEBAR') {
    if (request.hostname === window.location.hostname) {
      unmountSidebar();
    }
  } else if (request.msg === 'TURN_ON_KAP_SIDEBAR') {
    if (request.hostname === window.location.hostname && loggedIn === true) {
      mountSidebar();
    }
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

  if (
    (event.ctrlKey && event.key === '`') ||
    (event.ctrlKey && event.key === 'Escape')
  ) {
    if (shouldUseEscapeKeyToToggleSidebar) {
      Frame.toggle();
    }
  }
});
