# headless-akashic

## DEPRECATED

**Now the headless runner of Akashic Engine is [officially provided][official] with more generic API.
This repository is deprecated.**

## Intro.

> Japanese Documentation is also [available (ja)][guide-ja]. 日本語の文書は[こちら (ja)][guide-ja].

**headless-akashic** is a headless version of [Akashic Sandbox (ja)][sandbox].
You can run games using [Akashic Engine (ja)][ae] on [Node.js][node], without Web browsers.
Useful for unit testing.

> Unfortunately, Akashic Engine does not provide English documentation yet.
> Whole this library is documented in English just to be prepared for their future translation.
> You need to know Japanese to use this library in practice, at least currently.

## Features

- Almost complete emulation of a `g.Game` instance
- Point events emulation through API
- (Screenshot API) (planned but NOT YET)

## Documents

- [Guide][guide]
- [利用ガイド (ja)][guide-ja]

## License

MIT. See [LICENSE][license].

Some files in the `drivers/` directory are derived from [Akashic Sandbox (ja)][sandbox].
See [LICENSE-DRIVERS][license-drivers] for detail.

[official]: https://github.com/akashic-games/headless-akashic
[sandbox]: https://github.com/akashic-games/akashic-sandbox
[ae]: https://akashic-games.github.io/
[node]: https://nodejs.org/
[guide]: https://github.com/xnv/headless-akashic/blob/master/doc/guide.en.md
[guide-ja]: https://github.com/xnv/headless-akashic/blob/master/doc/guide.ja.md
[license]: https://github.com/xnv/headless-akashic/blob/master/LICENSE
[license-drivers]: https://github.com/xnv/headless-akashic/blob/master/LICENSE-DRIVERS
