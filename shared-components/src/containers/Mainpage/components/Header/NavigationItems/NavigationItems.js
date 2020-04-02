import React from 'react';

import Spinner from '../../../../../components/UI/Spinner/Spinner';
import { NavLink } from 'react-router-dom';
import * as appRoutes from '../../../../../shared/routes';
import * as FirestoreManager from '../../../../../firebase/firestore_wrapper';
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
      {!props.authenticated && (
        <div style={{ fontSize: '1.1rem', marginRight: 8, fontWeight: 500 }}>
          Reviewing:{' '}
        </div>
      )}
      <NavLink
        to={`/tasks/${props.currentTaskId}`}
        exact
        activeClassName={styles.active}
        onClick={e => {
          if (props.pathname.includes(`/tasks/${props.currentTaskId}`)) {
            let taskName = window.prompt(
              'Editing task name:',
              props.currentTask
            );
            if (
              taskName !== null &&
              taskName !== undefined &&
              taskName !== '' &&
              taskName !== props.currentTask
            ) {
              FirestoreManager.updateTaskName(props.currentTaskId, taskName);
            }
          }
        }}
      >
        <div className={styles.TaskName}>
          {!props.tasksLoading ? props.currentTask : <Spinner size="20px" />}
        </div>
      </NavLink>
    </li>
    {props.authenticated && (
      <li
        className={[styles.NavigationItem, styles.ActiveNavigationItem].join(
          ' '
        )}
      >
        <NavLink to={appRoutes.ALL_TASKS} exact activeClassName={styles.active}>
          <div className={styles.Label}>My Tasks</div>
        </NavLink>
      </li>
    )}
  </ul>
);

export default navigationItems;
