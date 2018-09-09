/* global chrome */
import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import KAPCaptureHelper from './captures/capture.helper';
import InteractionBox from '../../../../shared-components/src/components/InteractionBox/InteractionBox';
import SelectInteraction from '../../../../shared-components/src/components/InteractionBox/SelectInteraction/SelectInteraction';
import GoogleInPageTaskPrompt from '../../components/InPageTaskPrompt/GoogleInPageTaskPrompt/GoogleInPageTaskPrompt';
import SetAsNewTaskButton from '../../components/InPageTaskPrompt/GoogleInPageTaskPrompt/SetAsNewTaskButton';
import { getSearchTerm, getOrigin } from '../../../../shared-components/src/shared/utilities';
import * as actionTypes from '../../../../shared-components/src/shared/actionTypes';
import classes from './content.annotation.css';
import { PageCountHelper, dragElement } from './content.utility';
import { getFirstSentence } from '../../../../shared-components/src/shared/utilities';
import { SNIPPET_TYPE, APP_NAME_SHORT } from '../../../../shared-components/src/shared/constants';
import APP_ICON_SMALL from '../../../../shared-components/src/assets/images/icon-34.png';
import {
  userId,
  setUserIdAndName,
  tasksRef,
  currentTaskIdRef
} from '../../../../shared-components/src/firebase/index';
import * as FirebaseStore from '../../../../shared-components/src/firebase/store';

/* Set up popover box anchor */
const popOverAnchor = document.body.appendChild(document.createElement('div'));
popOverAnchor.style.zIndex = '33333';
popOverAnchor.style.position = 'absolute';
popOverAnchor.setAttribute('id', 'popover-box');

let currentTaskId = null;

const taskPromptAnchor = document.body.insertBefore(document.createElement('div'), document.body.childNodes[0]);
taskPromptAnchor.style.position = 'fixed';
taskPromptAnchor.style.top = '0px';
taskPromptAnchor.style.left = '0px';
taskPromptAnchor.style.width = '100%';
taskPromptAnchor.style.zIndex = '99999';

const setAsNewTaskBtnAnchor = document.body.insertBefore(document.createElement('div'), document.body.childNodes[0]);
setAsNewTaskBtnAnchor.style.position = 'absolute';
setAsNewTaskBtnAnchor.style.top = '28px';
setAsNewTaskBtnAnchor.style.left = '790px';
setAsNewTaskBtnAnchor.style.zIndex = '99999';


/* UTILITY FUNCTIONS */
const handleFromSearchToTask = () => {
  // check if new search is initiated,
  // if so, attempt to add a new task
  if (userId !== null && userId !== 'invalid') {
    if (getOrigin().indexOf('www.google.com') !== -1) {
      // attempt to generate new task
      let searchTerm = getSearchTerm(window.location);
      if (searchTerm !== '') {
        // google search results page
        // console.log('google search result page');
        ReactDOM.render(
          <div style={{
            marginLeft: '150px',
            marginTop: '6px',
            marginBottom: '12px'
          }}>
            <GoogleInPageTaskPrompt />
          </div>,
          document.querySelector('.mw'));

        ReactDOM.render(
          <SetAsNewTaskButton searchTerm={searchTerm} setAsNewTaskHandler={FirebaseStore.addTaskFromSearchTerm}/>,
          setAsNewTaskBtnAnchor
        );

        // check if should create a new task or stay on the same one
        currentTaskIdRef.once('value', (snapshot) => {
          if (snapshot.exists()) {
            currentTaskId = snapshot.val();
            const currentTaskRef = tasksRef.child(currentTaskId);

            currentTaskRef.once('value', (snap) => {
              if (snap.key === currentTaskId) {
                if (snap.val().taskOngoing === true) {
                  FirebaseStore.addASearchQueryToCurrentTask(searchTerm);
                } else {
                  FirebaseStore.addTaskFromSearchTerm(searchTerm);
                }
              }
            });
          }
        });

      } else {
        // google home page
        // console.log('google home page');

        ReactDOM.render(
          <div style={{
            marginTop: '8px',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-around'
          }}>
            <GoogleInPageTaskPrompt />
          </div>,
          taskPromptAnchor);
      }
    }
  } else {
    try {
      ReactDOM.unmountComponentAtNode(taskPromptAnchor);
      ReactDOM.unmountComponentAtNode(document.querySelector('.mw'));
      ReactDOM.unmountComponentAtNode(setAsNewTaskBtnAnchor);
    } catch (err) {
      console.log(err);
    }

  }

}

