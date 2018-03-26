/* global chrome */
import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import KAPCaptureHelper from './captures/capture.helper';
import InteractionBox from '../../components/InteractionBox/InteractionBox';
import HoverInteraction from '../../components/InteractionBox/HoverInteraction/HoverInteraction';

import * as actionTypes from '../../shared/actionTypes';
import classes from './content.annotation.css';
import { dragElement } from '../../shared/utilities';

import { 
  PageCountHelper,
  WebSurferHelper
} from './content.utility';
import { 
  tasksRef,
  currentTaskIdRef
} from '../../firebase/index';
import { SNIPPET_TYPE } from '../../shared/constants';
import * as FirebaseStore from '../../firebase/store';


/* inject stylesheet */
let link = document.createElement("link");
// link.href = "https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css";
link.href = "https://use.fontawesome.com/releases/v5.0.8/css/all.css";
link.type = "text/css";
link.rel = "stylesheet";
document.head.appendChild(link);




/* Handle page count */
PageCountHelper.handlePageCount();

/* handle searches to create tasks */
WebSurferHelper.handleFromSearchToTask();



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



/* Set up interaction box and hover box */
const interactionBoxAnchor = document.body.appendChild(document.createElement('div'));
interactionBoxAnchor.className = classes.InteractionBoxAnchor;
interactionBoxAnchor.setAttribute('id', 'interaction-box');

const hoverAnchor = document.body.appendChild(document.createElement('div'));
hoverAnchor.className = classes.InteractionBoxAnchor;
hoverAnchor.setAttribute('id', 'hover-box');

// interactionBoxAnchor.style.left = '100px';
// interactionBoxAnchor.style.top = '100px';
// ReactDOM.render(<InteractionBox />, interactionBoxAnchor);


let customRemoveInteractionEvent = new CustomEvent('removeInteractionBoxes', {});

const clean = () => {
  try {
    ReactDOM.unmountComponentAtNode(interactionBoxAnchor);
    ReactDOM.unmountComponentAtNode(hoverAnchor);
    // document.getSelection().empty();
  } catch (err) {
    console.log(err);
  }
}

document.addEventListener('removeInteractionBoxes', () =>	clean());


// let isMakingDecision = false;
// let selectedElement = null;

document.addEventListener('mouseup', (event) => {
  document.body.style.cursor = 'auto';
  if (interactionBoxAnchor.contains(event.target) || hoverAnchor.contains(event.target)) {
    // log("mouse up within the interaction box / hover box");
    return false;
  }
  if (interactionBoxAnchor.parentElement !== null | hoverAnchor.parentElement !== null) {
    document.dispatchEvent(customRemoveInteractionEvent);
  }
});





/* set up mouse move listener */
let mouseX, mouseY;
$(document).mousemove(function(e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
}).mouseover(); // call the handler immediately

// https://stackoverflow.com/questions/1589721/how-can-i-position-an-element-next-to-user-text-selection/1589912#1589912
const getDocumentSelection = () => {
  let selection = document.getSelection();
  console.log(selection);
  console.log(selection.getRangeAt(0).getBoundingClientRect());
  if (selection !== null && selection.type.toLowerCase() === 'range') {
    console.log('HAVE SELECTED');
    return {
      text: selection.toString(),
      rect: selection.getRangeAt(0).getBoundingClientRect()
    };
    
  }
  return {
    text: '',
    rect: null
  };
}

const clipClicked = () => {
  console.log('clicked');
  document.dispatchEvent(customRemoveInteractionEvent);
}

/* context menu listener */
chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.msg === actionTypes.ADD_OPTION_CONTEXT_MENU_CLICKED) {
      // console.log('should put up hover interaction');
      let selection = getDocumentSelection();
      let rect = {};
      hoverAnchor.style.left = `${mouseX-50}px`;
      hoverAnchor.style.top = `${mouseY+15}px`;
      if (selection.rect !== null) {
        rect = {...selection.rect.toJSON()};
        rect.top += document.documentElement.scrollTop;
        hoverAnchor.style.left = `${Math.floor(rect.left) + 25}px`;
        hoverAnchor.style.top = `${Math.floor(rect.top) + 25}px`;
      }      
      ReactDOM.render(
        <HoverInteraction content={selection.text} clip={clipClicked}/>, 
        hoverAnchor
      );
      dragElement(document.getElementById("hover-box"));

    } else if (request.msg === actionTypes.ADD_PIECE_CONTEXT_MENU_CLICKED) {
      // console.log('should put up interaction box');
      let selection = getDocumentSelection();
      let rect = null;
      console.log(selection.rect);
      interactionBoxAnchor.style.left = `${mouseX-50}px`;
      interactionBoxAnchor.style.top = `${mouseY+15}px`;
      if (selection.rect !== null) {
        rect = {...selection.rect.toJSON()};
        rect.top += document.documentElement.scrollTop;
        interactionBoxAnchor.style.left = `${Math.floor(rect.left) + 25}px`;
        interactionBoxAnchor.style.top = `${Math.floor(rect.top) + 25}px`;
      }      
      let postTags = [];
      if(window.location.hostname === "stackoverflow.com") {
        $(document.body).find('.post-taglist .post-tag').each((idx, tagNode) => {
          postTags.push($(tagNode).text().toLowerCase());
        });
      }
      ReactDOM.render(
        <InteractionBox 
          type={SNIPPET_TYPE.SELECTION}
          url={window.location.href}
          selectedText={selection.text}
          postTags={postTags}
          originalDimensions={rect !== null ? rect : null}
          clip={clipClicked}
        />, 
      interactionBoxAnchor);

      dragElement(document.getElementById("interaction-box"));
    }
  }
);





