import * as vscode from 'vscode';
var exec = require('child_process').exec;
var ncp = require("copy-paste");

export const open = (url) => {
    let platform = process.platform;
    let cmd;
    switch(platform) {
        case 'win32':
            cmd = `start "" "${url}"`;
            break;
        case 'darwin':
            cmd = `open "${url}"`;
            break;
        default:
            cmd = `xdg-open "${url}"`;
            break;
    }

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage('Error occurred when trying to open the link');
        }
    });
};

/**
0: "plaintext"
1: "Log"
2: "bat"
3: "clojure"
4: "coffeescript"
5: "c"
6: "cpp"
7: "csharp"
8: "css"
9: "diff"
10: "dockerfile"
11: "fsharp"
12: "git-commit"
13: "git-rebase"
14: "go"
15: "groovy"
16: "handlebars"
17: "hlsl"
18: "html"
19: "ini"
20: "properties"
21: "java"
22: "javascriptreact"
23: "javascript"
24: "jsx-tags"
25: "json"
26: "jsonc"
27: "less"
28: "log"
29: "lua"
30: "makefile"
31: "markdown"
32: "objective-c"
33: "objective-cpp"
34: "perl"
35: "perl6"
36: "php"
37: "powershell"
38: "jade"
39: "python"
40: "r"
41: "razor"
42: "ruby"
43: "rust"
44: "scss"
45: "shaderlab"
46: "shellscript"
47: "sql"
48: "swift"
49: "typescript"
50: "typescriptreact"
51: "vb"
52: "xml"
53: "xsl"
54: "yaml"
55: "ng-template"
56: "xquery"
57: "tex"
58: "latex"
59: "bibtex"
60: "latex-beamer"
61: "latex-memoir"
62: "latex-expl3"
63: "latex-log"
64: "pdf"
65: "source.jsx.styled"
66: "mapfile"
67: "pip-requirements"
68: "mongo"
69: "jinja"
 */

let supportedLanguages = [
    {type: 'html', start: '<!--', end: '-->'},
    {type: 'javascript', start: '//'},
    {type: 'typescript', start: '//'},
    {type: 'css', start: '/*', end: '*/'},
    {type: 'python', start: '#'},
    {type: 'shellscript', start: '#'},
];

export const commentString = (content: string, document: vscode.TextDocument): string => {    
    for(let lan of supportedLanguages) {
        if (vscode.languages.match(lan.type, document)) {
            return lan.start + " " + content + " " + (lan.end ? lan.end : '');
        }
    }
    return "";
}

export const getLanguageType = () => {
    let document = vscode.window.activeTextEditor.document;
    for(let lan of supportedLanguages) {
        if (vscode.languages.match(lan.type, document)) {
            return lan.type;
        }
    }
    return "";
}

export const commentStringStartEnd = (document: vscode.TextDocument): any => {
    let supportedLanguages = [
        {type: 'html', start: '<!--', end: '-->'},
        {type: 'javascript', start: '//'},
        {type: 'typescript', start: '//'},
        {type: 'css', start: '/*', end: '*/'},
        {type: 'python', start: '#'},
        {type: 'shellscript', start: '#'},
    ]
    
    for(let lan of supportedLanguages) {
        if (vscode.languages.match(lan.type, document)) {
            return lan;
        }
    }
    return "";
}

export const prepareCopiedCode = (context: vscode.ExtensionContext,payload: any): void => {  
    const { name, url, content } = payload;
    // console.log(name + " | " + url);
    let cmtString = commentString("@@@source: " + url + " @@@", vscode.window.visibleTextEditors[0].document);
    
    ncp.copy(cmtString + "\n" + content, () => {
        // console.log(ncp.paste());
        let mappings = context.workspaceState.get('mappings', []);
        let shouldAddToMapping = true;

        for (let map of mappings) {
            if (map.name === name && map.content === content && map.url === url) {
                shouldAddToMapping = false;
            }
        }

        if (shouldAddToMapping) {
            mappings.push({
                url: url,
                name: name,
                content: content
            });
            context.workspaceState.update('mappings', mappings).then(response => {
                // console.log(response);
            });
        }
        
    });
}