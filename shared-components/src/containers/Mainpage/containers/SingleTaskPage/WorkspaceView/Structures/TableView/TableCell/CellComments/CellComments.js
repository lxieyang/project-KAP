import React, { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

import Textarea from 'react-textarea-autosize';

import * as FirestoreManager from '../../../../../../../../../firebase/firestore_wrapper';
import CellCommentItem from './CellCommentItem/CellCommentItem';
import classesInCSS from './CellComments.css';

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

class CellComments extends Component {
  state = {
    comments: [],

    editCommentValue: ''
  };

  componentDidMount() {
    this.keyPress = this.keyPress.bind(this);
    this.unsubscribeComments = FirestoreManager.getAllCommentsToTableCell(
      this.props.workspaceId,
      this.props.cellId
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
      FirestoreManager.addCommentToATableCellById(
        this.props.workspaceId,
        this.props.cellId,
        comment
      );
      this.setState({ editCommentValue: '' });
      this.textarea.blur();
    }
  };

  cancelEditClickedHandler = () => {
    this.setState({ editCommentValue: '' });
  };

  render() {
    const { commentAccess, classes, workspaceId, cellId } = this.props;
    const { comments } = this.state;

    let CommentList = (
      <div className={classesInCSS.CommentListContainer}>
        {comments.map((item, idx) => {
          // return <div key={idx}>{item.content}</div>;
          return (
            <CellCommentItem
              key={idx}
              item={item}
              idx={idx}
              workspaceId={workspaceId}
              cellId={cellId}
              expanded={true}
            />
          );
        })}
      </div>
    );

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

    return expandedView;
  }
}

export default withStyles(styles)(CellComments);
