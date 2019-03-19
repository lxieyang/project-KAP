/* global chrome */
import React from 'react';

import ThumbUp from '../../../../assets/images/thumb-up-100.png';
import ThumbDown from '../../../../assets/images/thumb-down-100.png';

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
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'auto',
        height: 'auto',
        borderRadius: '50%',
        display: 'inline'
      }}
    />
  );
};

export const thumbUpSrc =
  window.chrome !== undefined && chrome.extension !== undefined
    ? chrome.extension.getURL(ThumbUp)
    : ThumbUp;

export const thumbDownSrc =
  window.chrome !== undefined && chrome.extension !== undefined
    ? chrome.extension.getURL(ThumbDown)
    : ThumbDown;

export default thumbV1;
