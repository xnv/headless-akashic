import * as path from "path";
import * as g from "../drivers/akashic-engine.altered";
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
	private amflowClient: any;
	private driver: any;
	private game: g.Game;
	private platform: Platform;
	private _xhaGameId: string;
	private _xhaPlayer: g.Player;
	private _xhaPlayId: string;
	private _opts: ContextOptions;

	constructor(opts: ContextOptions = {}) {
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
		var pf = new Platform(amflowClient, (opts.gameJsonContent ? gamejsonLoader : undefined));
		var driver = new gdr.GameDriver({
			platform: pf,
			player: this._xhaPlayer,
			errorHandler: function (e: any) { console.log("ERRORHANDLER:", e); }
		});

		this.amflowClient = amflowClient;
		this.driver = driver;
		this.game = null;
		this.platform = pf;
	}

	start(): Promise<g.Game> {
		return new Promise<g.Game>((resolve, reject) => {
			this.driver.gameCreatedTrigger.add((game: g.Game) => {
				this.game = game;
				game._started.add(() => resolve(game));
			});
			this.driver.initialize({
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
				this.driver.startGame();
			});
		});
	}

	end(): void {
		this.driver.stopGame();
		this.driver = null;
		this.game = null;
		this.amflowClient = null;
	}
}
