import * as g from "../../drivers/akashic-engine.altered";

export class NullAudioAsset extends g.AudioAsset {
	_load(loader: g.AssetLoadHandler): void {
		loader._onAssetLoad(this);
	}
}
