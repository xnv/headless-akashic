function main(param) {
	const scene = new g.Scene({game: g.game});
	scene.loaded.add(function() {
		const rect = new g.FilledRect({
			scene: scene,
			cssColor: "#ff0000",
			width: 32,
			height: 32
		});
		rect.update.add(function () {
			rect.x++;
			if (rect.x > g.game.width) rect.x = 0;
			rect.modified();
		});
		scene.append(rect);

		g.game.vars.rectEntity = rect;

		scene.update.add(function () {
			if (g.game.age === 10)
				g.game.external.send("age10");

			// v2.6.4 までに追加された機能が呼び出せることを確認
			const r = g.game.random.generate();
			if (r >= 1)
				throw new Error("never reach");
		});
	});
	g.game.pushScene(scene);
}

module.exports = main;
