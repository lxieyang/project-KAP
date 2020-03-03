import firebase from '../firebase';
import {
  db,
  DB_COLLECTIONS,
  getCurrentUserId,
  getTaskById,
  getVisitedPagesInTask,
  getCurrentUserCurrentTaskId
} from '../firestore_wrapper';

export const getVisitedPageById = pageId => {
  return db.collection(DB_COLLECTIONS.WEBPAGES).doc(pageId);
};

export const getPageInTaskByUrl = (taskId, url) => {
  return getVisitedPagesInTask(taskId).where('url', '==', url);
};

export const updatePageTitleViaUrl = async (url, title) => {
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;

  const parentQuerySnapshot = await getPageInTaskByUrl(
    currentTaskId,
    url
  ).get();
  if (!parentQuerySnapshot.empty) {
    parentQuerySnapshot.docs[0].ref.update({
      title
    });
  }
};

export const updatePageFaviconUrlViaUrl = async (url, faviconUrl) => {
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;

  const parentQuerySnapshot = await getPageInTaskByUrl(
    currentTaskId,
    url
  ).get();
  if (!parentQuerySnapshot.empty) {
    parentQuerySnapshot.docs[0].ref.update({ faviconUrl });
  }
};

export const updatePageUpdateTimestampViaUrl = async url => {
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;

  const parentQuerySnapshot = await getPageInTaskByUrl(
    currentTaskId,
    url
  ).get();
  if (!parentQuerySnapshot.empty) {
    parentQuerySnapshot.docs[0].ref.update({
      updateDate: firebase.firestore.FieldValue.serverTimestamp(),
      leaveDate: null
    });
  }
};

export const updatePageLeaveTimestampViaUrl = async url => {
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;

  const parentQuerySnapshot = await getPageInTaskByUrl(
    currentTaskId,
    url
  ).get();
  if (!parentQuerySnapshot.empty) {
    parentQuerySnapshot.docs[0].ref.update({
      leaveDate: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
};

export const addPageToTask = async data => {
  const { url, title, parentUrl } = data;

  let currentUserId = getCurrentUserId();
  let currentTaskId = (await getCurrentUserCurrentTaskId().get()).data().id;
  data.key = data.key || db.collection(DB_COLLECTIONS.WEBPAGES).doc().id;
  let ref = db.collection(DB_COLLECTIONS.WEBPAGES).doc(data.key);

  let existingPages = [];
  const querySnapshot = await getVisitedPagesInTask(currentTaskId).get();
  if (!querySnapshot.empty) {
    existingPages = querySnapshot.docs.map(doc => {
      return { id: doc.id, url: doc.data().url };
    });
  }

  for (let i = 0; i < existingPages.length; i++) {
    const p = existingPages[i];
    if (p.url === data.url) {
      console.log('Existing page:', p.url);
      updatePageUpdateTimestampViaUrl(p.url);
      return p.id;
    }
  }

  // get parent
  let parent = false;
  if (parentUrl !== null) {
    let parentQuerySnapshot = await getPageInTaskByUrl(
      currentTaskId,
      parentUrl
    ).get();
    if (!parentQuerySnapshot.empty) {
      parent = parentQuerySnapshot.docs[0].id;
    }
  }

  let newPage = {
    creator: currentUserId,
    trashed: false,
    creationDate: firebase.firestore.FieldValue.serverTimestamp(),
    updateDate: firebase.firestore.FieldValue.serverTimestamp(),
    leaveDate: null,
    url: url,
    title: title,
    references: { searchQuery: false, parent: parent, task: currentTaskId }
  };

  return ref.set(newPage).then(() => {
    return ref.id;
  });
};
