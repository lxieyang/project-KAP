import React, { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

import Textarea from 'react-textarea-autosize';

import * as FirestoreManager from '../../../../../../../../firebase/firestore_wrapper';
import CommentItem from './CommentItem/CommentItem';
import classesInCSS from './Comments.css';

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

class Comments extends Component {
  state = {
    comments: [],

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
  };

  render() {
    const {
      expanded,
      commentAccess,
      classes,
      isHovering,
      pieceId,
      expandPiece
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
              pieceId={pieceId}
              expanded={expanded}
              expandPiece={expandPiece}
              isHovering={isHovering}
              cellId={this.props.cellId}
              cellType={this.props.cellType}
            />
          );
        })}
      </div>
    );

    let compactView =
      this.props.cellType === undefined ? (
        <React.Fragment>
          <div
            className={classesInCSS.CommentBox}
            style={{
              opacity: isHovering ? '1' : '0.5'
            }}
          >
            {CommentList}
          </div>
        </React.Fragment>
      ) : null;

    let expandedView = (
      <React.Fragment>
        <div>
          <div className={classesInCSS.CommentBox}>{CommentList}</div>
          {commentAccess ? (
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
          ) : null}
        </div>
      </React.Fragment>
    );

    return expanded ? expandedView : compactView;
  }
}

export default withStyles(styles)(Comments);
