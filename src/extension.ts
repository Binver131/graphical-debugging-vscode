import { GraphicalWatch, GraphicalWatchEventData, GraphicalWatchEventType, GraphicalWatchVariable } from './graphicalwatch';
import { Debugger, Endianness, Language } from './debugger';
import { Webview } from './webview';
import * as colors from './colors.json'
import * as draw from './drawable'
import * as load from './loader'
import * as util from './util'
import * as vscode from 'vscode';


async function handleVariable(dbg: Debugger, gwVariable: GraphicalWatchVariable): Promise<[string, draw.PlotlyData]> {
	const origType = await dbg.getType(gwVariable.name);
	if (origType !== undefined) {
		const type = dbg.rawType(origType);
		let variable: load.Variable = new load.Variable(gwVariable.name, type);
		let loader = await load.getLoader(dbg, variable);
		if (loader !== undefined) {
			const drawable = await loader.load(dbg, variable);
			if (drawable !== undefined) {
				return [origType, drawable.toPlotly(gwVariable.color)];
			}
		}
		return ['unknown (' + origType + ')', draw.PlotlyData.empty(gwVariable.color)];
	}
	return ['not available', draw.PlotlyData.empty(gwVariable.color)];
}

function systemName(system: draw.System): string {
	switch(system) {
		case draw.System.Cartesian: return 'cartesian';
		case draw.System.Complex: return 'complex';
		case draw.System.Geographic: return 'geographic';
		default: return '';
	}
}

function createMessagePlot(message: any, system: draw.System): number {
	const systemStr = systemName(system);
	for (let i = 0; i < message.plots.length ; ++i)
		if (message.plots[i].system === systemStr)
			return i;
	message.plots.push({
		system: systemStr,
		traces: [] as any,
		lonintervals: [] as any,
		lonmid: 0
	});
	return message.plots.length - 1;
}

let drawableData: draw.PlotlyData[] = [];

function prepareMessage(potlyData: draw.PlotlyData[], colorTheme: vscode.ColorTheme): any {
	let message = {
		color: '#888',
		gridcolor: '#888',
		activecolor: '#888',
		projection: 'orthographic',
		plots: [] as any
	};
	if (colorTheme.kind === vscode.ColorThemeKind.Light) {
		message.color = '#555';
		message.gridcolor = '#aaa';
		message.activecolor = '#aaa';
	} else { // Dark or HighContrast
		message.color = '#aaa';
		message.gridcolor = '#555';
		message.activecolor = '#bbb';
	}
	const themeColors = colorTheme.kind === vscode.ColorThemeKind.Light ? colors.light : colors.dark;
	for (let d of potlyData) {
		if (d.traces.length < 1)
			continue;
		const colorStr = d.colorId >= 0 ? themeColors.colors[d.colorId] : themeColors.color;
		const plotId = createMessagePlot(message, d.system);
		for (let trace of d.traces) {
			if (trace.type === "bar")
				trace.marker = {color: colorStr + '88'};
			else
				trace.line = {color: colorStr + 'CC'};
			if (trace.fill !== undefined && trace.fill !== 'none')
				trace.fillcolor = colorStr + '55';
			trace.hoverinfo = d.system === draw.System.Geographic ? "lon+lat" : "x+y";
			message.plots[plotId].traces.push(trace);

			for (let dir of d.directions) {
				let dirTrace : any = d.system === draw.System.Geographic ?
					{ lon: [dir.x], lat: [dir.y] } :
					{ x: [dir.x], y: [dir.y] };
				dirTrace.type = trace.type;
				dirTrace.mode = "markers";
				dirTrace.hoverinfo = "skip";
				dirTrace.marker = {
					size: 10,
					symbol: 'triangle-up',
					angleref: 'up',
					angle: dir.angle,
					color: colorStr + 'CC'
				};
				message.plots[plotId].traces.push(dirTrace);
			}
		}
		message.plots[plotId].lonintervals.push(d.lonInterval);
	}

	const cartesianStr = systemName(draw.System.Cartesian);
	const complexStr = systemName(draw.System.Complex);
	const geographicStr = systemName(draw.System.Geographic);
	for (let p of message.plots) {
		if (p.system === geographicStr) {
			const loninterval = util.LonInterval.fromIntervals(p.lonintervals);
			p.lonmid = (loninterval.min + loninterval.max) / 2;
		}
		p.scaleanchor = p.system === cartesianStr || p.system === complexStr;
	}

	let projection = vscode.workspace.getConfiguration().get<string>('graphicalDebugging.geographicProjection');
	if (projection !== undefined)
		message.projection = projection;

	return message;
}

