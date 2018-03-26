import { compact, uniq, sortBy, first } from 'lodash'
import { 
  computedStyleToInlineStyle,
  resolveHangingTags
} from './capture.util';

class Snippet {
  constructor() {
    this.nodes = [];
    // this.paths = [];
    this.text = [];
    this.htmls = [];
    this.found = false;
    this.subTitle = '';
    this.initialDimensions = {};
  }

  findHtmlFromNode(node) {
    this.initialDimensions = node.getBoundingClientRect();
    this.nodes = [node];
    this.text = this.nodes.map(elem => elem.textContent).join("\n");
    
    //Inline the styles to html
    let inlineNodes = this.nodes.map(node => computedStyleToInlineStyle(node, {recursive: true, clone: true}))
    let resolved = resolveHangingTags(this.nodes, inlineNodes.slice(0));
    this.htmls = resolved.map(elem => elem.outerHTML);
    this.found = true;
    let headerNodes = [];
    this.nodes.forEach(node => {
      if (node.tagName.toLowerCase().match(/^h[1-6]$/))
        headerNodes.push(node);
      
      headerNodes.push(...node.querySelectorAll('h1,h2,h3,h4,h5.h6'))
    })
    let headerNode = first(sortBy(headerNodes, 'tagName'));
    this.subTitle = (headerNode)? headerNode.innerText : null;

    // clean nodes and html
    this.nodes = this.nodes.filter(node => node.id !== 'kap-selection-window');
    this.htmls = this.htmls.filter(h => h.indexOf('kap-selection-window') === -1);
    this.htmls = this.htmls.map((h) => {
      if (h.indexOf('<a ') !== -1) {
        h = h.replace(/<a /g, '<a target="_blank" ');
      }
      return h;
    });

  }

  findNodesFromBounds(rect) {
    rect = {top: rect.top + window.scrollY,
       bottom: rect.bottom + window.scrollY,
       left: rect.left + window.scrollX,
       right: rect.right + window.scrollX,
       width: rect.width, height: rect.height}
    
    let leafNodes = this.filterLeafNodes(rect);
    this.nodes = this.findOptimalParents(leafNodes);
    // this.paths = this.nodes.map((elem) => XPath.getUniqueXPath(elem, document.body));
    this.text = this.nodes.map(elem => elem.textContent).join("\n");
    
    //Inline the styles to html
    let inlineNodes = this.nodes.map(node => computedStyleToInlineStyle(node, {recursive: true, clone: true}))
    let resolved = resolveHangingTags(this.nodes, inlineNodes.slice(0));
    this.htmls = resolved.map(elem => elem.outerHTML);
    this.found = true;
    let headerNodes = [];
    this.nodes.forEach(node => {
      if (node.tagName.toLowerCase().match(/^h[1-6]$/))
        headerNodes.push(node);
      
      headerNodes.push(...node.querySelectorAll('h1,h2,h3,h4,h5.h6'))
    })
    let headerNode = first(sortBy(headerNodes, 'tagName'));
    this.subTitle = (headerNode)? headerNode.innerText : null;
    
    this.initialDimensions = rect;

    // clean nodes and html
    this.nodes = this.nodes.filter(node => node.id !== 'kap-selection-window');
    this.htmls = this.htmls.filter(h => h.indexOf('kap-selection-window') === -1);
    this.htmls = this.htmls.map((h) => {
      if (h.indexOf('<a ') !== -1) {
        h = h.replace(/<a /g, '<a target="_blank" ');
      }
      return h;
    });
  }

