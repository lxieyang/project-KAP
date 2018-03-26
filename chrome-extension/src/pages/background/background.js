/*global chrome*/
import '../../assets/images/icon-128.png';
import '../../assets/images/icon-34.png';
import * as actionTypes from '../../shared/actionTypes';
import { uniq, isEqual } from 'lodash';

import { 
  // database,
  sampleActionRef,
  sampleListRef,
  tasksRef,
  currentTaskIdRef,
  isDisabledRef
} from '../../firebase/index';
import * as FirebaseStore from '../../firebase/store';


/* initialize work status */
isDisabledRef.set(false);


/* some automatic bookkeeping */
tasksRef.on('child_added', (snapshot) => {
  currentTaskIdRef.set(snapshot.key);
});

tasksRef.on('child_removed', () => {
  tasksRef.once('value', (snapshot) => {
    snapshot.forEach((littleSnapshot) => {
      currentTaskIdRef.set(littleSnapshot.key);
    });
  });
});



/* local data */
let isDiabled = false;
let taskList = [

];

let currentTaskId = "";
let currentTaskName = "";
let currentTask = {};

let currentTaskOptions = [];

/* sync local data with firebase */
tasksRef.on('value', (snapshot) => {
  taskList = [];
  snapshot.forEach((childSnapshot) => {
    taskList.push({...childSnapshot.val(), id: childSnapshot.key});
  });
  // console.log(taskList);
});

currentTaskIdRef.on('value', (snapshot) => {
  currentTaskId = snapshot.val();
  tasksRef.child(currentTaskId).once('value', (snapshot) => {
    currentTask = snapshot.val();
    currentTaskName = snapshot.val().name;
  });
  tasksRef.child(currentTaskId + '/options').on('value', (snapshot) => {
    currentTaskOptions = [];
    snapshot.forEach((childSnapshot) => {
      currentTaskOptions.push({
        ...childSnapshot.val(),
        id: childSnapshot.key
      })
    });
  });
});

isDisabledRef.on('value', (snapshot) => {
  isDiabled  = snapshot.val();
});