window.addEventListener('mousedown', (event) => {
  if (captureWindow.contains(event.target)) {
    console.log('click inside window');
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
  // if (movingCaptureWindow) {
  //   console.log('moving');
  //   console.log(captureWindow.getBoundingClientRect());
  // }

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
  // snapshot.logThisSnippet();
  // console.log(snapshot.htmls);
  // for (let i = 0; i < snapshot.htmls.length; i++) {
  //   console.log(snapshot.htmls[i]);
  // }
  // console.log(snapshot.initialDimensions);
  // console.log(snapshot.text);
  return snapshot;
}


window.addEventListener('mouseup', (event) => {
  if (!mouseStart)
    return;
  
  mouseStart = null;
  document.body.style.cursor = 'auto';

  setTimeout(() => {
    let selection = document.getSelection();
    if (captureWindow.parentElement) {
  //     //TODO take care of capturing the elements?

  // //    chrome.runtime.sendMessage({msg: 'takeScreenshot'}, (dataURI) => {
  // //                               
  // //    });
  //     toolbar.style.left = `${parseInt(captureWindow.style.left) - toolbarWidth}px`;
  //     toolbar.style.top = captureWindow.style.top;
  //     ReactDOM.render(<AnnotationToolbar store={store} snippetWindow={captureWindow}/>, toolbar)

      let rect = captureWindow.getBoundingClientRect();
      let lassoSnapshot = takeSnapshot(rect);
      let snapshotDimension = lassoSnapshot.initialDimensions;
      interactionBoxAnchor.style.left = `${mouseX-50}px`;
      interactionBoxAnchor.style.top = `${mouseY+15}px`;
      if (selection.rect !== null) {
        interactionBoxAnchor.style.left = `${Math.floor(snapshotDimension.left) + 25}px`;
        interactionBoxAnchor.style.top = `${Math.floor(snapshotDimension.top) + 25}px`;
      }      
      // prepare for data transfer
      let postTags = [];
      if(window.location.hostname === "stackoverflow.com") {
        $(document.body).find('.post-taglist .post-tag').each((idx, tagNode) => {
          postTags.push($(tagNode).text().toLowerCase());
        });
      }

      lassoSnapshot.htmls = lassoSnapshot.htmls.filter(html => html.indexOf('kap-clip') === -1 && html.indexOf('kap-button') === -1);

      ReactDOM.render(
        <InteractionBox 
          type={SNIPPET_TYPE.LASSO}
          url={window.location.href}
          htmls={lassoSnapshot.htmls}
          selectedText={lassoSnapshot.text}
          postTags={postTags}
          originalDimensions={lassoSnapshot.initialDimensions}
          clip={clipClicked}
        />, 
      interactionBoxAnchor);

      dragElement(document.getElementById("interaction-box"));

      if (!movingCaptureWindow) {
        styleSheet.removeRule(0);
      }
      movingCaptureWindow = false;
      selection.empty();
    }
  }, 10);
});


window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    document.dispatchEvent(customRemoveInteractionEvent);
  }
});


/* listen for screen 'capture' */
// adapted from BentoChrome
// var delta = 500;
// var lastKeypressTime = 0;
// window.addEventListener('keydown', (e) => {
//   if (e.key === "Escape") {
//     var thisKeypressTime = new Date();
//     if ( thisKeypressTime - lastKeypressTime <= delta )
//     {
//       takeSnapshot();
//       // optional - if we'd rather not detect a triple-press
//       // as a second double-press, reset the timestamp
//       thisKeypressTime = 0;
//     }
//     lastKeypressTime = thisKeypressTime;
//   }
// });





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
        <div class="kap-button-text-container">
          <span class="kap-button-text">
            <i class="fas fa-save"></i>
          </span>
        </div>
      </button>`
    );
  });

  $('.kap-clip-post-button').on('click', function (event) {
    let checkmark = $(this).parents('.post-layout').find('.kap-clip-post-checkmark');
    let buttonText = $(this).parents('.post-layout').find('.kap-button-text');
    if ($(checkmark).hasClass('kap-checkmark-spin')) {
      $(this).removeClass('active');
      $(checkmark).removeClass('kap-checkmark-spin');
      $(buttonText).removeClass('kap-button-text-disappear');
      // unsave the clip
      console.log('Discard this snippet');
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
        console.log('Save this snippet');
        let postTextNode = $(this).parents('.post-layout').find('.post-text')[0];
        let postTextSnippet = KAPCaptureHelper.createCodeSnippetsFromNode(postTextNode);
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
          htmls: postTextSnippet.htmls,
          postTags: postTags,
          originalDimensions: postTextSnippet.originalDimensions,
          texts: postTextSnippet.text,
          codeSnippetHTMLs: codeSnippets.map(snp => snp.htmls),
          codeSnippetTexts: codeSnippets.map(snp => snp.text) 
        }
        // chrome.runtime.sendMessage({
        //   msg: actionTypes.ADD_A_PIECE_TO_CURRENT_TASK,
        //   payload: {piece}
        // }, (databack) => {
        //   collectedPostKey = databack.key;
        // });
        collectedPostKey = FirebaseStore.addAPieceToCurrentTask(piece);
      }, 5);
    }
    $(this).blur();
  }); 

}