const shouldCount = (url) => {
  let should_count = true;
  for (let prefix of PageCountHelper.excluded_prefixes) {
    if (url.indexOf(prefix) !== -1) {
      should_count = false;
      break;
    }
  }
  // console.log("[PAGE COUNT HELPER (shouldCount)]: " + should_count);
  return should_count;
}

const handlePageCount = () => {
  let domainName = window.location.hostname;
  let url = document.location.href;
  let siteTitle = document.title;
  if (shouldCount(url)) {
    FirebaseStore.addAPageToCountList(url, domainName, siteTitle);
  }
}

/** Set up connection between background and content scripts */
let port = chrome.runtime.connect({name: 'FROM_CONTENT'});
port.postMessage({msg: 'GET_USER_INFO'});
port.onMessage.addListener((response) => {
  if (response.msg === 'USER_INFO') {
    const { payload } = response;
    setUserIdAndName(payload.userId);
    console.log('payload.userId', payload.userId);
    handlePageCount();
    handleFromSearchToTask();

  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'USER_INFO') {
    setUserIdAndName(request.payload.userId);
    console.log(request.payload.userId);
    handlePageCount();
    handleFromSearchToTask();
  }
});







/** Inject Fontawesome stylesheet
 * Previous using: https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css
 */
let link = document.createElement("link");
link.href = "https://use.fontawesome.com/releases/v5.0.8/css/all.css";
link.type = "text/css";
link.rel = "stylesheet";
document.head.appendChild(link);





/** Set up Capture Window & mount/unmount utilities */
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
}

const unmountCaptureWindow = () => {
  movingCaptureWindow = false;
  captureWindow.remove();
}

const styleElem = document.createElement('style');
document.head.appendChild(styleElem);
let styleSheet = styleElem.sheet;

let mouseStart = null;



/* Set up interaction box and hover box anchor */
export const interactionBoxAnchor = document.body.appendChild(document.createElement('div'));
interactionBoxAnchor.className = classes.InteractionBoxAnchor;
interactionBoxAnchor.setAttribute('id', 'interaction-box');

const hoverAnchor = document.body.appendChild(document.createElement('div'));
hoverAnchor.className = classes.InteractionBoxAnchor;
hoverAnchor.setAttribute('id', 'hover-box');

let interactionBoxIsMounted = false;
let hoverBoxIsMounted = false;


/* CLEAN EVENTS */
let customRemoveInteractionEvent = new CustomEvent('removeInteractionBoxes', {});

const clean = () => {
  // console.log('annotation cleaning');
  try {
    ReactDOM.unmountComponentAtNode(interactionBoxAnchor);
    ReactDOM.unmountComponentAtNode(hoverAnchor);
    // document.getSelection().empty();
    interactionBoxIsMounted = false;
    hoverBoxIsMounted = false;
  } catch (err) {
    console.log(err);
  }
}

document.addEventListener('removeInteractionBoxes', () =>	clean());


// let isMakingDecision = false;
// let selectedElement = null;

document.addEventListener('mouseup', (event) => {
  let popoverList = document.getElementsByName('kap-popover-container');

  document.body.style.cursor = 'auto';
  if (interactionBoxAnchor.contains(event.target) || hoverAnchor.contains(event.target)) {
    // log("mouse up within the interaction box / hover box");
    return false;
  }

  if (popoverList.length > 0) {
    if (popoverList[0].contains(event.target)) {
      return false;
    }
  }
  
  if (interactionBoxAnchor.parentElement !== null | hoverAnchor.parentElement !== null) {
    document.dispatchEvent(customRemoveInteractionEvent);
  }
});