// chrome messaging listeners
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log(request.msg);

    switch(request.msg) {
      case actionTypes.SAMPLE_ACTION:
        sampleActionRef.set({
          hasForce: true,
          time: (new Date()).getTime()
        });
        break;
      
      case actionTypes.SAMPLE_ADD_TO_LIST:
        let sampleListElementRef = sampleListRef.push();
        sampleListElementRef.set({
          name: 'How to store information in chrome extension?',
          time: (new Date()).getTime()
        });
        break;

      case actionTypes.SAMPLE_UPDATE_ELEMENT_IN_LIST:
        sampleListRef.child('-L7ebCE2ndgG8C6Jv-U_').update({
          name: 'what back-end framework to use?',
          time: (new Date()).getTime()
        });
        break;

      
      /* switch working status */
      case actionTypes.SWITCH_PLUGIN_WORKING_STATUS:
        switchWorkingStatus();
        break;
      
      /* Add a task */
      case actionTypes.ADD_TASK_FROM_SEARCH_TERM:
        addTaskFromSearchTerm(request.payload.searchTerm, sender.tab.id);
        break;

      /* Switch a task */
      case actionTypes.SWITCH_CURRENT_TASK:
        switchCurrentTask(request.payload.id);
        break;
      
      /* Delete a task */
      case actionTypes.DELETE_TASK_WITH_ID:
        deleteTaskWithId(request.payload.id);
        break;
      
      /* Stay in the same class or not */
      case actionTypes.SWITCH_STATUS_FOR_STAY_IN_THE_SAME_TASK:
        switchStatusForStayInTheSameTask(
          request.payload.shouldStayInTheSameTask,
          request.payload.lastTaskId,
          request.payload.thisSearchTerm,
          sender.tab.id
        );
        break;
      
      /* Star a task or not */
      case actionTypes.SWITCH_STAR_STATUS_OF_SELECTED_TASK:
        switchStarStatusOfSelectedTask(request.payload.id);
        break;
      
      /* Combine two tasks with id */
      case actionTypes.COMBINE_SOURCE_TASK_WITH_TARGET_TASK:
        combineTasks(
          request.payload.sourceId, 
          request.payload.targetId, 
          request.payload.newTaskName
        );
        break;

      /* add a page to count list */
      case actionTypes.ADD_A_PAGE_TO_COUNT_LIST:
        addAPageToCountList(
          request.payload.url, 
          request.payload.domainName, 
          request.payload.siteTitle
        );
        break;
      
      /* delete a page from count list */
      case actionTypes.DELETE_A_PAGE_FROM_COUNT_LIST:
        deleteAPageFromCountList(request.payload.id);
        break;
      

      /* ADD an option for current task */
      case actionTypes.ADD_AN_OPTION_TO_CURRENT_TASK:
        addAnOptionForCurrentTask(request.payload.optionName);
        break;
      
      /* Delete an option for current task */
      case actionTypes.DELETE_OPTION_WITH_ID:
        deleteOptionWithId(request.payload.id);
        break;
      
      /* Add a piece for current task */
      case actionTypes.ADD_A_PIECE_TO_CURRENT_TASK:
        let key = addAPieceToCurrentTask(request.payload.piece);
        sendResponse({key});
        break;
      
      /* Delete a piece for current task */
      case actionTypes.DELETE_A_PIECE_WITH_ID:
        deleteAPieceWithId(request.payload.id);
        break;

      /* Update a piece for current task */
      case actionTypes.UPDATE_A_PIECE_WITH_ID:
        updateAPieceWithId(request.payload.id, request.payload.piece);
        break;
      
      /* Create a piece group */
      case actionTypes.CREATE_A_PIECE_GROUP_WITH_TWO_PIECES:
        createAPieceGroup(request.payload.pieceGroup);
        break;
      
      /* change the name of a piece group */
      case actionTypes.CHANGE_NAME_OF_GROUP_WITH_ID:
        changeNameOfAPieceGroup(request.payload.groupId, request.payload.name);
        break;
      
      /* Add a piece to a piece group */
      case actionTypes.ADD_A_PIECE_TO_A_GROUP:
        addAPieceToGroup(request.payload.groupId, request.payload.pieceId);
        break;

      case actionTypes.UPDATE_A_PIECE_GROUP_ATTITUDE_OPTION_PAIRS_WITH_ID:
        updateAPieceGroupAttitudeOptionPairsWithId(
          request.payload.groupId,
          request.payload.attitudeOptionPairs
        );
        break;
      
      /* delete a piece group */
      case actionTypes.DELETE_A_PIECE_GROUP:
        deleteAPieceGroup(request.payload.groupId);
        break;

      /* requests from content scripts */
      case actionTypes.GET_CURRENT_TASK:
        sendResponse({
          ...FirebaseStore.currentTask,
          id: FirebaseStore.currentTaskId
        });
        break;
      
      default:
        console.log('DEFAULT: ' + request.msg);
        break;
    }
  }
);

const switchWorkingStatus = () => {
  isDisabledRef.once('value', (snapshot) => {
    if (snapshot.val() !== null) {
      isDisabledRef.set(!snapshot.val());
    }
  })
}

const addTaskFromSearchTerm = (searchTerm, tabId) => {
  console.log(actionTypes.ADD_TASK_FROM_SEARCH_TERM);
  // prevent refresh or back button
  if (taskList) {
    for (let task of taskList) {
      if (task.name === searchTerm) {
        console.log("same");
        // set current task
        switchCurrentTask(task.id);
        return;
      }
    }
  }

  let task = {
    id: (new Date()).getTime(),
    timestamp: (new Date()).getTime(),
    fromSearchTabId: tabId,
    name: searchTerm.toLowerCase(),
    isStarred: false,
    searchQueries: [searchTerm.toLowerCase()],
    options: [],
    currentOptionId: 'invalid',
    pieces: []
  }

  // push to firebase
  let newTaskRef = tasksRef.push();
  newTaskRef.set(task);
}

const switchCurrentTask = (id) => {
  currentTaskIdRef.set(id);
}

const deleteTaskWithId = (id) => {
  tasksRef.child(id).set(null);
}

const switchStatusForStayInTheSameTask = (shouldBeInTheSameTask, lastTaskId, thisSearchTerm, tabId) => {
  if (currentTaskId !== lastTaskId && shouldBeInTheSameTask) {
    // get the search query of the new task inserted
    tasksRef.child(lastTaskId).child('searchQueries').once('value', (snapshot) => {
      let sqs = snapshot.val().concat(currentTask.searchQueries);
      tasksRef.child(lastTaskId).child('searchQueries').set(sqs);
      // delete the current task
      deleteTaskWithId(currentTaskId);
      switchCurrentTask(lastTaskId);
    });
  } else {
    addTaskFromSearchTerm(thisSearchTerm, tabId);
    tasksRef.child(lastTaskId).child('searchQueries').once('value', (snapshot) => {
      let sqs = snapshot.val();
      sqs.splice(sqs.indexOf(thisSearchTerm), 1);
      tasksRef.child(lastTaskId).child('searchQueries').set(sqs);
    });
  }
}

