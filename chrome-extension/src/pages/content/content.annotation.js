/* global chrome */
import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import Frame from './frame';

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
  }
});
