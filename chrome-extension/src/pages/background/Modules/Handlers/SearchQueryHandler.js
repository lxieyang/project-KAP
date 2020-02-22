import firebase from '../../../../../../shared-components/src/firebase/firebase';
import * as FirestoreManager from '../../../../../../shared-components/src/firebase/firestore_wrapper';

let searchQueriesInCurrentTask = [];
let currentSearchQueryId = null;

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    console.log('should get all search query in the task');
    let unsubCurrentSearchQueryId = null;
    let unsubSearchQueries = null;
    FirestoreManager.getCurrentUserCurrentTaskId().onSnapshot(snapshot => {
      const currentTaskId = snapshot.data().id;
      if (unsubCurrentSearchQueryId) {
        unsubCurrentSearchQueryId();
      }
      unsubCurrentSearchQueryId = FirestoreManager.getTaskCurrentSearchQueryId(
        currentTaskId
      ).onSnapshot(snapshot => {
        if (snapshot.exists) {
          currentSearchQueryId = snapshot.data().id;
          console.log('Current Search query id:', currentSearchQueryId);
        }
      });

      if (unsubSearchQueries) {
        unsubSearchQueries();
      }
      unsubSearchQueries = FirestoreManager.getAllSearchQueriesInTask(
        currentTaskId
      ).onSnapshot(querySnapshot => {
        let queries = [];
        querySnapshot.forEach(snapshot => {
          queries.push({ id: snapshot.id, ...snapshot.data() });
        });
        searchQueriesInCurrentTask = queries;
        console.log(searchQueriesInCurrentTask);
      });
    });
  }
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.msg === 'SEARCH_QUERY_DETECTED') {
    const { query } = request.payload;
    // add to query base
    const queryId = await FirestoreManager.createNewSearchQuery({ query });
    // console.log(queryId);
  }

  if (request.msg === 'SEARCH_RESULT_CLICKED') {
    // console.log(request.payload);
    // console.log(currentSearchQueryId);

    const { query, url, title } = request.payload;
    FirestoreManager.addPageToSearchQuery({ query, url, title });
  }
});
