import queryString from 'query-string';
import { getPureUrlWithoutHash } from '../../../../../../shared-components/src/shared/utilities';
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
const keepTrackOfWebpage = (parentUrl, url, title, favIconUrl) => {
  if (url.indexOf('chrome://') !== -1) {
    return;
  }
  if (url.indexOf('localhost') !== -1) {
    return;
  }
  if (url.indexOf('www.google.com') !== -1) {
    return;
  }
  if (url.indexOf('photos.google') !== -1) {
    return;
  }

  if (getSearchQueryFromURL(url) !== null) {
    return;
  }

  console.log('NOW', url);
  FirestoreManager.addPageToTask({
    url: getPureUrlWithoutHash(url),
    title,
    favIconUrl
  });
};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    gatherTabInfo();
    keepTrackOfWebpage(null, tab.url, tab.title, tab.favIconUrl);
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  FirestoreManager.updatePageLeaveTimestampViaUrl(allTabs[tabId].url);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'PAGE_LOADED') {
    let { url, scrollPercentage } = request.payload;
    url = getPureUrlWithoutHash(url);
    // reset scroll position
    FirestoreManager.resetPageScrollPercentageViaUrl(url, scrollPercentage);
  }
  if (request.msg === 'PAGE_SCROLLED') {
    let { url, scrollPercentage } = request.payload;
    url = getPureUrlWithoutHash(url);
    // update scroll position
    FirestoreManager.updatePageScrollPercentageViaUrl(url, scrollPercentage);
  }
});
