const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

let db = admin.firestore();

exports.deleteTablePiecesAndComments = functions.firestore
  .document("workspaces/{workspaceId}")
  .onDelete(async (snap, context) => {
    if (snap.data().workspaceType === 1) {
      // WORKSPACE_TYPES.table === 1, TODO: change this later to be an actual import

      // upon table deletion, clean pieces and comments in subcollections
      try {
        let workspaceId = context.params.workspaceId;
        let querySnapshot = await snap.ref.collection("cells").get();
        querySnapshot.forEach(async snapshot => {
          snapshot.ref.delete();
          let commentsSnapshot = await snapshot.ref
            .collection("comments")
            .get();
          return commentsSnapshot.forEach(comment => {
            comment.ref.delete();
          });
        });
      } catch (e) {
        console.log(e);
      }
    }
  });

exports.cleanTableByRemovingTrashedPieces = functions.firestore
  .document("pieces/{pieceId}")
  .onWrite(async (change, context) => {
    let pieceId = context.params.pieceId;
    if (
      change.before.data().trashed !== true &&
      change.after.data().trashed === true
    ) {
      console.log(`should attempt to clean ${pieceId} if it's in the table`);
      let taskId = (await db
        .collection("pieces")
        .doc(pieceId)
        .get()).data().references.task;

      let tables = await db
        .collection("workspaces")
        .where("references.task", "==", taskId)
        .get();

      return tables.forEach(table => {
        table.ref
          .collection("cells")
          .get()
          .then(querySnapshot => {
            return querySnapshot.forEach(snapshot => {
              let pieces = snapshot.data().pieces;
              let shouldUpdate = false;
              for (let i = 0; i < pieces.length; i++) {
                if (pieces[i].pieceId === pieceId) {
                  shouldUpdate = true;
                  break;
                }
              }
              if (shouldUpdate) {
                pieces = pieces.filter(p => p.pieceId !== pieceId);
                snapshot.ref.set({ pieces }, { merge: true });
              }
            });
          })
          .catch(e => {
            console.log(e);
          });
      });
    }
  });

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
