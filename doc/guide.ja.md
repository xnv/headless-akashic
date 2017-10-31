# headless-akashic ガイド

**headless-akashic** は、ヘッドレス(headless)の[Akashic Sandbox][sandbox] です。
[Node.js][node]上で、Webブラウザなしに[Akashic Engine][ae]のゲームを動かすことができます。
ユニットテストに利用することを想定しています。

## インストール

npmでインストールできます。 `"devDependencies"` に導入するには:

```
npm i -D @xnv/headless-akashic
```

headless-akashic の提供するエンジン実装は、akashic-sandbox のいずれかのバージョンと同一になっています。
適切なバージョンを選択してください。

|バージョン|@akashic/akashic-sandbox|@akashic/akashic-engine:|
|:--------:|:----------------------:|:----------------------:|
|0.0.1     |0.13.4                  |2.0.0                   |

## 利用法

headless-akashic の利用方法は二つあります:

- コンテンツを丸ごと実行する
- 空の `g.Game` インスタンスを生成する

### コンテンツを丸ごと実行する

ゲームコンテンツを丸ごと実行するには、 `Context` クラスを利用します。
これは headless-akashic のただ一つの公開インターフェイスです。
ゲームコンテンツが `./game/` にある時、次のように起動できます:

```
import { Context } from "@xnv/headless-akashic";

const ctx = new Context({ gameDir: "./game/" });
ctx.start();
setTimeout(() => ctx.end(), 5000);
```

`Context` のコンストラクタは、引数にオブジェクトを一つとります。
引数の `gameDir` プロパティに `game.json` を含むディレクトリのパスを指定してください。
`start()` メソッドによってそのディレクトリのゲームが起動されます。
この例では、実行開始の5秒後に `end()` で実行が停止します。

**注意**: この用法は単純ですが、今のところさほど有用ではありません。
現在の headless-akashic は `g.Renderer` や `g.AudioPlayer` について空実装しか持っていないためです。
すなわち、画像や音声は一切出力されません。
今のところこの用法は、コンテンツが実行時に例外を起こさないことを確認する程度の用途しかないでしょう。

将来的には、より意味のある `g.Renderer` の実装を予定しています。

### 空の `g.Game` インスタンスを生成する

ユニットテストで利用するには、スクリプトアセットに紐づかない空の `g.Game` インスタンスと `g` が必要です。

`Context` の生成時、 `gameDir` プロパティを与えなければ、空のゲームがロードされます。
`Game` のインスタンスは、 `start()` から得ることができます:
`Context#start()` の戻り値は `g.Game` のインスタンスでresolveされる `Promise` です。

```
import { Context } from "@xnv/headless-akashic";

const ctx = new Context();
ctx.start().then((game: g.Game) => {
	// Use `game` as you like
	ctx.end();
});
```

### グローバル変数 `g`

実際的には、 `Game` のインスタンスだけではほとんど何もできません。
たとえばシーン一つ作るにも `g` が必要です。
Akashic Engine のグローバルオブジェクト `g` は、次の `import` で得られます:

```
import "@xnv/headless-akashic/polyfill";
```

この文はグローバル変数 `g` を導入します。
これを使えば、Akashic Engineを用いた任意のコードをテストの中で記述することができます。

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

注意: この `g` はAkashic Engineが提供するものをすべて提供しますが、これには `g.game` は含まれません。
これは不可避の制限です。
スクリプトアセットの実行中と異なり、ユニットテストコードにおいては `g.Game` のインスタンスが一つとは限らないためです。

### TypeScript で利用する場合の注意

TypeScirpt でゲームを開発する場合、通常Akashic Engineの型定義ファイル
(i.e. `@akashic/akashic-engine/lib/main.d.ts`) をコンパイル対象に含める必要があります(`g` の型を解決するため)。

しかし headless-akashic を利用する場合、これは当てはまりません。
`main.d.ts` を手動で導入 **しないでください** 。
`@xnv/headless-akashic/polyfill` をimportすると、適切な型定義ファイルが自動的に参照されます。
このようになっているのは、提供されるエンジン実装(`akashic-engine`)のバージョンが headless-akashic によって定まるからです。

headless-akashic をユニットテストで使う場合、次のような状況が起こり得る点に注意してください。

* コンテンツのビルド用の tsconfig.json では `main.d.ts` を明示的に参照する (`g` は `main.d.ts` によって解決される)
* テストコード用の tsconfig.json では `main.d.ts` を参照しない (テストコードとコンテンツの `g` は headless-akashic 内蔵の型定義で解決される)

もし headless-akashic と合わせてコンパイルした時にだけコンパイルに失敗するのであれば、
コンテンツのビルド時に利用した akashic-engine と対応しないバージョンの headless-akashic を利用している可能性があります。

## API

### new Context(opts)

`Context` のインスタンスを生成します。
引数 `opts` はオブジェクトです(省略可能)。指定された場合、次のプロパティを含めることができます:

|プロパティ|型|説明|
|:------:|:--:|:---------:|
|`gameDir`|string|起動するゲームがあるディレクトリ。省略可能。|
|`overrideGameJson`|object|指定された場合、各プロパティでgame.jsonの内容をオーバーライドする。省略可能。|

### Context#start()

ゲームを起動します。
戻り値は `g.Game` のインスタンスでresolveされる `Promise` です。

### Context#end()

ゲームを終了します。

### Context#game

この `Context` の `g.Game` インスタンス。
`start()` の返した `Promise` がresolveされた後にのみ利用できます。

### Context#firePointDown(x, y, identifier)

座標 (x, y) にある `touchable` なエンティティの `pointDown` トリガーをfireします。
該当するエンティティがなければ `g.Scene#pointDownCapture` をfireします。

`identifier` はマルチタッチデバイス上での指を識別するための値(数値)。省略された場合、 `1` 。

同じ `identifier` で二度以上呼び出す場合、先行して `firePointUp()` が呼び出されなければなりません。

### Context#firePointMove(x, y, identifier)

直前に `pointDown` されたエンティティの `pointMove` トリガー(または `Scene#pointMoveCapture`)をfireします。
呼び出しは `firePointDown()` の後でなければなりません。

### Context#firePointUp(x, y, identifier)

直前に `pointDown` されたエンティティの `pointUp` トリガー(または `Scene#pointUpCapture`)をfireします。
呼び出しは `firePointDown()` の後でなければなりません。

## 制限

- `"@xnv/headless-akashic/polyfill"` の導入する `g` は `g.game` を提供しません。
- `g.Storage` と関連する機能は未サポートです。

[sandbox]: https://github.com/akashic-games/akashic-sandbox
[node]: https://nodejs.org/
[ae]: https://akashic-games.github.io/
[jasmine]: https://github.com/jasmine/jasmine-npm

