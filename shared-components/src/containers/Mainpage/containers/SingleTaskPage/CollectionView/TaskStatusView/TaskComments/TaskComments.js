import React, { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';

import Textarea from 'react-textarea-autosize';

import * as FirestoreManager from '../../../../../../../firebase/firestore_wrapper';
import CommentItem from './TaskCommentItem/TaskCommentItem';
import classesInCSS from './TaskComments.css';

const styles = theme => ({
  button: {
    marginTop: 0,
    marginBottom: 0,
    marginRight: 8,
    padding: '1px 4px 1px 4px',
    fontSize: 12
  }
});

const ActionButton = withStyles({
  root: {
    minWidth: '0',
    padding: '0px 4px'
  },
  label: {
    textTransform: 'capitalize'
  }
})(Button);

class TaskComments extends Component {
  state = {
    comments: [],

    editCommentValue: '',

    isEditingCommentItem: false
  };

  componentDidMount() {
    this.keyPress = this.keyPress.bind(this);
    this.updateTaskComments(this.props.taskId);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.taskId !== this.props.taskId) {
      this.updateTaskComments(this.props.taskId);
    }
  }

  updateTaskComments = taskId => {
    if (this.unsubscribeComments) this.unsubscribeComments();
    this.setState({ comments: [] });
    this.unsubscribeComments = FirestoreManager.getAllCommentsToTask(taskId)
      .orderBy('creationDate', 'desc')
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
  };

  switchIsEditingCommentItemStatus = to => {
    this.setState({ isEditingCommentItem: to });
  };

  // also allow Enter to submit
  keyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      this.saveEditClickedHandler();
    }
  }

  componentWillUnmount() {
    if (this.unsubscribeComments) this.unsubscribeComments();
  }

  handleInputChange = event => {
    this.setState({
      editCommentValue: event.target.value
    });
  };

  saveEditClickedHandler = () => {
    let comment = this.state.editCommentValue;
    if (comment !== '' && comment) {
      FirestoreManager.addCommentToATaskById(this.props.taskId, comment);
      this.setState({ editCommentValue: '' });
      this.textarea.blur();
    }
  };

  render() {
    const {
      expanded,
      commentAccess,
      classes,
      isHovering,
      taskId,
      currentAuthor
    } = this.props;
    const { comments } = this.state;

    let CommentList = (
      <div className={classesInCSS.CommentListContainer}>
        {comments.map((item, idx) => {
          return (
            <CommentItem
              key={idx}
              item={item}
              idx={idx}
              taskId={taskId}
              expanded={true}
              isHovering={isHovering}
              switchIsEditingCommentItemStatus={
                this.switchIsEditingCommentItemStatus
              }
            />
          );
        })}
      </div>
    );

    let expandedView = (
      <div>
        {commentAccess && !this.state.isEditingCommentItem ? (
          <div className={classesInCSS.EditCommentBox}>
            <div className={classesInCSS.AuthorIdentifierContainer}>
              <Avatar
                title={currentAuthor.displayName}
                aria-label="avatar"
                style={{
                  width: '24px',
                  height: '24px'
                }}
                className={classesInCSS.Avatar}
              >
                <img
                  src={currentAuthor.photoURL}
                  onError={e => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${
                      currentAuthor.displayName
                    }?bold=true`;
                  }}
                  alt={currentAuthor.displayName}
                  style={{ width: '100%', height: '100%' }}
                />
              </Avatar>
            </div>
            <div className={classesInCSS.TextAreaContainer}>
              <Textarea
                inputRef={tag => (this.textarea = tag)}
                minRows={1}
                maxRows={6}
                placeholder={'Add a comment'}
                value={this.state.editCommentValue}
                onKeyDown={this.keyPress}
                onMouseEnter={e => {
                  e.target.focus();
                }}
                onChange={e => this.handleInputChange(e)}
                className={classesInCSS.Textarea}
              />
            </div>
            {this.state.editCommentValue !== null &&
              this.state.editCommentValue !== '' && (
                <div className={classesInCSS.TextareaActionBar}>
                  <ActionButton
                    color="primary"
                    className={classes.button}
                    onClick={() => this.saveEditClickedHandler()}
                  >
                    Save
                  </ActionButton>
                </div>
              )}
          </div>
        ) : null}

        <div className={classesInCSS.CommentBox}>{CommentList}</div>
      </div>
    );

    return expandedView;
  }
}

export default withStyles(styles)(TaskComments);
