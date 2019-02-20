/* global chrome */
import React from 'react';

import ThumbUp from '../../../../assets/images/thumb-up-100.jpg';
import ThumbDown from '../../../../assets/images/thumb-down-100.jpg';

const thumbV1 = props => {
  const { type } = props;

  let srcUp = ThumbUp;
  let srcDown = ThumbDown;
  if (window.chrome !== undefined && chrome.extension !== undefined) {
    srcUp = chrome.extension.getURL(ThumbUp);
    srcDown = chrome.extension.getURL(ThumbDown);
  }
  return (
    <img
      src={type === 'up' ? srcUp : srcDown}
      alt="thumb"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        display: 'inline'
      }}
    />
  );
};

export default thumbV1;
