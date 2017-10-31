# headless-akashic Guide

**headless-akashic** is a headless version of [Akashic Sandbox (ja)][sandbox].
You can run games using [Akashic Engine (ja)][ae] on [Node.js][node], without Web browsers.
Useful for unit testing.

## Why?

Testing contents built on Akashic Engine is not easy in general.
You can examine the behaviour of your game with `akashic-sandbox` but it is hard to be automated.
Everytime you modify the code you need to run the game, click appropriate points on the screen,
wait for a while and finally see the world is not broken.

This is too painful, especially for library development
because their expected behaviour is clear and stable in many cases.
We need to test them.

headless-akashic is here for you.

It provides `g` and a `g.Game` instance in the Node.js environment.
Using given `Game` instance, you can write unit tests with any test framework such as [Jasmine][jasmine].

## Install

Use npm. To install as `"devDependencies"`:

```
npm i -DE @xnv/headless-akashic@0.0.1
```

The engine implementation provided by headless-akashic is identical to a specific version of akashic-sandbox.
Choose appropriate one.

|version|@akashic/akashic-sandbox|@akashic/akashic-engine:|
|:-----:|:----------------------:|:----------------------:|
|0.0.1  |0.13.4                  |2.0.0                   |

## Usage

There are two ways to use headless-akashic:

- Run a whole game content
- Provide a bare `g.Game` instance to write tests

### Run a Whole Game Content

To run a whole game content, use `Context` class, the only public interface of headless-akashic.
When you have a game content in `./game/`, it can be launched by:

```
import { Context } from "@xnv/headless-akashic";

const ctx = new Context({ gameDir: "./game/" });
ctx.start();
setTimeout(() => ctx.end(), 5000);
```

The constructor of `Context` takes one object argument.
Specify the path to a directory containing `game.json` to the `gameDir` property.
Then calling `start()` method launches the game in the directory.
In this example, the execution stops after five seconds by `end()`.

**NOTE**: this is simple but currently not very useful.
Because the current headless-akashic provides only null implementation of `g.Renderer` and `g.AudioPlayer`.
This means no visual/audio output will be generated.
You can use this option only to check that the content causes no runtime exception.

A more useful `g.Renderer` is planned to be implemented.

### A bare `g.Game` Instance

To use in unit test code, we need a bare `g.Game` instance and `g` without script assets execution.

When `Context` is instantiated without `gameDir` properties, it launches an empty game.
Its game instance can be obtained with `start()`.
`Context#start()` returns a `Promise` resolved with the game instance.

```
import { Context } from "@xnv/headless-akashic";

const ctx = new Context();
ctx.start().then((game: g.Game) => {
	// Use `game` as you like
	ctx.end();
});
```

### The global variable `g`

In practice, you can do nothing if you have only the game instance.
You need `g`, for instance, to create a scene.

The Akashic Engine's global object `g` is provided through the following `import`:

```
import "@xnv/headless-akashic/polyfill";
```

This statement introduces a global variable `g`.
Now you can write any code using Akashic Engine in tests like:

```
import { Context } from "@xnv/headless-akashic";
import "@xnv/headless-akashic/polyfill";

const ctx = new Context();
ctx.start().then((game: g.Game) => {
	const scene = new g.Scene({ game });
	scene.loaded.add(() => {
		// do anything
		ctx.end();
	});
	game.pushScene(scene);
});
```

NOTE: This object `g` provides anything in Akashic Engine but `g.game`.
This is an inevitable limitation.
Because the game instance is not unique here.
Unlike in script assets, two or more `g.Game` objects can be instantiated in parallel.

### Note for TypeScript Users

In general, you need to add the type declaration of Akashic Engine
(i.e. `@akashic/akashic-engine/lib/main.d.ts`) to your compile targets
when you write your game in TypeScript (to resolve the type of `g`).

But this is not the case for headless-akashic.
You *SHOULD NOT* include `main.d.ts` manually because
it will be introduced by `@xnv/headless-akashic/polyfill` automatically.
Because the version of `akashic-engine` is determined by the headless-akashic,
the appropriate `main.d.ts` is also determined by headless-akashic itself.

Note that if you are using headless-akashic in unit tests, the following situation may occur:

* tsconfig.json for building the content refers `main.d.ts` explicitly (`g` is resolved by `main.d.ts`), and
* tsconfig.json for test code does not refer `main.d.ts` (`g` for tests and the content resolved by headless-akashic).

If your code fails to compile only with headless-akashic then you might use an inconsistent version of headless-akashic.

## API

### new Context(opts)

Creates an instance of `Context`.
The argument `opts` is an optional object. When specified, it may includes:

|property|type|description|
|:------:|:--:|:---------:|
|`gameDir`|string|The directory of the game to launch. Optinal.|
|`overrideGameJson`|object|If given, override to game.json's property. Optional.|

### Context#start()

Launch the game.
Returns a `Promise` resolved with the game instance (a `g.Game`).

### Context#end()

Terminates the game.

### Context#game

The game instance of the context.
Available after the `Promise` returned by `start()` resolved.

### Context#firePointDown(x, y, identifier)

Fire `pointDown` trigger of the touchable frontmost entity at (x, y).
If no entity found, fire `Scene#pointDownCapture`.

The `identifier` is an optional number to distinguish finger (to emulate multi-touch device).
If not specified, will be treated as `1`.

Must follows `firePointUp()` when calling more than once on the same `identifier`.

### Context#firePointMove(x, y, identifier)

Fire `pointMove` trigger of the recent `pointDown`'ed entity.
Must follows `firePointDown()` if called.

### Context#firePointUp(x, y, identifier)

Fire `pointUp` trigger of the recent `pointDown`'ed entity.
Must follows `firePointDown()` if called.

## Limitation

- `g.game` is not provided in `g` introduced by `"@xnv/headless-akashic/polyfill"` 
- `g.Storage` and related functions are not supported.

[sandbox]: https://github.com/akashic-games/akashic-sandbox
[jasmine]: https://github.com/jasmine/jasmine-npm
