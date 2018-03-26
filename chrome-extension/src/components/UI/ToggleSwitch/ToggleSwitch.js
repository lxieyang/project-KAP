import React from 'react';

import Toggle from 'react-toggle';
import './ToggleSwitch.css';

// http://aaronshaf.github.io/react-toggle/
// https://stackoverflow.com/questions/39805537/how-to-apply-global-styles-with-css-modules-in-a-react-app

const toggleSwitch = (props) => {
  return (
    <Toggle
      icons={props.icons}
      defaultChecked={props.checked}
      onChange={props.statusChanged} />
  );
}

export default toggleSwitch;