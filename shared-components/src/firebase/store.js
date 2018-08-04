import { uniq, isEqual } from 'lodash';
import {
  database,
  tasksRef,
  currentTaskIdRef,
  lastTaskIdRef,
  editorIntegrationRef,
  userId,
  isDisabledRef,
  userPathInFirestore
} from './index';


/* local data */
export let isDisabled = false;
export let taskList = [];
export let currentTaskId = "";
export let currentTaskOptions = [];
export let currentTaskRequirements = [];

isDisabledRef.on('value', (snapshot) => {
  isDisabled  = snapshot.val();
});


/* USER SETTINGS */
export const updateUserProfile = (userId, userName, userProfilePhotoURL, userEmail) => {
  userPathInFirestore.set({
    userProfile: {
      userId, userName, userProfilePhotoURL, userEmail
    }
  }, {
    merge: true
  });
}

// SHOULD OVERRIDE NEW TAB
export const switchShouldOverrideNewtab = (shouldOverrideNewtab) => {
  userPathInFirestore.set({
    userSettings: {
      shouldOverrideNewtab
    }
  }, {
    merge: true
  })
  .then(() => {})
  .catch((error) => console.log(error));
}

// SHOULD DISPLAY ALL PAGES
export const switchShouldDisplayAllPages = (shouldDisplayAllPages) => {
  userPathInFirestore.set({
    userSettings: {
      shouldDisplayAllPages
    }
  }, {
    merge: true
  })
  .then(() => {})
  .catch((error) => console.log(error));
}




/** TASKS */
export const addTaskFromSearchTerm = async (searchTerm, tabId) => {
  // prevent refresh or back button
  let tasks = await tasksRef.once('value');
  taskList = [];
  tasks.forEach((childSnapshot) => {
    taskList.push({...childSnapshot.val(), id: childSnapshot.key});
  });
  /* create a new task */
  let newtask = {
    id: (new Date()).getTime(),
    timestamp: (new Date()).getTime(),
    name: searchTerm.toLowerCase(),
    isStarred: false,
    searchQueries: [searchTerm.toLowerCase()],
    options: [],
    currentOptionId: 'invalid',
    pieces: [],
    taskOngoing: true
  }
  // loop through current tasks to not create a duplicate task
  if (taskList) {
    for (let task of taskList) {
      // console.log(task.name.toLowerCase());
      if (task.name.toLowerCase() === searchTerm.toLowerCase()) {
        // console.log("same task found");
        // set current task to previous task with same search term
        if ((confirm('You have started a task with the same name before'
        + '\n' + 'To merge: select cancel'
        + '\n' + 'To create a new task: select OK '))) {
          // console.log("should start new task now");
        }
        else {
          switchCurrentTask(task.id);
          // console.log("should merge task now");
          return;
        }
      }
    }
  }



  // push to firebase
  let newTaskRef = tasksRef.push();
  newTaskRef.set(newtask);
  switchCurrentTask(newTaskRef.key);


}

export const switchCurrentTask = async (id) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  if (currentTaskId === id) {
    lastTaskIdRef.set(null);
  } else {
    lastTaskIdRef.set(currentTaskId);
  }
  currentTaskIdRef.set(id);
}

export const setCurrentTask = (id) => {
  currentTaskIdRef.set(id);
  lastTaskIdRef.set(null);
}

export const updateTaskName = async (id, taksName) => {
  tasksRef.child(id).child('name').set(taksName);
}

export const deleteTaskWithId = async (id) => {
  await tasksRef.child(id).set(null);
  let tasks = await tasksRef.orderByKey().limitToLast(1).once('value');
  tasks.forEach((snap) => {
    currentTaskIdRef.set(snap.key);
  });
}

export const switchStarStatusOfSelectedTask = async (id) => {
  let isStarred = (await tasksRef.child(id).child('isStarred').once('value')).val();
  tasksRef.child(id).child('isStarred').set(!isStarred);
}

