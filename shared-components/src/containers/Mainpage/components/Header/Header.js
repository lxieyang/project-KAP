/* global chrome */
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import qs from 'query-string';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasCog from '@fortawesome/fontawesome-free-solid/faCog';
import fasExternalLinkSquareAlt from '@fortawesome/fontawesome-free-solid/faExternalLinkSquareAlt';
import fasSignOutAlt from '@fortawesome/fontawesome-free-solid/faSignOutAlt';
import Aux from '../../../../hoc/Aux/Aux';
import NavigationItems from './NavigationItems/NavigationItems';
import Logo from '../../../../components/UI/Logo/Logo';
import AppHeader from '../../../../components/UI/AppHeader/AppHeader';
import SearchBar from '../../../../components/UI/SeachBar/SearchBar';
import styles from './Header.css';
import ProfileImg from '../../../../assets/images/profile-img.png';
import { APP_NAME_LONG, APP_NAME_SHORT } from '../../../../shared/constants';
import Popover from 'react-tiny-popover';
import { NavLink } from 'react-router-dom';
import * as appRoutes from '../../../../shared/routes';
import axios from 'axios';
import { database } from '../../../../firebase/index';
import Fuse from 'fuse.js';
import * as FirebaseStore from '../../../../firebase/store';

class Header extends Component {
  state = {
    userId: this.props.userId,
    currentTaskId: this.props.currentTaskId,
    popoverOpen: false,
    searchFocused: false,
    searchString: '',
    searchResults: [],
    searchLoading: false,
    tasksUpdated: true,
    searchContentForTasks: null,
    searchContentForPiecesInCurrentTask: null
  }

  componentDidMount() {
    this.unlisten = this.props.history.listen((location, action) => {
      this.setState({
        searchString: '',
        searchResults: []
      });
    });

    database.ref(`/users/${this.props.userId}/tasksUpdated`).on('value', (snapshot) => {
      this.setState({tasksUpdated: snapshot.val()});
    });

  }

  componentWillUnmount() {
    this.unlisten();
  }

  static getDerivedStateFromProps (nextProps, prevState) {
    if (nextProps.currentTaskId !== prevState.currentTaskId) {
      return {
        currentTaskId: nextProps.currentTaskId,
        searchContentForPiecesInCurrentTask: null
      }
    }

    return {
      currentTaskId: nextProps.currentTaskId
    };

  }

  handleClick(e) {
    this.setState({popoverOpen: !this.state.popoverOpen});
  }

  handleClose(e) {
    this.setState({popoverOpen: false});
  }

  inputChangedHandler = (event) => {
    this.setState({userId: event.target.value});
  }

  searchBlurHandler = (event) => {
    this.setState({
      searchFocused: false
    });
  }

  searchFocusHandler = (event) => {
    this.setState({searchFocused: true});

    if (this.props.location.pathname === appRoutes.ALL_TASKS) {
      if (this.state.tasksUpdated === true || this.state.searchContentForTasks === null) {
        this.setState({searchLoading: true});
        database.ref(`/users/${this.props.userId}/tasksUpdated`).set(false).then(() => {
          axios.get('https://us-central1-kap-project-nsh-2504.cloudfunctions.net/getSearchableTaskInfo', {
            params: {
              userId: this.props.userId
            }
          }).then((response) => {
            this.setState({
              searchContentForTasks: response.data,
              searchLoading: false
            });
          }).catch((error) => {
            console.log(error);
            this.setState({
              searchLoading: false
            });
          });
        });
      }
    } else if (this.props.location.pathname === appRoutes.CURRENT_TASK) {
      if (this.state.tasksUpdated === true || this.state.searchContentForTasks === null) {
        this.setState({searchLoading: true});
        database.ref(`/users/${this.props.userId}/tasksUpdated`).set(false).then(() => {
          axios.get('https://us-central1-kap-project-nsh-2504.cloudfunctions.net/getSearchablePiecesInThisTaskInfo', {
            params: {
              userId: this.props.userId,
              taskId: this.props.currentTaskId
            }
          }).then((response) => {
            this.setState({
              searchContentForPiecesInCurrentTask: response.data,
              searchLoading: false
            });
          }).catch((error) => {
            console.log(error);
            this.setState({
              searchLoading: false
            });
          });
        });
      }
    }
  }

