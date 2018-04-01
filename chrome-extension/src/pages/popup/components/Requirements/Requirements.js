import React from 'react';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import fasTrash from '@fortawesome/fontawesome-free-solid/faTrash';
import Input from '../../../../../../shared-components/src/components/UI/Input/Input';
import styles from './Requirements.css';
import { sortBy } from 'lodash';
const inputConfig = {
  placeholder: 'Add a requirement'
}

const requirements = (props) => {
  const { requirements } = props;
  let rqList = sortBy(requirements, ['order']);

  return (
    <div style={{display: 'flex'}}>
      <div className={styles.Requirements}>
        <div className={styles.Label}>
          <FontAwesomeIcon icon={fasFlagCheckered} /> &nbsp;
          Requirements:
        </div>
        <div className={styles.RequirementList}>
          <ul>
            {rqList.map((rq, idx) => (
              <li key={rq.id}>
                <span className={styles.Requirement}>{rq.name}</span>
                <span  
                  onClick={(event) => props.deleteRequirementWithId(rq.id)}>
                  <FontAwesomeIcon 
                    icon={fasTrash}
                    className={styles.TrashIcon}/>
                </span>
              </li>
            ))}
            <Input 
              elementType={'input'} 
              elementConfig={inputConfig}
              submitted={props.addRequirement}
              value={props.newRequirementValue}
              changed={props.changed} />
          </ul>
        </div>
      </div>
    </div>
  );
}

export default requirements;