export const clipClicked = () => {
  document.dispatchEvent(customRemoveInteractionEvent);
}

function displayInteractionBox (type) {
  console.log('should put up interaction box');
  let selectedText = null;
  let originalDimensions = null;
  let htmls = undefined;

  // check type
  if (type === SNIPPET_TYPE.LASSO) {
    let rect = captureWindow.getBoundingClientRect();
    let lassoSnapshot = takeSnapshot(rect);
    selectedText = lassoSnapshot.text;
    originalDimensions = lassoSnapshot.initialDimensions;
    lassoSnapshot.htmls = lassoSnapshot.htmls.filter(html => html.indexOf('kap-clip') === -1 && html.indexOf('kap-button') === -1);
    htmls = lassoSnapshot.htmls;

  } else if (type === SNIPPET_TYPE.SELECTION) {
    let selection = getDocumentSelection();
    selectedText = selection.text;
  }

  // render interaction box
  interactionBoxAnchor.style.left = `0px`;
  interactionBoxAnchor.style.top = `0px`;
  let postTags = [];
  if(window.location.hostname === "stackoverflow.com") {
    $(document.body).find('.post-taglist .post-tag').each((idx, tagNode) => {
      postTags.push($(tagNode).text().toLowerCase());
    });
  }
  ReactDOM.render(
    <InteractionBox
      type={type}
      url={window.location.href}
      htmls={htmls}
      selectedText={selectedText}
      postTags={postTags}
      originalDimensions={originalDimensions}
      clip={clipClicked}
    />,
  interactionBoxAnchor);

  // adjusting position of interaction box after mounting
  interactionBoxAnchor.style.top = `${Math.floor((window.innerHeight - interactionBoxAnchor.clientHeight)/6)}px`;
  interactionBoxAnchor.style.left = `${Math.floor((window.innerWidth - interactionBoxAnchor.clientWidth)/2)}px`;

  interactionBoxIsMounted = true;
  dragElement(document.getElementById("interaction-box"));
}





/* set up mouse move listener */
let mouseX, mouseY;
$(document).mousemove(function(e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
}).mouseover(); // call the handler immediately

// https://stackoverflow.com/questions/1589721/how-can-i-position-an-element-next-to-user-text-selection/1589912#1589912
const getDocumentSelection = () => {
  let selection = document.getSelection();
  // console.log(selection);
  // console.log(selection.getRangeAt(0).getBoundingClientRect());
  if (selection !== null && selection.type.toLowerCase() === 'range') {
    console.log('HAVE SELECTED ' + selection.toString());
    return {
      text: selection.toString(),
      range: selection.getRangeAt(0),
      rect: selection.getRangeAt(0).getBoundingClientRect()
    };

  }
  return {
    text: '',
    range: null,
    rect: null
  };
}



window.addEventListener('mousedown', (event) => {
  if (captureWindow.contains(event.target)) {
    // console.log('click inside window');
    movingCaptureWindow = true;
    mouseStart = event;
    return false;
  }

  unmountCaptureWindow();
  if (["INPUT", "TEXTAREA"].indexOf(event.target.nodeName) < 0 &&
      !event.target.isContentEditable) {
    mouseStart = event;
  }
});

