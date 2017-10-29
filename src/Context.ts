import * as path from "path";
import { Trigger } from "../drivers/akashic-engine.altered";
import * as gdr from "../drivers/game-driver.altered";
import { Platform } from "./platform/Platform";

export interface ContextOptions {
	gameDir?: string;
	overrideGameJson?: any;
	player?: {
		id: string;
		name?: string;
	};
}

// based on js/v2/sandbox.js in akashic-sandbox.
export class Context {
	onCalledExternalSend: Trigger<any>;
	private _amflowClient: any;
	private _driver: any;
	private _game: g.Game;
	private _platform: Platform;
	private _xhaGameId: string;
	private _xhaPlayer: g.Player;
	private _xhaPlayId: string;
	private _opts: ContextOptions;

	get game() { return this._game; }

	constructor(opts: ContextOptions = {}) {
		this.onCalledExternalSend = new Trigger<any>();
		this._xhaGameId = "xhaDummyGameId";
		this._xhaPlayer = opts.player || { id: "9999", name: "xha-player" };
		this._xhaPlayId = "xhaDummyPlayId";

		this._opts = {
			gameDir: opts.gameDir || path.resolve(__dirname, "..", "nullgame"),
			overrideGameJson: opts.overrideGameJson
		};

		// var storage = new gameStorage.GameStorage(window.localStorage, { gameId: this._xhaGameId });
		var amflowClient = new gdr.MemoryAmflowClient({
			playId: this._xhaPlayId,
			putStorageDataSyncFunc: () => { throw new Error("XHA: not implemented"); },
			getStorageDataSyncFunc: (readKeys: any) => { throw new Error("XHA: not implemented"); },
			tickList: null,
			startPoints: null
		});
		var gamejsonModifier = (data: any) => {
			if (opts.overrideGameJson)
				Object.keys(opts.overrideGameJson).forEach(k => (data[k] = opts.overrideGameJson[k]));
			return data;
		};
		var pf = new Platform({
			amflow: amflowClient,
			sendHandler: (pid: string, data: any) => this.onCalledExternalSend.fire(data),
			gamejsonModifier
		});
		var driver = new gdr.GameDriver({
			platform: pf,
			player: this._xhaPlayer,
			errorHandler: function (e: any) { console.log("ERRORHANDLER:", e); }
		});

		this._amflowClient = amflowClient;
		this._driver = driver;
		this._game = null;
		this._platform = pf;
	}

	start(): Promise<g.Game> {
		return new Promise<g.Game>((resolve, reject) => {
			this._driver.gameCreatedTrigger.add((game: g.Game) => {
				this._game = game;
				game._started.add(() => resolve(game));
			});
			this._driver.initialize({
				configurationUrl: path.resolve(this._opts.gameDir, "game.json"),
				assetBase: this._opts.gameDir,
				driverConfiguration: {
					playId: this._xhaPlayId,
					playToken: gdr.MemoryAmflowClient.TOKEN_ACTIVE,
					executionMode: gdr.ExecutionMode.Active
				},
				loopConfiguration: {
					loopMode: gdr.LoopMode.Realtime
				},
				profiler: undefined
			}, (e: any) => {
				if (e) return reject(e);
				this._driver.startGame();
			});
		});
	}

	end(): void {
		this._driver.stopGame();
		this._driver = null;
		this._game = null;
		this._amflowClient = null;
		this._platform = null;
	}

	firePointDown(x: number, y: number, identifier?: number): void { this._platform.doPointDown(x, y, identifier); }
	firePointMove(x: number, y: number, identifier?: number): void { this._platform.doPointMove(x, y, identifier); }
	firePointUp(x: number, y: number, identifier?: number): void { this._platform.doPointUp(x, y, identifier); }

	firePointDownMovesUp(interval: number, points: g.CommonOffset[], identifier?: number): void {
		if (points.length < 2)
			throw new Error("Context#firePointDownMovesUp: invalid argument");
		let ps = points.concat();
		let down = ps.shift();
		let up = ps.pop();
		this.firePointDown(down.x, down.y, identifier);
		let i = 0;
		const timer = setInterval(() => {
			const p = ps[i++];
			if (p) {
				this.firePointMove(p.x, p.y, identifier);
			} else {
				this.firePointUp(up.x, up.y, identifier);
				clearInterval(timer);
			}
		}, interval);
	}
}
