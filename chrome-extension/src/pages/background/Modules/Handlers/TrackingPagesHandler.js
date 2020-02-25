import queryString from 'query-string';
import firebase from '../../../../../../shared-components/src/firebase/firebase';
import * as FirestoreManager from '../../../../../../shared-components/src/firebase/firestore_wrapper';

const getSearchQueryFromURL = url => {
  const parsed = queryString.parse(new URL(url).search);
  if (parsed.q !== null && parsed.q !== undefined) {
    return parsed.q.trim();
  } else {
    return null;
  }
};

let allTabs = {};

const gatherTabInfo = () => {
  chrome.tabs.query({}, tabs => {
    allTabs = {};
    tabs.forEach(tab => {
      const { id, url, title } = tab;
      let query = null;
      const { hostname, pathname } = new URL(url);
      if (
        hostname.trim() === 'www.google.com' &&
        pathname.trim() === '/search'
      ) {
        query = getSearchQueryFromURL(url);
      }
      allTabs[id] = {
        url,
        title,
        query,
        faviconUrl: tab.faviconUrl ? tab.faviconUrl : false
      };
    });
    // console.log(allTabs);
  });
};

gatherTabInfo();

// prevent tracking:
/**
 * - new tab
 * - localhost
 * - google tab
 */
const keepTrackOfWebpage = (parentUrl, url, title) => {
  if (url.indexOf('chrome://newtab') !== -1) {
    return;
  }
  if (url.indexOf('localhost') !== -1) {
    return;
  }
  if (url.indexOf('www.google.com') !== -1) {
    return;
  }
  if (parentUrl.indexOf('chrome://newtab') !== -1) {
    parentUrl = null;
  }
  if (parentUrl.indexOf('localhost') !== -1) {
    parentUrl = null;
  }

  console.log('PARENT:', parentUrl);
  console.log('NOW', url);
  FirestoreManager.addPageToTask({ url, parentUrl, title });
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url !== undefined && changeInfo.url !== null) {
    if (tab.openerTabId === undefined) {
      if (
        allTabs[tabId].query === null &&
        getSearchQueryFromURL(changeInfo.url) === null
      ) {
        // should track
        keepTrackOfWebpage(allTabs[tabId].url, changeInfo.url, tab.title);
      }
    } else {
      if (
        (allTabs[tab.openerTabId].query === null &&
          getSearchQueryFromURL(changeInfo.url) === null) ||
        (allTabs[tab.openerTabId].query !== null &&
          allTabs[tabId].query === null &&
          getSearchQueryFromURL(changeInfo.url) === null)
      ) {
        // should track
        keepTrackOfWebpage(
          allTabs[tab.openerTabId].url,
          changeInfo.url,
          tab.title
        );
      }
    }
  }

  if (changeInfo.status === 'complete') {
    gatherTabInfo();
    // update page data
    FirestoreManager.updatePageTitleViaUrl(tab.url, tab.title);
  }
});
