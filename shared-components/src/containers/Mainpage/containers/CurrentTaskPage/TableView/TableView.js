import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import { withRouter } from 'react-router-dom';
import qs from 'query-string';
import {Collapse} from 'react-collapse';
import Aux from '../../../../../hoc/Aux/Aux';

import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import farSquare from '@fortawesome/fontawesome-free-regular/faSquare';
import farWindowMaximize from '@fortawesome/fontawesome-free-regular/faWindowMaximize';
import fasICursor from '@fortawesome/fontawesome-free-solid/faICursor';
import fasCode from '@fortawesome/fontawesome-free-solid/faCode';
import fasMinusCircle from '@fortawesome/fontawesome-free-solid/faMinusCircle';
import fasCheckCircle from '@fortawesome/fontawesome-free-solid/faCheckCircle';
import fasToggleOn from '@fortawesome/fontawesome-free-solid/faToggleOn';
import fasToggleOff from '@fortawesome/fontawesome-free-solid/faToggleOff';
import fasChevronDown from '@fortawesome/fontawesome-free-solid/faChevronDown';
import fasChevronUp from '@fortawesome/fontawesome-free-solid/faChevronUp';

import TableRow from './TableRow/TableRow';
import ToggleSwitch from '../../../../../components/UI/ToggleSwitch/ToggleSwitch';
import InteractionBox from '../../../../../components/InteractionBox/InteractionBox';
import ThumbV1 from '../../../../../components/UI/Thumbs/ThumbV1/ThumbV1';
import QuestionMark from '../../../../../components/UI/Thumbs/QuestionMark/QuestionMark';
import SnippetCard from '../../../../../components/UI/SnippetCards/SnippetCard/SnippetCard';
// import * as actionTypes from '../../../../../shared/actionTypes';
import styles from './TableView.css';
import { SNIPPET_TYPE } from '../../../../../shared/constants';
import { getFirstNWords } from '../../../../../shared/utilities';
import { debounce, sortBy, reverse } from 'lodash';
import ReactTooltip from 'react-tooltip';
import * as FirebaseStore from '../../../../../firebase/store';

/* For DnD */
import TableHeader from './TableHeader/TableHeader';
import update from 'immutability-helper';

const inactiveOpacity = 0.2;


class TableView extends Component {
  state = {
    pieces: this.props.task.pieces,
    specificPieceId: this.props.specificPieceId !== undefined ? this.props.specificPieceId : null,
    options: this.props.task.options,
    requirements: this.props.task.requirements,
    pieceGroups: this.props.task.pieceGroups,
    optionsList: [],
    requirementsList: [],
    piecesList: [],
    isDetailed: true,
    shouldShowNotes: this.props.task.showOptionNotes !== undefined ? this.props.task.showOptionNotes : false,
    showModal: false,
    modalPieceId: '',
    tableviewisOpen: true
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    if (nextProps.specificPieceId !== undefined) {
      this.setState({specificPieceId: nextProps.specificPieceId})
    } else {
      this.setState({specificPieceId: null});
    }
    const { task } = nextProps;
    this.transformData(task);
  }

  keyDownHandler = (event) => {
    if (event.key === 'Escape') {
      this.dismissModal();
    }
  }

  componentDidMount () {
    const { task } = this.props;
    this.transformData(task);

    document.body.addEventListener('keydown',  this.keyDownHandler);

    this.unlisten = this.props.history.listen((location, action) => {
      const search = qs.parse(location.search);
      if (search.pieceId !== null && search.pieceId !== undefined) {
        this.setState({modalPieceId: search.pieceId, showModal: true});

      } else {
        this.setState({showModal: false});
      }
    });
  }

  componentWillUnmount() {
    this.unlisten();
    document.body.removeEventListener('keydown', this.keyDownHandler);
  }

