import React from 'react';

import FontAwesome from 'react-fontawesome';
import { GET_FAVICON_URL_PREFIX } from '../../../../shared/constants';
import HorizontalDivider from '../../../UI/Divider/HorizontalDivider/HorizontalDivider';
import styles from './PageCard.css';

const pageCard = (props) => {
  
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
          <a href={props.siteLink} target="__blank" >
            {props.title}
          </a>
        </div>
        <div className={styles.SiteInfo}>
          <div className={styles.SiteIconContainer}>
            {
              props.siteIcon
              ? <a href={props.siteLink} target="__blank" >
                <img 
                  src={GET_FAVICON_URL_PREFIX + props.siteIcon} 
                  alt={props.siteName}
                  className={styles.SiteIcon} />
                </a>
              : null
            }
          </div>
          <div className={styles.SiteDomainName}>
            <a href={props.siteLink} target="__blank" >
              {props.siteName}
            </a>
          </div>
          
        </div>
      </div>
      <div className={styles.Right}>
        <div 
          className={styles.DeleteContainer}
          onClick={(event) => props.deleteThisPage(event, props.id)}>
          <FontAwesome name='trash' className={styles.Icon}/>
        </div>
      </div>
    </div>
  );

  const footer = (
    <div className={styles.Footer}>
      <div className={styles.MetaInfo}>
        <FontAwesome name='clock-o' className={styles.Icon}/>
        You visited this page {props.times} times
      </div>
      <div className={styles.MetaInfo}>
        <FontAwesome name='sticky-note-o' className={styles.Icon}/>
        {props.numPieces} snippets
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

export default pageCard;