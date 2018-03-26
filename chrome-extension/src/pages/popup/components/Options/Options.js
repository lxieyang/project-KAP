import React from 'react';

import FontAwesome from 'react-fontawesome';
import Input from '../../../../components/UI/Input/Input';
import styles from './Options.css';

const inputConfig = {
  placeholder: 'Add an option'
}

const options = (props) => {
  const { options, activeId } = props;
  return (
    <div style={{display: 'flex'}}>
      <div className={styles.Options}>
        <div className={styles.Label}>
          Options:
        </div>
        <div className={styles.OptionList}>
          <ul>
            {options.map((op, idx) => (
              <li key={op.id}>
                <span className={styles.Option}>{op.name}</span>
                {activeId === op.id 
                ? <span className={styles.ActiveBadge}>active</span>
                : null}
                <span  
                  onClick={(event) => props.deleteOptionWithId(op.id)}>
                  <FontAwesome 
                    name={'trash'} 
                    className={styles.TrashIcon}/>
                </span>
              </li>
            ))}
            <Input 
              elementType={'input'} 
              elementConfig={inputConfig}
              submitted={props.addOption}
              value={props.newOptionValue}
              changed={props.changed} />
          </ul>
        </div>
      </div>
    </div>
  );
}

export default options;