import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

export class Webview {
	constructor(
		private _context: vscode.ExtensionContext
	) { }

	async showAndPostMessage(data: any) {
		if (this._panel) {
			if (!this._panel.visible)
				this._panel.reveal();
			this._panel.webview.postMessage(data);
		} else {
			let viewColumn: vscode.ViewColumn = vscode.ViewColumn.Nine;
			for (const group of vscode.window.tabGroups.all) {
				if (group.tabs.length === 0)
					viewColumn = group.viewColumn;
			}

			this._panel = vscode.window.createWebviewPanel(
				'graphicalWatchWebview',
				'Graphical Watch', {
				viewColumn: viewColumn,
				preserveFocus: true
			}, {
				enableScripts: true,
				localResourceRoots: [vscode.Uri.file(path.join(this._context.extensionPath, 'resources'))]
			});
			// this._panel.onDidChangeViewState(
			// 	(e) => {
			// 		// TODO: handle hiding and showing again here?
			// 	},
			// 	null,
			// 	this._context.subscriptions);
			this._panel.onDidDispose(
				() => {
					this._panel = undefined;
				},
				null,
				this._context.subscriptions);

			let initialized = false;
			this._panel.webview.onDidReceiveMessage(
				(e: any) => {
					if (e.initialized && !initialized) {
						initialized = true;
						//this._panel?.webview.postMessage(data);
					}
				},
				undefined,
				this._context.subscriptions
			);

			try {
				// 读取HTML文件的内容
				const htmlFilePath = path.join(this._context.extensionPath, 'resources', 'webview.html');
				const htmlContent = await fs.readFile(htmlFilePath, 'utf8');
				// 将进程名称注入到HTML内容中
				// 设置webview的内容为读取并更新后的HTML文件内容
				this._panel.webview.html = htmlContent;
			} catch (err) {
				this._panel.webview.html = `<p>Error loading webview content.${err} </p>`;
			}
			// Failsafe
			setTimeout(() => {
				if (initialized) {
					this._panel?.webview.postMessage(data);
				}
			}, 1000);
		}
	}

	postMessage(data: any) {
		this._panel?.webview.postMessage(data);
	}

	hide() {
		this._panel?.dispose();
	}

	private getWebviewContent() {
		const htmlFilePath = path.join(this._context.extensionPath, 'resources', 'webview.html');
		return fs.readFile(htmlFilePath, 'utf8'(err: any, data: any) => {
			if(err) {
				return `<p>Error loading webview content.</p>`;
			}
			 return data;
		});
	}

	private _panel: vscode.WebviewPanel | undefined = undefined;
}
