/* global chrome */
import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import Frame from './frame';
import SelectTooltipButton from '../../../../shared-components/src/components/InteractionBox/SelectTooltipButton/SelectTooltipButton';
import { dragElement } from './content.utility';

import { PIECE_TYPES } from '../../../../shared-components/src/shared/types';
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

let store = new Store({
  [PIECE_TYPES.Highlight]: Highlight,
  [PIECE_TYPES.Snippet]: Snippet
});
store.init();

let captureWindow;

SiphonTools.initializeSelectors([
  HighlightSelector({
    onTrigger: (range, e) => {
      let highlight = new Highlight(range);
      console.log(highlight);
      // store.saveAnnotation(highlight);
    }
  }),
  SnippetSelector({
    onTrigger: (cptrWindow, e) => {
      let bounding = cptrWindow.getBoundingClientRect();
      let snippet = new Snippet(bounding);
      console.log(snippet);
      captureWindow = cptrWindow;
    }
  })
]);

window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (
      captureWindow !== undefined &&
      document.querySelector('.siphon-selection-window') !== null
    ) {
      captureWindow.remove();
    } else {
      Frame.toggle(true);
    }
  }
});

//
//
//
//
//
/* Sidebar manager & tracking status manager */
let shouldShrinkBody = true;
chrome.runtime.sendMessage({ msg: 'SHOULD_SHRINK_BODY' }, response => {
  shouldShrinkBody = response.SHOULD_SHRINK_BODY;
  document.body.style.transition = 'all 0.25s ease-in';
});

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
  }
});

// var keymap = {};
// $(document)
//   .keydown(function(e) {
//     console.log(e);
//     keymap[e.keyCode] = true;
//     console.log(keymap);
//   })
//   .keyup(function(e) {
//     keymap[e.keyCode] = false;
//     console.log(keymap);
//   });

// //
// //
// //
// //
// //
// /* Select Tooltip Setup */
// const captureWindow = document.createElement('div');
// captureWindow.className = 'kap-selection-window';
// captureWindow.setAttribute('id', 'kap-selection-window');
// const captureWindowInside = document.createElement('div');
// captureWindowInside.className = 'kap-selection-window-inside';
// captureWindowInside.setAttribute('id', 'kap-selection-window-inside');
// let movingCaptureWindow = false;

// const mountCaptureWindow = () => {
//   document.body.appendChild(captureWindow);
//   captureWindow.appendChild(captureWindowInside);
// };

// const unmountCaptureWindow = () => {
//   movingCaptureWindow = false;
//   captureWindow.remove();
// };

// const styleElem = document.createElement('style');
// document.head.appendChild(styleElem);
// let styleSheet = styleElem.sheet;

// /* CLEAN EVENTS */
// let customRemoveInteractionEvent = new CustomEvent(
//   'removeInteractionBoxes',
//   {}
// );

// const clean = () => {
//   // console.log('annotation cleaning');
//   try {
//     ReactDOM.unmountComponentAtNode(popOverAnchor);
//     // document.getSelection().empty();
//   } catch (err) {
//     console.log(err);
//   }
// };

// document.addEventListener('removeInteractionBoxes', () => clean());

// // https://stackoverflow.com/questions/1589721/how-can-i-position-an-element-next-to-user-text-selection/1589912#1589912
// const getDocumentSelection = () => {
//   let selection = document.getSelection();
//   // console.log(selection);
//   // console.log(selection.getRangeAt(0).getBoundingClientRect());
//   if (selection !== null && selection.type.toLowerCase() === 'range') {
//     console.log('HAVE SELECTED ' + selection.toString());
//     return {
//       text: selection.toString(),
//       range: selection.getRangeAt(0),
//       rect: selection.getRangeAt(0).getBoundingClientRect()
//     };
//   }
//   return {
//     text: '',
//     range: null,
//     rect: null
//   };
// };

// let mouseStart = null;

// window.addEventListener('mousedown', event => {
//   if (captureWindow.contains(event.target)) {
//     movingCaptureWindow = true;
//     mouseStart = event;
//     return false;
//   }

//   if (
//     captureWindow.parentElement !== null &&
//     popOverAnchor.contains(event.target)
//   ) {
//     // clicking save button
//     return false;
//   }

//   unmountCaptureWindow();
//   if (
//     ['INPUT', 'TEXTAREA'].indexOf(event.target.nodeName) < 0 &&
//     !event.target.isContentEditable
//   ) {
//     mouseStart = event;
//   }
// });

// window.addEventListener('mousemove', event => {
//   // change cursor look
//   if (event.altKey) {
//     document.body.style.cursor = 'crosshair';
//   } else {
//     document.body.style.cursor = 'auto';
//   }

//   if (!mouseStart || document.getSelection().type !== 'Range') {
//     //Only bother doing anything if we have a mousedown event
//     return;
//   }

