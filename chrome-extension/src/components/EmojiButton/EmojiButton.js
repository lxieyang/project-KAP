import React from 'react';

const emojiButton = (props) => (
  <span onClick={(event) => {props.emojiChanged(event)}}>
    <span role="img" aria-label="thumbsup">👍</span>
    <span role="img" aria-label="thumbsdown">👎</span>
  </span>
);

export default emojiButton;