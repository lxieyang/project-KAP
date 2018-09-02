import React from 'react';

import classes from './Input.css';

const input = (props) => {
  let inputElement = null;
  const inputClasses = [classes.InputElement];

  switch (props.elementType) {
    case ('input'):
      inputElement = <input autoFocus={props.autoFocus} className={inputClasses.join(' ')} {...props.elementConfig} value={props.value} id={props.id}
      onChange={(event) => props.changed(event)}/>;
      break;
    case ('textarea'):
      inputElement = <textarea className={inputClasses.join(' ')} {...props.elementConfig} value={props.value} id={props.id}
      onChange={props.changed}/>;
      break;
    case ('select'):
      inputElement = (
        <select 
          value={props.value}
          className={inputClasses.join(' ')} 
          onChange={(event) => props.changed(event)}>
          {props.elementConfig.options.map(option => (
            <option 
              key={option.id}  
              value={option.id}>
              {option.displayName}
            </option>
          ))}
        </select>
      )
      break;
    default:
      inputElement = <input className={classes.InputElement} {...props.elementConfig} value={props.value} 
      onEnterKeyPressed={props.submitted}/>;
  }

  return (
    <div className={classes.Input}>
      {inputElement}
    </div>
  );
}

export default input;