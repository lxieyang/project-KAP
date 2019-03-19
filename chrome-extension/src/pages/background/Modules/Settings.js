/* global chrome */
//
//
//
//
//
/* Choose to shrink body / cover content */
let shouldShrinkBody = true;
let shouldUseEscapeKeyToToggleSidebar = true;
const updateShouldShrinkBodyStatus = () => {
  chrome.tabs.query({}, function(tabs) {
    for (var i = 0; i < tabs.length; ++i) {
      chrome.tabs.sendMessage(tabs[i].id, {
        msg: `TURN_${shouldShrinkBody ? 'ON' : 'OFF'}_BODY_SHRINK`
      });
    }
  });
};

const updateShouldUseEscapeKeyToToggleSidebarStatus = () => {
  chrome.tabs.query({}, function(tabs) {
    for (var i = 0; i < tabs.length; ++i) {
      chrome.tabs.sendMessage(tabs[i].id, {
        msg: `TURN_${
          shouldUseEscapeKeyToToggleSidebar ? 'ON' : 'OFF'
        }_TOGGLE_SIDEBAR_WITH_ESC_KEY`
      });
    }
  });
};

// check chrome storage to see if should enable shouldShrinkBody
chrome.storage.sync.get(['shouldShrinkBody'], function(result) {
  console.log('shouldShrinkBody:', result.shouldShrinkBody);
  if (result.shouldShrinkBody !== undefined) {
    shouldShrinkBody = result.shouldShrinkBody;
  }
  updateShouldShrinkBodyStatus();
});

// check chrome storage to see if should enable shouldUseEscapeKeyToToggleSidebar
chrome.storage.sync.get(['shouldUseEscapeKeyToToggleSidebar'], function(
  result
) {
  console.log(
    'shouldUseEscapeKeyToToggleSidebar:',
    result.shouldUseEscapeKeyToToggleSidebar
  );
  if (result.shouldUseEscapeKeyToToggleSidebar !== undefined) {
    shouldUseEscapeKeyToToggleSidebar =
      result.shouldUseEscapeKeyToToggleSidebar;
  }
  updateShouldUseEscapeKeyToToggleSidebarStatus();
});

chrome.tabs.onCreated.addListener(tab => {
  chrome.tabs.sendMessage(tab.id, {
    msg: `TURN_${shouldShrinkBody ? 'ON' : 'OFF'}_BODY_SHRINK`
  });
  chrome.tabs.sendMessage(tab.id, {
    msg: `TURN_${shouldShrinkBody ? 'ON' : 'OFF'}_TOGGLE_SIDEBAR_WITH_ESC_KEY`
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.msg === 'SETTINGS_CHANGED_SIDEBAR_BEHAVIOR') {
    shouldShrinkBody = request.to === 'overlay' ? false : true;
    updateShouldShrinkBodyStatus();
    chrome.storage.sync.set({ shouldShrinkBody }, function() {
      //  Data's been saved boys and girls, go on home
      console.log('shouldShrinkBody has been set to:', shouldShrinkBody);
    });
  }

  if (request.msg === 'SETTINGS_CHANGED_SIDEBAR_ESCAPE_KEY_TOGGLE') {
    shouldUseEscapeKeyToToggleSidebar = request.to;
    updateShouldUseEscapeKeyToToggleSidebarStatus();
    chrome.storage.sync.set({ shouldUseEscapeKeyToToggleSidebar }, function() {
      //  Data's been saved boys and girls, go on home
      console.log(
        'shouldUseEscapeKeyToToggleSidebar has been set to:',
        shouldUseEscapeKeyToToggleSidebar
      );
    });
  }

  if (request.msg === 'SHOULD_SHRINK_BODY') {
    sendResponse({ SHOULD_SHRINK_BODY: shouldShrinkBody });
  }

  if (request.msg === 'SHOULD_TOGGLE_SIDEBAR_WITH_ESC_KEY') {
    sendResponse({
      SHOULD_TOGGLE_SIDEBAR_WITH_ESC_KEY: shouldUseEscapeKeyToToggleSidebar
    });
  }
});
