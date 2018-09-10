/* global chrome */
import $ from 'jquery';
import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import { withRouter } from 'react-router-dom';
import qs from 'query-string';
import {Collapse} from 'react-collapse';
import Aux from '../../../../../hoc/Aux/Aux';
import fasPlusCircle from '@fortawesome/fontawesome-free-solid/faPlusCircle';
import fasListAlt from '@fortawesome/fontawesome-free-solid/faListAlt';
import fasFlagCheckered from '@fortawesome/fontawesome-free-solid/faFlagCheckered';
import faPlus from '@fortawesome/fontawesome-free-solid/faPlus';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import farSquare from '@fortawesome/fontawesome-free-regular/faSquare';
import farWindowMaximize from '@fortawesome/fontawesome-free-regular/faWindowMaximize';
import fasICursor from '@fortawesome/fontawesome-free-solid/faICursor';
import fasCode from '@fortawesome/fontawesome-free-solid/faCode';
import fasMinusCircle from '@fortawesome/fontawesome-free-solid/faMinusCircle';
import fasCheckCircle from '@fortawesome/fontawesome-free-solid/faCheckCircle';
import fasToggleOn from '@fortawesome/fontawesome-free-solid/faToggleOn';
import fasToggleOff from '@fortawesome/fontawesome-free-solid/faToggleOff';
import fasAngleDown from '@fortawesome/fontawesome-free-solid/faAngleDown';
import fasAngleRight from '@fortawesome/fontawesome-free-solid/faAngleRight';

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
import Popover from 'react-tiny-popover';
import Input from '../../../../../components/UI/Input/Input';
import * as FirebaseStore from '../../../../../firebase/store';

/* For DnD */
import TableHeader from './TableHeader/TableHeader';
import update from 'immutability-helper';
import Snackbar from '../../../../../components/UI/Snackbar/Snackbar';

const inactiveOpacity = 0.2;


class TableView extends Component {
  state = {
    pieces: this.props.task.pieces,
    specificPieceId: this.props.specificPieceId !== undefined ? this.props.specificPieceId : null,
    options: this.props.task.options,
    requirements: this.props.task.requirements,
    pieceGroups: this.props.task.pieceGroups,
    selectedSnippets: 0,
    optionsList: [],
    requirementsList: [],
    piecesList: [],
    isDetailed: true,
    shouldShowNotes: true,
    showModal: false,
    modalPieceId: '',
    tableviewisOpen: true,
    readModeisOn: false,

    addRequirementPopoverIsOpen: false,
    addOptionPopoverIsOpen: false,
    newOptionInput: '',
    newRequirementInput: '',
    isEditingOption: false,
    isEditingRequirement: false,

    // chrome extension port
    portToBackground: null,

    // snackbar
    deleteOptionSnackbarShouldShow: false,
    deleteRequirementSnackbarShouldShow: false,
    toDeleteOptionId: null,
    toDeleteRequirementId: null,
    toDeleteOptionName: null,
    toDeleteRequirementName: null
  }

  deleteOptionStateHelper = (snackbarStatus, id, name) => {
    this.setState({
      deleteOptionSnackbarShouldShow: snackbarStatus,
      toDeleteOptionId: id,
      toDeleteOptionName: name
    });
    const { portToBackground } = this.state;
    portToBackground.postMessage({
      msg: 'TO_DELETE_OPTION_STATUS_CHANGED',
      payload: {
        id: id
      }
    });
  }

  deleteRequirementStateHelper = (snackbarStatus, id, name) => {
    this.setState({
      deleteRequirementSnackbarShouldShow: snackbarStatus,
      toDeleteRequirementId: id,
      toDeleteRequirementName: name
    });
    const { portToBackground } = this.state;
    portToBackground.postMessage({
      msg: 'TO_DELETE_REQUIREMENT_STATUS_CHANGED',
      payload: {
        id: id
      }
    });
  }

  showSnackbar = (type, id, name) => {
    // https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_snackbar
    if (type === 'op') {
      this.deleteOptionStateHelper(true, id, name);
      this.deleteOptionSnackbarTimer = setTimeout(() => {
        this.deleteOptionStateHelper(false, null, null);
      }, 5000);
    } else if (type === 'rq') {
      this.deleteRequirementStateHelper(true, id, name);
      this.deleteRequirementSnackbarTimer = setTimeout(() => {
        this.deleteRequirementStateHelper(false, null, null);
      }, 5000);
    }
  }

