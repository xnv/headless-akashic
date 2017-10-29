import * as path from "path";
import { Context } from "../../lib/";

describe("Context", function () {
	it("can be instantiated", function (done: DoneFn) {
		const ctx = new Context();
		ctx.start().then((game: g.Game) => {
			// must be identical with nullgame/game.json
			expect(game.fps).toBe(30);
			expect(game.width).toBe(640);
			expect(game.height).toBe(480);
			ctx.end();
			done();
		}, done.fail);
	});

	it("can override game.json", function (done: DoneFn) {
		const ctx = new Context({ overrideGameJson: { width: 200, fps: 60 } });
		ctx.start().then((game: g.Game) => {
			expect(game.fps).toBe(60);
			expect(game.width).toBe(200);
			expect(game.height).toBe(480); // must be untouched nullgame/game.json
			ctx.end();
			done();
		}, done.fail);
	});

	it("can run a game and trap game.external.send()", function (done: DoneFn) {
		const ctx = new Context({
			gameDir: path.resolve(__dirname, "..", "fixture", "testgame")
		});
		ctx.onCalledExternalSend.add((arg) => {
			expect(arg).toBe("age10");
			expect(ctx.game.age).toBe(10);
			expect(ctx.game.vars.rectEntity.x).toBe(11);
			done();
		});
		ctx.start().then((game: g.Game) => {
			// must be identical with fixture/testgame/game.json
			expect(game.fps).toBe(30);
			expect(game.width).toBe(320);
			expect(game.height).toBe(320);
		}, done.fail);
	});
});
