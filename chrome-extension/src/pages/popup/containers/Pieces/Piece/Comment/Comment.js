import React, { Component } from 'react';

import * as FirestoreManager from '../../../../../../../../shared-components/src/firebase/firestore_wrapper';
import { getFirstName } from '../../../../../../../../shared-components/src/shared/utilities';

import { withStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import LinesEllipsis from 'react-lines-ellipsis';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { PencilCircleOutline, DeleteCircleOutline } from 'mdi-material-ui';

import Textarea from 'react-textarea-autosize';

import classesInCSS from './Comment.css';
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

// const fakeComments = [
//   {
//     authorId: 'author-01',
//     authorName: 'Barack Obama',
//     updateDate: new Date(),
//     authorAvatarURL:
//       'https://radioviceonline.com/wp-content/uploads/2012/05/square-obama-halo.png',
//     content: `This is a good deal, grab it before it\'s gone. This is a good deal, grab it before it\'s gone.`
//   },
//   {
//     authorId: 'author-02',
//     authorName: 'George Bush',
//     updateDate: new Date(),
//     authorAvatarURL:
//       'https://www.abc.net.au/radionational/image/7174982-1x1-700x700.jpg',
//     content: `This is a NOT good deal, DO NOT grab it. This is a NOT good deal, DO NOT grab it. This is a NOT good deal, DO NOT grab it. This is a NOT good deal, DO NOT grab it. This is a NOT good deal, DO NOT grab it. This is a NOT good deal, DO NOT grab it. This is a NOT good deal, DO NOT grab it. This is a NOT good deal, DO NOT grab it.`
//   }
// ];

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

class Comment extends Component {
  state = {
    comments: [],

    anchorEl: null,
    editCommentValue: ''
  };

  componentDidMount() {
    this.keyPress = this.keyPress.bind(this);
    this.unsubscribeComments = FirestoreManager.getAllCommentsToPiece(
      this.props.pieceId
    )
      .orderBy('creationDate', 'asc')
      .onSnapshot(querySnapshot => {
        let comments = [];
        querySnapshot.forEach(snapshot => {
          comments.push({
            id: snapshot.id,
            ...snapshot.data()
          });
        });
        this.setState({ comments });
      });
  }

  // also allow Cmd / Ctrl + Enter to submit
  keyPress(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      this.saveEditClickedHandler();
    }
  }

  componentWillUnmount() {
    this.unsubscribeComments();
  }

  handleInputChange = event => {
    this.setState({
      editCommentValue: event.target.value
    });
  };

  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  handleAction = (action, commentId, content) => {
    if (action === 'delete') {
      FirestoreManager.deleteCommentById(this.props.pieceId, commentId);
    } else if (action === 'edit') {
    }
    this.handleClose();
  };

  saveEditClickedHandler = () => {
    let comment = this.state.editCommentValue;
    if (comment !== '' && comment) {
      FirestoreManager.addCommentToAPieceById(this.props.pieceId, comment);
      this.setState({ editCommentValue: '' });
      this.textarea.blur();
    }
  };

  cancelEditClickedHandler = () => {
    this.setState({ editCommentValue: '' });
    this.props.finishComment();
  };

  render() {
    const { expanded, classes } = this.props;
    const { anchorEl, comments } = this.state;
    const open = Boolean(anchorEl);

    let CommentList = (
      <div className={classesInCSS.CommentListContainer}>
        {comments.map((item, idx) => {
          return (
            <React.Fragment key={idx}>
              <div
                className={[
                  classesInCSS.CommentItem,
                  expanded
                    ? classesInCSS.CommentItemExpanded
                    : classesInCSS.CommentItemCompact
                ].join(' ')}
              >
                <div>
                  <Avatar
                    aria-label="avatar"
                    style={{
                      width: expanded ? '24px' : '20px',
                      height: expanded ? '24px' : '20px'
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
                        text={item.content}
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
                          {item.creationDate
                            ? moment(item.creationDate.toDate()).fromNow()
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
                    paddingTop: '3px'
                  }}
                >
                  {item.authorId === FirestoreManager.getCurrentUserId() ? (
                    <React.Fragment>
                      <Menu
                        id="long-menu"
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
                            onClick={() =>
                              this.handleAction(
                                option.action,
                                item.id,
                                item.content
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
                        <MoreVertIcon
                          style={{ width: '16px', height: '16px' }}
                        />
                      </IconButton>
                    </React.Fragment>
                  ) : null}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );

    let compactView = (
      <React.Fragment>
        <div className={classesInCSS.CommentBox}>{CommentList}</div>
      </React.Fragment>
    );

    let expandedView = (
      <React.Fragment>
        <div>
          <div className={classesInCSS.CommentBox}>{CommentList}</div>
          <div className={classesInCSS.EditCommentBox}>
            <div className={classesInCSS.TextAreaContainer}>
              <Textarea
                autoFocus
                inputRef={tag => (this.textarea = tag)}
                minRows={1}
                maxRows={3}
                placeholder={'Add a comment'}
                value={this.state.editCommentValue}
                onKeyDown={this.keyPress}
                onChange={e => this.handleInputChange(e)}
                className={classesInCSS.Textarea}
              />
            </div>
            <div className={classesInCSS.TextareaActionBar}>
              <ActionButton
                color="primary"
                className={classes.button}
                onClick={() => this.saveEditClickedHandler()}
              >
                Save
              </ActionButton>

              <ActionButton
                color="secondary"
                className={classes.button}
                onClick={() => this.cancelEditClickedHandler()}
              >
                Cancel
              </ActionButton>
            </div>
          </div>
        </div>
      </React.Fragment>
    );

    return expanded ? expandedView : compactView;
  }
}

export default withStyles(styles)(Comment);
