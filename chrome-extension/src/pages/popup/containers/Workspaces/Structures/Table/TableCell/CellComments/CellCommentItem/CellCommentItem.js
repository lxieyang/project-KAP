import React, { Component } from 'react';

import * as FirestoreManager from '../../../../../../../../../../firebase/firestore_wrapper';
import { getFirstName } from '../../../../../../../../../../shared/utilities';

import { withStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import LinesEllipsis from 'react-lines-ellipsis';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import PencilCircleOutline from 'mdi-material-ui/PencilCircleOutline';
import DeleteCircleOutline from 'mdi-material-ui/DeleteCircleOutline';

import Textarea from 'react-textarea-autosize';

import classesInCSS from './CellCommentItem.css';
import moment from 'moment';

const styles = theme => ({
  button: {
    marginTop: 0,
    marginBottom: 0,
    marginRight: 8,
    padding: '1px 4px 1px 4px',
    fontSize: 12
  }
});

const options = [
  {
    icon: <PencilCircleOutline style={{ width: '20px', height: '20px' }} />,
    text: 'Edit',
    action: 'edit'
  },
  {
    icon: <DeleteCircleOutline style={{ width: '20px', height: '20px' }} />,
    text: 'Delete',
    action: 'delete'
  }
];

const ActionButton = withStyles({
  root: {
    minWidth: '0',
    padding: '0px 4px'
  },
  label: {
    textTransform: 'capitalize'
  }
})(Button);

class CellCommentItem extends Component {
  state = {
    anchorEl: null,

    // edit comment item
    editingCommentItem: false,
    commentItemContent: this.props.item.content
  };

  componentDidMount() {
    this.keyPress = this.keyPress.bind(this);
  }

  // also Enter to submit
  keyPress(e) {
    // if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    if (e.key === 'Enter' && !e.shiftKey) {
      this.saveCommentItemClickedHandler(this.props.item.id);
    }
  }

  // comment item
  editCommentItemClickedHandler = () => {
    this.setState({
      editingCommentItem: true
    });
    setTimeout(() => {
      this.textarea.focus();
      // this.textarea.setSelectionRange(0, 0);
      // this.textarea.scrollTo(0, 0);
    }, 100);
  };

  handleCommentItemInputChange = event => {
    this.setState({
      commentItemContent: event.target.value
    });
  };

  saveCommentItemClickedHandler = commentId => {
    this.setState({ editingCommentItem: false });
    FirestoreManager.updateTableCellCommentById(
      this.props.workspaceId,
      this.props.cellId,
      commentId,
      this.state.commentItemContent
    );
  };

  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  handleAction = (action, commentId, content, event) => {
    if (action === 'delete') {
      if (window.confirm(`Are you sure you want to delete "${content}"?`)) {
        FirestoreManager.deleteTableCellCommentById(
          this.props.workspaceId,
          this.props.cellId,
          commentId
        );
      }
    } else if (action === 'edit') {
      this.editCommentItemClickedHandler();
    }
    this.handleClose();
  };

  render() {
    const { expanded, classes, isHovering, item } = this.props;
    const { anchorEl } = this.state;
    const open = Boolean(anchorEl);

    return (
      <React.Fragment>
        <div
          className={[
            classesInCSS.CommentItem,
            expanded
              ? classesInCSS.CommentItemExpanded
              : classesInCSS.CommentItemCompact
          ].join(' ')}
        >
          {this.state.editingCommentItem ? (
            <div className={classesInCSS.CommentItemEditContainer}>
              <div className={classesInCSS.TextAreaContainer}>
                <Textarea
                  inputRef={tag => (this.textarea = tag)}
                  minRows={1}
                  maxRows={4}
                  placeholder={'Add a comment'}
                  value={this.state.commentItemContent}
                  onKeyDown={this.keyPress}
                  onBlur={() => this.saveCommentItemClickedHandler(item.id)}
                  onChange={e => this.handleCommentItemInputChange(e)}
                  className={classesInCSS.Textarea}
                />
              </div>
            </div>
          ) : (
            <React.Fragment>
              <div>
                <Avatar
                  title={item.authorName}
                  aria-label="avatar"
                  style={{
                    width: expanded ? '24px' : '16px',
                    height: expanded ? '24px' : '16px'
                  }}
                  className={classesInCSS.Avatar}
                >
                  <img
                    src={item.authorAvatarURL}
                    alt={item.authorId}
                    style={{ width: '100%', height: '100%' }}
                  />
                </Avatar>
              </div>
              <div
                style={{
                  flex: '1'
                }}
              >
                {!expanded ? (
                  <div className={classesInCSS.CommentContentCompact}>
                    <LinesEllipsis
                      text={item.content ? item.content : ''}
                      maxLine={1}
                      ellipsis="..."
                      trimRight
                      basedOn="words"
                    />
                  </div>
                ) : (
                  <div className={classesInCSS.CommentContentExpanded}>
                    <div className={classesInCSS.CommentInfoBar}>
                      <span className={classesInCSS.CommentAuthor}>
                        {getFirstName(item.authorName)}
                      </span>
                      <span className={classesInCSS.CommentMoment}>
                        {item.updateDate
                          ? 'Updated ' +
                            moment(item.updateDate.toDate()).fromNow()
                          : null}
                      </span>
                    </div>
                    <div className={classesInCSS.CommentContent}>
                      {item.content}
                    </div>
                  </div>
                )}
              </div>
              <div
                style={{
                  flexBasis: '28px',
                  marginLeft: 'auto',
                  order: '3',
                  paddingTop: '0px'
                }}
              >
                {item.authorId === FirestoreManager.getCurrentUserId() ? (
                  <React.Fragment>
                    <Menu
                      id={`${item.id}-long-menu`}
                      anchorEl={anchorEl}
                      open={open}
                      onClose={this.handleClose}
                      style={{ padding: '2px' }}
                      PaperProps={{
                        style: {
                          maxHeight: 24 * 4.5,
                          width: 70
                        }
                      }}
                    >
                      {options.map(option => (
                        <MenuItem
                          key={option.text}
                          selected={false}
                          onClick={e =>
                            this.handleAction(
                              option.action,
                              item.id,
                              item.content,
                              e
                            )
                          }
                          style={{
                            padding: '4px 4px',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            opacity: '0.8'
                          }}
                        >
                          {option.icon} &nbsp; {option.text}
                        </MenuItem>
                      ))}
                    </Menu>
                    <IconButton
                      aria-label="More"
                      aria-owns={open ? 'long-menu' : undefined}
                      aria-haspopup="true"
                      style={{ padding: '6px' }}
                      onClick={this.handleClick}
                    >
                      <MoreVertIcon style={{ width: '16px', height: '16px' }} />
                    </IconButton>
                  </React.Fragment>
                ) : null}
              </div>
            </React.Fragment>
          )}
        </div>
      </React.Fragment>
    );
  }
}

export default withStyles(styles)(CellCommentItem);