//   if (event.altKey && captureWindow.parentElement != null) {
//     captureWindow.style.width = `${Math.abs(mouseStart.pageX - event.pageX)}px`;
//     captureWindow.style.height = `${Math.abs(
//       mouseStart.pageY - event.pageY
//     )}px`;

//     captureWindow.style.top =
//       event.pageY >= mouseStart.pageY
//         ? `${mouseStart.pageY}px`
//         : `${event.pageY}px`;
//     captureWindow.style.left =
//       event.pageX >= mouseStart.pageX
//         ? `${mouseStart.pageX}px`
//         : `${event.pageX}px`;
//   }

//   if (event.altKey && captureWindow.parentElement == null) {
//     //Check if the capture window is in the dom, add if not
//     mountCaptureWindow();
//     styleSheet.insertRule(
//       '::selection { background-color: inherit  !important; color: inherit  !important;}'
//     );
//     dragElement(document.getElementById('kap-selection-window'));
//   }
// });

// /* Set up popover box anchor */
// const popOverAnchor = document.body.appendChild(document.createElement('div'));
// popOverAnchor.style.zIndex = '33333';
// popOverAnchor.style.position = 'absolute';
// popOverAnchor.setAttribute('id', 'popover-box');

// let justSelectedRange;

// function selectionTimeout() {
//   let selection = document.getSelection();
//   // console.log('selected text:', selection.toString());
//   if (
//     selection.type === 'Range' &&
//     selection.toString().trim() !== '' &&
//     captureWindow.parentElement === null
//   ) {
//     let rect = selection.getRangeAt(0).getBoundingClientRect();
//     displayTooltipButton(rect);
//     // // popOverAnchor.style.width = '100px';
//     // popOverAnchor.top = '0px';
//     // popOverAnchor.style.left = `0px`;

//     // ReactDOM.render(<SelectTooltipButton />, popOverAnchor);

//     // // adjusting position of popover box after mounting
//     // popOverAnchor.style.top = `${rect.bottom + 3 + window.scrollY}px`;
//     // let leftPosition = Math.floor(
//     //   rect.left + rect.width / 2 - popOverAnchor.clientWidth / 2
//     // );
//     // leftPosition = leftPosition >= 10 ? leftPosition : 10;
//     // popOverAnchor.style.left = `${leftPosition}px`;

//     // store range
//     justSelectedRange = selection.getRangeAt(0);
//   } else {
//     ReactDOM.unmountComponentAtNode(popOverAnchor);
//   }

//   if (captureWindow.parentElement) {
//     if (!movingCaptureWindow) {
//       // styleSheet.deleteRule(0);
//     }
//     movingCaptureWindow = false;
//     selection.empty();
//   }
// }

// function displayTooltipButton(rect) {
//   // popOverAnchor.top = '0px';
//   // popOverAnchor.style.left = `0px`;

//   // ReactDOM.render(<SelectTooltipButton />, popOverAnchor);

//   // // adjusting position of popover box after mounting
//   // popOverAnchor.style.top = `${rect.bottom + 3 + window.scrollY}px`;
//   // let leftPosition = Math.floor(
//   //   rect.left + rect.width / 2 - popOverAnchor.clientWidth / 2
//   // );
//   // leftPosition = leftPosition >= 10 ? leftPosition : 10;
//   // popOverAnchor.style.left = `${leftPosition}px`;

//   popOverAnchor.top = '0px';
//   popOverAnchor.style.left = `0px`;

//   ReactDOM.render(<SelectTooltipButton />, popOverAnchor);

//   // adjusting position of popover box after mounting
//   popOverAnchor.style.top = `${rect.bottom + 3 + window.scrollY}px`;
//   let leftPosition = Math.floor(
//     rect.left + rect.width - popOverAnchor.clientWidth
//   );
//   leftPosition = leftPosition >= 10 ? leftPosition : 10;
//   popOverAnchor.style.left = `${leftPosition}px`;
// }

// // listening to text selection using keyboard (option + shift + arrow etc)
// window.addEventListener('keyup', event => {
//   if (event.key !== 'Escape') {
//     // trick when dealing with window selection on mouse up
//     setTimeout(() => {
//       selectionTimeout();
//     }, 10);
//   }
// });

// window.addEventListener('mouseup', event => {
//   if (popOverAnchor.contains(event.target)) {
//     // console.log('click inside popover');
//     // window.getSelection().removeAllRanges();
//     // window.getSelection().addRange(justSelectedRange);
//     return false;
//   }

//   if (!mouseStart) return;

//   mouseStart = null;
//   document.body.style.cursor = 'auto';

//   setTimeout(selectionTimeout(), 5); // trick when dealing with window selection on mouse up

//   if (captureWindow.parentElement !== null) {
//     setTimeout(displayTooltipButton(captureWindow.getBoundingClientRect()), 5); // trick when dealing with window selection on mouse up
//   }
// });
