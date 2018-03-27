/* global chrome */
import $ from 'jquery';
import { getSearchTerm, getOrigin } from '../../../../shared-components/src/shared/utilities';
import * as FirebaseStore from '../../../../shared-components/src/firebase/store';



export class PageCountHelper {
  static excluded_prefixes = [
    'www.google.com',
    'www.bing.com',
    'search.yahoo.com',
    'www.youtube.com',
    'accounts.google.com',
    'facebook.com',
    'twitter.com',
    'messenger.com',
    'slack.com',
    'localhost'
    // should be more
  ];

  static shouldCount (url) {
    let should_count = true;
    for (let prefix of this.excluded_prefixes) {
      if (url.indexOf(prefix) !== -1) {
        should_count = false;
        break;
      }
    }
    console.log("[PAGE COUNT HELPER (shouldCount)]: " + should_count);
    return should_count;
  }

  static handlePageCount() {
    let domainName = window.location.hostname;
    let url = document.location.href;
    let siteTitle = document.title;
    if (this.shouldCount(url)) {
      // ChromeMessagingHelper.sendMessageToBackground(
      //   actionTypes.ADD_A_PAGE_TO_COUNT_LIST,
      //   {url, domainName, siteTitle}
      // );
      FirebaseStore.addAPageToCountList(url, domainName, siteTitle);
    }
  }
}


export class WebSurferHelper {
  static laskTask = {};
  static currentTask = {};
  static currentTaskId = "";


  static handleFromSearchToTask () {
    // check if new search is initiated,
    // if so, attempt to add a new task
    if (getOrigin().indexOf('www.google.com') !== -1) {
      // configure to open links in new tab
      // $('.srg a').each((idx, element) => {
      //   $(element).attr('target', '__blank');
      // });
  
      // attempt to generate new task
      let searchTerm = getSearchTerm(window.location);
      if (searchTerm !== '') {
        FirebaseStore.addTaskFromSearchTerm(searchTerm);
      }
    } 

    
  }
}