  deleteOptionHandler = (id, name) => {
    this.showSnackbar('op', id, name);

    FirebaseStore.switchOptionVisibility(id, false);
    this.deleteOptionTimer = setTimeout(() => {
      FirebaseStore.deleteOptionWithId(id);
    }, 6000);
  }

  undoDeleteOptionHandler = () => {
    clearTimeout(this.deleteOptionTimer);
    clearTimeout(this.deleteOptionSnackbarTimer);
    FirebaseStore.switchOptionVisibility(this.state.toDeleteOptionId, true);
    this.deleteOptionStateHelper(false, null, null);
  }

  deleteRequirementHandler = (id, name) => {
    this.showSnackbar('rq', id, name);

    FirebaseStore.switchRequirementVisibility(id, false);
    this.deleteRequirementTimer = setTimeout(() => {
      FirebaseStore.deleteRequirementWithId(id);
    }, 6000);
  }

  undoDeleteRequirementHandler = () => {
    clearTimeout(this.deleteRequirementTimer);
    clearTimeout(this.deleteRequirementSnackbarTimer);
    FirebaseStore.switchRequirementVisibility(this.state.toDeleteRequirementId, true);
    this.deleteRequirementStateHelper(false, null, null);
  }

  switchPopoverOpenStatus = (isOption) => {
    if (isOption) {
      this.setState(prevState => {
        return {addOptionPopoverIsOpen: !prevState.addOptionPopoverIsOpen}
      });
    } else {
      this.setState(prevState => {
        return {addRequirementPopoverIsOpen: !prevState.addRequirementPopoverIsOpen}
      });
    }
  }

  inputChangedHandlerForOption = (event) => {
    this.setState({
      isEditingOption: true,
      isEditingRequirement: false,
      newOptionInput: event.target.value
    });
  }

  submitHandlerForOption = (event) => {
    this.setState({
      addOptionPopoverIsOpen: false
    });
    event.preventDefault();
    const { newOptionInput } = this.state;
    if (newOptionInput !== '') {
      FirebaseStore.addAnOptionForCurrentTask(this.state.newOptionInput);
    }
    this.setState({
      newOptionInput: ''
    });
  }

  inputChangedHandlerForRequirement = (event) => {
    this.setState({
      isEditingOption: false,
      isEditingRequirement: true,
      newRequirementInput: event.target.value
    });
  }

  submitHandlerForRequirement = (event) => {
    this.setState({
      addRequirementPopoverIsOpen: false
    });
    event.preventDefault();
    const { newRequirementInput } = this.state;
    if (newRequirementInput !== '') {
      FirebaseStore.addARequirementForCurrentTask(this.state.newRequirementInput);
    }
    this.setState({
      newRequirementInput: ''
    });
  }

  UNSAFE_componentWillReceiveProps (nextProps) {

    this.setState({selectedSnippets: nextProps.selectedSnippets})
    // console.log('tableview selected snippet number', this.state.selectedSnippets);
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

    document.body.addEventListener('keyup', (event) => {
      if (event.keyCode === 13) {
        // Enter key pressed
        if (this.state.isEditingOption) {
          this.submitHandlerForOption(event);
        }
        if (this.state.isEditingRequirement) {
          this.submitHandlerForRequirement(event);
        }
      }
      if (event.key === 'Escape') {
        if (this.state.addOptionPopoverIsOpen) {
          this.setState({
            addOptionPopoverIsOpen: false,
            newOptionInput: ''
          })
        }
        if (this.state.addRequirementPopoverIsOpen) {
          this.setState({
            addRequirementPopoverIsOpen: false,
            newRequirementInput: ''
          })
        }
      }
    });

    let port = chrome.runtime.connect({name: 'FROM_TABLEVIEW'});
    this.setState({portToBackground: port});
  }

  componentWillUnmount() {
    this.unlisten();
    document.body.removeEventListener('keydown', this.keyDownHandler);

    // // clean up options and requirements
    // if (this.state.toDeleteOptionId !== null) {
    //   FirebaseStore.deleteOptionWithId(this.state.toDeleteOptionId);
    // }

    // if (this.state.toDeleteRequirementId !== null) {
    //   FirebaseStore.deleteRequirementWithId(this.state.toDeleteRequirementId);
    // }
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
    this.setState({
      pieces: task.pieces
    })
  }