export const combineTasks = (sourceTaskId, targetTaskId, newTaskName) => {
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
      // search queries (removed dups)
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

export const cloneATaskForCurrentUser = async (originalUserId, originalTaskId) => {
  database.ref('users').child(originalUserId).child('tasks').child(originalTaskId).once('value', (snap) => {
    let newTaskRef = tasksRef.push();
    newTaskRef.set(snap.val());
    switchCurrentTask(newTaskRef.key);
  });
}


/* CURRENT TASK STATUS */
export const switchTaskWorkingStatus = (taskId, shouldTaskBeOngoing, shouldUpdateLog) => {
  tasksRef.child(taskId).child('taskOngoing').set(shouldTaskBeOngoing).then(() => {}).catch((err) => {console.log(err)});
  if (shouldTaskBeOngoing === false) {
    tasksRef.child(taskId).child('completionTimestamp').set((new Date()).getTime());
  }
  if (shouldUpdateLog) {
    let newLogEntryRef = tasksRef.child(taskId).child('workingStatusChangeLog').push();
    newLogEntryRef.set({
      taskOngoing: shouldTaskBeOngoing,
      timestamp: (new Date()).getTime()
    });
  }
}



/* PAGE COUNT */
export const addAPageToCountList = async (url, domainName, siteTitle) => {
  // console.log(currentTaskIdRef);
  // check dups

  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let pageCountList = await tasksRef.child(currentTaskId).child('pageCountList').once('value');
  let dupKey = null;
  pageCountList.forEach((childSnapshot) => {
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
      visitedCount: 1,
      notes: ''
    });
  } else {
    let visitedCount = (await tasksRef.child(currentTaskId).child('pageCountList').child(dupKey).child('visitedCount').once('value')).val();
    tasksRef.child(currentTaskId).child('pageCountList').child(dupKey).child('visitedCount').set(visitedCount + 1);
  }
}

export const updatePageNotes = async (pageId, notes) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let pageRef = tasksRef.child(currentTaskId).child('pageCountList').child(pageId);
  pageRef.once('value', (snap) => {
    pageRef.set({
      ...snap.val(),
      notes: notes
    })
  });
}

export const deleteAPageFromCountList = async (id) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  tasksRef.child(currentTaskId).child('pageCountList').child(id).set(null);
}








/* OPTIONS */
export const addAnOptionForCurrentTask = async (optionName) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let options = await tasksRef.child(currentTaskId + '/options').once('value');
  currentTaskOptions = [];
  options.forEach((childSnapshot) => {
    currentTaskOptions.push({
      ...childSnapshot.val(),
      id: childSnapshot.key
    })
  });

  // check duplicate
  if (currentTaskOptions) {
    for (let option of currentTaskOptions) {
      if (option.name.toLowerCase() === optionName.toLowerCase()) {
        console.log('same option');
        alert('You have entered the same option before, the duplicate will be deleted')
        return;
      }
    }
  }

  if (optionName.trim() === '') {
    return;
  }

  let newOptionRef = tasksRef.child(currentTaskId + '/options').push();
  newOptionRef.set({
    name: optionName,
    order: currentTaskOptions.length,
    starred: false,
    hide: false,
    used: false,
    notes: []
  });
  tasksRef.child(currentTaskId + '/options').on('child_added', (snapshot) => {
    tasksRef.child(currentTaskId + '/currentOptionId').set(snapshot.key);
  });
}

export const switchShowOptionNotesStatus = async () => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let showOptionNotesref = tasksRef.child(currentTaskId).child('showOptionNotes');
  showOptionNotesref.once('value', snap => {
    if (snap.val() !== null) {
      showOptionNotesref.set(!snap.val());
    } else {
      showOptionNotesref.set(true);
    }
  });
}

export const updateOptionName = async (optionId, optionName) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let optionRef = tasksRef.child(currentTaskId + '/options').child(optionId);
  optionRef.once('value', (snap) => {
    optionRef.set({
      ...snap.val(),
      name: optionName
    })
  });
}

export const switchOptionNotesShowStatus = async (optionId) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let optionNotesShowStatusRef = tasksRef.child(currentTaskId + '/options').child(optionId).child('showNotes');
  optionNotesShowStatusRef.once('value', snap => {
    if (snap.val() === null) {
      optionNotesShowStatusRef.set(true);
    } else {
      optionNotesShowStatusRef.set(!snap.val());
    }
  });
}

export const addANoteToAnOption = async (optionId, note) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let optionNotesRef = tasksRef.child(currentTaskId + '/options').child(optionId).child('notes');
  optionNotesRef.once('value', (snap) => {
    if (snap.val() === null) {
      // no notes yet ==> add one to the list
      optionNotesRef.set([note]);
    } else {
      let notes = snap.val();
      notes.push(note);
      optionNotesRef.set(notes);
    }
  })
}

