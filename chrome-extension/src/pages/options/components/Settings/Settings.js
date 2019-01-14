import React, { Component } from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasWindowMaximize from '@fortawesome/fontawesome-free-regular/faWindowMaximize';
import fasClipboardList from '@fortawesome/fontawesome-free-solid/faClipboardList';
import faCommentAlt from '@fortawesome/fontawesome-free-solid/faCommentAlt';
import Setting from './Setting/Setting';
import { APP_NAME_SHORT, DEFAULT_SETTINGS } from '../../../../../../shared-components/src/shared/constants';
import {
  userPathInFirestore
} from '../../../../../../shared-components/src/firebase/index';
import * as FirebaseStore from '../../../../../../shared-components/src/firebase/store';
import styles from './Settings.css';

class Settings extends Component {

  state = {
    shouldOverrideNewtab: DEFAULT_SETTINGS.shouldOverrideNewtab,
    shouldDisplayAllPages: DEFAULT_SETTINGS.shouldDisplayAllPages,
    shouldShowSelector:DEFAULT_SETTINGS.shouldShowSelector
  }

  componentDidMount () {
    userPathInFirestore.onSnapshot((doc) => {
      if (doc.exists && doc.data().userSettings !== undefined) {
        const {
          shouldShowSelector,
          shouldOverrideNewtab,
          shouldDisplayAllPages,

        } = doc.data().userSettings;
        // console.log(doc.data().userSettings);
        this.setState({
          shouldShowSelector,
          shouldOverrideNewtab,
          shouldDisplayAllPages,

        });

      } else {
        FirebaseStore.switchShouldShowSelector(DEFAULT_SETTINGS.shouldShowSelector)
        FirebaseStore.switchShouldOverrideNewtab(DEFAULT_SETTINGS.shouldOverrideNewtab);
        FirebaseStore.switchShouldDisplayAllPages(DEFAULT_SETTINGS.shouldDisplayAllPages);

      }
    });
  }

  switchShouldShowSelector = () => {
    console.log('should switch shouldShowSelector');
    FirebaseStore.switchShouldShowSelector(!this.state.shouldShowSelector)
  }

  switchShouldOverrideNewtabHandler = () => {
    console.log('should switch shouldOverrideNewtab');
    FirebaseStore.switchShouldOverrideNewtab(!this.state.shouldOverrideNewtab);
  }

  switchShouldDisplayAllPagesHandler = () => {
    console.log('should switch shouldDisplayAllPages');
    FirebaseStore.switchShouldDisplayAllPages(!this.state.shouldDisplayAllPages);
  }



  render() {
    return (
      <div className={styles.Settings}>
      <Setting
        name={'Turn on the Selector'}
        icon={faCommentAlt}
        description={
          `By switching on this option, Chrome will display a popover for collecting information whenever you highlight text as well as an in-page task prompt when you make a search in Google. (Please reload your webpage if this button does not immediately work)`
        }
        checked={this.state.shouldShowSelector || false}
        statusChanged={this.switchShouldShowSelector}/>

        <Setting
          name={'Override the new tab'}
          icon={fasWindowMaximize}
          description={
            `By switching on this option, Chrome will replace the page you see when opening a new tab with the ${APP_NAME_SHORT} page. If you wish to keep your current new tab page intact (e.g. you have other Chrome extensions like Toby or Momentum that also override the new tab), please switch this off.`
          }
          checked={this.state.shouldOverrideNewtab || false}
          statusChanged={this.switchShouldOverrideNewtabHandler}/>

        <Setting
          name={'Track all web pages'}
          icon={fasClipboardList}
          description={
            `By switching on this option, ${APP_NAME_SHORT} will keep track of and display a "Pages" section in the collection view containing all the web pages you visisted until the completion of a task.`
          }
          checked={this.state.shouldDisplayAllPages || false}
          statusChanged={this.switchShouldDisplayAllPagesHandler}/>

      </div>
    )
  }
}

export default Settings;
