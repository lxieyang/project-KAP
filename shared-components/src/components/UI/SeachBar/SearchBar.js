import React from 'react';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasSearch from '@fortawesome/fontawesome-free-solid/faSearch';
import fasArrowRight from '@fortawesome/fontawesome-free-solid/faArrowRight';
import fasTimes from '@fortawesome/fontawesome-free-solid/faTimes';
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
          // props.searchResults.length === 0 ? styles.Hide : null
        ].join(' ')}>
        <ul>
          {
            props.searchResults.map((entry, idx) => {
              return (
                <li 
                  key={idx}
                  onClick={(event) => props.taskItemInSearchResultsClickedHandler(event, entry)}>
                  {entry}
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