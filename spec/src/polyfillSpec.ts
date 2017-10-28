// import "../../polyfill";

xdescribe("polyfill", function () {
	it("is given", function () {
		expect(!!g).toBe(true);
		expect(g.Game instanceof Function).toBe(true);
		expect(g.Scene instanceof Function).toBe(true);
	});

	it("has no game", function () {
		expect(g.game).toBe(undefined);
	});
});