window.addEventListener('mousemove', (event) => {
  // change cursor look
  if (event.altKey) {
    document.body.style.cursor = 'crosshair';
  } else {
    document.body.style.cursor = 'auto';
  }

  if (!mouseStart || document.getSelection().type !== "Range"){ //Only bother doing anything if we have a mousedown event
    return;
  }

  if (event.altKey && captureWindow.parentElement != null) {
    captureWindow.style.width = `${Math.abs(mouseStart.pageX - event.pageX)}px`;
    captureWindow.style.height = `${Math.abs(mouseStart.pageY - event.pageY)}px`;

    captureWindow.style.top = (event.pageY >= mouseStart.pageY)? `${mouseStart.pageY}px` : `${event.pageY}px`;
    captureWindow.style.left = (event.pageX >= mouseStart.pageX)? `${mouseStart.pageX}px` : `${event.pageX}px`;
  }

  if (event.altKey && captureWindow.parentElement == null) { //Check if the capture window is in the dom, add if not
    mountCaptureWindow();
    styleSheet.insertRule('::selection { background-color: inherit  !important; color: inherit  !important;}');
    dragElement(document.getElementById("kap-selection-window"));

  }
});

let takeSnapshot = (rect=null) => {
  let snapshot = KAPCaptureHelper.createSnapshot(rect);
  return snapshot;
}


let justSelectedRange;

function selectionTimeout() {
  let selection = document.getSelection();
  // console.log('selected text:', selection.toString());
  if (selection.type === 'Range' && selection.toString().trim() !== '') {
    let rect = selection.getRangeAt(0).getBoundingClientRect();
    // popOverAnchor.style.width = '100px';
    popOverAnchor.top = '0px';
    popOverAnchor.style.left = `0px`;
    ReactDOM.render(
        <SelectInteraction
          selectedText={selection.toString()}
          addPiece={() => displayInteractionBox(SNIPPET_TYPE.SELECTION)}
          clip={() => ReactDOM.unmountComponentAtNode(popOverAnchor)}/>,
        popOverAnchor);
    // adjusting position of popover box after mounting
    popOverAnchor.style.top = `${rect.top - 5 + window.scrollY - popOverAnchor.clientHeight}px`;
    let leftPosition = Math.floor(rect.left + rect.width/2 - popOverAnchor.clientWidth/2);
    leftPosition = leftPosition >= 10 ? leftPosition : 10;
    popOverAnchor.style.left = `${leftPosition}px`;

    // store range
    justSelectedRange = selection.getRangeAt(0);
  } else {
    ReactDOM.unmountComponentAtNode(popOverAnchor);
  }


  if (captureWindow.parentElement) {
    displayInteractionBox(SNIPPET_TYPE.LASSO);

    if (!movingCaptureWindow) {
      styleSheet.deleteRule(0);
    }
    movingCaptureWindow = false;
    selection.empty();
  }
}

// listening to text selection using keyboard (option + shift + arrow etc)
window.addEventListener('keyup', (event) => {
  if (event.key !== 'Escape') {
    // trick when dealing with window selection on mouse up
    setTimeout(() => {
      selectionTimeout();
    }, 10);
  }
});

window.addEventListener('mouseup', (event) => {
  if (popOverAnchor.contains(event.target)) {
    // console.log('click inside popover');
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(justSelectedRange);
    return false;
  }

  if (!mouseStart)
    return;

  mouseStart = null;
  document.body.style.cursor = 'auto';

  setTimeout(selectionTimeout(),10); // trick when dealing with window selection on mouse up
});


window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    document.dispatchEvent(customRemoveInteractionEvent);
  }
});


window.addEventListener('copy', function (event) {
  if (hoverBoxIsMounted === false && interactionBoxIsMounted === false && window.isInKAP !== true && window.location.href.indexOf('stackoverflow.com') !== -1) {
    let selection = window.getSelection();
    let range = selection.getRangeAt(0);
    let parentPiece = KAPCaptureHelper.createCodeSnippetsFromNode(range.commonAncestorContainer);
    let postTags = [];
    $(document.body).find('.post-taglist .post-tag').each((idx, tagNode) => {
      postTags.push($(tagNode).text().toLowerCase());
    });
    // save to firebase
    let piece = {
      timestamp: (new Date()).getTime(),
      url: window.location.href,
      type: SNIPPET_TYPE.COPIED_PIECE,
      notes: '',
      title: getFirstSentence(selection.toString()),
      content: selection.toString(),
      autoSuggestedTitle: true,
      htmls: parentPiece.htmls,
      postTags: postTags,
      originalDimensions: parentPiece.initialDimensions,
      texts: parentPiece.text,
      codeSnippetHTMLs: [],
      codeSnippetTexts: [],
      selected: false
    }
    FirebaseStore.addAPieceToCurrentTask(piece, true);
    // console.log('just  added a piece');
  }
});




