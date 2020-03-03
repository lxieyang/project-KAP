import queryString from 'query-string';
import $ from 'jquery';

let query = null;

const getSearchQueryFromWindowURL = () => {
  const parsed = queryString.parse(window.location.search);
  if (parsed.q !== null && parsed.q !== undefined) {
    return parsed.q.trim();
  } else {
    return null;
  }
};

const sendSearchQueryToBackground = query => {
  chrome.runtime.sendMessage({
    msg: 'SEARCH_QUERY_DETECTED',
    payload: {
      query
    }
  });
};

const queryResultClickedHandler = (url, title) => {
  console.log('search result clicked');
  chrome.runtime.sendMessage({
    msg: 'SEARCH_RESULT_CLICKED',
    payload: {
      query,
      url,
      title // this title may be cropped
    }
  });
};

const { hostname, pathname } = window.location;
if (hostname.trim() === 'www.google.com' && pathname.trim() === '/search') {
  query = getSearchQueryFromWindowURL();
  if (query !== null && query !== '') {
    console.log('QUERY DETECTED:', query);
    sendSearchQueryToBackground(query);
  }

  $('.g .rc a').on('click', function() {
    queryResultClickedHandler(
      this.href,
      $(this)
        .children('h3')
        .first()
        .text()
    );
  });
}
