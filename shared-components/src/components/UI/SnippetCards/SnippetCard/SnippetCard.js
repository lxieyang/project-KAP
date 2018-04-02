import React, { Component } from 'react';

import Aux from '../../../../hoc/Aux/Aux';
import ThumbV1 from '../../../UI/Thumbs/ThumbV1/ThumbV1';
import QuestionMark from '../../../UI/Thumbs/QuestionMark/QuestionMark';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import farClock from '@fortawesome/fontawesome-free-regular/faClock';
import fasTrash from '@fortawesome/fontawesome-free-solid/faTrash';
import fasEye from '@fortawesome/fontawesome-free-solid/faEye';
import fasStar from '@fortawesome/fontawesome-free-solid/faStar';
import { GET_FAVICON_URL_PREFIX } from '../../../../shared/constants';
import HorizontalDivider from '../../../UI/Divider/HorizontalDivider/HorizontalDivider';
import styles from './SnippetCard.css';
import uniqid from 'uniqid';
import moment from 'moment';
import { SNIPPET_TYPE } from '../../../../shared/constants';
import { getFirstNWords } from '../../../../shared/utilities';
import { DragSource, DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import { debounce, reverse, sortBy } from 'lodash';
import * as FirebaseStore from '../../../../firebase/store';


/* drag and drop */
const cardSource = {
  beginDrag(props) {
    return {
      id: props.id,
      type: props.type
    }
  },

  canDrag(props) {
    if (props.type === SNIPPET_TYPE.PIECE_GROUP) {
      return false;
    }
    return true;
  },

  endDrag(props, monitor, component) {
    // console.log("END DRAGGING")
    // const item = monitor.getDropResult();
    // console.log(item);
  }
}

const cardTarget = {
  canDrop(props, monitor, component) {
    // if (monitor.getItem().id === props.id) {
    //   return false;
    // } else if (monitor.getItem().type === SNIPPET_TYPE.PIECE_GROUP) {
    //   return false;
    // }
    // return true;

    return false;   // ==> temporarily disable piece grouping
  },

  drop(props, monitor, component) {
    console.log("DROPPED on card [ID:" + props.id + "]");
    const item = monitor.getItem();
    if (props.id !== item.id) {
      // check type
      if (props.type !== SNIPPET_TYPE.PIECE_GROUP && item.type !== SNIPPET_TYPE.PIECE_GROUP) {  // should create a piece group
        props.createAPieceGroup(props.id, item.id);
      } else if (props.type === SNIPPET_TYPE.PIECE_GROUP && item.type !== SNIPPET_TYPE.PIECE_GROUP) {
        props.addAPieceToGroup(props.id, item.id);
      }
    }

    // console.log(item);
    return {
      id: props.id
    }
  }
}

const collectDrag = (connect, monitor) => {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  }
}

const collectDrop = (connect, monitor) => {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  }
}




const getHTML = (htmls) => {
  let htmlString = ``;
  for (let html of htmls) {
    htmlString += html;
  }
  return {__html: htmlString};
}

@DropTarget('TASKCARD', cardTarget, collectDrop)
@DragSource('TASKCARD', cardSource, collectDrag)
class SnippetCard extends Component {

  static propTypes = {
    // Injected by React DnD:
    connectDragSource: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    isOver: PropTypes.bool.isRequired,
    canDrop: PropTypes.bool.isRequired
  };

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