  filterLeafNodes({top, left, bottom, right}) {

    let traverse = (parent) => {
      var nodes = [];
      Array.from(parent.children).forEach((elem) => {
        if (elem.children.length > 0) {
          nodes = nodes.concat(traverse(elem));
        } else {

          //Only use block level elements and ignore "display none" elements
          let style = window.getComputedStyle(elem);
          if (elem.className.indexOf && elem.className.indexOf("bento-") >= 0 )
            return;

          while(style.display.indexOf("inline") >= 0) {
            elem = elem.parentElement;
            style = window.getComputedStyle(elem);
          }

          let rect = this.getAdjustedRect(elem, style);

          //Ignore empty elems
          let areaChild = rect.width * rect.height;
          if (areaChild <= 0)
            return;

          let areaSelection = (bottom - top) * (right - left);
          //Calculate intersection + union of leaf (@see https://stackoverflow.com/questions/9324339/how-much-do-two-rectangles-overlap)
          let SI = Math.max(0, Math.min(rect.right, right) - Math.max(rect.left, left)) * Math.max(0, Math.min(rect.bottom, bottom) - Math.max(rect.top, top));
          //let SU = areaChild + areaSelection - SI;
          if (SI > 0) //Just get any elements where there is an intersection
            nodes.push({elem: elem, intersection: SI, areaChild: areaChild});
        }
      })
      return nodes;
    }
    let touchingNodes = traverse(document.body);
    var threshold = 0.9;
    var filteredNodes = [];
    while(filteredNodes.length < 1) {
      filteredNodes = touchingNodes.filter(node => node.intersection / node.areaChild >= threshold)
      threshold -= 0.05;
    }
    return uniq(filteredNodes.map((node) => node.elem));
  }


  //Assume Child nodes will fill 90% of the area of their optimal parents
  findOptimalParents(leafNodes) {
    let parents = new Map();
    let foundNewParent = false;
    //Get the immediate parent for all of our leaf elements
    leafNodes.forEach(elem => {
      let parent = elem.parentElement;
      let style = window.getComputedStyle(parent);
      //Ensure we have a block level parent
      while(style.display.indexOf("inline") >= 0) {
        parent = parent.parentElement;
        style = window.getComputedStyle(parent);
      }
      //If for some reason we're already tracking this parent, then ignore this signal
      if (leafNodes.indexOf(parent) >= 0) {
        foundNewParent = true;
        return; 
      }

      let children = parents.get(parent) || [];
      parents.set(parent, children.concat(elem));
    });

    let newSet = [];
    //Determine how much of the parent's area the child is covering
    parents.forEach((children, parent) => {
      //If would be nice to use a more flexible area formula, but weird padding and margin values can mess this up
  //    let style = window.getComputedStyle(parent);
  //    let parentRect = getAdjustedRect(parent, style);
  //    let parentArea = parentRect.height * parentRect.width;
  //    
  //    let childrenArea = children.reduce((totalArea, child) => {
  //      let childRect = child.getBoundingClientRect();
  //      return totalArea + (childRect.width * childRect.height);
  //    }, 0);
  //    
  //    //If we explain 90% of the parent's area, then we accept this parent
  //    if (childrenArea / parentArea >= 0.9) {
      //Sadly the above doesn't work in cases with odd padding values -- might still be better in most cases?

      //Only include visible children
      if (Array.from(parent.children).filter(elem => elem.offsetParent).length === children.length) {
        foundNewParent = true;
        newSet.push(parent);
      }
      else
        newSet = newSet.concat(children);
    });
    if (foundNewParent)
      return this.findOptimalParents(newSet);
    else
      return leafNodes;
  }

  //Get an adjusted rectangle that accounts for scroll, padding and borders
  getAdjustedRect(elem, style) {
    //Apparently it only uses padding + boarder (not margin) in the computation for bounding client rect
    let rect = elem.getBoundingClientRect();
    var borderLeft = parseInt(style.borderLeftWidth, 10) || 0;
    var borderRight = parseInt(style.borderRightWidth, 10) || 0;
    var borderTop = parseInt(style.borderTopWidth, 10) || 0;
    var borderBottom = parseInt(style.borderBottomWidth, 10) || 0;

    var paddingLeft = parseInt(style.paddingLeft, 10) || 0;
    var paddingRight = parseInt(style.paddingRight, 10) || 0;
    var paddingTop = parseInt(style.paddingTop, 10) || 0;
    var paddingBottom = parseInt(style.paddingBottom, 10) || 0;

    return {top: rect.top + window.scrollY + paddingTop + borderTop,
           bottom: rect.bottom + window.scrollY - paddingBottom - borderBottom,
           left: rect.left + window.scrollX + paddingLeft + borderLeft,
           right: rect.right + window.scrollX - paddingRight - borderRight,
           width: rect.width - paddingLeft - paddingRight - borderLeft - borderRight, 
           height: rect.height - paddingTop - paddingBottom - borderTop - borderBottom}
  }

  logThisSnippet() {
    console.log(this.nodes);
    console.log(this.text);
    console.log(this.htmls);
    console.log(this.subTitle);
  }
}

export default Snippet;