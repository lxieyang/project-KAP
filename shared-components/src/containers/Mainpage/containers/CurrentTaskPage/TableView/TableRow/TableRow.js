import React, { Component } from 'react';
import { debounce, sortBy, reverse } from 'lodash';
import { UnmountClosed } from 'react-collapse';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import fasStar from '@fortawesome/fontawesome-free-solid/faStar';
import fasCheckCircle from '@fortawesome/fontawesome-free-solid/faCheckCircle';
import fasToggleOn from '@fortawesome/fontawesome-free-solid/faToggleOn';
import fasToggleOff from '@fortawesome/fontawesome-free-solid/faToggleOff';
import fasTrash from '@fortawesome/fontawesome-free-solid/faTrash';
import faEdit from '@fortawesome/fontawesome-free-solid/faEdit';
import ordinal from 'ordinal';
import PropTypes from 'prop-types';
import { findDOMNode } from 'react-dom';
import { DragSource, DropTarget } from 'react-dnd';
import Input from '../../../../../../components/UI/Input/Input';
import styles from './TableRow.css';


const rowSource = {
  beginDrag(props) {
    return {
      id: props.op.id,
      index: props.index
    };
  },
}

const rowTarget = {
  hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }

    // Time to actually perform the action
    props.moveRow(dragIndex, hoverIndex);

    monitor.getItem().index = hoverIndex;
  },
}

@DropTarget('TABLE_ROW', rowTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
}))
@DragSource('TABLE_ROW', rowSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
}))
class TableRow extends Component {
  static propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    connectDropTarget: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
    isDragging: PropTypes.bool.isRequired,
    moveRow: PropTypes.func.isRequired,
  }

  state = {
    pieces: this.props.pieces,
    options: this.props.options,
    requirements: this.props.requirements,
    noteIsOpen: this.props.shouldShowNotes !== undefined ? this.props.shouldShowNotes : false,
    newNote: ''
  }

  componentDidMount () {
    this.optionCallback = debounce((event, id) => {
      this.props.updateOptionName(id, event.target.innerText.trim());
      event.target.innerText = event.target.innerText.trim();
      event.target.blur();
    }, 1000);

    // event listener
    document.body.addEventListener('keyup', (event) => {
      if (event.keyCode === 13) {
        // Enter key pressed
        if (this.state.newNote.trim() !== '') {
          this.props.addANoteToOption(this.props.op.id, this.state.newNote.trim());
          this.setState({newNote: ''});
        }
      }
    });
  }

  optionNameChangedHandler = (event, id) => {
    event.persist();
    this.optionCallback(event, id);
  }

  switchNoteShowStatus = () => {
    this.setState(prevState => {
      return {noteIsOpen: !prevState.noteIsOpen};
    });
  }

  deleteNoteHandler = (event, note) => {
    this.props.deleteANoteFromOption(this.props.op.id, note);
  }

  inputChangedHandler = (event) => {
    this.setState({newNote: event.target.value});
  }

  render () {
    const { op, index, inactiveOpacity, isDragging, connectDragSource, connectDropTarget } = this.props;
    const opacity = isDragging ? 0 : 1;
    return connectDragSource(connectDropTarget(
        <td style={{ opacity, position: 'sticky'}}>
          <div
            className={styles.ShowHideOption}
            onClick={(event) => this.props.switchHideStatusOfAnOption(index, op.id, op.hide)}>
            {
              op.hide !== true
              ? <FontAwesomeIcon icon={fasToggleOff} className={styles.ShowHidePieceIcon}/>
              : <FontAwesomeIcon icon={fasToggleOn} className={styles.ShowHidePieceIcon}/>
            }
          </div>
          <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '5px',
              borderRadius: '3px',
              opacity: op.hide === true ? `${inactiveOpacity}` : '1',
              backgroundColor: op.used === true ? 'rgba(82, 184, 101, 0.3)' : 'transparent' }}>
            <div style={{height: '100%'}}>
              <div
                className={[styles.OptionStar, (
                  op.starred === true ? styles.ActiveStar : null
                )].join(' ')}
                onClick={(event) => this.props.switchStarStatusOfOption(op.id)}>
                <FontAwesomeIcon icon={fasStar} />
              </div>
              <span className={styles.Ordinal}>{ordinal(index + 1)}</span>
              <div
                className={[styles.OptionUseStatus, (
                  op.used === true ? styles.UsedOption : null
                )].join(' ')}
                onClick={(event) => this.props.switchUsedStatusOfOption(op.id, op.used)}>
                <FontAwesomeIcon icon={fasCheckCircle} />
              </div>
            </div>
            <div className={[styles.OptionNameContainer, !op.active ? styles.InactiveOption : null].join(' ')}>
              <span
                contentEditable={true}
                suppressContentEditableWarning={true}
                onSubmit={(event) => this.optionNameChangedHandler(event, op.id)}
                className={styles.OptionText}>
                {op.name}
              </span>
              <span
                className={[styles.ShowHideNotes, this.state.noteIsOpen ? styles.OpenNotes : styles.CloseNotes].join(' ')}
                onClick={(event) => this.switchNoteShowStatus()}>
                <FontAwesomeIcon icon={faEdit} className={styles.NotesIcon}/>
              </span>
              <UnmountClosed
                className={styles.CollapsedNotes}
                isOpened={this.state.noteIsOpen}
                springConfig={{stiffness: 1000, damping: 40}}>
                <div className={styles.NotesBox}>
                  <div className={styles.NotesContainer}>
                    <strong>Notes:</strong>
                    <ul>
                      {
                        op.notes !== undefined && op.notes !== null
                        ? op.notes.map((note, idx) => {
                          return (
                            <li key={idx}>
                              <div className={styles.NotesContent}>
                                {note}
                              </div>
                              <FontAwesomeIcon
                                icon={fasTrash}
                                className={styles.TrashNoteIcon}
                                onClick={(event) => this.deleteNoteHandler(event, note)}/>
                            </li>
                          )
                        })
                        : null
                      }
                    </ul>
                  </div>
                  <div className={styles.InputContainer}>
                    <Input
                      className={styles.Input}
                      elementType='textarea'
                      elementConfig={{placeholder: 'Add a note'}}
                      value={this.state.newNote}
                      changed={this.inputChangedHandler}/>
                  </div>
                </div>
              </UnmountClosed>
            </div>
          </div>
        </td>
    ));
  }
}

export default TableRow;
