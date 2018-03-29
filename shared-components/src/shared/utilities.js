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
}

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
}


export const getFirstNWords = (n, str) => {
  let split = str.split(/\s+/);
  return split.length < n ? split.join(' ') : split.slice(0, n).join(" ") + ' ...';
}

export const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}


// Make the DIV element draggagle:
// https://www.w3schools.com/howto/howto_js_draggable.asp
export const dragElement = (elmnt) => {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "-header")) {
    /* if present, the header is where you move the DIV from:*/
    document.getElementById(elmnt.id + "-header").onmousedown = dragMouseDown;
  } 
  // else {
  //   /* otherwise, move the DIV from anywhere inside the DIV:*/
  //   elmnt.onmousedown = dragMouseDown;
  // }

  function dragMouseDown(e) {
    e = e || window.event;
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}