  transformData = (task) => {
    // extract options
    let optionsList = [];
    for (let opKey in task.options) {
      optionsList.push({
        ...task.options[opKey],
        id: opKey,
        active: true,
      });
    }
    optionsList = sortBy(optionsList, ['order']);

    // extract requirements
    let requirementsList = [];
    for (let rqKey in task.requirements) {
      requirementsList.push({
        ...task.requirements[rqKey],
        id: rqKey,
        active: true
      });
    }
    requirementsList = sortBy(requirementsList, ['order']);

    // extract pieces
    let piecesList = [];
    for (let pKey in task.pieces) {
      piecesList.push({
        ...task.pieces[pKey],
        id: pKey,
        active: true // toInactivePiecesList.indexOf(pKey) === -1
      });
    }

    // show notes?
    let shouldShowNotes = task.showOptionNotes;

    this.setState({optionsList, requirementsList, piecesList, shouldShowNotes});
  }

  switchTableIsOpenStatus = (event) => {
    this.setState(prevState => {
      return {tableviewisOpen: !prevState.tableviewisOpen};
    });
  }

  getOrderedRequirementListFromState () {
    let { requirementsList } = this.state;
    requirementsList = reverse(sortBy(requirementsList, ['active', 'order']));
    return requirementsList;
  }

  getOrderedOptionListFromState () {
    let { optionsList } = this.state;
    optionsList = reverse(sortBy(optionsList, ['active']));
    return optionsList;
  }

  switchPieceStatus = (event, pieceId) => {
    console.log(pieceId);
    let idx = 0;
    let updatedPiece = {};
    for (; idx < this.state.piecesList.length; idx++) {
      if (this.state.piecesList[idx].id === pieceId) {
        updatedPiece = {...this.state.piecesList[idx]};
        break;
      }
    }
    updatedPiece.active = !updatedPiece.active;
    let updatedPiecesList = [...this.state.piecesList];
    updatedPiecesList[idx] = updatedPiece;
    this.setState({piecesList: updatedPiecesList});

  }

  switchOptionStatus = (event, optionId) => {
    let idx = 0;
    let updatedOption = {};
    for(; idx < this.state.optionsList.length; idx++) {
      if (this.state.optionsList[idx].id === optionId) {
        updatedOption = {...this.state.optionsList[idx]};
        break;
      }
    }
    updatedOption.active = !updatedOption.active;
    let updatedOptionsList = [...this.state.optionsList];
    updatedOptionsList[idx] = updatedOption;
    this.setState({optionsList: updatedOptionsList});
  }

  switchRequirementStatus = (event, requirementId) => {
    let idx = 0;
    let updatedRequirement = {};
    for(; idx < this.state.requirementsList.length; idx++) {
      if (this.state.requirementsList[idx].id === requirementId) {
        updatedRequirement = {...this.state.requirementsList[idx]};
        break;
      }
    }
    updatedRequirement.active = !updatedRequirement.active;
    let updatedRequirementList = [...this.state.requirementsList];
    updatedRequirementList[idx] = updatedRequirement;
    this.setState({requirementsList: updatedRequirementList});
  }

  // dismissModal = () => {
  //   this.setState({showModal: false});
  // }

  // makeInteractionbox = (event, pieceId) => {
  //   this.setState({modalPieceId: pieceId, showModal: true});
  // }

  dismissModal = () => {
    // this.setState({showModal: false});
    const query = {
      ...qs.parse(this.props.location.search)
    };
    delete query['pieceId'];
    this.props.history.push({
      search: qs.stringify(query)
    });
  }

  makeInteractionbox = (event, pieceId) => {
    // this.setState({modalPieceId: pieceId, showModal: true});
    const query = {
      ...qs.parse(this.props.location.search),
      pieceId
    };
    this.props.history.push({
      search: qs.stringify(query)
    });
  }

  getTypeBadge = (type) => {
    switch(type) {
      case SNIPPET_TYPE.SELECTION:
        return (
          <FontAwesomeIcon icon={fasICursor} className={styles.BadgeIcon}/>
        );
      case SNIPPET_TYPE.LASSO:
        return (
          <FontAwesomeIcon icon={farSquare} className={styles.BadgeIcon}/>
        );
      case SNIPPET_TYPE.POST_SNAPSHOT:
        return (
          <FontAwesomeIcon icon={farWindowMaximize} className={styles.BadgeIcon}/>
        );
      default:
        return null;
    }
  }

