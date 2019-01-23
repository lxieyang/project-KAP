/* global chrome */
import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import Frame from './frame';
import SelectTooltipButton from './SelectTooltipButton/SelectTooltipButton';
import { dragElement } from './content.utility';

import { ANNOTATION_TYPES } from '../../../../shared-components/src/shared/types';
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

/* Set up popover box anchor */
const popOverAnchor = document.body.appendChild(document.createElement('div'));
popOverAnchor.style.zIndex = '33333';
popOverAnchor.style.position = 'absolute';
popOverAnchor.setAttribute('id', 'popover-box');

function displayTooltipButton(rect, props) {
  popOverAnchor.top = '0px';
  popOverAnchor.style.left = `0px`;

  ReactDOM.render(<SelectTooltipButton {...props} />, popOverAnchor);

  // adjusting position of popover box after mounting
  popOverAnchor.style.top = `${rect.bottom + 3 + window.scrollY}px`;
  let leftPosition = Math.floor(
    rect.left + rect.width - popOverAnchor.clientWidth
  );
  leftPosition = leftPosition >= 10 ? leftPosition : 10;
  popOverAnchor.style.left = `${leftPosition}px`;
}

let store = new Store({
  [ANNOTATION_TYPES.Highlight]: Highlight,
  [ANNOTATION_TYPES.Snippet]: Snippet
});
store.init();

let captureWindow;

SiphonTools.initializeSelectors([
  HighlightSelector({
    onTrigger: (range, e) => {
      displayTooltipButton(range.getBoundingClientRect());

      let highlight = new Highlight(range);
      console.log(highlight);
      // store.saveAnnotation(highlight);
    }
  }),
  SnippetSelector({
    onTrigger: (cptrWindow, e) => {
      captureWindow = cptrWindow;
      let rect = cptrWindow.getBoundingClientRect();
      displayTooltipButton(rect, {
        captureWindow
      });
      let snippet = new Snippet(rect);
      console.log(snippet);
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
      // Frame.toggle(true);
      Frame.toggle();
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
