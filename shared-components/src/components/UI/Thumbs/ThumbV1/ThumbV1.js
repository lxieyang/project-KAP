/* global chrome */
import React from 'react';
import styled from 'styled-components';

import ThumbUp from '../../../../assets/images/thumb-up-100.jpg';
import ThumbDown from '../../../../assets/images/thumb-down-100.jpg';

const Image = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: inline;
`;

const thumbV1 = props => {
  const { type } = props;

  let srcUp = ThumbUp;
  let srcDown = ThumbDown;
  if (window.chrome !== undefined && chrome.extension !== undefined) {
    srcUp = chrome.extension.getURL(ThumbUp);
    srcDown = chrome.extension.getURL(ThumbDown);
  }
  return <Image src={type === 'up' ? srcUp : srcDown} alt="thumb" />;
};

export default thumbV1;
