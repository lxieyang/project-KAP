// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import TextDocumentContentProvider from './TextDocumentContentProvider';
import { open, getLanguageType, prepareCopiedCode } from './util';
import firebase from './firebase';


// Get a reference to the database service
let database = firebase.database();

interface Decoration {
    decorations: vscode.DecorationOptions[];
    payload: any;
}

interface Mapping {
    pieceId: string;
    userId: string;
    taskId: string;
    content: string;
    note: string;
    existingOptions: Object;
    originalCodeSnippet: string[];
    url: string;
    title: string;
    type: string;
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "open-webview" is now active!');
    
    let userId: string = "";
    let mappings : Mapping[] = [];
    context.workspaceState.update('mappings', mappings).then(response => {});
    let activeLanguage: string = "";
    let copiedPayload = {};

    let taskToNavigateTo = {
        userId: "",
        taskId: "",
        pieceId: ""
    }
    
    let hoverProvider = {
        provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Hover> {
            // console.log(lastScanResult);
            
            // console.log(position.line + " | " + position.character);
            let range = document.getWordRangeAtPosition(position);
            // console.log("HOVER " + JSON.stringify(range));
            const matchingDecorationAndItem = lastScanResult.map(item => {
                return {
                    item: item,
                    range: item.decorations[0].range
                }
            }).find(pair => pair.range !== null && pair.range.start.line === range.start.line);            

            let result: Thenable<vscode.Hover> = undefined;

            if (matchingDecorationAndItem) {
                // let hoverMessage = "";
                // hoverMessage += `### [${matchingDecorationAndItem.item.payload.title}](${matchingDecorationAndItem.item.payload.url})    \n`;
                // hoverMessage += `### [${matchingDecorationAndItem.item.payload.title}](http://localhost:3001/tasks/yiyiwang/-L8TbdGiRIRpkzh_FwzJ)    \n`;

                // hoverMessage += `#### Original Code Snippets:   \n`;
                // hoverMessage += `\`\`\`${activeLanguage}  \n`;
                // hoverMessage += `${matchingDecorationAndItem.item.payload.content}   `;
                // hoverMessage += `\`\`\`   \n`;

                // hoverMessage += `#### Options involved:   \n`;
                // for (let op of matchingDecorationAndItem.item.payload.existingOptions.filter(op => op.active === true)) {
                //     hoverMessage += `> - ${op.name}: ${op.attitude === true ? '👍' : op.attitude === false ? '👎' : '❓'}  \n`;
                // }
                let payload = matchingDecorationAndItem.item.payload;
                taskToNavigateTo = {
                    userId: payload.userId,
                    taskId: payload.taskId,
                    pieceId: payload.pieceId
                };

                let hoverMessage = new vscode.MarkdownString();
                hoverMessage.isTrusted = true;
                hoverMessage.appendMarkdown(`### [${matchingDecorationAndItem.item.payload.title}](${matchingDecorationAndItem.item.payload.url})    \n`);
                hoverMessage.appendMarkdown(`### [${matchingDecorationAndItem.item.payload.title}](command:extension.openTask)    \n`)


                return Promise.resolve(new vscode.Hover(hoverMessage, document.getWordRangeAtPosition(position)));
            }
            // let hoverMessage = '![Google](https://firebasestorage.googleapis.com/v0/b/project-kap-dev.appspot.com/o/1_2_DSC_0023.jpg?alt=media&token=38f7006e-b466-40c6-b2da-f2e67bd3817e)   \n looks cool';
            return result;
        }
    };

    let dummy = vscode.languages.registerHoverProvider(['*'], hoverProvider);
    
    
    
    let lastScanResult: Decoration[] = [];
    let throttleId = undefined;
    let throttledScan = (timeout: number = 500) => {
        if (throttleId) {
            clearTimeout(throttleId);
        }
        throttleId = setTimeout(() => scan(), timeout);
    };
    const scan = () => {
        console.log("scanning");
        const editor = vscode.window.activeTextEditor;
        // console.log(editor.document);
        if (editor) {
            lastScanResult = [];
            collectEntries(editor, '@@@source', '@@@', lastScanResult);
        }
    };

