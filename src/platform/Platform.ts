import * as g from "../../drivers/akashic-engine.altered";
import { ResourceFactory } from "./ResourceFactory";
import { NodeTextAsset } from "./NodeTextAsset";
import { NullSurface } from "./NullSurface";
import { Looper } from "./Looper";

export interface PlatformArgument {
	amflow: any;
	sendHandler: (playId: string, data: any) => void;
	gamejsonLoader?: (url: string) => any;
}

export class Platform {
	amflow: any;

	private _resFac: g.ResourceFactory;
	private _rendererReq: any;
	private _primarySurface: g.Surface;
	private _eventHandler: any;
	private _sendHandler: (playId: string, data: any) => void;
	private _gamejsonLoader: (url: string) => any;

	constructor(param: PlatformArgument) {
		this.amflow = param.amflow;
		this._resFac = new ResourceFactory();
		this._rendererReq = null;
		this._primarySurface = null;
		this._eventHandler = null;
		this._sendHandler = param.sendHandler;
		this._gamejsonLoader = param.gamejsonLoader;
	}

	setPlatformEventHandler(handler: any): void {
		this._eventHandler = handler;
	}

	loadGameConfiguration(url: string, callback: (err: Error, data: Object) => void): void {
		if (this._gamejsonLoader)
			return void setTimeout(() => callback(null, this._gamejsonLoader(url)), 0);
		const a = new NodeTextAsset("(game.json)", url);
		a._load({
			_onAssetLoad: (asset: g.Asset) => callback(null, JSON.parse(a.data)),
			_onAssetError: (asset: g.Asset, error: any) => callback(error, null)
		});
	}

	getResourceFactory(): any {
		return this._resFac;
	}

	setRendererRequirement(requirement: any): void {
		if (!requirement) {
			// TODO reset view or primary surface?
			return;
		}
		this._rendererReq = requirement;
		// TODO use this._rendererReq.rendererCandidates
		this._primarySurface = new NullSurface(this._rendererReq.primarySurfaceWidth, this._rendererReq.primarySurfaceHeight, null);
		// TODO refrect platformEventHandler?
	}

	getPrimarySurface(): g.Surface {
		return this._primarySurface;
	}

	createLooper(fun: (deltaTime: number) => number): any {
		return new Looper(fun);
	}

	sendToExternal(playId: any, data: any): void {
		this._sendHandler(playId, data);
	}

	registerAudioPlugins(plugins: any): void {}
	setScale(xScale: number, yScale: number): void {}
	fitToWindow(noCenter: boolean): void {}
	revertViewSize(): void {}
	notifyViewMoved(): void {}  // should do something...?
	setMasterVolume(volume: any): void {}
	getMasterVolume(): number { return 0; }

	// ---- XHA extension ----

	doPointDown(x: number, y: number, identifier: number = 1): void {
		if (!this._eventHandler) return;
		this._eventHandler.onPointEvent({ type: 0, x, y, identifier });
	}

	doPointMove(x: number, y: number, identifier: number = 1): void {
		if (!this._eventHandler) return;
		this._eventHandler.onPointEvent({ type: 1, x, y, identifier });
	}

	doPointUp(x: number, y: number, identifier: number = 1): void {
		if (!this._eventHandler) return;
		this._eventHandler.onPointEvent({ type: 2, x, y, identifier });
	}
}
