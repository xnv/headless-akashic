import * as g from "../../drivers/akashic-engine.altered";
import { NullImageAsset } from "./NullImageAsset";
import { NullSurface } from "./NullSurface";
import { NullAudioAsset } from "./NullAudioAsset";
import { NullAudioPlayer } from "./NullAudioPlayer";
import { NodeTextAsset } from "./NodeTextAsset";
import { NodeScriptAsset } from "./NodeScriptAsset";
import { NullGlyphFactory } from "./NullGlyphFactory";

export class ResourceFactory extends g.ResourceFactory {
	createImageAsset(id: string, assetPath: string, width: number, height: number): g.ImageAsset {
		return new NullImageAsset(id, assetPath, width, height);
	}

	createVideoAsset(id: string, assetPath: string, width: number, height: number,
	                 system: g.VideoSystem, loop: boolean, useRealSize: boolean): g.VideoAsset {
		throw new Error("XHA: not supported");
	}

	createAudioAsset(id: string, assetPath: string, duration: number,
	                 system: g.AudioSystem, loop: boolean, hint: g.AudioAssetHint): g.AudioAsset {
		return new NullAudioAsset(id, assetPath, duration, system, loop, hint);
	}

	createAudioPlayer(system: g.AudioSystem): g.AudioPlayer {
		return new NullAudioPlayer(system);
	}

	createTextAsset(id: string, assetPath: string): g.TextAsset {
		return new NodeTextAsset(id, assetPath);
	}

	createScriptAsset(id: string, assetPath: string): g.ScriptAsset {
		return new NodeScriptAsset(id, assetPath);
	}

	createSurface(width: number, height: number): g.Surface {
		return new NullSurface(width, height);
	}

	createGlyphFactory(fontFamily: g.FontFamily | string | (g.FontFamily | string)[], fontSize: number,
	                   baselineHeight?: number, fontColor?: string, strokeWidth?: number, strokeColor?: string,
	                   strokeOnly?: boolean, fontWeight?: g.FontWeight): g.GlyphFactory {
		return new NullGlyphFactory(fontFamily, fontSize, baselineHeight, fontColor, strokeWidth, strokeColor, strokeOnly, fontWeight);
	}
}
