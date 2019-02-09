import React, { Component } from 'react';
import CommentItem from './CommentItem/CommentItem';

import * as FirestoreManager from '../../../../../../../../shared-components/src/firebase/firestore_wrapper';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

import Textarea from 'react-textarea-autosize';

import classesInCSS from './Comment.css';

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
//     content: `This is a good deal, grab it before it\'s gone.`
//   },
//   {
//     authorId: 'author-02',
//     authorName: 'George Bush',
//     updateDate: new Date(),
//     authorAvatarURL:
//       'https://www.abc.net.au/radionational/image/7174982-1x1-700x700.jpg',
//     content: `This is a NOT good deal, DO NOT grab it.`
//   }
// ];

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

  // also allow Enter to submit
  keyPress(e) {
    // if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    if (e.key === 'Enter' && !e.shiftKey) {
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

  handleAction = (action, commentId, content, event) => {
    if (action === 'delete') {
      console.log(`delete ${commentId}`);
      // FirestoreManager.deleteCommentById(this.props.pieceId, commentId);
    } else if (action === 'edit') {
      this.props.expandPiece();
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
    const { expanded, classes, isHovering, pieceId, expandPiece } = this.props;
    const { anchorEl, comments } = this.state;
    const open = Boolean(anchorEl);

    let CommentList = (
      <div className={classesInCSS.CommentListContainer}>
        {comments.map((item, idx) => {
          return (
            <CommentItem
              key={idx}
              item={item}
              idx={idx}
              pieceId={pieceId}
              expanded={expanded}
              expandPiece={expandPiece}
              isHovering={isHovering}
            />
          );
        })}
      </div>
    );

    let compactView = (
      <React.Fragment>
        <div
          className={classesInCSS.CommentBox}
          style={{ opacity: isHovering ? '1' : '0.5' }}
        >
          {CommentList}
        </div>
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