let collectedPostKey = '';

/* optimized for stack overflow */
if(window.location.hostname === "stackoverflow.com") {

  // add a button to each post cell
  $('.post-layout').each((idx, post) => {

    $(post).children('.votecell').append(
      `<button class="kap-clip-post-button">
        <div class="kap-clip-post-checkmark-container">
          <div class="kap-clip-post-checkmark"></div>
        </div>
        <div 
          title="Save to ${APP_NAME_SHORT}"  
          class="kap-button-text-container">
          <span class="kap-button-text">
            <img alt="icon" src=${chrome.extension.getURL(APP_ICON_SMALL)} class="kap-icon-in-button-text"/>
            &nbsp;
            Save
          </span>
        </div>
      </button>`
    );
  });

  $('.kap-clip-post-button').on('click', async function (event) {
    let checkmark = $(this).parents('.post-layout').find('.kap-clip-post-checkmark');
    let buttonText = $(this).parents('.post-layout').find('.kap-button-text');
    if ($(checkmark).hasClass('kap-checkmark-spin')) {
      $(this).removeClass('active');
      $(checkmark).removeClass('kap-checkmark-spin');
      $(buttonText).removeClass('kap-button-text-disappear');
      // unsave the clip
      // console.log('Discard this Snippet');
      // chrome.runtime.sendMessage({
      //   msg: actionTypes.DELETE_A_PIECE_WITH_ID,
      //   payload: {id: collectedPostKey}
      // });
      FirebaseStore.deleteAPieceWithId(collectedPostKey);

    } else {
      $(this).addClass('active');
      $(checkmark).addClass('kap-checkmark-spin');
      $(buttonText).addClass('kap-button-text-disappear');
      // save the clip -> try not to block the UI
      setTimeout(() => {
        // console.log('Save this Snippet');
        let postTextNode = $(this).parents('.post-layout').find('.post-text')[0];
        let postTextSnippet = KAPCaptureHelper.createCodeSnippetsFromNode(postTextNode);
        // console.log(postTextSnippet);
        let codeSnippetInPostText = $(this).parents('.post-layout').find('pre.prettyprint');
        let codeSnippets = [];
        if (codeSnippetInPostText.length > 0) {
          codeSnippetInPostText.each((idx, snp) => {
            let codeSnippet = KAPCaptureHelper.createCodeSnippetsFromNode(snp);
            codeSnippets.push(codeSnippet);
          });
        }
        let postTags = [];
        $(document.body).find('.post-taglist .post-tag').each((idx, tagNode) => {
          postTags.push($(tagNode).text().toLowerCase());
        });

        // save to firebase
        let piece = {
          timestamp: (new Date()).getTime(),
          url: window.location.href,
          type: SNIPPET_TYPE.POST_SNAPSHOT,
          notes: '',
          title: getFirstSentence(postTextSnippet.text),
          autoSuggestedTitle: true,
          htmls: postTextSnippet.htmls,
          postTags: postTags,
          originalDimensions: postTextSnippet.initialDimensions,
          texts: postTextSnippet.text,
          codeSnippetHTMLs: codeSnippets.map(snp => snp.htmls),
          codeSnippetTexts: codeSnippets.map(snp => snp.text),
          selected: false
        }
        FirebaseStore.addAPieceToCurrentTask(piece).then((data) => {
          collectedPostKey = data;
        });
      }, 5);
    }
    $(this).blur();
  });

}
