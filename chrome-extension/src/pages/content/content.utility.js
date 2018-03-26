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
        // console.log(searchTerm);

        // // get current task
        // // chrome.runtime.sendMessage({
        // //   msg: actionTypes.GET_CURRENT_TASK
        // // }, (currentTask) => {
        // this.lastTask = FirebaseStore.currentTask;
        // // console.log(this.lastTask);

        // $('body').prepend(
        // `
        // <div id="kap-insert-box-container">
        //   <div id="kap-task-info-container">
        //     <div id="kap-task-info-title">Last Task:</div>
        //     ${this.lastTask.name}
        //   </div>
        //   <div id="kap-question-container">
        //     <div id="kap-question-title">Still on the same task?</div>
        //     <div id="kap-question-answer-container"><input id="same-task-checkbox" type="checkbox"></div>
        //   </div>
        // </div>
        // `
        // );

        // $('#same-task-checkbox').on('click', (event) => {
        //   let checked = event.target.checked;
        //   // chrome.runtime.sendMessage({
        //   //   msg: actionTypes.SWITCH_STATUS_FOR_STAY_IN_THE_SAME_TASK,
        //   //   payload: {
        //   //     shouldStayInTheSameTask: checked,
        //   //     lastTaskId: this.lastTask.id,
        //   //     thisSearchTerm: searchTerm
        //   //   }
        //   // });
        //   FirebaseStore.switchStatusForStayInTheSameTask(checked, this.lastTask.id, searchTerm);
        // });
        
        // ChromeMessagingHelper.sendMessageToBackground(
        //   actionTypes.ADD_TASK_FROM_SEARCH_TERM,
        //   {searchTerm}
        // );
        FirebaseStore.addTaskFromSearchTerm(searchTerm);

        // currentTaskIdRef.on('value', (snapshot) => {
        //   this.currentTaskId = snapshot.val();
        //   if(this.lastTask.id === this.currentTaskId) {
        //     // console.log($('#same-task-checkbox'));
        //     $('#same-task-checkbox').prop('checked', true);
        //   }
      
        //   tasksRef.child(this.currentTaskId).once('value', (snapshot) => {
        //     this.currentTask = snapshot.val();
        //   });
        // });
        // }); 
      }
    } 

    
  }
}