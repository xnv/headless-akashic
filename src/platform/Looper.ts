export class Looper {
	private _fun: (deltaTime: number) => number;
	private _timerId: any;
	private _prev: number;
	constructor(fun: (deltaTime: number) => number) {
		this._fun = fun;
		this._timerId = null;
		this._prev = 0;
	}
	start(): void {
		this._fun(0);
		this._prev = Date.now();
		this._timerId = setInterval(() => {
			const now = Date.now();
			this._fun(now - this._prev);
			this._prev = now;
		}, 16);
	}
	stop(): void {
		clearInterval(this._timerId);
		this._timerId = null;
		this._prev = 0;
	}
}
