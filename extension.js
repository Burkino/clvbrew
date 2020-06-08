// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fetch = require('node-fetch');

let obf = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
obf.command = "clvbrew.obfuscate";
obf.tooltip = "Obfuscate script";
obf.text = "$(output) Obfuscate";

let change = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
change.command = "clvbrew.changelog";
change.tooltip = "Changelog of Clvbrew";
change.text = "$(book) Clvbrew changelog";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	change.show()
	obf.show()

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('clvbrew.obfuscate', function () {
		const settings = vscode.workspace.getConfiguration('clvbrew')
		if (settings['ApiKey'] == "") {
			vscode.window.showErrorMessage("hey dummy you need an api key, use !api in the clvbrew server or to the bot")
			return
		}
		const fullRange = new vscode.Range(vscode.window.activeTextEditor.document.positionAt(0),vscode.window.activeTextEditor.document.positionAt(vscode.window.activeTextEditor.document.getText().length))

		fetch('https://ibidk.herokuapp.com/obfuscate-key', {
			method: "post",
			headers: {"Content-Type":"application/json"},
			body: JSON.stringify({
				key: settings['ApiKey'],
				script: vscode.window.activeTextEditor.document.getText(),
				encAllStrings: settings['encAllStrings'],
				encImportantStrings: settings['encImportantStrings'],
				noControlFlow: settings['noControlFlow'],
				debugInfo: settings['debugInfo'],
				noCompressBS: settings['noCompressBS']
			  })
		})
		.then(res => {
			if(res.status === 401) {
				throw new Error()
			}
			return res.text()
		})
		.then(text => {
			if (settings['OutputType'] == 'Create new file') {
				vscode.workspace.openTextDocument({"content":`${text}`,"language":"lua"})
				vscode.window.showInformationMessage("Obfuscated, new tab opened")
			} else if (settings['OutputType'] == 'Replace current file') {
				vscode.window.activeTextEditor.edit(editBuilder => {editBuilder.replace(fullRange, text)})
				vscode.window.showInformationMessage("Obfuscated")
			}
		})
		.catch(function() {
			vscode.window.showErrorMessage('Invalid api key')
		})

	});

	let changelog = vscode.commands.registerCommand('clvbrew.changelog', function() {
		fetch('https://ibidk.herokuapp.com/changelog.txt')
		.then(res => res.text())
		.then(body => {
		    var s = body.replace(/-/g,"# ")
		    const versions = s.match(/(?:\# ([a-f\.0-9]+?))\[\n*((.*\n)+?)\]/g).reverse()
		    let out = ""
		    for (i in versions) {
		        out += versions[i].replace(/(\[\n)/g, "\n").replace(/(\n\])/g, "\n\n")
		    }
			vscode.workspace.openTextDocument({"content":`${out}`,"language":"markdown"})
			vscode.window.showInformationMessage("Opened changelog")
		})
	})
	context.subscriptions.push(disposable);
	context.subscriptions.push(changelog);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
	obf.dispose()
	change.dispose()
}

module.exports = {
	activate,
	deactivate
}
