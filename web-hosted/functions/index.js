const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();


exports.setUpdated = functions.database.ref('/users/{userId}/tasks')
  .onWrite((snapshot, context) => {
    console.log(snapshot.after.ref.parent);
    return snapshot.after.ref.parent.child('tasksUpdated').set(true);
  });


exports.getSearchableTaskInfo = functions.https.onRequest((req, res) => {
  res.set('Access-Control-Allow-Origin', "*");
  res.set('Access-Control-Allow-Methods', 'GET, POST');

  const userId = req.query.userId;
  console.log(userId);
  return admin.database().ref('users').child(userId).child('tasks').once('value').then((snapshot) => {
    let tasks = [];
    snapshot.forEach((childSnapshot) => {
      let originalTask = childSnapshot.val();
      let transformedTask = {
        id: childSnapshot.key,
        name: originalTask.name,
        type: 'task'
      };
      let content = originalTask.name + ' ';
      // transform options
      if (originalTask.option !== null) {
        for (key in originalTask.options) {
          content += originalTask.options[key]['name'] + ' ';
        }
      }

      // transform requirements
      if (originalTask.requirements !== null) {
        for (key in originalTask.requirements) {
          content += originalTask.requirements[key]['name'] + ' ';
        }
      }

      // transform pieces
      if (originalTask.pieces !== null) {
        for (key in originalTask.pieces) {
          content += originalTask.pieces[key]['title'] + ' ';
          content += originalTask.pieces[key]['texts'].replace(/\s/g, ' ').replace(/(['"])/g, ' ') + ' ';
        }
      }
      
      transformedTask['content'] = content.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').replace(/\s{2,}/g, ' ');
      tasks.push(transformedTask);
    });
    return res.json(tasks);
  }).catch((error) => {
    console.log(error);
    return res.send(error);
  });
});


exports.getSearchablePiecesInThisTaskInfo = functions.https.onRequest((req, res) => {
  res.set('Access-Control-Allow-Origin', "*");
  res.set('Access-Control-Allow-Methods', 'GET, POST');

  const userId = req.query.userId;
  const taskId = req.query.taskId;
  console.log(`USER ID: ${userId} | TASK ID: ${taskId}`);
  return admin.database().ref('users').child(userId).child("tasks").child(taskId).once('value').then((snapshot) => {
    let transformedPieces = [];
    let originalTask = snapshot.val();
    let originalTaskId = taskId;
    let originalTaskOptions = originalTask['options'];
    let originalTaskRequirements = originalTask['requirements'];
    // transform pieces
    if (originalTask.pieces !== null) {
      for (key in originalTask.pieces) {
        let piece = originalTask.pieces[key];
        let transformedPiece = {
          id: key,
          name: piece['title'],
          type: 'piece',
          url: piece['url'],
          taskId: originalTaskId,
          taskName: originalTask.name
        };

        let content = 
          piece['title'] + ' ' 
          + piece['texts'].replace(/\s/g, ' ').replace(/(['"])/g, ' ') 
          + ' ';

        // process attitude list
        if (piece.attitudeList !== null) {
          for (opKey in piece.attitudeList) {
            content += originalTaskOptions[opKey]['name'] + ' ';
            for (rqKey in piece.attitudeList[opKey]) {
              content += originalTaskRequirements[rqKey]['name'] + ' ';
            }
          }
        }

        transformedPiece['content'] = content.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').replace(/\s{2,}/g, ' ');
        transformedPieces.push(transformedPiece);
      }
    }

    return res.json(transformedPieces);
  }).catch((error) => {
    console.log(error);
    res.send(error);
  });

});


exports.getSearchablePiecesInfo = functions.https.onRequest((req, res) => {
  res.set('Access-Control-Allow-Origin', "*");
  res.set('Access-Control-Allow-Methods', 'GET, POST');

  const userId = req.query.userId;
  console.log(userId);
  return admin.database().ref('users').child(userId).child('tasks').once('value').then((snapshot) => {
    let transformedPieces = [];
    snapshot.forEach((childSnapshot) => {
      // extract pieces from tasks
      let originalTask = childSnapshot.val();
      let originalTaskId = childSnapshot.key;
      let originalTaskOptions = originalTask['options'];
      let originalTaskRequirements = originalTask['requirements'];
      // transform pieces
      if (originalTask.pieces !== null) {
        for (key in originalTask.pieces) {
          let piece = originalTask.pieces[key];
          let transformedPiece = {
            id: key,
            name: piece['title'],
            type: 'piece',
            url: piece['url'],
            taskId: originalTaskId,
            taskName: originalTask.name
          };

          let content = 
            piece['title'] + ' ' 
            + piece['texts'].replace(/\s/g, ' ').replace(/(['"])/g, ' ') 
            + ' ';

          // process attitude list
          if (piece.attitudeList !== null) {
            for (opKey in piece.attitudeList) {
              content += originalTaskOptions[opKey]['name'] + ' ';
              for (rqKey in piece.attitudeList[opKey]) {
                content += originalTaskRequirements[rqKey]['name'] + ' ';
              }
            }
          }

          transformedPiece['content'] = content.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').replace(/\s{2,}/g, ' ');
          transformedPieces.push(transformedPiece);
        }
      }
    });
    return res.json(transformedPieces);
  }).catch((error) => {
    console.log(error);
    return res.send(error);
  });
});