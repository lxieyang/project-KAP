/* global chrome */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

let timeDisplayRoot = document.createElement('div');
timeDisplayRoot.style.position = 'fixed';
timeDisplayRoot.style.top = '0px';
timeDisplayRoot.style.right = '0px';
document.body.appendChild(timeDisplayRoot);

let originalDocumentTitle = document.title;

let isTracking = true;

let accumulatedTime = 0;
let lastTimestamp = new Date().getTime();

window.addEventListener('click', e => {
  e.stopPropagation();
  console.log('click');
});

window.addEventListener(
  'focus',
  event => {
    console.log('focus');
    console.log(accumulatedTime);
    lastTimestamp = new Date().getTime();
  },
  false
);

window.addEventListener(
  'blur',
  event => {
    console.log('blur');
    let now = new Date().getTime();
    let duration = now - lastTimestamp;
    accumulatedTime += duration;

    // document.title = `${accumulatedTime}ms | ` + originalDocumentTitle;

    // ReactDOM.unmountComponentAtNode(timeDisplayRoot);
    // ReactDOM.render(
    //   <TimeDisplay duration={accumulatedTime} />,
    //   timeDisplayRoot
    // );
  },
  false
);

// class TimeDisplay extends Component {
//   componentDidUpdate(prevProps) {
//     console.log('props');
//   }

//   render() {
//     return (
//       <div
//         style={{ backgroundColor: 'red', color: 'white', zIndex: 999999999999 }}
//       >
//         Duration: {this.props.duration}ms
//       </div>
//     );
//   }
// }
