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
    url: string;
    name: string;
    content: string;
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "open-webview" is now active!');

    let mappings : Mapping[] = [];
    context.workspaceState.update('mappings', mappings).then(response => {});
    let copiedPayload = {};
    
    let hoverProvider = {
        provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Hover> {
            // console.log(position.line + " | " + position.character);
            let range = document.getWordRangeAtPosition(position);
            const matchingDecorationAndItem = lastScanResult.map(item => {
                return {
                    item: item,
                    decoration: item.decorations.find(dec => range.start.line === dec.range.start.line)
                }
            }).find(pair => pair.decoration != null);

            let result: Thenable<vscode.Hover> = undefined;

            if (matchingDecorationAndItem) {
                let hoverMessage = "";
                hoverMessage += `### [${matchingDecorationAndItem.item.payload.name}](${matchingDecorationAndItem.item.payload.url})    \n`;
                hoverMessage += `#### Snippet:   \n`;
                hoverMessage += `\`\`\`  \n`;
                hoverMessage += `${matchingDecorationAndItem.item.payload.content}   `;
                hoverMessage += `\`\`\``;

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
        if (throttleId)
        clearTimeout(throttleId);
        throttleId = setTimeout(() => scan(), timeout);
    };
    const scan = () => {
        console.log("scanning");
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            lastScanResult = [];
            collectEntries(editor, '@@@source', '@@@', lastScanResult);
        }
    };

    const collectEntries = (editor: vscode.TextEditor, identifier: string, endingIdentifier: string,lastScanResult: Decoration[]) => {
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
                    let lineUrl = line.substring(start, end).split(' ')[1];
                    mappings = context.workspaceState.get('mappings', []);
                     // find mapping
                    for (let entry of mappings) {
                        if (entry.url === lineUrl) {
                            let payload = {
                                ...entry
                            }
                            lastScanResult.push({
                                decorations,
                                payload
                            });
                            // console.log('found one');
                        }           
                    }
                }
            }
        }
    }

    const updateLanType = () => {
        let lan = getLanguageType();
        console.log(lan);
        database.ref('editor/languagetype').set(lan);
    }
    

    let previewUri = vscode.Uri.parse('open-webview://open-webview');
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
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'KAP').then((success) => {

        }, (reason) => {
            vscode.window.showErrorMessage(reason);
        });
    });

    vscode.commands.registerCommand('extension.openLink', (link) => {
        console.log(link);
        open(link);
    });

    vscode.commands.registerCommand('extension.copyDetected', (name, url, content) => {
        copiedPayload = {
            name, url, content
        };

        prepareCopiedCode(context, copiedPayload);
   
    });




    // disposable
    context.subscriptions.push(disposable, registration, dummy);
}

// this method is called when your extension is deactivated
export function deactivate() {
}