  switchTableIsOpenStatus = (event) => {
    this.setState(prevState => {
      return {tableviewisOpen: !prevState.tableviewisOpen};
    });
  }
  // syncing scrolling for the two tables https://jsfiddle.net/1tv8bkyc/8/
  scrollTable = (event) => {
    $('#top').on('scroll', function () {
          $('#middle').scrollTop($(this).scrollTop());
          $('#bottom').scrollTop($(this).scrollTop());
          $('#bottom').scrollLeft($(this).scrollLeft());
        });
  }

  attitudeChangeHandler = (event) => {
    console.log('TODO: update the attitudes of all selected snippets and unselect all snippets')
  }

  switchTableMode = (event, mode) => {
    this.setState({readModeisOn: mode});
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
    this.setState(prevState => {
      return {shouldShowNotes: !prevState.shouldShowNotes};
    });

    // this.setState({shouldShowNotes:!shouldShowNotes});
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

  tableviewSnippetSeleciton() {
    // console.log('not to be selected snippets');
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

  log(event) {
    console.log('click made');
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
        <td className={[styles.AddButtons, (newRequirementsList.length === 0 || newOptionsList.length === 0) ? styles.WhenNothingInTable : null].join(' ')}>

          <div className={styles.AddRequirementButtonContainer}>
            <Popover
              isOpen={this.state.addRequirementPopoverIsOpen}
              position={'bottom'} // preferred position
              onClickOutside={() => this.switchPopoverOpenStatus(false)}
              containerClassName={styles.AddPopoverContainer}
              content={(
                <div className={styles.AddPopoverContentContainer}>
                  <Input
                    autoFocus={true}
                    elementType={'input'}
                    elementConfig={{placeholder: 'Add a criterion / feature'}}
                    submitted={this.submitHandlerForRequirement}
                    value={this.state.newRequirementInput}
                    changed={this.inputChangedHandlerForRequirement} />
                  <span>
                    {this.state.newRequirementInput !== ''
                      ? <span className={styles.PromptToHitEnter}>Press Enter &#x23ce; when done</span>
                      : ' '}
                  </span>
                </div>
              )}
            >
              <a data-tip data-for='addRequirement' onClick={() => this.switchPopoverOpenStatus(false)}>
                <FontAwesomeIcon icon={fasPlusCircle} className={[styles.AddButton, styles.AddRequirementButton].join(' ')}/>
              </a>
              <ReactTooltip
                id='addRequirement'
                type='dark'
                effect='solid'
                place={'bottom'}
                globalEventOff='click'
                className={styles.AddTooltipContainer}>
                Add a new criterion / feature
              </ReactTooltip>
            </Popover>
          </div>

          <div className={styles.AddOptionButtonContainer}>
            <Popover
              isOpen={this.state.addOptionPopoverIsOpen}
              position={'bottom'} // preferred position
              onClickOutside={() => this.switchPopoverOpenStatus(true)}
              containerClassName={styles.AddPopoverContainer}
              content={(
                <div className={styles.AddPopoverContentContainer}>
                  <Input
                    autoFocus={true}
                    elementType={'input'}
                    elementConfig={{placeholder: 'Add an option'}}
                    submitted={this.submitHandlerForOption}
                    value={this.state.newOptionInput}
                    changed={this.inputChangedHandlerForOption} />
                  <span>
                    {this.state.newOptionInput !== ''
                      ? <span className={styles.PromptToHitEnter}>Press Enter &#x23ce; when done</span>
                      : ' '}
                  </span>
                </div>
              )}
            >
              <a data-tip data-for='addOption' onClick={() => this.switchPopoverOpenStatus(true)}>
                <FontAwesomeIcon icon={fasPlusCircle} className={[styles.AddButton, styles.AddOptionButton].join(' ')}/>
              </a>
              <ReactTooltip
                id='addOption'
                type='dark'
                effect='solid'
                place={'bottom'}
                globalEventOff='click'
                className={styles.AddTooltipContainer}>
                Add a new option
              </ReactTooltip>
            </Popover>
          </div>
        </td>

        {
          newRequirementsList.filter(rq => rq.visibility !== false).map((rq, idx) => {
            let isVisible = true;
            return (
              <TableHeader
                key={rq.id}
                rq={rq}
                index={idx}
                moveHeader={this.moveHeader}
                inactiveOpacity={inactiveOpacity}
                switchStarStatusOfRequirement={this.switchStarStatusOfRequirement}
                switchHideStatusOfARequirement={this.switchHideStatusOfARequirement}
                deleteRequirementWithId={this.deleteRequirementHandler}
                updateRequirementName={FirebaseStore.updateRequirementName}
                isVisible={isVisible}
                />
            );
          })
        }
      </tr>
    );
    let viewTableHeader = (
      <tr>
        <td className={styles.addButtons}>
      </td>

        {
          newRequirementsList.map((rq, idx) => {
            let isVisible = true;
            return (
              <TableHeader
                key={rq.id}
                rq={rq}
                index={idx}
                moveHeader={this.moveHeader}
                inactiveOpacity={inactiveOpacity}
                switchStarStatusOfRequirement={this.switchStarStatusOfRequirement}
                switchHideStatusOfARequirement={this.switchHideStatusOfARequirement}
                deleteRequirementWithId={this.deleteRequirementHandler}
                updateRequirementName={FirebaseStore.updateRequirementName}
                isVisible={isVisible}
                />
            );
          })
        }
      </tr>
    );
    let newTableBody = newOptionsList.filter(op => op.visibility !== false).map((op, idx) => {
      let optionVisibility = true;
      let snippetsSelected = this.state.selectedSnippets;
      return (
        <tr key={op.id}>
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
            deleteOptionWithId={this.deleteOptionHandler}
            updateOptionName={FirebaseStore.updateOptionName}
            addANoteToOption={FirebaseStore.addANoteToAnOption}
            deleteANoteFromOption={FirebaseStore.deleteANoteFromAnOption}
            shouldShowNotes={this.state.shouldShowNotes}
            makeInteractionbox={this.makeInteractionbox}
            invisible={optionVisibility}
            />
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

                if (snippetsSelected > 0) {
                return (
                  <td key={rq.id} style={{alignItems:'center'}}>

                  <div className={[styles.RequirementAttitudeContainer].join(' ')}>

                  <div
                  className={[styles.RequirementAttitudeThumbContainer].join(' ')}
                  onClick={(event) => this.attitudeChangeHandler(event, op.id, rq.id, 'good')}>
                  <ThumbV1 type={'up'}/>
                  </div>

                  <div
                  className={[styles.RequirementAttitudeThumbContainer].join(' ')}
                  onClick={(event) => this.attitudeChangeHandler(event, op.id, rq.id, 'idk')}>
                  <QuestionMark />
                  </div>

                  <div
                  className={[styles.RequirementAttitudeThumbContainer].join(' ')}
                  onClick={(event) => this.attitudeChangeHandler(event, op.id, rq.id, 'bad')}>
                  <ThumbV1 type={'down'}/>
                  </div>

                  </div>
                  </td>
                )}
                else {
                  return(
                  <td key={rq.id} style={{
                    opacity: rq.hide === true || op.hide === true ? `${inactiveOpacity}` : '1',
                  }}>
                    <div className={styles.AttitudeThumbInTableCellContainer}>
                      {
                        piecesInThisCell.length > 0 ?
                        piecesInThisCell.map((p, idx) => {
                        let thumb = null;
                        switch (p.attitude) {
                          case 'good':  thumb = (<ThumbV1 type='up' />); break;
                          case 'bad':   thumb = (<ThumbV1 type='down' />); break;
                          case 'idk':   thumb = (<QuestionMark />); break;
                          default: break;
                        }
                        // TODO add onclick to bring up interactionbox for each attitude in table cell
                        return (
                          <Aux key={`${p.id}${op.id}${rq.id}`}>
                            <div
                              className={[styles.AttitudeInTableCell].join(' ')}
                              data-tip
                              data-for={`${p.id}${op.id}${rq.id}`}
                              >
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
                                    incrementSelectedSnippetNumber={this.tableviewSnippetSeleciton}
                                    decrementSelectedSnippetNumber={this.tableviewSnippetSeleciton}
                                    selectable={false}
                                    makeInteractionBox={(event, id) => this.makeInteractionbox(event, id)
                                    }/>
                                );
                              }}>

                            </ReactTooltip>
                          </Aux>
                        );

                      }): null}
                    </div>
                  </td>
                  )
                };
              })
            }
        </tr>
      );
    });

    let TableBodyOverlay = newOptionsList.map((op,idx) => {
    let optionVisibility = true;
    return (
        <tr
        key={op.id}
        style={{position:'relative',backgroundColor:'rgba(255,255,255,1)'}}
        >
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
          makeInteractionbox={this.makeInteractionbox}
          invisible={optionVisibility}
          />
        </tr>
      )});
    let emptyHeader = (
      <tr>
          <th>
            <div className={styles.ConfigurationLine}>
            </div>
            </th>

        {   newRequirementsList.map((rq, idx) => {
            let isVisible = false;
            return (
              <TableHeader
                key={rq.id}
                rq={rq}
                index={idx}
                moveHeader={this.moveHeader}
                inactiveOpacity={inactiveOpacity}
                switchStarStatusOfRequirement={this.switchStarStatusOfRequirement}
                switchHideStatusOfARequirement={this.switchHideStatusOfARequirement}
                deleteRequirementWithId={this.deleteRequirementHandler}
                updateRequirementName={FirebaseStore.updateRequirementName}
                isVisible={isVisible}
                />
            );
          })
        }
      </tr>
    );
    let invisibleIconOverlay = newOptionsList.map((op, idx) => {
      let optionVisibility = false;
      return (
        <tr key={op.id}>
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
            makeInteractionbox={this.makeInteractionbox}
            invisible={optionVisibility}
            />
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
                  <td key={rq.id} style={{
                    opacity: rq.hide === true || op.hide === true ? `${inactiveOpacity}` : '1',
                  }}>
                    <div className={styles.AttitudeThumbInTableCellContainer}>
                      { piecesInThisCell.length > 0 ?
                        piecesInThisCell.map((p, idx) => {
                        let thumb = null;
                        switch (p.attitude) {
                          case 'good':  thumb = (<ThumbV1 type='up' onClick={(event) => this.log(event)}/>); break;
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
                                    incrementSelectedSnippetNumber={this.tableviewSnippetSeleciton}
                                    decrementSelectedSnippetNumber={this.tableviewSnippetSeleciton}
                                    selectable={false}
                                    makeInteractionBox={(event, id) => this.makeInteractionbox(event, id)
                                    }/>
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
    let invisibleOptionsOverlay = newOptionsList.map((op, idx) => {
      let optionVisibility = false;
      return (
        <tr key={op.id}>
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
            makeInteractionbox={this.makeInteractionbox}
            invisible={optionVisibility}
            />
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
                  <td key={rq.id} style={{
                    opacity: rq.hide === true || op.hide === true ? `${inactiveOpacity}` : '1',
                  }}>
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
                                    incrementSelectedSnippetNumber={this.tableviewSnippetSeleciton}
                                    decrementSelectedSnippetNumber={this.tableviewSnippetSeleciton}
                                    selectable={false}
                                    makeInteractionBox={(event, id) => this.makeInteractionbox(event, id)
                                    }/>
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
      // console.log('tableview interaction box');
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

    let writeContent = (
      <div style={{}}>
      <table className={styles.ComparisonTable}>
        <thead>
          {newTableHeader}
        </thead>
        <tbody>
          {newTableBody}
        </tbody>
      </table>
      </div>
    );
    let readContent = (
      <div style={{position: 'relative'}}>
        <div id='bottom' style={{opacity:'1', zIndex: '15',borderSpacing: '0px',
                              maxWidth: '90vw', maxHeight: '50vw',
                              overflowY:'auto', overflowX:'auto'}}>
          <table className={styles.ComparisonTable}>
            <thead style={{ opacity: '1'}}>{viewTableHeader}</thead>
            <tbody style={{ opacity: '1'}}>{invisibleOptionsOverlay}</tbody>
          </table>
        </div>

        <div id='middle' style={{zIndex: '30', position: 'absolute', top: '0',
                      maxWidth: '90vw', maxHeight: '50vw',
                      overflowY:'scroll', overflowX:'scroll'}}>
        <table className={[styles.Overlay, styles.ComparisonTable].join(' ')}>
          <thead style={{opacity:'0'}}>{viewTableHeader}</thead>
          <tbody style={{opacity:'1'}}>{TableBodyOverlay}</tbody>
        </table>
        </div>

        <div id='top' style={{opacity: '1', zIndex: '45', position: 'absolute', top: '0', left: '0',
                      maxWidth: '90vw', maxHeight: '50vw',
                      overflowY:'scroll', overflowX:'scroll'}}
                      onScroll={(event) => this.scrollTable(event)}>
        <table className={[styles.Overlay].join(' ')}>
        <thead style={{ opacity: '0'}}>{emptyHeader}</thead>
        <tbody style={{ opacity: '0'}}>{invisibleIconOverlay}</tbody>
        </table>
        </div>

        <div style={{opacity: '1', zIndex: '44', position: 'absolute', top: '0', left: '0',
                      maxWidth: '90vw', maxHeight: '50vw',
                      overflowY:'hidden', overflowX:'hidden'}}>
        <table className={[styles.Overlay].join(' ')}>
        <thead style={{ opacity: '1'}}>{emptyHeader}</thead>
        <tbody style={{ visibility: 'hidden'}}>{invisibleOptionsOverlay}</tbody>
        </table>
        </div>
      </div>
  );

    return (
      <Aux>
        <div className={styles.Section}>
          <div className={styles.TableView}>
            <div className={styles.Header}>
              <div className={styles.HeaderNameContainer}>
                <div className={styles.HeaderName}
                onClick={(event) => this.switchTableIsOpenStatus(event)}>
                  <span>Comparison Table</span>
                </div>
                <div className={styles.HeaderCollapseButton}
                  onClick={(event) => this.switchTableIsOpenStatus(event)}
                  title={this.state.tableviewisOpen ? 'Collapse the table' : 'Show the table'}>
                  {
                    this.state.tableviewisOpen
                    ? <FontAwesomeIcon icon={fasAngleDown} />
                    : <FontAwesomeIcon icon={fasAngleRight} />
                  }
                </div>
                { /* The show notes handler was not really working so it is temp. commented out
                <div onClick={(event) => this.showNotesChangedHandler(event)}>
                  {
                    this.state.shouldShowNotes
                    ? <span>Hide Notes</span>
                    : <span>Show Notes</span>
                  }
                </div>
                */}
              </div>

              {
                this.state.tableviewisOpen
                ? <div className={styles.ModeToggleButtonsContainer}>
                    <div className={[styles.ModeToggleButton, this.state.readModeisOn === true ? styles.ModeToggleButtonActive : null].join(' ')}
                      onClick={(event) => this.switchTableMode(event, true)}>
                      View
                    </div>

                    <div>|</div>

                    <div className={[styles.ModeToggleButton, this.state.readModeisOn === false ? styles.ModeToggleButtonActive : null].join(' ')}
                    onClick={(event) => this.switchTableMode(event, false)}>
                      Edit
                    </div>
                  </div>
                : null
              }

            </div>
            <Collapse isOpened={this.state.tableviewisOpen} springConfig={{stiffness: 700, damping: 50}}>
              <div className={styles.Content}>
              {
                this.state.readModeisOn? readContent: writeContent
              }
              </div>
            </Collapse>
            {modal}
          </div>


        </div>

        <Snackbar
          id="deleteOptionSnackbar"
          show={this.state.deleteOptionSnackbarShouldShow}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div className={styles.SnackbarLeft}>
              Option <u>{this.state.toDeleteOptionName}</u> deleted
            </div>
            <div className={styles.SnackbarRight}>
              <button
                className={styles.UndoButton}
                onClick={() => this.undoDeleteOptionHandler()}>UNDO</button>
            </div>
          </div>
        </Snackbar>

        <Snackbar
          id="deleteRequirementSnackbar"
          show={this.state.deleteRequirementSnackbarShouldShow}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div className={styles.SnackbarLeft}>
              Criterion <u>{this.state.toDeleteRequirementName}</u> deleted
            </div>
            <div className={styles.SnackbarRight}>
              <button
                className={styles.UndoButton}
                onClick={() => this.undoDeleteRequirementHandler()}>UNDO</button>
            </div>
          </div>
        </Snackbar>

      </Aux>
    );
  }
}

export default withRouter(TableView);
