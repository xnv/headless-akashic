const path = require("path");
const sh = require("shelljs");

const akashicEngineRoot = path.resolve(__dirname, "..", "node_modules", "@akashic", "akashic-engine");
const dest = path.resolve(__dirname, "..", "drivers");

sh.mkdir("-p", dest);

sh.cat(
	path.resolve(__dirname, "header.js.fragment"),
	path.resolve(dest, "akashic-engine.js"), // created by npm scripts
	path.resolve(__dirname, "footer_akashic-engine.js.fragment")
).to(path.resolve(dest, "akashic-engine.altered.js"));

sh.cat(
	path.resolve(__dirname, "header.js.fragment"),
	path.resolve(dest, "game-driver.js"),  // created by npm scripts
	path.resolve(__dirname, "footer_game-driver.js.fragment")
).to(path.resolve(dest, "game-driver.altered.js"));

sh.cp(path.resolve(akashicEngineRoot, "lib", "main.d.ts"), path.resolve(dest, "akashic-engine.main.d.ts"));
sh.cp(path.resolve(akashicEngineRoot, "lib", "main.node.d.ts"), path.resolve(dest, "akashic-engine.altered.d.ts"));
sh.cp(path.resolve(__dirname, "game-driver.altered.d.ts.template"), path.resolve(dest, "game-driver.altered.d.ts"));
