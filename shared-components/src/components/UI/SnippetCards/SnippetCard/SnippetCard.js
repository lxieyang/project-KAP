import React, { Component } from 'react';
import * as $ from 'jquery'
import Aux from '../../../../hoc/Aux/Aux';

import ThumbV1 from '../../../UI/Thumbs/ThumbV1/ThumbV1';
import QuestionMark from '../../../UI/Thumbs/QuestionMark/QuestionMark';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import farClock from '@fortawesome/fontawesome-free-regular/faClock';
import fasTrash from '@fortawesome/fontawesome-free-solid/faTrash';
import fasEye from '@fortawesome/fontawesome-free-solid/faEye';
import fasStar from '@fortawesome/fontawesome-free-solid/faStar';
import fasStickyNote from '@fortawesome/fontawesome-free-solid/faStickyNote';
import fasCheckCircle from '@fortawesome/fontawesome-free-solid/faCheckCircle';
import fasShareSquare from '@fortawesome/fontawesome-free-solid/faShareSquare';
import fasCode from '@fortawesome/fontawesome-free-solid/faCode';
import fasFileCode from '@fortawesome/fontawesome-free-solid/faFileCode';
import fasCodeBranch from '@fortawesome/fontawesome-free-solid/faCodeBranch';
import fasCheck from '@fortawesome/fontawesome-free-solid/faCheck';

// import fasTimes from '@fortawesome/fontawesome-free-solid/faTimes';
import { GET_FAVICON_URL_PREFIX } from '../../../../shared/constants';
import HorizontalDivider from '../../../UI/Divider/HorizontalDivider/HorizontalDivider';
import styles from './SnippetCard.css';
import uniqid from 'uniqid';
import moment from 'moment';
import { SNIPPET_TYPE } from '../../../../shared/constants';
import { getFirstNWords } from '../../../../shared/utilities';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import { debounce, reverse, sortBy, last, first } from 'lodash';
import * as FirebaseStore from '../../../../firebase/store';
import ordinal from 'ordinal';


import Popover from 'react-tiny-popover';
import fasMore from '@fortawesome/fontawesome-free-solid/faEllipsisV';


const getHTML = (htmls) => {
  let htmlString = ``;
  if (htmls !== undefined) {
    for (let html of htmls) {
      htmlString += html;
    }
  }
  return {__html: htmlString};
}

class SnippetCard extends Component {
  state = {
    selected: false,
    isPopoverOpen: false
  }

  switchPopoverOpenStatus = () => {
    this.setState(prevState => {
      return {isPopoverOpen: !prevState.isPopoverOpen}
    });
  }

  deleteSnippetWithId = (event, id, name) => {
    this.props.deleteThisSnippet(id, name);
    this.setState({isPopoverOpen: false});
  }

  componentDidMount() {
    this.inputCallback = debounce((event) => {

      FirebaseStore.changeNameOfAPieceGroup(this.props.id, event.target.value.trim());
      event.target.value = event.target.value.trim();
    }, 1000);
  }


  inputChangedHandler = (event) => {
    event.persist();
    this.inputCallback(event);
  }

  goToThisLine = (lineNumber, codebaseId, filePath) => {
    FirebaseStore.setToOpenFile(codebaseId, filePath, lineNumber);
  }

  // Hold off this selected feature to the future (after CHI 2019 deadline)
  // TODO: Enable this feature
  /*
  handleClick = (event,id) => {
    this.setState(prevState => {
      let selected = this.state.selected;
      selected ? this.props.decrementSelectedSnippetNumber(event) : this.props.incrementSelectedSnippetNumber(event);
      return {selected:!(prevState.selected)};
    })
  }

  handleClickTitle = (event, props) => {
    this.props.decrementSelectedSnippetNumber(event);
    this.setState(prevState => {
      this.state.selected ? props.decrementSelectedSnippetNumber(event) : props.incrementSelectedSnippetNumber(event);
      return {selected:!(prevState.selected)};
    })
    this.props.decrementSelectedSnippetNumber(event);
    props.makeInteractionBox(event, props.id);

  }
  */

