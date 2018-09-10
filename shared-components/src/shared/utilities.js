import $ from 'jquery';
// https://stackoverflow.com/questions/6045477/extract-keyword-from-google-search-in-javascript?rq=1
export const getParameterByName = (name, url) => {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
      results = regex.exec(url);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
};


export const getSearchTerm = (url) => {
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
  return split.length <= n ? split.join(' ') : split.slice(0, n).join(" ") + ' ...';
};

export const getFirstName = (fullname) => {
  if (fullname !== null && fullname !== undefined) {
    return fullname.split(' ')[0];
  } else {
    return ''; 
  }
}

export const getFirstSentence = (str) => {
  // https://stackoverflow.com/questions/23200446/finding-the-first-sentence-with-jquery
  str = str.replace(/[.,\/#!$%\^&\*;:{}\[\]=\-_`~()]/g,"");
  let split = str.split(/[\n\r\!\,\.\?]/);
  let first = "";
  for (let sp of split) {
    if (sp.trim() !== '' && !$.isNumeric(sp.trim())) {
      first = sp.trim();
      break;
    }
  }
  return first;
}


export const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};
