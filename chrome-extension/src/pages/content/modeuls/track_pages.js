import queryString from 'query-string';
import $ from 'jquery';

const { hostname, pathname, href } = window.location;
if (hostname.trim() === 'www.google.com' && pathname.trim() === '/search') {
  console.log('on search results page, skip');
} else {
  console.log('should track:', href);
}
