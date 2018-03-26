import React from 'react';

import Spinner from '../../../../../components/UI/Spinner/Spinner';
import { NavLink } from 'react-router-dom';
import * as appRoutes from '../../../../../shared/routes';
import styles from './NavigationItems.css';

const navigationItems = (props) => (
  <ul className={styles.NavigationItems}>
    <li className={styles.NavigationItem}>
      <NavLink 
        to={appRoutes.CURRENT_TASK}
        exact
        activeClassName={styles.active}>
        <div className={styles.Label}>Current Task: </div>
        <div className={styles.TaskName}>
          {
            props.currentTask
            ? props.currentTask
            : <Spinner size="20px" />
          }
        </div>
      </NavLink>
    </li>

    <li className={styles.NavigationItem}>
      <NavLink 
        to={appRoutes.ALL_TASKS}
        exact
        activeClassName={styles.active}>
        <div className={styles.Label}>All Tasks</div>
      </NavLink>
    </li>
  </ul>
  
);

export default navigationItems;