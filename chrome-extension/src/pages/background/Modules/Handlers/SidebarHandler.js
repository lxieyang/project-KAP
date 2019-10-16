console.log('sidebar handler');

const toggleSidebar = () => {
  console.log('toggle sidebar');
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    let activeTabId = tabs[0].id;
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(activeTabId, {
        from: 'background',
        msg: 'TOGGLE_SIDEBAR'
      });
    });
  });
};

chrome.browserAction.onClicked.addListener(senderTab => {
  console.log('browser icon clicked');
  toggleSidebar();
});

chrome.commands.onCommand.addListener(function(command) {
  if (command === 'toggle-sidebar') {
    toggleSidebar();
  } else if (command === 'toggle-sidebar-2') {
    toggleSidebar();
  }
});
