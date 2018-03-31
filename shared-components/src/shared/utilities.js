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
  let split = str.split(/\s+/);
  return split.length < n ? split.join(' ') : split.slice(0, n).join(" ") + ' ...';
};


export const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};
