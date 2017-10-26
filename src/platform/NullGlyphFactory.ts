import * as g from "../../drivers/akashic-engine.altered";

export class NullGlyphFactory extends g.GlyphFactory {
	create(code: number): g.Glyph {
		return new g.Glyph(code, 0, 0, 0, 0, 0, 0, this.fontSize, undefined, true);
	}
	measureMinimumFontSize(): number {
		return 1;
	}
}
