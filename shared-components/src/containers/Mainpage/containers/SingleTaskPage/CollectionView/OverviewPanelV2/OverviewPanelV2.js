import React, { Component } from 'react';
import { sortBy, reverse } from 'lodash';

import { withStyles } from '@material-ui/core/styles';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import { GiTargeting, GiBinoculars } from 'react-icons/gi';
import { IoMdGlobe } from 'react-icons/io';
import { AiOutlineSearch } from 'react-icons/ai';
import { GiThreeKeys } from 'react-icons/gi';
import { TiUser } from 'react-icons/ti';
import { FaBookmark } from 'react-icons/fa';

import Textarea from 'react-textarea-autosize';

import AuthorCardImg from './authorcard.png';

import { GET_FAVICON_URL_PREFIX } from '../../../../../../shared/constants';

import styles from './OverviewPanelV2.css';

const materialStyles = theme => ({
  summaryExpanded: {
    minHeight: '30px !important'
  },
  summaryRoot: {
    minHeight: 30,
    padding: '0px 10px',
    '&$expanded': {
      minHeight: 36
    }
  },
  summaryContent: {
    margin: '0px'
  },
  detailsRoot: {
    padding: '10px',
    display: 'block',
    fontSize: 12,
    fontWeight: 400
  },
  heading: {
    fontSize: 13,
    fontWeight: 600,
    flexBasis: '25%',
    flexShrink: 0,
    marginRight: '4px',
    display: 'flex',
    alignItems: 'center'
  },
  secondaryHeading: {
    fontSize: 12,
    fontWeight: 400
  }
});