  searchInputHandler = (event) => {
    const doSearchWith = (source) => {
      var options = {
        keys: ['content'],
        // id: 'id'
      };

      let fuse = new Fuse(source, options);
      let results = fuse.search(this.state.searchString.trim());
      this.setState({searchResults: results});
    };

    this.setState({searchString: event.target.value});
    // console.log(this.state.searchString);
    if (this.props.location.pathname === appRoutes.ALL_TASKS) {
      if (this.state.searchContentForTasks !== null && this.state.searchLoading === false) {
        // do the search using library: Fuse.js
        doSearchWith(this.state.searchContentForTasks);
      } else {
        // loop around till searchLoading is false
        let clear = setInterval(() => {
          // console.log('checking is loading complete');
          if (this.state.searchLoading === false) {
            // console.log('loading complete!');
            clearInterval(clear);
            if (this.state.searchContentForTasks !== null) {
              doSearchWith(this.state.searchContentForTasks);
            }
          }
        }, 100);
      }
    } else if (this.props.location.pathname === appRoutes.CURRENT_TASK) {
      if (this.state.searchContentForPiecesInCurrentTask !== null && this.state.searchLoading === false) {
        // do the search using library: Fuse.js
        doSearchWith(this.state.searchContentForPiecesInCurrentTask);
      } else {
        // loop around till searchLoading is false
        let clear = setInterval(() => {
          // console.log('checking is loading complete');
          if (this.state.searchLoading === false) {
            // console.log('loading complete!');
            clearInterval(clear);
            if (this.state.searchContentForPiecesInCurrentTask !== null) {
              doSearchWith(this.state.searchContentForPiecesInCurrentTask);
            }
          }
        }, 100);
      }
    }
  }

  clearSearchHandler = (event) => {
    this.setState({searchString: ''});
  }

  itemInSearchResultsClickedHandler = (event, id, isTask) => {
    if (isTask) {
      FirebaseStore.switchCurrentTask(id);
      // re-routing
      this.props.history.push(appRoutes.CURRENT_TASK);
    } else {
      // pull up piece with pieceId = id
      const query = {
        ...qs.parse(this.props.location.search),
        pieceId: id
      };
      this.props.history.push({
        search: qs.stringify(query)
      });
    }
    
  }

  openSettingsPageClickedHandler = () => {
    console.log('open settings tab');
    chrome.runtime.sendMessage({
      msg: 'OPEN_SETTINGS_PAGE'
    });
  }

  render () {
    const { userName, userProfilePhotoURL, authenticated, location } = this.props;

    if (!authenticated) {
      return (
        <Aux>
          <header className={styles.Header}>
            <div style={{width: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'center'}}>
              <AppHeader logoSize='38px' hover={false} shouldDisplayHeaderButtons={false}/>
            </div>
          </header>
        </Aux>
      )
    }

    let searchBarPlaceHolder = '';

    if (location.pathname === appRoutes.ALL_TASKS) {
      searchBarPlaceHolder = 'Search tasks...';
    } else if (location.pathname === appRoutes.CURRENT_TASK) {
      searchBarPlaceHolder = 'Search within this task...';
    }

    return (
      <Aux>
        <header className={styles.Header}>
          <div>
            <div 
              className={styles.LogoBox}>
              <Logo 
                hover={true} size='38px'/>
            </div>
          </div>
          
          
          <nav>
            <NavigationItems 
              thereIsTask={this.props.thereIsTask}
              tasksLoading={this.props.tasksLoading}
              currentTask={this.props.taskName}/>
          </nav>
  
  
          <div className={styles.ToTheRight}>
            <div className={styles.SearchBox}>
              <SearchBar
                isInAllTasksRoute={this.props.location.pathname === appRoutes.ALL_TASKS}
                searchFocused={this.state.searchFocused}
                searchString={this.state.searchString}
                searchLoading={this.state.searchLoading}
                searchResults={this.state.searchString.trim() !== '' ? this.state.searchResults : []}
                placeholder={searchBarPlaceHolder}
                searchBlurHandler={this.searchBlurHandler}
                searchFocusHandler={this.searchFocusHandler}
                searchInputHandler={this.searchInputHandler}
                clearSearchHandler={this.clearSearchHandler}
                itemInSearchResultsClickedHandler={this.itemInSearchResultsClickedHandler}/>
            </div>
            <div>
              <div
                title={'Open settings tab'}
                onClick={(event) => this.openSettingsPageClickedHandler()}>
                <FontAwesomeIcon icon={fasCog} className={styles.IconInHeader} />
              </div>
            </div>
            <Popover
              containerStyle={{zIndex: '100000'}}
              containerClassName={styles.LogoutPopoverContainer}
              isOpen={this.state.popoverOpen}
              position={'bottom'} 
              align={'end'}
              onClickOutside={this.handleClose.bind(this)}
              content={(
                <div className={styles.MenuItem} onClick={this.handleClose.bind(this)}>
                  <NavLink 
                    to={appRoutes.LOG_OUT}
                    exact>
                    <div >
                      &nbsp;
                      <FontAwesomeIcon icon={fasSignOutAlt} /> &nbsp;
                      Sign out
                    </div>
                  </NavLink>
                </div>
              )}
            >
              <div 
                title={'Click to sign out'}
                className={styles.Profile}
                onClick={this.handleClick.bind(this)}>
                <img src={userProfilePhotoURL !== null ? userProfilePhotoURL : ProfileImg} alt="" className={styles.ProfileImg}/> 
                <span>{userName}</span>
              </div>
            </Popover>
          </div>
        </header>
      </Aux>
    );
  }
}

export default withRouter(Header);