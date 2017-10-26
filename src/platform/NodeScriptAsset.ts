import * as fs from "fs";
import * as path from "path";
import * as g from "../../drivers/akashic-engine.altered";

export class NodeScriptAsset extends g.ScriptAsset {
	static PRE_SCRIPT: string = "(function(exports, require, module, __filename, __dirname) {";
	static POST_SCRIPT: string = "})(g.module.exports, g.module.require, g.module, g.filename, g.dirname);";

	_load(loader: g.AssetLoadHandler): void {
		fs.readFile(path.resolve(this.path), (err: any, data: any) => {
			if (err) return loader._onAssetLoad(err);
			this.script = data.toString();
			return loader._onAssetLoad(this);
		});
	}

	execute(execEnv: g.ScriptAssetExecuteEnvironment): any {
		var func = new Function("g", NodeScriptAsset.PRE_SCRIPT + this.script + NodeScriptAsset.POST_SCRIPT);
		func(execEnv);
		return execEnv.module.exports;
	}
}