export const deleteANoteFromAnOption = async (optionId, note) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let optionNotesRef = tasksRef.child(currentTaskId + '/options').child(optionId).child('notes');
  optionNotesRef.once('value', (snap) => {
    if (snap.val() !== null) {
      let notes = snap.val();
      notes.splice(notes.indexOf(note), 1);
      optionNotesRef.set(notes);
    }
  });
}

export const useAnOption = async (optionId) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let optionRef = tasksRef.child(currentTaskId + '/options').child(optionId);
  optionRef.once('value', (snap) => {
    optionRef.set({
      ...snap.val(),
      used: true
    });
  });
}

export const unUseAnOption = async (optionId) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let optionRef = tasksRef.child(currentTaskId + '/options').child(optionId);
  optionRef.once('value', (snap) => {
    optionRef.set({
      ...snap.val(),
      used: false
    });
  });
}

export const switchStarStatusOfAnOptionWithId = async (id) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let op = await tasksRef.child(currentTaskId).child('options').child(id).once('value');
  tasksRef.child(currentTaskId).child('options').child(id).set({
    ...op.val(),
    starred: !op.val().starred
  });
}

export const switchHideStatusOfAnOptionWithId = async (id, hide, ordering) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  if (hide !== true) {
    let optionsRef = tasksRef.child(currentTaskId).child('options');
    let options = await optionsRef.once('value');
    options.forEach((snap) => {
      if (id === snap.key) {
        optionsRef.child(snap.key).set({
          ...snap.val(),
          order: ordering[snap.key],
          hide: true
        });
      } else {
        optionsRef.child(snap.key).set({
          ...snap.val(),
          order: ordering[snap.key]
        });
      }
    });
  } else {
    let op = await tasksRef.child(currentTaskId).child('options').child(id).once('value');
    tasksRef.child(currentTaskId).child('options').child(id).set({
      ...op.val(),
      hide: false
    });
  }
}

export const deleteOptionWithId = async (id) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  tasksRef.child(currentTaskId).child('options').child(id).set(null);
  // also delete options in pieces.attitudeList
  let pieces = await tasksRef.child(currentTaskId).child('pieces').once('value');
  pieces.forEach((snap) => {
    let attitudeList = snap.val().attitudeList;
    if (attitudeList !== undefined) {
      delete attitudeList[id];
    }
    tasksRef.child(currentTaskId).child('pieces').child(snap.key).child('attitudeList').set(attitudeList);
  });
}

export const updateOptionsOrdering = async (ordering) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let optionsRef = tasksRef.child(currentTaskId).child('options');
  let options = await optionsRef.once('value');
  options.forEach((snap) => {
    optionsRef.child(snap.key).set({
      ...snap.val(),
      order: ordering[snap.key]
    });
  });
}

/* REQUIREMENTS / CRITERIA */
export const addARequirementForCurrentTask = async (requirementName) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let requirements = await tasksRef.child(currentTaskId + '/requirements').once('value');
  currentTaskRequirements = [];
  requirements.forEach((childSnapshot) => {
    currentTaskRequirements.push({
      ...childSnapshot.val(),
      id: childSnapshot.key
    })
  });

  // check duplicate
  if (currentTaskRequirements) {
    for (let requirement of currentTaskRequirements) {
      if (requirement.name.toLowerCase() === requirementName.toLowerCase()) {
        console.log('same requirement');
        return;
      }
    }
  }

  if (requirementName.trim() === '') {
    return;
  }

  let newRequirementRef = tasksRef.child(currentTaskId + '/requirements').push();
  newRequirementRef.set({
    name: requirementName,
    order: currentTaskRequirements.length,
    starred: false,
    hide: false
  });
}

export const updateRequirementName = async (requirementId, requirementName) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let requirementRef = tasksRef.child(currentTaskId + '/requirements').child(requirementId);
  requirementRef.once('value', (snap) => {
    requirementRef.set({
      ...snap.val(),
      name: requirementName
    })
  });
}

export const switchStarStatusOfARequirementWithId = async (id) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let rq = await tasksRef.child(currentTaskId).child('requirements').child(id).once('value');
  tasksRef.child(currentTaskId).child('requirements').child(id).set({
    ...rq.val(),
    starred: !rq.val().starred
  });
}

export const switchHideStatusOfARequirementWithId = async (id, hide, ordering) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  if (hide !== true) {
    let requirementsRef = tasksRef.child(currentTaskId).child('requirements');
    let requirements = await requirementsRef.once('value');
    requirements.forEach((snap) => {
      if (id === snap.key) {
        requirementsRef.child(snap.key).set({
          ...snap.val(),
          order: ordering[snap.key],
          hide: true
        });
      } else {
        requirementsRef.child(snap.key).set({
          ...snap.val(),
          order: ordering[snap.key]
        });
      }
    });
  } else {
    let rq = await tasksRef.child(currentTaskId).child('requirements').child(id).once('value');
    tasksRef.child(currentTaskId).child('requirements').child(id).set({
      ...rq.val(),
      hide: false
    });
  }
}

