import { uniq, isEqual } from 'lodash';
import { 
  // database,
  tasksRef,
  currentTaskIdRef,
  isDisabledRef
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





/* WORKING STATUS */
export const switchWorkingStatus = () => {
  isDisabledRef.once('value', (snapshot) => {
    if (snapshot.val() !== null) {
      isDisabledRef.set(!snapshot.val());
    }
  })
}






/** TASKS */
export const addTaskFromSearchTerm = async (searchTerm, tabId) => {
  // prevent refresh or back button
  let tasks = await tasksRef.once('value');
  taskList = [];
  tasks.forEach((childSnapshot) => {
    taskList.push({...childSnapshot.val(), id: childSnapshot.key});
  });
  if (taskList) {
    for (let task of taskList) {
      if (task.name.toLowerCase() === searchTerm.toLowerCase()) {
        console.log("same");
        // set current task
        switchCurrentTask(task.id);
        return;
      }
    }
  }

  /* create a new task */
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
  switchCurrentTask(newTaskRef.key);
}

export const switchCurrentTask = (id) => {
  currentTaskIdRef.set(id);
}

export const deleteTaskWithId = async (id) => {
  await tasksRef.child(id).set(null);
  let tasks = await tasksRef.once('value');
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
      visitedCount: 1
    });
  } else {
    let visitedCount = (await tasksRef.child(currentTaskId).child('pageCountList').child(dupKey).child('visitedCount').once('value')).val();
    tasksRef.child(currentTaskId).child('pageCountList').child(dupKey).child('visitedCount').set(visitedCount + 1);
  }
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

export const deleteOptionWithId = async (id) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  tasksRef.child(currentTaskId).child('options').child(id).set(null);
  // also delete options in pieces.attitudeOptionPairs
  let pieces = await tasksRef.child(currentTaskId).child('pieces').once('value');
  pieces.forEach((childSnapshot) => {
    let pairs = childSnapshot.val().attitudeOptionPairs
    if (pairs !== undefined) {
      pairs = pairs.filter(p => p.optionId !== id);
      tasksRef.child(currentTaskId).child('pieces').child(childSnapshot.key).child('attitudeOptionPairs').set(pairs);
    }
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

  let newRequirementRef = tasksRef.child(currentTaskId + '/requirements').push();
  newRequirementRef.set({
    name: requirementName
  });
}

export const deleteRequirementWithId = async (id) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  tasksRef.child(currentTaskId).child('requirements').child(id).set(null);
}






/* PIECES */
export const addAPieceToCurrentTask = async (piece) => {
  currentTaskId = (await currentTaskIdRef.once('value')).val();
  let newPieceRef = tasksRef.child(currentTaskId + '/pieces').push();
  newPieceRef.set(piece);
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
