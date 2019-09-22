console.log('sidebar handler');

const toggleSidebar = () => {
  console.log('toggle sidebar');
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