export const deleteRequirementWithId = async (id) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  tasksRef.child(currentTaskId).child('requirements').child(id).set(null);
  // delete those in the attitude list
  let pieces = await tasksRef.child(currentTaskId).child('pieces').once('value');
  pieces.forEach((snap) => {
    let attitudeList = snap.val().attitudeList;
    if (attitudeList !== undefined) {
      for (let opKey in attitudeList) {
        let attitudeReruirementPairs = attitudeList[opKey];
        if (attitudeReruirementPairs !== undefined) {
          delete attitudeReruirementPairs[id];
        }
      }
    }
    tasksRef.child(currentTaskId).child('pieces').child(snap.key).child('attitudeList').set(attitudeList);
  });
}

export const updateRequirementOrdering = async (ordering) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let requirementRef = tasksRef.child(currentTaskId).child('requirements');
  let requirements = await requirementRef.once('value');
  requirements.forEach((snap) => {
    requirementRef.child(snap.key).set({
      ...snap.val(),
      order: ordering[snap.key]
    });
  });
}

/* PIECES aka Snippets */
export const addAPieceToCurrentTask = async (piece, alsoSetCopyData = false) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let newPieceRef = tasksRef.child(currentTaskId + '/pieces').push();
  newPieceRef.set(piece);
  if (alsoSetCopyData === true) {
    let payload = {
      title: piece.title,
      content: piece.content,
      originalCodeSnippet: null,
      notes: piece.notes,
      url: piece.url,
      existingOptions: [],
      existingRequirements: [],
      userId: userId,
      taskId: currentTaskId,
      pieceId: newPieceRef.key,
      timestamp: (new Date()).toString(),
      selected: piece.selected
    };
    setCopyData(payload);
  }
  return newPieceRef.key;
}

export const deleteAPieceWithId = async (id) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  tasksRef.child(currentTaskId).child('pieces').child(id).set(null);
}

export const updateAPieceWithId = async (pieceId, piece) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  tasksRef.child(currentTaskId).child('pieces').child(pieceId).set(piece);
}

export const createAPieceGroup = async (pieceGroup) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let newPieceGroupRef = tasksRef.child(currentTaskId).child('pieceGroups').push();
  newPieceGroupRef.set(pieceGroup);
}

export const changeNameOfAPieceGroup = async (groupId, name) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  tasksRef.child(currentTaskId).child('pieceGroups').child(groupId).child('name').set(name);
}






/* PIECE GROUPS */
export const addAPieceToGroup = async (groupId, pieceId) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let targetGroupRef = tasksRef.child(currentTaskId).child('pieceGroups').child(groupId);
  let pieceIds = (await targetGroupRef.child('pieceIds').once('value')).val();
  if (pieceIds.indexOf(pieceId) === -1) {
    targetGroupRef.child('pieceIds').set(pieceIds.concat([pieceId]));
  }
}

export const updateAPieceGroupAttitudeOptionPairsWithId = async (groupId, attitudeOptionPairs) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  tasksRef.child(currentTaskId).child('pieceGroups').child(groupId).child('attitudeOptionPairs').set(attitudeOptionPairs);
}

export const deleteAPieceGroup = async (groupId) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  tasksRef.child(currentTaskId).child('pieceGroups').child(groupId).set(null);
}




/* SEARCH QUERIES */
export const addASearchQueryToCurrentTask = async (searchQuery) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let SQs = (await tasksRef.child(currentTaskId).child('searchQueries').once('value')).val();
  SQs = SQs !== undefined ? SQs : [];
  SQs.push(searchQuery);
  tasksRef.child(currentTaskId).child('searchQueries').set(uniq(SQs.concat([searchQuery])));
}



/* COPY PASTE SUPPORT */
export const setCopyData = async (payload) => {
  editorIntegrationRef.child('copyPayload').set(payload);
}

export const setToOpenFile = async (codebaseId, filePath, lineNumber) => {
  editorIntegrationRef.child('toOpenFileAndLineNumber').set({
    codebaseId: codebaseId,
    filePath: filePath,
    lineNumber: lineNumber
  });
}