    const collectEntries = (editor: vscode.TextEditor, identifier: string, endingIdentifier: string,lastScanResult: Decoration[]) => {
        mappings = context.workspaceState.get('mappings', []);
        console.log(mappings);
        let max = editor.document.lineCount;
        for (let lineIdx = 0; lineIdx < max; lineIdx++) {
            let lineObject = editor.document.lineAt(lineIdx);
            let line = lineObject.text;
            if (line.indexOf(identifier) !== -1) {
                // console.log("Line: " + lineIdx + " | " + line);
                let decorations: vscode.DecorationOptions[] = [];
                decorations.push({
                    range: new vscode.Range(lineIdx, 0, lineIdx, 0),
                    hoverMessage: ""
                });

                let start = line.indexOf(identifier);
                let end = line.lastIndexOf(endingIdentifier);
                if (start !== -1 && end !== -1) {
                    let lineIdentity = line.substring(start, end).trim();
                    // find mapping
                    for (let entry of mappings) {
                        const { userId, pieceId } = entry;
                        // console.log("@@@source: (" + userId + ") (" + pieceId + ")");
                        // console.log(lineIdentity);
                        if ("@@@source: (" + userId + ") (" + pieceId + ")" === lineIdentity) {
                            console.log("pushed");
                            let payload = {
                                ...entry
                            };
                            lastScanResult.push({
                                decorations,
                                payload
                            });
                        }           
                    }
                }
            }
        }
    }

    const updateLanType = () => {
        activeLanguage = getLanguageType();
        console.log(activeLanguage);
        database.ref('editor/languagetype').set(activeLanguage);
    }
    

    let previewUri = vscode.Uri.parse('open-webview://open-webview/http://localhost:3001/');
    let provider = new TextDocumentContentProvider();
    let registration = vscode.workspace.registerTextDocumentContentProvider('open-webview', provider);





    // change listener
    vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
        // console.log(e);
        throttledScan();
        // let tmp: any[] = context.workspaceState.get('mappings');
        // if (tmp !== undefined) {
        //     mappings = tmp;
        //     console.log(mappings);
        // }
        if (e.document === vscode.window.activeTextEditor.document) {
            provider.update(previewUri);
        }
    });

    vscode.window.onDidChangeActiveTextEditor((e: vscode.TextEditor) => {
        // console.log(e);
        throttledScan();
        if (copiedPayload) {
            prepareCopiedCode(context, copiedPayload);
        }
        updateLanType();
    });

    vscode.workspace.onDidChangeWorkspaceFolders(e => {
        throttledScan();
        if (copiedPayload) {
            prepareCopiedCode(context, copiedPayload);
        }
        updateLanType();
    });

    vscode.workspace.onDidOpenTextDocument(() => {
        lastScanResult = [];
        throttledScan();
        if (copiedPayload) {
            prepareCopiedCode(context, copiedPayload);
        }
        updateLanType();
    });

    throttledScan();

    vscode.window.onDidChangeTextEditorSelection((e: vscode.TextEditorSelectionChangeEvent) => {
        // console.log("selection event fired");
        // console.log(e.textEditor.selection);
        if (e.textEditor === vscode.window.activeTextEditor) {
            provider.update(previewUri);
        }
    });





    // register commands
    let disposable = vscode.commands.registerCommand('extension.openWebview', () => {
        console.log(previewUri);
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'KAP').then((success) => {

        }, (reason) => {
            vscode.window.showErrorMessage(reason);
        });
    });

    vscode.commands.registerCommand('extension.openTask', (payload) => {
        // console.log('open task');
        // console.log(previewUri);
        // provider.update(vscode.Uri.parse('open-webview://open-webview/https://project-kap-dev.firebaseapp.com/'));

        console.log(taskToNavigateTo);
        database.ref('users').child(userId).child('editor').child('taskToNavigateTo').set(taskToNavigateTo);
    
    });

    vscode.commands.registerCommand('extension.openLink', (link) => {
        console.log(link);
        open(link);
    });

    vscode.commands.registerCommand('extension.setUser', (_userId) => {
        console.log(userId);
        userId = _userId;
    });

    vscode.commands.registerCommand('extension.copyDetected', (payload) => {
        // console.log(payload);
        copiedPayload = payload;
        prepareCopiedCode(context, payload);
   
    });





    // vscode.commands.registerCommand('extension.copyDetected', (name, url, content) => {
    //     copiedPayload = {
    //         name, url, content
    //     };

    //     prepareCopiedCode(context, copiedPayload);
   
    // });

    




    // disposable
    context.subscriptions.push(disposable, registration, dummy);
}

// this method is called when your extension is deactivated
export function deactivate() {
}