  render () {
    const props = this.props;
    
    const { connectDragSource, isDragging, connectDropTarget, canDrop, isOver } = props;
    const isActive = canDrop && isOver;

    const { allPieces, options, requirements } = props;

    let content = null;
    if (props.type === SNIPPET_TYPE.SELECTION) {
      content = (
        <div 
          className={styles.ContentContainer}
          style={{maxHeight: props.isInTableView === true ? '400px' : '200px'}}>
          {getFirstNWords(10,props.texts)}
        </div>
      );
    } else if (props.type === SNIPPET_TYPE.LASSO || props.type === SNIPPET_TYPE.POST_SNAPSHOT) {
      content = (
        <div 
          className={styles.ContentContainer}
          style={{maxHeight: props.isInTableView === true ? '400px' : '200px'}}>
          <div 
            className={styles.HTMLPreview} 
            contentEditable="true"
            suppressContentEditableWarning="true"
            dangerouslySetInnerHTML={getHTML(props.htmls)}>
          </div>
        </div>
      );
    } else if (props.type === SNIPPET_TYPE.PIECE_GROUP) {
      content = (
        <div 
          className={styles.ContentContainer}
          style={{maxHeight: props.isInTableView === true ? '400px' : '200px'}}>
          <div className={styles.PieceGroupNameContainer}>
            <textarea
              rows={'2'} 
              ref={(input) => { this.nameInput = input; }} 
              type='text' 
              placeholder='Name of this group'
              defaultValue={props.title}
              onChange={(event) => this.inputChangedHandler(event)}/>
          </div>
          <div className={styles.PieceGroupListContainer}>
            <ul>
              {props.pieceIds.map((pid, idx) =>  {
                let piece = allPieces[pid];
                let attitudeOptionPairsList = [];
                if (Object.keys(props.options).length > 0 && piece.attitudeOptionPairs !== undefined) {
                  piece.attitudeOptionPairs.forEach((pair) => {
                    attitudeOptionPairsList.push({
                      optionId: pair.optionId,
                      optionName: props.options[pair.optionId].name,
                      attitude: pair.attitude !== undefined ? pair.attitude : null
                    }); 
                  });
                }
                attitudeOptionPairsList = sortBy(attitudeOptionPairsList, ['attitude']);
                return (
                  <li key={idx}>
                    <div className={styles.Bullet}>• </div>
                    <div className={styles.PieceContainerInPieceGroup}>
                      <div className={styles.PieceTitle} data-tip data-for={pid}>
                        { 
                          piece.title === undefined 
                          ? getFirstNWords(5, piece.texts)
                          : getFirstNWords(5, piece.title)
                        }
                      </div>
                    </div>
                    
                    <ReactTooltip 
                      id={pid} 
                      delayHide={100} 
                      place="right" 
                      type="light" 
                      effect="solid" 
                      class={styles.Tooltip}>
                      {piece.type === SNIPPET_TYPE.SELECTION
                        ? <div className={styles.ContentContainer}>
                            {getFirstNWords(10, piece.texts)}
                          </div>
                        : piece.type === SNIPPET_TYPE.LASSO || piece.type === SNIPPET_TYPE.POST_SNAPSHOT
                          ? <div className={styles.ContentContainer}>
                              <div 
                                className={styles.HTMLPreview} 
                                contentEditable="true"
                                suppressContentEditableWarning="true"
                                dangerouslySetInnerHTML={getHTML(piece.htmls)}>
                              </div>
                            </div>
                          : null
                      }
                      <div className={styles.AttitudeContainer}>
                        <ul>
                          {attitudeOptionPairsList.map((pair, idx) => {
                            return (
                              <li key={idx}>
                                <div className={styles.OptionName}>
                                  {pair.optionName}
                                </div>
                                <div className={styles.Attitude}>
                                  {
                                    pair.attitude === true
                                    ? <ThumbV1 type='up' />
                                    : pair.attitude === false
                                      ? <ThumbV1 type='down' />
                                      : <QuestionMark />
                                  }
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <div className={styles.SiteInfo}>
                        {
                          piece.url
                          ? <Aux>
                              <div className={styles.SiteIconContainer}>
                                  <img
                                    src={GET_FAVICON_URL_PREFIX + piece.url}
                                    alt={piece.url}
                                    className={styles.SiteIcon} />
                                </div>
                                <div className={styles.SiteDomainName}>
                                  {(new URL(piece.url)).hostname}
                                </div>
                              </Aux>
                          : null
                        }
                        <div 
                          title="View this piece"
                          className={styles.ViewIconInTooltip}
                          onClick={(event) => props.makeInteractionBox(event, pid)}>
                          <FontAwesomeIcon icon={fasEye} />
                        </div>
                      </div>
                      <HorizontalDivider margin="5px" />
                      <div className={styles.Footer}>
                        <div className={styles.MetaInfo}>
                          <FontAwesomeIcon icon={farClock} className={styles.Icon}/>
                          {moment(new Date(piece.timestamp)).fromNow()}
                        </div>
                      </div>
                    </ReactTooltip>
                    
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      );
    }

    const header = (
      <div className={styles.Header}>
        {
          props.type === SNIPPET_TYPE.PIECE_GROUP
          ? null
          : <div className={styles.Title}>
              {props.title}
            </div>
        }
        {
          props.title === undefined || props.type === SNIPPET_TYPE.PIECE_GROUP ? null : <HorizontalDivider margin="5px" />
        }
        <div className={styles.ContentInHeader}>
          {content}
        </div>
        {
          props.type === SNIPPET_TYPE.PIECE_GROUP
          ? null
          : <div className={styles.SiteInfo}>
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
              <div 
                className={styles.ViewIcon}
                onClick={(event) => props.makeInteractionBox(event, props.id)}>
                <FontAwesomeIcon icon={fasEye} />
              </div>
            </div>
        }
        {
          props.isInTableView === true 
          ? null
          : <div
              title={props.type === SNIPPET_TYPE.PIECE_GROUP ? 'Discard this group\n(pieces will be preserved)' : 'Delete this piece'}
              className={styles.DeleteContainer}
              onClick={(event) => props.deleteThisSnippet(event, props.id, props.type)}>
              <FontAwesomeIcon 
                icon={fasTrash}
                className={styles.Icon}
                />
            </div>
        }
        
      </div>
    );

    

    // const attitudes = (
    //   <div className={styles.AttitudeContainer}>
    //     <ul>
    //       {props.attitudeOptionPairsList.map((pair, idx) => {
    //         return (
    //           <li key={idx}>
    //             <div className={styles.OptionName}>
    //               {pair.optionName}
    //             </div>
    //             <div className={styles.Attitude}>
    //               {
    //                 pair.attitude === true
    //                 ? <ThumbV1 type='up' />
    //                 : pair.attitude === false
    //                   ? <ThumbV1 type='down' />
    //                   : <QuestionMark />
    //               }
    //             </div>
    //           </li>
    //         );
    //       })}
    //     </ul>
    //   </div>
    // );

    let transformedAttitudeList = [];
    for (let opkey in props.attitudeList) {
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
        optionId: opkey,
        optionName: options[opkey].name,
        listOfAttitudes: transformedAttitudeOfOptionList
      });
    }
    console.log(transformedAttitudeList);

    const attitudes = (
      <div className={styles.AttitudeContainer}>
        <ul>
          {transformedAttitudeList.map((op, idx) => {
            
            return (
              <li key={idx}>
                <div className={styles.OptionName}>
                  {op.optionName}
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
                             ? <FontAwesomeIcon icon={fasStar} />
                             : null}
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

    return connectDropTarget(connectDragSource(
      <div 
        className={[styles.SnippetCard, props.status ? null : styles.Hide].join(' ')}
        style={{
          transform: isActive ? 'scale(1.2)' : 'scale(1.0)',
          opacity: isDragging ? '0.3' : '1.0',
          cursor: isDragging ? 'move' : 'auto',
          width: props.isInTableView === true ? '100%' : '250px'
        }}>
        {header}
        {attitudes}
        <HorizontalDivider margin="5px" />
        {footer}
      </div>
    ));
  }
}

export default SnippetCard;
