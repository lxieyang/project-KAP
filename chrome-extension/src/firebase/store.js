import { uniq, isEqual } from 'lodash';
import { 
  // database,
  sampleActionRef,
  sampleListRef,
  tasksRef,
  currentTaskIdRef,
  isDisabledRef
} from './index';

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
export let isDiabled = false;
export let taskList = [

];

export let currentTaskId = "";
export let currentTaskName = "";
export let currentTask = {};

export let currentTaskOptions = [];

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


export const switchWorkingStatus = () => {
  isDisabledRef.once('value', (snapshot) => {
    if (snapshot.val() !== null) {
      isDisabledRef.set(!snapshot.val());
    }
  })
}

export const addTaskFromSearchTerm = (searchTerm, tabId) => {
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

export const switchCurrentTask = (id) => {
  currentTaskIdRef.set(id);
}

export const deleteTaskWithId = (id) => {
  tasksRef.child(id).set(null);
}

export const switchStatusForStayInTheSameTask = (shouldBeInTheSameTask, lastTaskId, thisSearchTerm, tabId) => {
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

export const switchStarStatusOfSelectedTask = (id) => {
  tasksRef.child(id).child('isStarred').once('value', (snapshot) => {
    let prevValue = snapshot.val();
    tasksRef.child(id).child('isStarred').set(!prevValue);
  });
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

export const addAPageToCountList = (url, domainName, siteTitle) => {
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

export const deleteAPageFromCountList = (id) => {
  tasksRef.child(currentTaskId).child('pageCountList').child(id).set(null);
}

export const addAnOptionForCurrentTask = (optionName) => {
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

export const deleteOptionWithId = (id) => {
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

export const addAPieceToCurrentTask = (piece) => {
  let newPieceRef = tasksRef.child(currentTaskId + '/pieces').push();
  newPieceRef.set(piece);
  return newPieceRef.key;
}

export const deleteAPieceWithId = (id) => {
  tasksRef.child(currentTaskId).child('pieces').child(id).set(null);
}

export const updateAPieceWithId = (pieceId, piece) => {
  tasksRef.child(currentTaskId).child('pieces').child(pieceId).set(piece);
}

export const createAPieceGroup = (pieceGroup) => {
  let newPieceGroupRef = tasksRef.child(currentTaskId).child('pieceGroups').push();
  newPieceGroupRef.set(pieceGroup);
}

export const changeNameOfAPieceGroup = (groupId, name) => {
  tasksRef.child(currentTaskId).child('pieceGroups').child(groupId).child('name').set(name);
}

export const addAPieceToGroup = (groupId, pieceId) => {
  let targetGroupRef = tasksRef.child(currentTaskId).child('pieceGroups').child(groupId);
  targetGroupRef.child('pieceIds').once('value', (snapshot) => {
    if (snapshot.val().indexOf(pieceId) === -1) {
      targetGroupRef.child('pieceIds').set(snapshot.val().concat([pieceId]));
    }
  });
}

export const updateAPieceGroupAttitudeOptionPairsWithId = (groupId, attitudeOptionPairs) => {
  tasksRef.child(currentTaskId).child('pieceGroups').child(groupId).child('attitudeOptionPairs').set(attitudeOptionPairs);
}

export const deleteAPieceGroup = (groupId) => {
  tasksRef.child(currentTaskId).child('pieceGroups').child(groupId).set(null);
}
