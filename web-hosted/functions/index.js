const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();


exports.setUpdated = functions.database.ref('/users/{userId}/tasks')
  .onWrite((snapshot, context) => {
    console.log(snapshot.after.ref.parent);
    return snapshot.after.ref.parent.child('tasksUpdated').set(true);
  });


exports.getSearchableTaskInfo = functions.https.onRequest((req, res) => {
  const userId = req.query.userId;
  console.log(userId);
  return admin.database().ref('users').child(userId).child('tasks').once('value').then((snapshot) => {
    let tasks = [];
    snapshot.forEach((childSnapshot) => {
      let originalTask = childSnapshot.val();
      let transformedTask = {id: childSnapshot.key};
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
          content += originalTask.pieces[key]['texts'] + ' ';
          content += originalTask.pieces[key]['postTags'].join(' ') + ' ';
        }
      }
      
      transformedTask['content'] = content;
      tasks.push(transformedTask);
    });
    return res.json(tasks);
  }).catch((error) => {
    console.log(error);
    return res.send(error);
  });
});