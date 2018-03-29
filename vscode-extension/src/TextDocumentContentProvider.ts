import * as vscode from 'vscode';


class TextDocumentContentProvider implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

  public provideTextDocumentContent(uri: vscode.Uri): string {
    console.log(uri);
    return this.displayPreview(uri.path.substr(1));
  }

  get onDidChange(): vscode.Event<vscode.Uri> {
    return this._onDidChange.event;
  }

  public update(uri: vscode.Uri) {
    console.log(uri);
    this._onDidChange.fire(uri);
  }

  private displayPreview(path): string {
    let address = path; // 'http://localhost:3001/'; // 'https://project-kap-dev.firebaseapp.com/'; //'http://localhost:3001/';
    return `
    <!DOCTYPE html>
    <head><style type="text/css"> html, body{ height:100%; width:100%; overflow:hidden; padding:0;margin:0; } </style>
    <title>iFrame</title>
    <script type="text/javascript">
      function start(){
        // We need a unique value so html is reloaded
        var color = '';
        var fontFamily = '';
        var fontSize = '';
        var theme = '';
        var fontWeight = '';
        try {
          computedStyle = window.getComputedStyle(document.body);
          color = computedStyle.color + '';
          backgroundColor = computedStyle.backgroundColor + '';
          fontFamily = computedStyle.fontFamily;
          fontSize = computedStyle.fontSize;
          fontWeight = computedStyle.fontWeight;
          theme = document.body.className;
        }
        catch(ex){
        }
        
        // https://stackoverflow.com/questions/28295870/how-to-pass-parameters-through-iframe-from-parent-html
        document.getElementById('myframe').setAttribute('src', '${address}');

        window.addEventListener('message', function(e) {
          var data = JSON.parse(e.data);
          if (data.secret === 'secret-transmission-from-iframe') {
            if (data.type === 'CLICKED') {
              var url = data.payload.url;
              var openLinkAnchor = document.getElementById('open-link');
              openLinkAnchor.href = "${encodeURI('command:extension.openLink?')}" + encodeURIComponent(JSON.stringify([url]));
              openLinkAnchor.click();

            } else if (data.type === 'COPY_DETECTED') {
              // var name = data.payload.name;
              // var content = data.payload.content;
              // var url = data.payload.url;
              var payload = data.payload;

              var openLinkAnchor = document.getElementById('copy-detected');
              // openLinkAnchor.href = "${encodeURI('command:extension.copyDetected?')}" + encodeURIComponent(JSON.stringify([name, url, content]));
              openLinkAnchor.href = "${encodeURI('command:extension.copyDetected?')}" + encodeURIComponent(JSON.stringify([payload]));
              document.getElementById('debug').innerHTML = openLinkAnchor.getAttribute("href");
              openLinkAnchor.click();

            } else if (data.type === 'SET_USER') {
              var userId = data.payload.userId;
              var setUserAnchor = document.getElementById('set-user');
              setUserAnchor.href = "${encodeURI('command:extension.setUser?')}" + encodeURIComponent(JSON.stringify([userId]));
              setUserAnchor.click();

            }
          }
        }, false);

      }
    </script>
    </head>
    <body onload="start()">
    <div id="debug" style="display:none; width: 300px; overflow-wrap: break-word">
      hehe
    </div>
    <a id="open-link" style="display:none;"  href="${encodeURI('command:extension.openLink?') + encodeURIComponent('["https://www.google.com#ha"]')}">
    Click and hopefully opens ${encodeURI('command:extension.openLink?["https://www.google.com#hoho"]')}
    </a>
    <a id="copy-detected" style="display:none;" href="${encodeURI('command:extension.copyDetected?["https://www.google.com"]')}">Click and hopefully opens</a>
    <a id="set-user" style="display:none;" href="${encodeURI('command:extension.setUser?["https://www.google.com"]')}">Click and set user</a>
      <div style="background-color: white;height:100%;width:100%;">
        <iframe id="myframe" frameborder="0" style="border: 0px solid transparent; height:100%;width:100%;" src="" seamless></iframe>
      </div>
    </body>
    </html>
    `;
  }

}

export default TextDocumentContentProvider;