/* global chrome */
import React, { Component } from "react";
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasExternalLinkSquareAlt from '@fortawesome/fontawesome-free-solid/faExternalLinkSquareAlt';
import Header from './components/Header/Header';
import Settings from './components/Settings/Settings';
import Aux from '../../../../shared-components/src/hoc/Aux/Aux';
import AppHeader from '../../../../shared-components/src/components/UI/AppHeader/AppHeader';
import HorizontalDivider from '../../../../shared-components/src/components/UI/Divider/HorizontalDivider/HorizontalDivider';
import { 
  setUserIdAndName
} from '../../../../shared-components/src/firebase/index';
import styles from './Options.css';

const dividerOptions = {
  margin: {
    long: '10px',
    short: '30px'
  }
}

class Options extends Component {
  state = {
    loading: true,
    userId: null,
    userName: null,
    userProfilePhotoURL: null
  }

  componentDidMount() {
    let port = chrome.runtime.connect({name: 'FROM_OPTIONS'});
    port.postMessage({msg: 'GET_USER_INFO'});
    port.onMessage.addListener((response) => {
      if(response.msg === 'USER_INFO') {
        const { payload } = response;
        setUserIdAndName(payload.userId);
        this.setState({
          loading: false,
          userId: payload.userId,
          userName: payload.userName,
          userProfilePhotoURL: payload.userProfilePhotoURL
        });
      }
    });
  }

  openInNewTabClickedHandler = () => {
    console.log('open new tab');
    chrome.runtime.sendMessage({
      msg: 'OPEN_IN_NEW_TAB'
    });
  }

  render () {
    let isLoggedIn = !(this.state.userId === null || this.state.userId === 'invalid');

    if (!isLoggedIn) {
      if (!this.state.loading) {
        return (
          <Aux>
            <div 
              style={{
                display: 'flex', 
                justifyContent: 'space-around', 
                alignItems: 'center'
              }}>
              <AppHeader 
                logoSize='38px' 
                hover={false}
                shouldDisplayHeaderButtons={false} />
            </div>
            
            <HorizontalDivider margin={dividerOptions.margin.short}/>
            <div 
              style={{
                width: '100%', 
                height: '80px', 
                display: 'flex', 
                justifyContent: 'space-around', 
                alignItems: 'center'
              }}>
              <div 
                className={styles.GoToNewTabBtn} 
                onClick={(event) => this.openInNewTabClickedHandler()}>
                Please first sign in from a new tab! &nbsp;
                <FontAwesomeIcon icon={fasExternalLinkSquareAlt} />
              </div>
            </div>
          </Aux>
        );
      } else {
        return (<div></div>);
      }
    }

    return (
      <Aux>
        <Header 
          userName={this.state.userName}
          userProfilePhotoURL={this.state.userProfilePhotoURL}/>
        <main className={styles.Main}>
          <div className={styles.Content}>
            <Settings />
          </div>
        </main>
      </Aux>
    );
  }
}

export default Options;