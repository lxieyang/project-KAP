import React from 'react';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasSearch from '@fortawesome/fontawesome-free-solid/faSearch';
import fasArrowRight from '@fortawesome/fontawesome-free-solid/faArrowRight';
import fasTimes from '@fortawesome/fontawesome-free-solid/faTimes';
import Spinner from '../../UI/Spinner/Spinner';
import { GET_FAVICON_URL_PREFIX } from '../../../shared/constants';
import styles from './SearchBar.css';

const searchBar = (props) => {
  return (
    <div className={styles.searchBarContainer}>
      <div className={styles.SearchBar}>
        <input 
          type="text" 
          placeholder={props.searchFocused ? '' : props.placeholder} 
          value={props.searchString}
          name="search" 
          onBlur={(event) => props.searchBlurHandler(event)}
          onFocus={(event) => props.searchFocusHandler(event)}
          onInput={(event) => props.searchInputHandler(event)}
          />
        <div 
          className={[styles.SearchButton, props.searchString.trim() !== '' ? styles.SearchClearButton : null].join(' ')}
          onClick={(event) => props.clearSearchHandler(event)}>
          <FontAwesomeIcon
            icon={props.searchString.trim() !== '' ? fasTimes : fasSearch}
            className={styles.ConfigureIcon}
          />
        </div>
      </div>
      <div 
        className={[styles.SearchResultsContainer, 
          // props.searchResults.length === 0 || 
          props.searchString.trim() === '' 
          ? styles.Hide : null
        ].join(' ')}>
        <div 
          className={[styles.ResultHeader, 
            props.searchLoading || (!props.searchLoading && (
              props.isInAllTasksRoute
              ? props.searchResults.filter(entry => entry.type === 'task').length > 0
              : props.searchResults.filter(entry => entry.type === 'piece').length > 0
            )) ? null : styles.Hide,
            props.isInAllTasksRoute ? styles.TaskBadge : styles.PieceBadge
          ].join(' ')}>
          {
            props.isInAllTasksRoute
            ? <span>Tasks</span>
            : <span>Snippets</span>
          }
          {
            props.searchLoading ? <Spinner size='15px' /> : null
          }
        </div>
        <ul>
          {
            props.searchResults.filter(entry => entry.type === (props.isInAllTasksRoute ? 'task' : 'piece')).map((entry, idx) => {
              return (
                <li 
                  key={idx}
                  onClick={(event) => props.itemInSearchResultsClickedHandler(event, entry.id, props.isInAllTasksRoute)}>
                  <div className={styles.ResultEntryName}>
                    {
                      props.isInAllTasksRoute 
                      ? null
                      : <img
                        src={GET_FAVICON_URL_PREFIX + entry.url}
                        alt={entry.url}
                        className={styles.SiteIcon} />
                    }
                    <span>{entry.name}</span>
                  </div>
                </li>
              );
            })
          }
        </ul>
      </div>
    </div>
  ); 
}

export default searchBar;