const switchStarStatusOfSelectedTask = (id) => {
  tasksRef.child(id).child('isStarred').once('value', (snapshot) => {
    let prevValue = snapshot.val();
    tasksRef.child(id).child('isStarred').set(!prevValue);
  });
}

const combineTasks = (sourceTaskId, targetTaskId, newTaskName) => {
  console.log('SOURCE TASK: ' + sourceTaskId + ' | TARGET TASK: ' + targetTaskId);
  tasksRef.child(sourceTaskId).once('value', (databack) => {
    let sourceTask = databack.val();
    if (sourceTask.searchQueries === undefined) sourceTask.searchQueries = [];
    if (sourceTask.options === undefined) sourceTask.options = {};
    if (sourceTask.pieces === undefined) sourceTask.pieces = {};
    if (sourceTask.pageCountList === undefined) sourceTask.pageCountList = {};
    tasksRef.child(targetTaskId).once('value', (snapshot) => {
      let targetTask = snapshot.val();
      tasksRef.child(targetTaskId).child('id').set((new Date()).getTime());
      tasksRef.child(targetTaskId).child('timestamp').set((new Date()).getTime());
      // search queries (remove dups)
      let SQs = targetTask.searchQueries !== undefined ? targetTask.searchQueries : []
      tasksRef.child(targetTaskId).child('searchQueries').set(uniq(SQs.concat(sourceTask.searchQueries)));

      // options (did not remove dups)
      let options = targetTask.options !== undefined ? targetTask.options : {}
      tasksRef.child(targetTaskId).child('options').set(Object.assign(options, sourceTask.options));

      // pieces (did not remove dups)
      let pieces = targetTask.pieces !== undefined ? targetTask.pieces : {}
      tasksRef.child(targetTaskId).child('pieces').set(Object.assign(pieces, sourceTask.pieces));
      
      // page count list (remove dups)
      let pageCountList = targetTask.pageCountList !== undefined ? targetTask.pageCountList : {}
      for (let spKey in sourceTask.pageCountList) {
        let source = sourceTask.pageCountList[spKey];
        let shouldInsert = true;
        for (let tpKey in pageCountList) {
          let target = pageCountList[tpKey];
          if (isEqual(source, target)) {
            shouldInsert = false;
            break;
          }
        }
        if(shouldInsert) {
          pageCountList = Object.assign(pageCountList, {[spKey]: source});
        }
      }
      tasksRef.child(targetTaskId).child('pageCountList').set(pageCountList);
    });
    // delete the source task
    tasksRef.child(sourceTaskId).set(null);
  });
}

const addAPageToCountList = (url, domainName, siteTitle) => {
  // check dups
  tasksRef.child(currentTaskId).child('pageCountList').once('value', (snapshot) => {
    let dupKey = null;
    snapshot.forEach((childSnapshot) => {
      if (childSnapshot.val().url === url) {
        dupKey = childSnapshot.key;
      }
    });
    if (dupKey === null) {
      let newPageToCount = tasksRef.child(currentTaskId).child('pageCountList').push();
      newPageToCount.set({
        url: url,
        domainName: domainName,
        siteTitle: siteTitle,
        numPieces: 0,
        visitedCount: 1
      });
    } else {
      tasksRef.child(currentTaskId).child('pageCountList').child(dupKey).child('visitedCount').once('value', (databack) => {
        tasksRef.child(currentTaskId).child('pageCountList').child(dupKey).child('visitedCount').set(databack.val() + 1);
      });
    }
  });
}

const deleteAPageFromCountList = (id) => {
  tasksRef.child(currentTaskId).child('pageCountList').child(id).set(null);
}

const addAnOptionForCurrentTask = (optionName) => {
  // check duplicate
  if (currentTaskOptions) {
    for (let option of currentTaskOptions) {
      if (option.name === optionName) {
        console.log('same option');
        return;
      }
    }
  }

  let newOptionRef = tasksRef.child(currentTaskId + '/options').push();
  newOptionRef.set({
    name: optionName
  });
  tasksRef.child(currentTaskId + '/options').on('child_added', (snapshot) => {
    tasksRef.child(currentTaskId + '/currentOptionId').set(snapshot.key);
  });
}

