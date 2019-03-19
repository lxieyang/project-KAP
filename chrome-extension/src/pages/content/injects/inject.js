let MathJax = window.MathJax;

let data = { type: 'FROM_PAGE_MATHJAX_STATUS', status: MathJax !== undefined };
window.postMessage(data, '*');
