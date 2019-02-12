import React from 'react';

import Spinner from '../../../../../components/UI/Spinner/Spinner';
import { NavLink } from 'react-router-dom';
import * as appRoutes from '../../../../../shared/routes';
import styles from './NavigationItems.css';

const navigationItems = props => (
  <ul className={styles.NavigationItems}>
    <li
      className={[
        styles.NavigationItem,
        props.thereIsTask
          ? styles.ActiveNavigationItem
          : styles.InactiveNavigationItem
      ].join(' ')}
    >
      <NavLink
        to={`/tasks/${props.currentTaskId}`}
        exact
        activeClassName={styles.active}
      >
        <div className={styles.TaskName}>
          {!props.tasksLoading ? props.currentTask : <Spinner size="20px" />}
        </div>
      </NavLink>
    </li>

    <li
      className={[styles.NavigationItem, styles.ActiveNavigationItem].join(' ')}
    >
      <NavLink to={appRoutes.ALL_TASKS} exact activeClassName={styles.active}>
        <div className={styles.Label}>My Tasks</div>
      </NavLink>
    </li>
  </ul>
);

export default navigationItems;
