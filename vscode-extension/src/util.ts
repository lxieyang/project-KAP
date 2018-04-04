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
};


export const getLanguageType = () => {
    let document = vscode.window.activeTextEditor.document;
    for(let lan of supportedLanguages) {
        if (vscode.languages.match(lan.type, document)) {
            return lan.type;
        }
    }
    return "";
};


export const commentStringStartEnd = (document: vscode.TextDocument): any => {
    let supportedLanguages = [
        {type: 'html', start: '<!--', end: '-->'},
        {type: 'javascript', start: '//'},
        {type: 'typescript', start: '//'},
        {type: 'css', start: '/*', end: '*/'},
        {type: 'python', start: '#'},
        {type: 'shellscript', start: '#'},
    ];
    
    for(let lan of supportedLanguages) {
        if (vscode.languages.match(lan.type, document)) {
            return lan;
        }
    }
    return "";
};


export const prepareCopiedCodeLegacy = (context: vscode.ExtensionContext, payload: any): void => {  
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
};


export const prepareCopiedCode = (context: vscode.ExtensionContext, payload: any): void => {  
    const { title, content, userId, taskId, pieceId } = payload;
    if (vscode.window.visibleTextEditors.length > 0 && vscode.window.visibleTextEditors[0].document !== undefined) {
        let cmtString = commentString(`@@@source: (${userId}) (${taskId}) (${pieceId}) (${title}) @@@`, vscode.window.visibleTextEditors[0].document);
        ncp.copy(cmtString + "\n" + content, () => {
            console.log('COPY MODIFICATION COMPLETE');
        });
    }
};


export const getFileNameWithinWorkspace = (workspaceName: string, filePath: string) => {
    let idx = filePath.indexOf(workspaceName);
    if (idx !== -1) {
        return filePath.substr(idx);
    } else {
        return null;
    }
    
};