import React, { Component } from 'react';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasAngleRight from '@fortawesome/fontawesome-free-solid/faAngleRight';
import fasTrash from '@fortawesome/fontawesome-free-solid/faTrash';
import { GET_FAVICON_URL_PREFIX } from '../../../../shared/constants';
import HorizontalDivider from '../../../UI/Divider/HorizontalDivider/HorizontalDivider';
import styles from './PageCard.css';
import { openLinkInTextEditorExtension } from '../../../../shared/utilities';

class PageCard extends Component {

  render () {
    const { props } = this;
    let titleClasses = [styles.Title];
    switch(props.titleSize) {
      case 'giant': 
        titleClasses = (titleClasses.concat([styles.SizeGiant])).join(' '); break;
      case 'large': 
        titleClasses = (titleClasses.concat([styles.SizeLarge])).join(' '); break;
      case 'medium': 
        titleClasses = (titleClasses.concat([styles.SizeMedium])).join(' '); break;
      case 'small': 
        titleClasses = (titleClasses.concat([styles.SizeSmall])).join(' '); break;
      default: 
        titleClasses = (titleClasses.concat([styles.SizeSmall])).join(' '); break;
    }

    const header = (
      <div className={styles.Header}>
        <div className={styles.Left}>
          <div className={titleClasses}>
            <a href={props.siteLink} target="__blank" onClick={(event) => openLinkInTextEditorExtension(event, props.siteLink)} >
              {props.title}
            </a>
          </div>
          <div className={styles.SiteInfo}>
            <div className={styles.SiteIconContainer}>
              {
                props.siteIcon
                ? <a href={props.siteLink} target="__blank" onClick={(event) => openLinkInTextEditorExtension(event, props.siteLink)} >
                  <img 
                    src={GET_FAVICON_URL_PREFIX + props.siteIcon} 
                    alt={props.siteName}
                    className={styles.SiteIcon} />
                  </a>
                : null
              }
            </div>
            <div className={styles.SiteDomainName}>
              <a href={props.siteLink} target="__blank" onClick={(event) => openLinkInTextEditorExtension(event, props.siteLink)} >
                {props.siteName}
              </a>
            </div>
            
          </div>
        </div>
        <div className={styles.Right}>
          <div 
            className={styles.DeleteContainer}
            onClick={(event) => props.deleteThisPage(event, props.id)}>
            <FontAwesomeIcon 
              icon={fasTrash}
              className={styles.Icon}
              />
          </div>
        </div>
      </div>
    );

    const footer = (
      <div className={styles.Footer}>
        <div className={styles.MetaInfo}>
          <FontAwesomeIcon 
            icon={fasAngleRight}
            className={styles.Icon}
            />
          You visited this page {props.times} times
        </div>
      </div>
    );

    return (
      <div className={styles.SnippetCard}>
        {header}
        <HorizontalDivider margin="5px" />
        {footer}
      </div>
    );
  }
}

export default PageCard;