class OverviewPanelV2 extends Component {
  render() {
    const { classes } = this.props;
    let { queries, pieces, pages } = this.props;
    queries = sortBy(queries, ['creationDate']);
    // console.log(queries);

    const queriesToDisplay = queries
      ? queries.filter((q, idx) => {
          if (idx > 2) {
            return false;
          }
          return true;
        })
      : [];

    pages = pages.map(page => {
      const piecesInPage = pieces.filter(
        item => item.references.url === page.url
      );
      // .map(item => item.id);
      page.piecesInPage = piecesInPage;
      page.piecesNumber = piecesInPage.length;
      return page;
    });

    // pages = pages.filter(page => page.piecesNumber > 0);
    // console.log(pages);

    let domains = [];
    pages.forEach(p => {
      if (domains.filter(d => d.domain === p.domain).length === 0) {
        domains.push({
          domain: p.domain,
          pages: [p],
          numberOfPages: 1,
          numberOfPieces: p.piecesNumber,
          favicon: p.faviconUrl ? p.faviconUrl : null
        });
      } else {
        domains = domains.map(d => {
          if (d.domain === p.domain) {
            d.pages.push(p);
            d.numberOfPages = d.pages.length;
            d.numberOfPieces += p.piecesNumber;
            if (d.favicon === null && p.faviconUrl) {
              d.favicon = p.faviconUrl;
            }
          }
          return d;
        });
      }
    });

    domains = domains.map(d => {
      let updateDate = d.pages[0].updateDate;
      d.pages.forEach(p => {
        if (p.updateDate > updateDate) {
          updateDate = p.updateDate;
        }
      });
      d.updateDate = updateDate;

      if (d.favicon === null) {
        d.favicon = GET_FAVICON_URL_PREFIX + d.pages[0].url;
      }

      return d;
    });

    domains = reverse(sortBy(domains, ['numberOfPieces', 'numberOfPages']));

    return (
      <div className={styles.OverviewPanelV2Contaienr}>
        <div className={styles.OverviewTitleContainer}>Overview</div>
        <div className={styles.OverviewContent}>
          <ExpansionPanel>
            <ExpansionPanelSummary
              expandIcon={<ExpandMoreIcon />}
              className={classes.summaryRoot}
            >
              <Typography className={classes.heading}>
                <GiTargeting className={styles.SectionHeaderIcon} />
                Goal
              </Typography>
              <Typography className={classes.secondaryHeading}>
                difference between python matrix and numpy
              </Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className={classes.detailsRoot}>
              <Textarea
                minRows={1}
                maxRows={3}
                className={styles.Textarea}
                defaultValue={'difference between python matrix and numpy'}
              />
            </ExpansionPanelDetails>
          </ExpansionPanel>

          <ExpansionPanel>
            <ExpansionPanelSummary
              expandIcon={<ExpandMoreIcon />}
              className={classes.summaryRoot}
            >
              <Typography className={classes.heading}>
                <IoMdGlobe className={styles.SectionHeaderIcon} />
                Environments
              </Typography>
              <Typography className={classes.secondaryHeading}>
                The author uses <em>Python 2.7</em>, <em>Numpy 1.1</em>.<br />
                There's also a new version of Python available (Python 3.5)
                since the table was last updated.
              </Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className={classes.detailsRoot}>
              <p className={styles.Temp}>
                let the author provide details about his/her environments
              </p>
              <p className={styles.Temp}>
                we can use that and the timestamps to figure out if there's new
                versions
              </p>
            </ExpansionPanelDetails>
          </ExpansionPanel>

          <ExpansionPanel>
            <ExpansionPanelSummary
              expandIcon={<ExpandMoreIcon />}
              className={classes.summaryRoot}
            >
              <Typography className={classes.heading}>
                <AiOutlineSearch className={styles.SectionHeaderIcon} />
                Search Queries
              </Typography>
              <Typography className={classes.secondaryHeading}>
                The author searched for{' '}
                <em>difference between python matrix and numpy</em>, etc. Click
                to see more
              </Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className={classes.detailsRoot}>
              {queriesToDisplay.map((item, idx) => {
                return (
                  <div key={idx} className={styles.ListItem}>
                    {item.query}
                  </div>
                );
              })}
            </ExpansionPanelDetails>
          </ExpansionPanel>

          <ExpansionPanel>
            <ExpansionPanelSummary
              expandIcon={<ExpandMoreIcon />}
              className={classes.summaryRoot}
            >
              <Typography className={classes.heading}>
                <GiThreeKeys className={styles.SectionHeaderIcon} />
                Sources & Pages
              </Typography>
              <Typography className={classes.secondaryHeading}>
                Information are collected from 5 different sources, with the
                most used one being stackoverflow.com.
                <br />
                <div>
                  {domains.map((item, idx) => {
                    return (
                      <img
                        key={idx}
                        alt={item.domain}
                        src={item.favicon}
                        style={{ margin: 4, width: 16, height: 16 }}
                        title={item.domain}
                      />
                    );
                  })}
                </div>
              </Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className={classes.detailsRoot}>
              <p className={styles.Temp}>
                place the complete list of sources and pages here in detail.
              </p>
            </ExpansionPanelDetails>
          </ExpansionPanel>

          <ExpansionPanel>
            <ExpansionPanelSummary
              expandIcon={<ExpandMoreIcon />}
              className={classes.summaryRoot}
            >
              <Typography className={classes.heading}>
                <FaBookmark className={styles.SectionHeaderIcon} />
                Snippets
              </Typography>
              <Typography className={classes.secondaryHeading}>
                There are 12 snippets, of which 3 are options, 3 are criteria,
                and 6 are evidence snippets.
                <br /> Snippets range from 2 years ago to 3 days ago.
                <br />
                7 out of 9 received at least 10 up-votes (max: 438, min: 1).
                <br />
              </Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className={classes.detailsRoot}>
              <p className={styles.Temp}>
                view filters for honest signals that can be turned on/off, like
                popularity, date, source, etc.
              </p>
            </ExpansionPanelDetails>
          </ExpansionPanel>

          <ExpansionPanel>
            <ExpansionPanelSummary
              expandIcon={<ExpandMoreIcon />}
              className={classes.summaryRoot}
            >
              <Typography className={classes.heading}>
                <TiUser className={styles.SectionHeaderIcon} />
                Task Author
              </Typography>
              <Typography className={classes.secondaryHeading}>
                <em>Michael</em> from <em>Carnegie Mellon University</em>.
                Specialized in <em>Javascript</em>.
              </Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className={classes.detailsRoot}>
              <img src={AuthorCardImg} style={{ width: '100%' }} alt="" />
              <p className={styles.Temp}>
                Also how the author's most used languages
              </p>
            </ExpansionPanelDetails>
          </ExpansionPanel>

          <ExpansionPanel>
            <ExpansionPanelSummary
              expandIcon={<ExpandMoreIcon />}
              className={classes.summaryRoot}
            >
              <Typography className={classes.heading}>
                <GiBinoculars className={styles.SectionHeaderIcon} />
                Next steps
              </Typography>
              <Typography className={classes.secondaryHeading}>
                <div className={styles.Temp}>what to say here?</div>
              </Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className={classes.detailsRoot}>
              <p className={styles.Temp}>google suggested options?</p>
            </ExpansionPanelDetails>
          </ExpansionPanel>
        </div>
      </div>
    );
  }
}

export default withStyles(materialStyles)(OverviewPanelV2);
