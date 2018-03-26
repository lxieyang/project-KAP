import Snippet from './Snippet';

class KAPCapturing {
  static createSnapshot(boundingRect=null) {
    let snapshot = new Snippet();
    if (boundingRect === null) {
      let widthAdj = window.innerWidth - (window.innerWidth * 0.9);
      let heightAdj = window.innerHeight - (window.innerHeight * 0.9);
      boundingRect = {
        left: widthAdj / 2,
        right: window.innerWidth - (widthAdj / 2),
        top: heightAdj / 2,
        bottom: window.innerHeight - (heightAdj / 2),
        width: window.innerWidth - widthAdj,
        height: window.innerHeight - widthAdj
      }
    }
    // console.log(boundingRect);
    snapshot.findNodesFromBounds(boundingRect);
    return snapshot;
  }

  static createCodeSnippetsFromNode(node) {
    let snapshot = new Snippet();
    snapshot.findHtmlFromNode(node);
    return snapshot;
  }
}

export default KAPCapturing;