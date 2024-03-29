import $ from 'jquery';
import * as FirestoreManager from '../firebase/firestore_wrapper';

let superUserIds = [
  'GyIbFsUnhGevd33nIp7M7wB5Z7l2',
  'zZU6Vsy4DEfCiMIiJufhjTntpK23'
];

let anonymizeKeywords = ['oberlin.edu'];

export const getAnonymizationInfo = () => {
  FirestoreManager.getAnonymizationInfo()
    .get()
    .then(snapshot => {
      let data = snapshot.data();
      superUserIds = data.superUserIds;
      anonymizeKeywords = data.anonymizeKeywords;
    });
};

const isProduction = process.env.NODE_ENV === 'production' ? true : false;

// https://stackoverflow.com/questions/6045477/extract-keyword-from-google-search-in-javascript?rq=1
export const getParameterByName = (name, url) => {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
    results = regex.exec(url);
  return results == null
    ? ''
    : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

export const getSearchTerm = url => {
  return getParameterByName('q', url);
};

export const getOrigin = () => {
  return window.location.origin;
};

export const openLinkInTextEditorExtension = (event, url) => {
  if (window.top !== window.self) {
    event.preventDefault();
    let msg = {
      secret: 'secret-transmission-from-iframe',
      type: 'CLICKED',
      payload: {
        url
      }
    };
    window.parent.postMessage(JSON.stringify(msg), '*');
  }
};

export const getFirstNWords = (n, str) => {
  if (str === null) return '';
  let split = str.split(/\s+/);
  return split.length <= n
    ? split.join(' ')
    : split.slice(0, n).join(' ') + ' ...';
};

export const getFirstName = fullname => {
  if (fullname !== null && fullname !== undefined) {
    return fullname.split(' ')[0];
  } else {
    return '';
  }
};

export const getHostnameWithoutWWW = hostname => {
  let target = 'www.';
  if (hostname !== null && hostname !== undefined) {
    let idxOfTarget = hostname.indexOf(target);
    if (idxOfTarget !== -1) {
      return hostname.substr(idxOfTarget + target.length);
    }
  }

  return hostname;
};

export const getFirstSentence = str => {
  // https://stackoverflow.com/questions/23200446/finding-the-first-sentence-with-jquery
  str = str.replace(/[.,\/#!$%\^&\*;:{}\[\]=\-_`~()]/g, '');
  let split = str.split(/[\n\r\!\,\.\?]/);
  let first = '';
  for (let sp of split) {
    if (sp.trim() !== '' && !$.isNumeric(sp.trim())) {
      first = sp.trim();
      break;
    }
  }
  return first;
};

export const capitalizeFirstLetter = string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const getCleanURLOfCurrentPage = () => {
  return `${window.location.protocol}//${window.location.host}${
    window.location.pathname
  }`;
};

export const copyToClipboard = str => {
  let el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

export const getTaskLink = taskId => {
  return (
    (isProduction
      ? `https://unakite-v2.firebaseapp.com/tasks/`
      : `http://localhost:3001/tasks/`) + `${taskId}`
  );
};

export const getAllTasksLink = () => {
  return isProduction
    ? `https://unakite-v2.firebaseapp.com/alltasks`
    : `http://localhost:3001/alltasks`;
};

export const shouldAnonymize = (creatorEmail, creatorId, currentUserId) => {
  // for Oberlin experiment
  let shouldAnonymize = false;
  if (superUserIds.indexOf(currentUserId) !== -1) {
    shouldAnonymize = false;
  } else if (
    creatorEmail !== undefined &&
    creatorEmail !== null &&
    currentUserId !== creatorId
  ) {
    for (let i = 0; i < anonymizeKeywords.length; i++) {
      if (creatorEmail.includes(anonymizeKeywords[i])) {
        shouldAnonymize = true;
        break;
      }
    }
  }

  // console.log(creatorEmail, creatorId, currentUserId, shouldAnonymize);

  return shouldAnonymize;
};

export const getDefaultUserAvatar = name => {
  return `https://ui-avatars.com/api/?name=${name}?bold=true`;
};

export const googleIcon =
  'data:image/png;base64,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';