  render () {
    const props = this.props;
    const { allPieces, options, requirements, showoff } = props;

    let content = null;
    if (props.type === SNIPPET_TYPE.SELECTION) {
      content = (
        <div
          className={styles.ContentContainer}
          style={{maxHeight: props.isInTableView === true ? '350px' : '200px'}}>
          {getFirstNWords(10, props.texts)}
        </div>
      );
    } else if (props.type === SNIPPET_TYPE.LASSO || props.type === SNIPPET_TYPE.POST_SNAPSHOT || props.type === SNIPPET_TYPE.COPIED_PIECE) {
      content = (
        <div
          className={styles.ContentContainer}
          style={{maxHeight: props.isInTableView === true ? '350px' : '200px'}}>
          <div
            className={styles.HTMLPreview}
            // contentEditable="true"
            // suppressContentEditableWarning="true"
            dangerouslySetInnerHTML={getHTML(props.htmls)}>
          </div>
        </div>
      );
    } 

    const header = (
      <div className={styles.Header}>
        {
          <div className={styles.TitleContainer} >
            {
              showoff !== true
              ? <div 
                  className={styles.Title}
                  onClick={(event) => props.makeInteractionBox(event, props.id)}>
                  {getFirstNWords(10, props.title)}
                </div>
              : <div 
                  className={styles.Title}
                  >
                  <a
                    title={'Visit the source page'}
                    href={props.link}
                    target='_blank' rel="noopener noreferrer">
                    {getFirstNWords(10, props.title)}
                  </a>
                </div>
            }

            {
              props.codeUseInfo !== undefined && props.codeUseInfo !== null
              ? <div className={styles.CodeUsedContainer}>

                  <div
                    className={styles.CodeUsedTooltipHandle}
                    data-tip
                    data-for={`${props.id}-tooltip`}>
                    <span>
                      <FontAwesomeIcon icon={fasCode} /> &nbsp;
                      {props.codeUseInfo.length} usage(s)
                    </span>
                  </div>
                  {/*
                  <FontAwesomeIcon
                    icon={fasCheckCircle}
                    className={styles.CodeBadge}
                    data-tip
                    data-for={`${props.id}-tooltip`}/>
                  */}
                  <ReactTooltip
                    place="bottom" type="light" effect="solid"
                    id={`${props.id}-tooltip`}
                    delayHide={200}
                    className={styles.CodeBadgeTooltip}>
                    <div className={styles.CodeBadgeTooltipStats}>
                      Used in {props.codeUseInfo.length} codebase(s):
                    </div>

                    { props.codeUseInfo !== undefined && props.codeUseInfo !== null ?
                      props.codeUseInfo.map((cb, idx) => {
                      return (
                        <div
                          key={idx}
                          className={styles.CodebaseContainer}>
                          <div className={styles.CodebaseNameContainer}>
                            <FontAwesomeIcon icon={fasCode} className={styles.CodebaseIcon}/>
                            <span className={styles.CodebaseName}>{cb.codebase}</span>
                            <span className={styles.CodebaseStats}>({cb.useInfo.length} occasions)</span>
                          </div>

                          <ul style={{listStyleType: 'none', margin: '0', padding: '0'}}>
                            { cb.useInfo !== undefined && cb.useInfo !== null ?
                              cb.useInfo.map((use, idx1) => {
                              return (
                                <li key={idx1} style={{marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid lightgray'}}>
                                  <div className={styles.UsedTimestamp}>
                                    Used on {moment(new Date(use.timestamp)).format("dddd, MMMM Do YYYY, h:mm:ss a")}
                                  </div>
                                  <div className={styles.CodeContentContainer}>
                                    <pre>{use.content}</pre>
                                  </div>
                                  <div>
                                    <ul style={{listStyleType: 'none', margin: '0', padding: '0'}}>
                                      { use.usedBy !== undefined && use.usedBy !== null ?
                                        use.usedBy.map((record, idx2) => {
                                        return (
                                          <li key={idx2} style={{marginBottom: '4px', lineHeight: '1.8'}}>
                                            <div>
                                              <FontAwesomeIcon icon={fasFileCode} className={styles.CodebaseIcon}/>
                                              <span className={styles.FilePath}>
                                                {record.filePath}
                                              </span>
                                              {
                                                record.isUsing
                                                ? <span style={{marginLeft: '4px'}}>
                                                    <span className={styles.InUseBadge}>In Use</span>
                                                    &nbsp;(line <span> </span>
                                                      {
                                                        last(record.useHistory).lineIndices.map(l => l + 1).map((l, idxxx) => (
                                                          <span
                                                            key={idxxx}>
                                                            <span
                                                              title={`Go to line ${l} of this file`}
                                                              className={styles.LineNumber}
                                                              onClick={(event) => this.goToThisLine(l, cb.codebaseId, record.filePath)}>
                                                              {l}
                                                            </span>
                                                            {idxxx !== last(record.useHistory).lineIndices.length - 1
                                                            ? <span>, </span> : null}
                                                          </span>
                                                        ))
                                                      })
                                                  </span>
                                                : <span style={{marginLeft: '4px'}}
                                                  className={styles.DeletedBadge}>
                                                    Deleted
                                                  </span>
                                              }
                                            </div>
                                            <div>
                                              {
                                                first(record.useHistory).gitInfo.branch !== undefined && last(record.useHistory).gitInfo.branch !== undefined ?
                                                record.isUsing
                                                ? <div>
                                                    Introduced in
                                                    <span className={styles.Branch}>
                                                      <FontAwesomeIcon icon={fasCodeBranch}/>
                                                      {first(record.useHistory).gitInfo.branch}
                                                    </span>
                                                    <span className={styles.CommitMessage}>
                                                      {
                                                        getFirstNWords(4, first(record.useHistory).gitInfo.commitMessage)
                                                      } (
                                                      {
                                                        first(record.useHistory).gitInfo.abbreviatedSha
                                                      })
                                                    </span>
                                                    <br />
                                                    Last edit in
                                                    <span className={styles.Branch}>
                                                      <FontAwesomeIcon icon={fasCodeBranch}/>
                                                      {last(record.useHistory).gitInfo.branch}
                                                    </span>
                                                    <span className={styles.CommitMessage}>
                                                      {
                                                        getFirstNWords(4, last(record.useHistory).gitInfo.commitMessage)
                                                      } (
                                                      {
                                                        last(record.useHistory).gitInfo.abbreviatedSha
                                                      })
                                                    </span>
                                                  </div>
                                                : <div>
                                                    Last appeared in
                                                    <span className={styles.Branch}>
                                                      <FontAwesomeIcon icon={fasCodeBranch}/>
                                                      {last(record.useHistory).gitInfo.branch}
                                                    </span>
                                                    <span className={styles.CommitMessage}>
                                                      {
                                                        getFirstNWords(4, last(record.useHistory).gitInfo.commitMessage)
                                                      } (
                                                      {
                                                        last(record.useHistory).gitInfo.abbreviatedSha
                                                      })
                                                    </span>
                                                  </div> : null
                                              }
                                            </div>
                                          </li>
                                        );
                                      }): null}
                                    </ul>
                                  </div>
                                </li>
                              );
                            }): null}
                          </ul>
                        </div>
                      );
                    }): null}
                  </ReactTooltip>
                </div>
              : null
            }
          </div>

        }
        {
          props.title === undefined ? null : <HorizontalDivider margin="5px" />
        }
        <div className={styles.ContentInHeader}>
          {content}
        </div>
        {
          <div className={styles.SiteInfo}>
            <div className={styles.SiteIconContainer}>
              {
                props.icon
                ? <img
                    src={GET_FAVICON_URL_PREFIX + props.icon}
                    alt={props.name}
                    className={styles.SiteIcon} />
                : null
              }
            </div>
            <div className={styles.SiteDomainName}>
              {props.name}
            </div>
            <a
              title={'Visit the source page'}
              className={styles.ExternalLink}
              href={props.link}
              target='_blank' rel="noopener noreferrer">
              <FontAwesomeIcon icon={fasShareSquare} className={styles.IconInside}/>
            </a>
            {
              showoff !== true
              ? <div
                  title={'View in detail'}
                  className={styles.ViewIcon}
                  onClick={(event) => props.makeInteractionBox(event, props.id)}>
                  <FontAwesomeIcon icon={fasEye}/>
                </div>
              : null
            }

          </div>
        }
        {
          props.isInTableView === true
          ? null
          : <Popover
              isOpen={this.state.isPopoverOpen}
              position={'bottom'} // preferred position
              onClickOutside={() => this.switchPopoverOpenStatus()}
              containerClassName={styles.PopoverContainer}
              content={(
                <div className={styles.PopoverContentContainer}>
                  <ul>
                    
                    <li 
                      onClick={(event) => this.deleteSnippetWithId(event, props.id, props.title)}
                      className={styles.DeleteLi}>
                      <div className={styles.IconBoxInPopover}>
                        <FontAwesomeIcon icon={fasTrash} className={styles.IconInPopover}/>
                      </div>
                      <div>Delete</div>
                    </li>
                  </ul>
                </div>
              )}
            >
              <span 
                className={styles.MoreIconContainer}
                style={{opacity: this.state.isPopoverOpen ? '0.7' : null}}
                onClick={() => this.switchPopoverOpenStatus()}>
                <FontAwesomeIcon icon={fasMore}/>
              </span>
              
            </Popover>
        }

      </div>
    );

    let transformedAttitudeList = [];
    for (let opkey in props.attitudeList) {
      if (options[opkey] !== undefined) {   // hack-fix still loading previous task options bug
        let transformedAttitudeOfOptionList = [];
        let attitudeRequirementPairs = props.attitudeList[opkey];
        if (attitudeRequirementPairs !== undefined) {
          for (let rqKey in attitudeRequirementPairs) {
            transformedAttitudeOfOptionList.push({
              ...requirements[rqKey],
              requirementId: rqKey,
              attitude: attitudeRequirementPairs[rqKey]
            });
          }
        }
        transformedAttitudeOfOptionList = reverse(sortBy(transformedAttitudeOfOptionList, ['attitude']));
        transformedAttitudeList.push({
          ...options[opkey],
          optionId: opkey,
          optionName: options[opkey].name,
          listOfAttitudes: transformedAttitudeOfOptionList
        });
      }
    }
    transformedAttitudeList = sortBy(transformedAttitudeList, ['order']);

    const attitudes = (
      <div className={styles.AttitudeContainer}>
        <ul>
          {transformedAttitudeList.map((op, idx) => {
            // console.log('option', op);
            return (
              <li key={idx}>
                <div style={{display: 'flex', alignItems: 'center', width: '70%'}}>
                  <span className={styles.Ordinal}>
                    {(op.order + 1)}
                  </span>
                  <div
                    className={styles.OptionName}>
                    <div
                      className={[styles.OptionStar, (
                        op.starred === true ? styles.ActiveStar : null
                      )].join(' ')}>
                      <FontAwesomeIcon icon={fasStar} />
                    </div>
                    {op.optionName}
                  </div>
                </div>
                <div className={styles.AttitudeListContainer}>
                  {op.listOfAttitudes.map((pair, index) => {
                    let thumb = null;
                    switch (pair.attitude) {
                      case 'good':  thumb = (<ThumbV1 type='up' />); break;
                      case 'bad':   thumb = (<ThumbV1 type='down' />); break;
                      case 'idk':   thumb = (<QuestionMark />); break;
                      default: break;
                    }
                    let identifier = uniqid();
                    return (
                      <Aux key={pair.requirementId}>
                        <div
                          data-tip
                          data-for={identifier}
                          className={styles.Attitude}>
                          {thumb}
                        </div>
                        <ReactTooltip
                          className={styles.AttitudeOfRequirementTooltip}
                          id={identifier}
                          place="right" type="dark" effect="float">
                          <div>
                            {pair.starred === true
                              ? <span><FontAwesomeIcon icon={fasStar} /> &nbsp;</span>
                              : null}
                            {pair.order + 1} &nbsp;
                          </div>
                          <div>
                            {pair.name}
                          </div>
                        </ReactTooltip>
                      </Aux>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    )

    const notes = (
      <div className={styles.NotesContainer}>
        <div className={styles.MetaInfo}>
          <FontAwesomeIcon
            icon={fasStickyNote}
            className={styles.Icon}
            />
          Notes:
        </div>
        <div className={styles.NotesContent}>
          {props.notes}
        </div>
      </div>
    )

    const footer = (
      <div className={styles.Footer}>
        <div className={styles.MetaInfo}>
          <FontAwesomeIcon
            icon={farClock}
            className={styles.Icon}
            />
          {moment(new Date(props.timestamp)).fromNow()}
        </div>
      </div>
    );
    
    return (
      <div
        className={[styles.SnippetCard, props.status ? null : styles.Hide, props.specificPieceId === props.id ? styles.FamousCard : null].join(' ')}
        style={{
          opacity: '1.0',
          width: props.isInTableView === true ? '100%' : '250px',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: (this.state.selected && this.props.selectable) ? '#009BF9': 'lightgray',
          borderRadius: '3px'
        }}
        // onClick={(event) => this.handleClick(event,props.id)}
        >
        {header}
        {attitudes}
        <HorizontalDivider margin="5px" />
        {
          props.notesFilterOn === true
          ? <Aux>
              {notes}
              <HorizontalDivider margin="5px" />
            </Aux>
          : null
        }
        {footer}
      </div>
    // ));
    );
  }
}

export default SnippetCard;
