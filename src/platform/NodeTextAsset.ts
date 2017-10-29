import * as fs from "fs";
import * as path from "path";
import * as g from "../../drivers/akashic-engine.altered";

export class NodeTextAsset extends g.TextAsset {
	_load(loader: g.AssetLoadHandler): void {
		fs.readFile(path.resolve(this.path), (err: any, data: any) => {
			if (err) return loader._onAssetLoad(err);
			this.data = data.toString();
			return loader._onAssetLoad(this);
		});
	}
}
