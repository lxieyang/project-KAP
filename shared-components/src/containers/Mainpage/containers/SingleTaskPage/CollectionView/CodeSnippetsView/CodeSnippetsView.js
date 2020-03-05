import React, { Component } from 'react';
import { reverse, sortBy } from 'lodash';
import styles from './CodeSnippetsView.css';

import Divider from '@material-ui/core/Divider';
import Popover from 'react-tiny-popover';
import moment from 'moment';

import { GET_FAVICON_URL_PREFIX } from '../../../../../../shared/constants';

const getHTML = htmls => {
  let htmlString = ``;
  if (htmls !== undefined) {
    for (let html of htmls) {
      htmlString += html;
    }
  }
  return { __html: htmlString };
};

class CodeSnippetsView extends Component {
  state = {};

  render() {
    let { pieces } = this.props;

    pieces = pieces.filter(
      p => p.codeSnippets !== undefined && p.codeSnippets !== null
    );

    const allCodeSnippets = [];

    pieces.forEach(piece => {
      let url = piece.answerMetaInfo
        ? piece.answerMetaInfo.answerLink
        : piece.references.url;
      let tags = piece.answerMetaInfo
        ? piece.answerMetaInfo.questionTags
        : null;
      piece.codeSnippets.forEach(code => {
        allCodeSnippets.push({
          pieceId: piece.id,
          codeHTML: code.html,
          codeText: code.text,
          url,
          title: piece.references.pageTitle,
          tags
        });
      });
    });
    // console.log(allCodeSnippets);

    return (
      <div className={styles.CodeSnippetsViewContainer}>
        <div className={styles.ListContainer}>
          {allCodeSnippets.map((item, idx) => {
            return (
              <div key={idx} className={styles.CodeSnippetContainer}>
                <div className={styles.MetaInfoContainer}>
                  <div className={styles.SourceInfo}>
                    <img src={GET_FAVICON_URL_PREFIX + item.url} alt="" />{' '}
                    <a href={item.url} target="__blank">
                      {item.title}
                    </a>
                  </div>
                  {item.tags && item.tags.length > 0 && (
                    <div className={styles.TagsInfo}>
                      {item.tags.map((tag, tagIdx) => {
                        return <span key={tagIdx}>{tag}</span>;
                      })}
                    </div>
                  )}
                </div>
                <div dangerouslySetInnerHTML={getHTML(item.codeHTML)} />
              </div>
            );
          })}

          <div style={{ height: 200 }} />
        </div>
      </div>
    );
  }
}

export default CodeSnippetsView;