async function parseData(dbg:Debugger, node:string): Promise<any>{
        let type = (await dbg.evaluate("currentApp"))?.type;
		return type;
}

export function activate(context: vscode.ExtensionContext) {

	const debugHelper: Debugger = new Debugger(context);
	const graphicalWatch: GraphicalWatch = new GraphicalWatch();
	const webview: Webview = new Webview(context);


	// TODO: get variables asynchroniously?

	debugHelper.onStopped(async () => {
		// const language = debugHelper.language();
		// const machineInfo = await debugHelper.machineInfo();
		// if (language !== undefined)
		// 	console.log(language);
		// if (machineInfo) {
		// 	console.log('pointer size: ' + machineInfo.pointerSize.toString());
		// 	console.log(machineInfo.endianness === Endianness.Little ? 'little endian' : 'big endian');
		// }
		graphicalWatch.refreshAll();
		let root = "currentAPP"
		let eva = (await debugHelper.evaluate("currentApp"));
        let type = (await debugHelper.evaluate("currentApp"))?.type;
        let typeDetail = await debugHelper.evaluate('-exec ptype /rmt ' + type);
		parseData(debugHelper, root);
		//"type = struct RApp_t {\n    int priority;\n    int visible;\n    Bool endRender;\n    float ratio_x;\n    float ratio_y;\n    RWindow *windows;\n    RApp *back;\n    long long int message_ptr;\n    char *MessageBuffer;\n} *\n"
		var data1 =
		{
			series: {
				type: "treemap",
				data: [{
					name: "Food",
					children: [{
						value: 3,
						name: "Fruit",
						children: [{
							value: 1,
							name: "Apple"
						}, {
							value: 2,
							name: "Orange",
							children: [{
								name: "Seville Orange",
								value: 1
							}, {
								name: "Blood Orange",
								value: 1
							}]
						}]
					}, {
						value: 9,
						name: "Meat",
						children: [{
							value: 6,
							name: "Beaf",
							children: [{
								name: "Sirloin",
								value: 1
							}, {
								name: "Rib",
								value: 1
							}, {
								name: "Chuck",
								value: 1
							}, {
								name: "Shank",
								value: 1
							}]
						}, {
							value: 2,
							name: "Chicken",
							children: [{
								name: "Wings",
								value: 1
							}]
						}, {
							name: "Breast",
							value: 1
						}]
					}]
				}, {
					value: 6,
					name: "Drinks",
					children: [{
						value: 3,
						name: "Wine",
						children: [{
							name: "USA",
							value: 2
						}, {
							name: "Europe",
							children: [{
								name: "Germany",
								value: 1
							}]
						}]
					}, {
						name: "Soft Drink",
						children: [{
							value: 3,
							name: "Juice",
							children: [{
								name: "Apple Juice",
								value: 1
							}, {
								name: "Orange Juice",
								value: 2
							}]
						}]
					}]
				}, {
					value: 6,
					name: "Fashion",
					children: [{
						name: "Clothing",
						children: [{
							name: "Shirts",
							value: 1
						}, {
							name: "Jackets",
							value: 3,
							children: [{
								name: "Men",
								value: 1
							}, {
								name: "Woman",
								value: 1
							}]
						}, {
							value: 2,
							name: "Coats",
							children: [{
								name: "Men",
								value: 1
							}, {
								name: "Woman",
								value: 1
							}]
						}]
					}]
				}, {
					name: "Computers",
					children: [{
						name: "Components",
						value: 4,
						children: [{
							name: "Barebones",
							value: 1
						}, {
							value: 2,
							name: "External",
							children: [{
								name: "Hard Drives",
								value: 2
							}]
						}, {
							name: "Monitors",
							value: 1
						}]
					}, {
						value: 3,
						name: "Other",
						children: [{
							name: "USB",
							value: 1
						}, {
							name: "Cases"
						}, {
							name: "Sound Cards",
							value: 1
						}]
					}]
				}]
			}
		};

		webview.showAndPostMessage(data1);
		/* if (graphicalWatch.variables.length > 0)
			load.types.update(debugHelper);

		for (let variable of graphicalWatch.variables)
			variable.type = 'loading...';
		graphicalWatch.refreshAll();

		drawableData = [];
		for (let variable of graphicalWatch.variables) {
			const [t, d] = await handleVariable(debugHelper, variable);
			drawableData.push(d);
			variable.type = t;
			graphicalWatch.refresh(variable);
		}
		//graphicalWatch.refreshAll();

		const message = prepareMessage(drawableData, vscode.window.activeColorTheme);
		webview.showAndPostMessage(message);
		if (message.plots.length > 0) {
			webview.showAndPostMessage(message);
		} */

		// let expr2 = await dbg.evaluate("&arrd[0]");
		// if (expr2 && expr2.memoryReference) {
		// 	let buffer = await dbg.readMemoryBuffer(expr2.memoryReference, 0, 10240);
		// 	if (buffer) {
		// 		let bufferLength = buffer.length;
		// 		let a = buffer.readDoubleLE(0);
		// 		let b = buffer.readDoubleLE(8);
		// 		let c = buffer.readDoubleLE(16);
		// 		let d = buffer.readDoubleLE(24);
		// 	}
		// }
	});

	// TODO: cancel processing of variables
	debugHelper.onUnavailable(() => {
		for (let variable of graphicalWatch.variables) {
			variable.type = 'not available';
		}
		graphicalWatch.refreshAll();
	});

	graphicalWatch.onChange(async (e: GraphicalWatchEventData) => {
		if (e.eventType === GraphicalWatchEventType.Add
			|| e.eventType === GraphicalWatchEventType.Edit) {
			if (e.variable !== undefined) {
				if (debugHelper.isStopped()) {
					load.types.update(debugHelper);
					e.variable.type = 'loading...';
					graphicalWatch.refresh(e.variable);
					const [t, d] = await handleVariable(debugHelper, e.variable);
					if (e.eventType === GraphicalWatchEventType.Add) {
						drawableData.push(d);
					} else {
						const i = graphicalWatch.variables.indexOf(e.variable);
						if (i >= 0 && i < drawableData.length) {
							drawableData[i] = d;
						}
					}
					e.variable.type = t;
					graphicalWatch.refresh(e.variable);
					const message = prepareMessage(drawableData, vscode.window.activeColorTheme);

					webview.showAndPostMessage(message);
				} else {
					e.variable.type = 'not available';
					graphicalWatch.refresh(e.variable);
				}
			}
		} else if (e.eventType === GraphicalWatchEventType.Remove) {
			if (e.variable) {
				const i = graphicalWatch.variables.indexOf(e.variable);
				if (i >= 0 && i < drawableData.length) {
					drawableData.splice(i, 1);
					if (drawableData.length > 0) {
						const message = prepareMessage(drawableData, vscode.window.activeColorTheme);
						webview.showAndPostMessage(message);
					} else {
						webview.hide();
					}
				}
			}
		} else if (e.eventType === GraphicalWatchEventType.RemoveAll) {
			drawableData = [];
			webview.hide();
		}
	});

	vscode.window.onDidChangeActiveColorTheme((e: vscode.ColorTheme) => {
		const message = prepareMessage(drawableData, e);
		webview.postMessage(message);
	});
}

export function deactivate() {

}
