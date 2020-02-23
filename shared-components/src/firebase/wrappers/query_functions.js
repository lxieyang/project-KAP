import firebase from '../firebase';
import {
  db,
  DB_COLLECTIONS,
  getCurrentUserId,
  getTaskById,
  getCurrentUserCurrentTaskId
} from '../firestore_wrapper';

export const getAllSearchQueriesInTask = taskId => {
  return db
    .collection(DB_COLLECTIONS.SEARCH_QUERIES)
    .where('references.task', '==', taskId)
    .where('trashed', '==', false);
};

export const getAllTrashedSearchQueriesInTask = taskId => {
  return db
    .collection(DB_COLLECTIONS.SEARCH_QUERIES)
    .where('references.task', '==', taskId)
    .where('trashed', '==', true);
};

export const getSearchQueryById = queryId => {
  return db.collection(DB_COLLECTIONS.SEARCH_QUERIES).doc(queryId);
};

export const removeSearchQueryById = queryId => {
  return db
    .collection(DB_COLLECTIONS.SEARCH_QUERIES)
    .doc(queryId)
    .delete();
};

export const getTaskCurrentSearchQueryId = taskId => {
  return getTaskById(taskId)
    .collection('SearchManagement')
    .doc('currentSearchQuery');
};

export const updateTaskCurrentSearchQueryId = (taskId, queryId) => {
  if (queryId === null) {
    return getTaskCurrentSearchQueryId(taskId).delete();
  }
  return getTaskCurrentSearchQueryId(taskId).set(
    { id: queryId },
    { merge: true }
  );
};

export const createNewSearchQuery = async data => {
  let currentUserId = getCurrentUserId();
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;
  data.key = data.key || db.collection(DB_COLLECTIONS.SEARCH_QUERIES).doc().id;
  let ref = db.collection(DB_COLLECTIONS.SEARCH_QUERIES).doc(data.key);

  let existingQueries = [];
  const querySnapshot = await getAllSearchQueriesInTask(currentTaskId).get();
  if (!querySnapshot.empty) {
    existingQueries = querySnapshot.docs.map(doc => {
      return { id: doc.id, query: doc.data().query };
    });
  }

  for (let i = 0; i < existingQueries.length; i++) {
    const q = existingQueries[i];
    if (q.query === data.query) {
      console.log('Existing Query:', q.query);
      updateTaskCurrentSearchQueryId(currentTaskId, q.id);
      return q.id;
    }
  }

  // new query
  updateTaskCurrentSearchQueryId(currentTaskId, ref.id);

  let newQuery = {
    creator: currentUserId,
    trashed: false,
    creationDate: firebase.firestore.FieldValue.serverTimestamp(),
    updateDate: firebase.firestore.FieldValue.serverTimestamp(),
    query: data.query,
    references: {
      task: currentTaskId
    }
  };

  return ref.set(newQuery).then(() => {
    return ref.id;
  });
};

export const getSearchQueryVisitedPages = queryId => {
  return db
    .collection(DB_COLLECTIONS.WEBPAGES)
    .where('references.searchQuery', '==', queryId)
    .where('trashed', '==', false);
};

export const getSearchQueryTrashedVisitedPages = queryId => {
  return db
    .collection(DB_COLLECTIONS.WEBPAGES)
    .where('references.searchQuery', '==', queryId)
    .where('trashed', '==', true);
};

export const getVisitedPagesInTask = taskId => {
  return db
    .collection(DB_COLLECTIONS.WEBPAGES)
    .where('references.task', '==', taskId)
    .where('trashed', '==', false);
};

export const getSearchQueryVisitedPageById = pageId => {
  return db.collection(DB_COLLECTIONS.WEBPAGES).doc(pageId);
};

export const addPageToSearchQuery = async data => {
  const { query, url, title } = data;

  // determine query id
  const queryId = await createNewSearchQuery({ query });
  console.log(queryId);

  let currentUserId = getCurrentUserId();
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;
  data.key = data.key || db.collection(DB_COLLECTIONS.WEBPAGES).doc().id;
  let ref = db.collection(DB_COLLECTIONS.WEBPAGES).doc(data.key);

  let existingPages = [];
  const querySnapshot = await getSearchQueryVisitedPages(queryId).get();
  if (!querySnapshot.empty) {
    existingPages = querySnapshot.docs.map(doc => {
      return {
        id: doc.id,
        url: doc.data().url
      };
    });
  }

  for (let i = 0; i < existingPages.length; i++) {
    const p = existingPages[i];
    if (p.url === data.url) {
      console.log('Existing page:', p.url);
      return p.id;
    }
  }

  // new query

  let newPage = {
    creator: currentUserId,
    trashed: false,
    creationDate: firebase.firestore.FieldValue.serverTimestamp(),
    updateDate: firebase.firestore.FieldValue.serverTimestamp(),
    url: url,
    title: title,
    references: { searchQuery: queryId, task: currentTaskId }
  };

  return ref.set(newPage).then(() => {
    return ref.id;
  });
};
