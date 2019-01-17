/* global chrome */
import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import Frame from './frame';
import SelectTooltipButton from '../../../../shared-components/src/components/InteractionBox/SelectTooltipButton/SelectTooltipButton';

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
/* Sidebar manager */
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
}

function unmountSidebar() {
  ReactDOM.unmountComponentAtNode(sidebarRoot);
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

//
//
//
//
//
/* Select Tooltip Setup */
const captureWindow = document.createElement('div');
captureWindow.className = 'kap-selection-window';
captureWindow.setAttribute('id', 'kap-selection-window');
const captureWindowInside = document.createElement('div');
captureWindowInside.className = 'kap-selection-window-inside';
captureWindowInside.setAttribute('id', 'kap-selection-window-inside');
let movingCaptureWindow = false;

const mountCaptureWindow = () => {
  document.body.appendChild(captureWindow);
  captureWindow.appendChild(captureWindowInside);
};

const unmountCaptureWindow = () => {
  movingCaptureWindow = false;
  captureWindow.remove();
};

const styleElem = document.createElement('style');
document.head.appendChild(styleElem);
let styleSheet = styleElem.sheet;

let mouseStart = null;

window.addEventListener('mousedown', event => {
  if (
    ['INPUT', 'TEXTAREA'].indexOf(event.target.nodeName) < 0 &&
    !event.target.isContentEditable
  ) {
    mouseStart = event;
  }
});

/* Set up popover box anchor */
const popOverAnchor = document.body.appendChild(document.createElement('div'));
popOverAnchor.style.zIndex = '33333';
popOverAnchor.style.position = 'absolute';
popOverAnchor.setAttribute('id', 'popover-box');

let justSelectedRange;

function selectionTimeout() {
  let selection = document.getSelection();
  // console.log('selected text:', selection.toString());
  if (selection.type === 'Range' && selection.toString().trim() !== '') {
    let rect = selection.getRangeAt(0).getBoundingClientRect();
    // popOverAnchor.style.width = '100px';
    popOverAnchor.top = '0px';
    popOverAnchor.style.left = `0px`;

    ReactDOM.render(<SelectTooltipButton />, popOverAnchor);

    // adjusting position of popover box after mounting
    popOverAnchor.style.top = `${rect.bottom + 3 + window.scrollY}px`;
    let leftPosition = Math.floor(
      rect.left + rect.width / 2 - popOverAnchor.clientWidth / 2
    );
    leftPosition = leftPosition >= 10 ? leftPosition : 10;
    popOverAnchor.style.left = `${leftPosition}px`;

    // store range
    justSelectedRange = selection.getRangeAt(0);
  } else {
    ReactDOM.unmountComponentAtNode(popOverAnchor);
  }
}

// listening to text selection using keyboard (option + shift + arrow etc)
window.addEventListener('keyup', event => {
  if (event.key !== 'Escape') {
    // trick when dealing with window selection on mouse up
    setTimeout(() => {
      selectionTimeout();
    }, 10);
  }
});

window.addEventListener('mouseup', event => {
  if (popOverAnchor.contains(event.target)) {
    // console.log('click inside popover');
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(justSelectedRange);
    return false;
  }

  if (!mouseStart) return;

  mouseStart = null;
  document.body.style.cursor = 'auto';

  setTimeout(selectionTimeout(), 5); // trick when dealing with window selection on mouse up
});