const deleteOptionWithId = (id) => {
  tasksRef.child(currentTaskId).child('options').child(id).set(null);
  // also delete options in pieces.attitudeOptionPairs
  tasksRef.child(currentTaskId).child('pieces').once('value', (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      let pairs = childSnapshot.val().attitudeOptionPairs
      if (pairs !== undefined) {
        pairs = pairs.filter(p => p.optionId !== id);
        tasksRef.child(currentTaskId).child('pieces').child(childSnapshot.key).child('attitudeOptionPairs').set(pairs);
      }
    });
  });
}

const addAPieceToCurrentTask = (piece) => {
  let newPieceRef = tasksRef.child(currentTaskId + '/pieces').push();
  newPieceRef.set(piece);
  return newPieceRef.key;
}
const deleteAPieceWithId = (id) => {
  tasksRef.child(currentTaskId).child('pieces').child(id).set(null);
}

const updateAPieceWithId = (pieceId, piece) => {
  tasksRef.child(currentTaskId).child('pieces').child(pieceId).set(piece);
}

const createAPieceGroup = (pieceGroup) => {
  let newPieceGroupRef = tasksRef.child(currentTaskId).child('pieceGroups').push();
  newPieceGroupRef.set(pieceGroup);
}

const changeNameOfAPieceGroup = (groupId, name) => {
  tasksRef.child(currentTaskId).child('pieceGroups').child(groupId).child('name').set(name);
}

const addAPieceToGroup = (groupId, pieceId) => {
  let targetGroupRef = tasksRef.child(currentTaskId).child('pieceGroups').child(groupId);
  targetGroupRef.child('pieceIds').once('value', (snapshot) => {
    if (snapshot.val().indexOf(pieceId) === -1) {
      targetGroupRef.child('pieceIds').set(snapshot.val().concat([pieceId]));
    }
  });
}

const updateAPieceGroupAttitudeOptionPairsWithId = (groupId, attitudeOptionPairs) => {
  tasksRef.child(currentTaskId).child('pieceGroups').child(groupId).child('attitudeOptionPairs').set(attitudeOptionPairs);
}

const deleteAPieceGroup = (groupId) => {
  tasksRef.child(currentTaskId).child('pieceGroups').child(groupId).set(null);
}



/* create context menu items */
chrome.contextMenus.removeAll();
chrome.contextMenus.create({
  title: 'Add an option',
  onclick: (_, tab) => {
    console.log(tab);
    // send to content scripts
    chrome.tabs.sendMessage(tab.id, {
      msg: actionTypes.ADD_OPTION_CONTEXT_MENU_CLICKED
    }, () => {});
  }
});

chrome.contextMenus.create({
  title: 'Add "%s" as an Option',
  "contexts": ["selection"],
  onclick: (_, tab) => {
    console.log(tab);
    // send to content scripts
    chrome.tabs.sendMessage(tab.id, {
      msg: actionTypes.ADD_OPTION_CONTEXT_MENU_CLICKED
    }, () => {});
  }
});

// chrome.contextMenus.create({
//   title: 'Collect a snippet',
//   onclick: (_, tab) => {
//     console.log(tab);
//     // send to content scripts
//     chrome.tabs.sendMessage(tab.id, {
//       msg: actionTypes.ADD_PIECE_CONTEXT_MENU_CLICKED
//     }, () => {});
//   }
// });

chrome.contextMenus.create({
  title: 'Collect it as a Piece',
  "contexts": ["selection"],
  onclick: (_, tab) => {
    console.log(tab);
    // send to content scripts
    chrome.tabs.sendMessage(tab.id, {
      msg: actionTypes.ADD_PIECE_CONTEXT_MENU_CLICKED
    }, () => {});
  }
});








/* Piece (id)
  - attitudeOptionPairs
    - {optionId: '', attitude: true/false/null}
  - notes
  - type: 'SELECTION' | 'LASSO' | 'POST_SNAPSHOT'
  - texts: ''
  - codeSnippetHTMLs: ['', '', '']
  - codeSnippetTexts: ['', '', '']
  - postTages: ['', '', '']     ==> also add to Task
  - originalDimensions: {width: 222, height: 333}
  - htmls: ['', '', '']
  - url
  - timestamp

*/