  getCodeBadge = (htmls) => {
    for (let html of htmls) {
      if (html.indexOf('pre') !== -1 && html.indexOf('prettyprint') !== -1) {
        return (
          <FontAwesomeIcon icon={fasCode} className={styles.BadgeIcon}/>
        );
      }
    }
    return null;
  }

  detailedViewChangeHandler = (event) => {
    this.setState(prevState => {
      return {isDetailed: !prevState.isDetailed};
    });
  }

  showNotesChangedHandler = (event) => {
    // this.setState(prevState => {
    //   return {shouldShowNotes: !prevState.shouldShowNotes};
    // });

    FirebaseStore.switchShowOptionNotesStatus();
  }

  changeAttitude = (optionId, pieceId, originalAttitude, changedAttitude, type) => {
    // console.log('change attitude from: ' + originalAttitude + ' to: ' + changedAttitude);
    if (type !== SNIPPET_TYPE.PIECE_GROUP) {
      const { pieces } = this.props.task;
      let piece = pieces[pieceId];
      // console.log(piece);
      let pieceClone = JSON.parse(JSON.stringify(piece));
      if (originalAttitude === changedAttitude) {
        // console.log('should be undefined');
        if (pieceClone.attitudeOptionPairs) {
          pieceClone.attitudeOptionPairs = pieceClone.attitudeOptionPairs.filter(pair => pair.optionId !== optionId);
        }
      } else {
        // console.log('should be ' + changedAttitude);
        if (pieceClone.attitudeOptionPairs) {
          let shouldPushNew = true;
          pieceClone.attitudeOptionPairs = pieceClone.attitudeOptionPairs.map((pair) => {
            if (pair.optionId === optionId) {
              shouldPushNew = false;
              return changedAttitude === null
                      ? {optionId: optionId}
                      : {attitude: changedAttitude, optionId: optionId}
            }
            return pair;
          });
          if(shouldPushNew) {
            // console.log('should push new pair');
            pieceClone.attitudeOptionPairs.push(
              changedAttitude === null
              ? {optionId: optionId}
              : {attitude: changedAttitude, optionId: optionId}
            );
          }
        } else {
          pieceClone.attitudeOptionPairs = [
            changedAttitude === null
            ? {optionId: optionId}
            : {attitude: changedAttitude, optionId: optionId}];
        }
      }
      // console.log(pieceClone);
      // save piece
      FirebaseStore.updateAPieceWithId(pieceId, pieceClone);

    } else {
      // PIECE_GROUP
      console.log('change attitude of piece group to: ' + changedAttitude);
      const { pieceGroups } = this.props.task;
      let piece = pieceGroups[pieceId];
      // console.log(piece);
      let pieceClone = JSON.parse(JSON.stringify(piece));
      if (originalAttitude === changedAttitude) {
        // console.log('should be undefined');
        if (pieceClone.attitudeOptionPairs) {
          pieceClone.attitudeOptionPairs = pieceClone.attitudeOptionPairs.filter(pair => pair.optionId !== optionId);
        }
      } else {
        // console.log('should be ' + changedAttitude);
        if (pieceClone.attitudeOptionPairs) {
          let shouldPushNew = true;
          pieceClone.attitudeOptionPairs = pieceClone.attitudeOptionPairs.map((pair) => {
            if (pair.optionId === optionId) {
              shouldPushNew = false;
              return changedAttitude === null
                      ? {optionId: optionId}
                      : {attitude: changedAttitude, optionId: optionId}
            }
            return pair;
          });
          if(shouldPushNew) {
            // console.log('should push new pair');
            pieceClone.attitudeOptionPairs.push(
              changedAttitude === null
              ? {optionId: optionId}
              : {attitude: changedAttitude, optionId: optionId}
            );
          }
        } else {
          pieceClone.attitudeOptionPairs = [
            changedAttitude === null
            ? {optionId: optionId}
            : {attitude: changedAttitude, optionId: optionId}];
        }
      }
      // console.log(pieceId);
      // console.log(pieceClone);

      FirebaseStore.updateAPieceGroupAttitudeOptionPairsWithId(pieceId, pieceClone.attitudeOptionPairs);
    }
  }

