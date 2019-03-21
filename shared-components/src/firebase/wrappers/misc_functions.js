import { db } from '../firestore_wrapper';

export const getExtensionInfo = () => {
  return db.collection('chrome_extension').doc('unakite');
};

export const updateExtensionVersionString = versionString => {
  return getExtensionInfo().set(
    {
      chromeWebStoreVersion: versionString
    },
    {
      merge: true
    }
  );
};
