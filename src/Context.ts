import * as path from "path";
import { Trigger } from "../drivers/akashic-engine.altered";
import * as gdr from "../drivers/game-driver.altered";
import { Platform } from "./platform/Platform";

export interface ContextOptions {
	gameDir?: string;
	gameJsonContent?: Object;
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
			gameJsonContent: opts.gameJsonContent
		};

		// var storage = new gameStorage.GameStorage(window.localStorage, { gameId: this._xhaGameId });
		var amflowClient = new gdr.MemoryAmflowClient({
			playId: this._xhaPlayId,
			putStorageDataSyncFunc: () => { throw new Error("XHA: not implemented"); },
			getStorageDataSyncFunc: (readKeys: any) => { throw new Error("XHA: not implemented"); },
			tickList: null,
			startPoints: null
		});
		var gamejsonLoader = (url: string) => opts.gameJsonContent;
		var pf = new Platform({
			amflow: amflowClient,
			sendHandler: (pid: string, data: any) => this.onCalledExternalSend.fire(data),
			gamejsonLoader: (opts.gameJsonContent ? gamejsonLoader : undefined)
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
}