  getHTML = (htmls) => {
    let htmlString = ``;
    for (let html of htmls) {
      htmlString += html;
    }
    return {__html: htmlString};
  }






  /* For Dnd */
  moveHeader = (dragIndex, hoverIndex) => {
    const { requirementsList } = this.state;
    const dragHeader = requirementsList[dragIndex];

    let newRequirementsList = update(requirementsList, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, dragHeader]
      ]
    });

    this.setState({requirementsList: newRequirementsList});

    // update order
    let ordering = {};
    for (let idx = 0; idx < newRequirementsList.length; idx++) {
      ordering[newRequirementsList[idx].id] = idx;
    }
    FirebaseStore.updateRequirementOrdering(ordering);
  }

  switchHideStatusOfARequirement = (toHideIndex, requirementId, hide) => {
    const { requirementsList } = this.state;
    const fromHeader = requirementsList[toHideIndex];
    let toIndex = requirementsList.length - 1;

    let newRequirementsList = update(requirementsList, {
      $splice: [
        [toHideIndex, 1],
        [toIndex, 0, fromHeader]
      ]
    });

    this.setState({requirementsList: newRequirementsList});

    // update order
    let ordering = {};
    for (let idx = 0; idx < newRequirementsList.length; idx++) {
      ordering[newRequirementsList[idx].id] = idx;
    }

    FirebaseStore.switchHideStatusOfARequirementWithId(requirementId, hide, ordering);
  }

  moveRow = (dragIndex, hoverIndex) => {

    const { optionsList } = this.state;
    const dragRow = optionsList[dragIndex];

    let newOptionsList = update(optionsList, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, dragRow]
      ]
    });

    this.setState({optionsList: newOptionsList});

    // update order
    let ordering = {};
    for (let idx = 0; idx < newOptionsList.length; idx++) {
      ordering[newOptionsList[idx].id] = idx;
    }
    FirebaseStore.updateOptionsOrdering(ordering);
  }

  switchHideStatusOfAnOption = (toHideIndex, optionId, hide) => {

    const { optionsList } = this.state;
    const fromRow = optionsList[toHideIndex];
    let toIndex = optionsList.length - 1;

    let newOptionsList = update(optionsList, {
      $splice: [
        [toHideIndex, 1],
        [toIndex, 0, fromRow]
      ]
    });

    this.setState({optionsList: newOptionsList});

    // update order
    let ordering = {};
    for (let idx = 0; idx < newOptionsList.length; idx++) {
      ordering[newOptionsList[idx].id] = idx;
    }

    FirebaseStore.switchHideStatusOfAnOptionWithId(optionId, hide, ordering);
  }

  switchStarStatusOfRequirement = (id) => {
    FirebaseStore.switchStarStatusOfARequirementWithId(id);
  }

  switchStarStatusOfOption = (id) => {
    FirebaseStore.switchStarStatusOfAnOptionWithId(id);
  }

  switchUsedStatusOfOption = (id, used) => {
    if (used === true) {
      FirebaseStore.unUseAnOption(id);
    } else {
      FirebaseStore.useAnOption(id);
    }
  }

  render () {
    // let pieceViewOption = (
    //   <Aux>
    //     <div className={styles.Label}>
    //       <span>View Detailed Pieces</span>
    //     </div>
    //     <div className={styles.Slider}>
    //       <ToggleSwitch
    //         checked={this.state.isDetailed}
    //         statusChanged={this.detailedViewChangeHandler}/>
    //     </div>
    //   </Aux>
    // );


    let newRequirementsList = this.state.requirementsList; // this.getOrderedRequirementListFromState();
    let newOptionsList = this.state.optionsList; // this.getOrderedOptionListFromState();

    let newTableHeader = (
      <tr>
        <th style={{verticalAlign: 'bottom'}}>
          <div className={styles.ConfigurationLine}>
            <div className={styles.Label}>
              <span>Show Notes</span>
            </div>
            <div
              className={styles.Slider}
              onClick={(event) => this.showNotesChangedHandler(event)}>
              {
                this.state.shouldShowNotes
                ? <FontAwesomeIcon icon={fasToggleOn} className={[styles.SliderIcon, styles.SliderOn].join(' ')}/>
                : <FontAwesomeIcon icon={fasToggleOff} className={[styles.SliderIcon, styles.SliderOff].join(' ')}/>
              }
            </div>
          </div>
        </th>
        {
          newRequirementsList.map((rq, idx) => {
            return (
              <TableHeader
                key={rq.id}
                rq={rq}
                index={idx}
                moveHeader={this.moveHeader}
                inactiveOpacity={inactiveOpacity}
                switchStarStatusOfRequirement={this.switchStarStatusOfRequirement}
                switchHideStatusOfARequirement={this.switchHideStatusOfARequirement}
                updateRequirementName={FirebaseStore.updateRequirementName}/>
            );
          })
        }
      </tr>
    );

    let newTableBody = newOptionsList.map((op, idx) => {
      return (
        <tr
          key={op.id}>
          <TableRow
            op={op}
            index={idx}
            moveRow={this.moveRow}
            inactiveOpacity={inactiveOpacity}
            switchStarStatusOfOption={this.switchStarStatusOfOption}
            switchHideStatusOfAnOption={this.switchHideStatusOfAnOption}
            switchUsedStatusOfOption={this.switchUsedStatusOfOption}
            newRequirementsList={newRequirementsList}
            pieces={this.state.pieces}
            options={this.state.options}
            requirements={this.state.requirements}
            updateOptionName={FirebaseStore.updateOptionName}
            addANoteToOption={FirebaseStore.addANoteToAnOption}
            deleteANoteFromOption={FirebaseStore.deleteANoteFromAnOption}
            shouldShowNotes={this.state.shouldShowNotes}
            makeInteractionbox={this.makeInteractionbox}/>
            {
              newRequirementsList.map((rq, index) => {
                // find all pieces in the piecesList that has option id = op.id and requirement id = rq.id
                let piecesInThisCell = [];
                for (let pKey in this.state.pieces) {
                  let piece = this.state.pieces[pKey];
                  let attitudeList = piece.attitudeList;
                  if (attitudeList !== undefined) {
                    let attitudeRequirementPairs = attitudeList[op.id];
                    if (attitudeRequirementPairs !== undefined) {
                      let attitude = attitudeRequirementPairs[rq.id];
                      if (attitude !== undefined) {
                        piecesInThisCell.push({
                          ...piece,
                          id: pKey,
                          attitude: attitude
                        })
                      }
                    }
                  }
                }
                piecesInThisCell = reverse(sortBy(piecesInThisCell, ['attitude']));

                return (
                  <td key={rq.id} style={{opacity: rq.hide === true || op.hide === true ? `${inactiveOpacity}` : '1'}}>
                    <div className={styles.AttitudeThumbInTableCellContainer}>
                      { piecesInThisCell.length > 0 ?
                        piecesInThisCell.map((p, idx) => {
                        let thumb = null;
                        switch (p.attitude) {
                          case 'good':  thumb = (<ThumbV1 type='up' />); break;
                          case 'bad':   thumb = (<ThumbV1 type='down' />); break;
                          case 'idk':   thumb = (<QuestionMark />); break;
                          default: break;
                        }

                        return (
                          <Aux key={`${p.id}${op.id}${rq.id}`}>
                            <div
                              className={[styles.AttitudeInTableCell].join(' ')}
                              data-tip
                              data-for={`${p.id}${op.id}${rq.id}`}>
                              {thumb}
                            </div>
                            <ReactTooltip
                              place="right"
                              type="light"
                              effect="solid"
                              id={`${p.id}${op.id}${rq.id}`}
                              className={styles.TooltipOverAttitude}
                              getContent={() => {
                                return (
                                  <SnippetCard
                                    id={p.id}
                                    type={p.type}
                                    isInTableView={true}
                                    allPieces={this.state.pieces}
                                    options={this.state.options}
                                    requirements={this.state.requirements}
                                    status={true}
                                    pieceIds={p.type === SNIPPET_TYPE.PIECE_GROUP ? p.pieceIds : []}
                                    title={p.type === SNIPPET_TYPE.PIECE_GROUP ? p.name : p.title}
                                    texts={p.type === SNIPPET_TYPE.PIECE_GROUP ? p.name : p.texts}
                                    name={p.type === SNIPPET_TYPE.PIECE_GROUP ? null : (new URL(p.url)).hostname}
                                    link={p.url}
                                    icon={p.url}
                                    htmls={p.htmls}
                                    timestamp={p.timestamp}
                                    postTags={p.postTags}
                                    notes={p.notes}
                                    codeUseInfo={p.codeUseInfo}
                                    attitudeList={p.attitudeList}
                                    makeInteractionBox={(event, id) => this.makeInteractionbox(event, id)}/>
                                );
                              }}>

                            </ReactTooltip>
                          </Aux>
                        );

                      }): null}
                    </div>
                  </td>
                );
              })
            }
        </tr>
      );
    });

    let modal = null;
    if (this.state.showModal) {
      let piece = this.props.task.pieces[this.state.modalPieceId];
      // console.log(piece);
      if (piece !== undefined) {
        modal = (
          <Aux>
            <div className={styles.BackDrop}>
            </div>
            <div
              className={styles.ModalContentBackground}>
              <InteractionBox
                mode={'UPDATE'}
                clip={this.dismissModal}
                id={this.state.modalPieceId}
                specificPieceId={this.state.specificPieceId}
                options={this.props.task.options}
                requirements={this.props.task.requirements}

                attitudeList={piece.attitudeList}
                type={piece.type}
                url={piece.url}
                postTags={piece.postTags}
                htmls={piece.htmls}
                title={piece.title}
                autoSuggestedTitle={piece.autoSuggestedTitle}
                originalDimensions={piece.originalDimensions}
                selectedText={piece.texts}
                notes={piece.notes}
              />
            </div>
          </Aux>
        );
      }

    }


    let content = (
    <table className={styles.ComparisonTable}>
      <thead>
        {newTableHeader}
      </thead>
      <tbody>
        {newTableBody}
      </tbody>
    </table>
);

    return (
      <Aux>
      <div className={styles.Section}>
        <div className={styles.TableView}>
          <div className={styles.ConfigureRow}>

            {/*
            <div className={styles.PieceConfigure}>
              {pieceViewOption}
            </div>
            */}
          </div>

          <div className={styles.Content}>

          <Aux>
            <div className={styles.Header}>
            <div className={styles.HeaderNameContainer}
            onClick={(event) => this.switchTableIsOpenStatus(event)}>
              <div className={styles.HeaderName}>
                 <span>Comparison Table</span>
              </div>

              <div
                  className={styles.HeaderCollapseButton}>
                  {
                    this.state.tableviewisOpen
                    ? <FontAwesomeIcon icon={fasChevronUp} />
                    : <FontAwesomeIcon icon={fasChevronDown} />
                  }
                </div>
              </div>
              </div>
              <Collapse isOpened={this.state.tableviewisOpen} springConfig={{stiffness: 700, damping: 50}}>
                {content}
              </Collapse>
            </Aux>

            {modal}

            </div>

            </div>
        </div>
      </Aux>
    );
  }
}

export default withRouter(TableView);
