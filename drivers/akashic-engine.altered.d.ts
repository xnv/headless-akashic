
declare namespace g {
    /**
     * アセット読み込み失敗時のエラーの種別。
     *
     * この値はあくまでもエラーメッセージ出力のための補助情報であり、
     * 網羅性・厳密性を追求したものではないことに注意。
     */
    enum AssetLoadErrorType {
        /**
         * 明示されていない(以下のいずれかかもしれないし、そうでないかもしれない)。
         */
        Unspecified = 0,
        /**
         * エンジンの再試行回数上限設定値を超えた。
         */
        RetryLimitExceeded = 1,
        /**
         * ネットワークエラー。タイムアウトなど。
         */
        NetworkError = 2,
        /**
         * リクエストに問題があるエラー。HTTP 4XX など。
         */
        ClientError = 3,
        /**
         * サーバ側のエラー。HTTP 5XX など。
         */
        ServerError = 4,
    }
}
declare namespace g {
    /**
     * アサーションエラー。
     * エンジンが想定しない状態に陥った場合にthrowされる。メソッドの引数が正しくない場合などもこのエラーがthrowされる。
     */
    interface AssertionError extends Error {
        cause?: any;
    }
    /**
     * 型ミスマッチエラー。
     * 期待されるものと異なる型の値が与えられた場合にthrowされる。
     */
    interface TypeMismatchError extends Error {
        cause?: any;
        /**
         * 期待される型情報。
         */
        expected: string;
        /**
         * 実際に渡されたオブジェクト。
         */
        actual: any;
    }
    /**
     * アセットロードエラー。
     * `Asset#_load()` が失敗した時、`AssetLoadHandler#_onAssetError` に渡される。
     *
     * エラーの理由は `message` から、そのおおまかな種別は `type` から得ることができる。
     * ただし特に `message` の内容はアセットの実装に依存するため、 `message` の値で処理を変更してはならない。
     * 読み込みの再試行が可能かどうかは `retriable` で判断すべきである。
     */
    interface AssetLoadError extends Error {
        cause?: any;
        /**
         * 再試行できるエラーかどうか。
         *
         * `Asset#_load()` が再試行できない要因 (HTTP 404 Not Found など) で失敗した時、偽。でなければ真。
         * 通常の場合 (`Scene` 経由で読み込んだ場合)、読み込み失敗回数が再試行回数上限 `AssetManager.MAX_ERROR_COUNT` を超えた際にも偽になる。
         */
        retriable: boolean;
        /**
         * エラーの種別。
         *
         * ダンプやエラーメッセージ出力のためのエラー種別情報。
         * この値はあくまでも `message` (内容がアセットの実装依存) の補助情報である。
         * 読み込み再試行の可否は `retriable` によって判断すべきである。
         */
        type: AssetLoadErrorType;
    }
    /**
     * 例外生成ファクトリ。
     * エンジン内部での例外生成に利用するもので、ゲーム開発者は通常本モジュールを利用する必要はない。
     */
    module ExceptionFactory {
        function createAssertionError(message: string, cause?: any): AssertionError;
        function createTypeMismatchError(methodName: string, expected: any, actual?: any, cause?: any): TypeMismatchError;
        function createAssetLoadError(message: string, retriable?: boolean, type?: AssetLoadErrorType, cause?: any): AssetLoadError;
    }
    interface StorageLoadError extends Error {
        cause?: any;
    }
}
declare namespace g {
    /**
     * リソースの生成を行うクラス。
     *
     * このクラス (の実装クラス) のインスタンスはエンジンによって生成される。ゲーム開発者が生成する必要はない。
     * またこのクラスの各種アセット生成メソッドは、エンジンによって暗黙に呼び出されるものである。
     * 通常ゲーム開発者が呼び出す必要はない。
     */
    abstract class ResourceFactory {
        abstract createImageAsset(id: string, assetPath: string, width: number, height: number): ImageAsset;
        abstract createVideoAsset(id: string, assetPath: string, width: number, height: number, system: VideoSystem, loop: boolean, useRealSize: boolean): VideoAsset;
        abstract createAudioAsset(id: string, assetPath: string, duration: number, system: AudioSystem, loop: boolean, hint: AudioAssetHint): AudioAsset;
        abstract createTextAsset(id: string, assetPath: string): TextAsset;
        abstract createAudioPlayer(system: AudioSystem): AudioPlayer;
        abstract createScriptAsset(id: string, assetPath: string): ScriptAsset;
        /**
         * Surface を作成する。
         * 与えられたサイズで、ゲーム開発者が利用できる描画領域 (`Surface`) を作成して返す。
         * 作成された直後のSurfaceは `Renderer#clear` 後の状態と同様であることが保証される。
         * @param width 幅(ピクセル、整数値)
         * @param height 高さ(ピクセル、整数値)
         */
        abstract createSurface(width: number, height: number): Surface;
        /**
         * GlyphFactory を作成する。
         *
         * @param fontFamily フォントファミリ。g.FontFamilyの定義する定数、フォント名、またはそれらの配列で指定する。
         * @param fontSize フォントサイズ
         * @param baselineHeight 描画原点からベースラインまでの距離。生成する `g.Glyph` は
         *                       描画原点からこの値分下がったところにベースラインがあるかのように描かれる。省略された場合、 `fontSize` と同じ値として扱われる
         * @param fontColor フォントの色。省略された場合、 `"black"` として扱われる
         * @param strokeWidth ストローク(縁取り線)の幅。省略された場合、 `0` として扱われる
         * @param strokeColor ストロークの色。省略された場合、 `"black"` として扱われる
         * @param strokeOnly ストロークのみを描画するか否か。省略された場合、偽として扱われる
         * @param fontWeight フォントウェイト。省略された場合、 `FontWeight.Normal` として扱われる
         */
        abstract createGlyphFactory(fontFamily: FontFamily | string | (g.FontFamily | string)[], fontSize: number, baselineHeight?: number, fontColor?: string, strokeWidth?: number, strokeColor?: string, strokeOnly?: boolean, fontWeight?: FontWeight): GlyphFactory;
        createSurfaceAtlas(width: number, height: number): SurfaceAtlas;
    }
}
declare namespace g {
    /**
     * オフセット特性インターフェース。
     */
    interface CommonOffset {
        x: number;
        y: number;
    }
    /**
     * サイズ特性インターフェース。
     */
    interface CommonSize {
        width: number;
        height: number;
    }
    /**
     * 汎用領域インターフェース。
     */
    interface CommonArea extends CommonOffset, CommonSize {
    }
    /**
     * 汎用矩形インターフェース。
     */
    interface CommonRect {
        left: number;
        right: number;
        top: number;
        bottom: number;
    }
}
declare namespace g {
    interface RequireCacheable {
        /**
         * @private
         */
        _cachedValue: () => any;
    }
}
declare namespace g {
    class RequireCachedValue implements RequireCacheable {
        _value: any;
        constructor(value: any);
        /**
         * @private
         */
        _cachedValue(): any;
    }
}
declare namespace g {
    /**
     * 破棄可能なオブジェクトかを表すインターフェース。
     */
    interface Destroyable {
        /**
         * オブジェクトを破棄する。
         */
        destroy(): void;
        /**
         * 破棄されたオブジェクトかどうかを判定する。
         */
        destroyed(): boolean;
    }
}
declare namespace g {
    /**
     * 登録と抹消が行えることを表すインターフェース。
     */
    interface Registrable<T> {
        /**
         * 登録。
         */
        register(target: T): void;
        /**
         * 抹消。
         */
        unregister(target: T): void;
    }
}
declare namespace g {
    /**
     * 乱数生成器。
     * `RandomGenerator#get()` によって、新しい乱数を生成することができる。
     */
    abstract class RandomGenerator {
        /**
         * 本乱数生成器の種を表す。ゲーム開発者は本値を直接書き換えてはならない。
         */
        seed: number;
        /**
         * このインスタンス (`this`) と同じ値。
         * この値は過去に `g.Game#random` が配列だった当時との互換性のために提供されている。
         * @deprecated 非推奨である。ゲーム開発者はこの値ではなく単にこのインスタンス自身を利用すべきである。
         */
        0?: RandomGenerator;
        constructor(seed: number);
        abstract get(min: number, max: number): number;
        abstract serialize(): any;
    }
}
declare namespace g {
    /**
     * 状態のビットフラグを表す数値。
     */
    const enum EntityStateFlags {
        /**
         * 特にフラグが立っていない状態。
         */
        None = 0,
        /**
         * 非表示フラグ。
         */
        Hidden = 1,
        /**
         * 描画結果がキャッシュ済みであることを示すフラグ。
         */
        Cached = 2,
        /**
         * modifiedされ、描画待ちであることを示すフラグ。
         */
        Modified = 4,
        /**
         * 軽量な描画処理を利用できることを示すフラグ。
         */
        ContextLess = 8,
    }
}
declare namespace g {
    /**
     * `Asset` の読み込みまたは読み込み失敗を受け取るハンドラのインターフェース定義。
     * 通常、このインターフェースをゲーム開発者が利用する必要はない。
     * `AssetManagerLoadHandler` とは異なる。こちらは `Asset` の読み込み処理を直接実行する場合に用いるハンドラである。
     */
    interface AssetLoadHandler {
        /**
         * 読み込失敗の通知を受ける関数。
         * @param asset 読み込みに失敗したアセット
         * @param error 失敗の内容を表すエラー
         */
        _onAssetError(asset: Asset, error: AssetLoadError): void;
        /**
         * 読み込み完了の通知を受ける関数。
         * @param asset 読み込みが完了したアセット
         */
        _onAssetLoad(asset: Asset): void;
    }
}
declare namespace g {
    /**
     * 各種リソースを表すクラス。
     * 本クラスのインスタンスをゲーム開発者が直接生成することはない。
     * game.jsonによって定義された内容をもとに暗黙的に生成されたインスタンスを、
     * Scene#assets、またはGame#assetsによって取得して利用する。
     */
    abstract class Asset implements Destroyable {
        id: string;
        path: string;
        originalPath: string;
        onDestroyed: Trigger<g.Asset>;
        constructor(id: string, path: string);
        destroy(): void;
        destroyed(): boolean;
        /**
         * 現在利用中で解放出来ない `Asset` かどうかを返す。
         * 戻り値は、利用中である場合真、でなければ偽である。
         *
         * 本メソッドは通常 `false` が返るべきである。
         * 例えば `Sprite` の元画像として使われているケース等では、その `Sprite` によって `Asset` は `Surface` に変換されているべきで、
         * `Asset` が利用中で解放出来ない状態になっていない事を各プラットフォームで保障する必要がある。
         *
         * 唯一、例外的に本メソッドが `true` を返すことがあるのは音楽を表す `Asset` である。
         * BGM等はシーンをまたいで演奏することもありえる上、
         * 演奏中のリソースのコピーを常に各プラットフォームに強制するにはコストがかかりすぎるため、
         * 本メソッドは `true` を返し、適切なタイミングで `Asset` が解放されるよう制御する必要がある。
         */
        inUse(): boolean;
        /**
         * アセットの読み込みを行う。
         *
         * ゲーム開発者がアセット読み込み失敗時の挙動をカスタマイズする際、読み込みを再試行する場合は、
         * (このメソッドではなく) `AssetLoadFailureInfo#cancelRetry` に真を代入する必要がある。
         *
         * @param loader 読み込み結果の通知を受け取るハンドラ
         * @private
         */
        abstract _load(loader: AssetLoadHandler): void;
        /**
         * @private
         */
        _assetPathFilter(path: string): string;
    }
    /**
     * 画像リソースを表すクラス。
     * 本クラスのインスタンスをゲーム開発者が直接生成することはない。
     * game.jsonによって定義された内容をもとに暗黙的に生成されたインスタンスを、
     * Scene#assets、またはGame#assetsによって取得して利用する。
     *
     * width, heightでメタデータとして画像の大きさをとることは出来るが、
     * ゲーム開発者はそれ以外の情報を本クラスから直接は取得せず、Sprite等に本リソースを指定して利用する。
     */
    abstract class ImageAsset extends Asset {
        width: number;
        height: number;
        constructor(id: string, assetPath: string, width: number, height: number);
        abstract asSurface(): Surface;
    }
    /**
     * 動画リソースを表すクラス。
     * 本クラスのインスタンスをゲーム開発者が直接生成することはない。
     * game.jsonによって定義された内容をもとに暗黙的に生成されたインスタンスを、
     * Scene#assets、またはGame#assetsによって取得して利用する。
     */
    abstract class VideoAsset extends ImageAsset {
        /**
         * 動画の本来の幅。
         *
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を変更してはならない。
         */
        realWidth: number;
        /**
         * 動画の本来の高さ。
         *
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を変更してはならない。
         */
        realHeight: number;
        /**
         * @private
         */
        _system: VideoSystem;
        /**
         * @private
         */
        _loop: boolean;
        /**
         * @private
         */
        _useRealSize: boolean;
        constructor(id: string, assetPath: string, width: number, height: number, system: VideoSystem, loop: boolean, useRealSize: boolean);
        abstract asSurface(): Surface;
        play(loop?: boolean): VideoPlayer;
        stop(): void;
        abstract getPlayer(): VideoPlayer;
        destroy(): void;
    }
    /**
     * 音リソースを表すクラス。
     * 本クラスのインスタンスをゲーム開発者が直接生成することはない。
     * game.jsonによって定義された内容をもとに暗黙的に生成されたインスタンスを、
     * Scene#assets、またはGame#assetsによって取得して利用する。
     *
     * AudioAsset#playを呼び出す事で、その音を再生することが出来る。
     */
    abstract class AudioAsset extends Asset {
        data: any;
        duration: number;
        loop: boolean;
        hint: AudioAssetHint;
        /**
         * @private
         */
        _system: AudioSystem;
        /**
         * @private
         */
        _lastPlayedPlayer: AudioPlayer;
        constructor(id: string, assetPath: string, duration: number, system: AudioSystem, loop: boolean, hint: AudioAssetHint);
        play(): AudioPlayer;
        stop(): void;
        inUse(): boolean;
        destroy(): void;
    }
    /**
     * 文字列リソースを表すクラス。
     * 本クラスのインスタンスをゲーム開発者が直接生成することはない。
     * game.jsonによって定義された内容をもとに暗黙的に生成されたインスタンスを、
     * Scene#assets、またはGame#assetsによって取得して利用する。
     *
     * TextAsset#dataによって、本リソースが保持する文字列を取得することが出来る。
     */
    abstract class TextAsset extends Asset {
        data: string;
        constructor(id: string, assetPath: string);
        destroy(): void;
    }
    /**
     * スクリプトリソースを表すクラス。
     * 本クラスのインスタンスをゲーム開発者が直接生成することはない。
     * game.jsonによって定義された内容をもとに暗黙的に生成されたインスタンスを、
     * Scene#assets、またはGame#assetsによって取得して利用する。
     *
     * ScriptAsset#executeによって、本リソースが表すスクリプトを実行し、その結果を受け取る事が出来る。
     * requireによる参照とは異なり、executeはキャッシュされないため、何度でも呼び出し違う結果を受け取ることが出来る。
     */
    abstract class ScriptAsset extends Asset {
        script: string;
        abstract execute(execEnv: ScriptAssetExecuteEnvironment): any;
        destroy(): void;
    }
}
declare namespace g {
    /**
     * `AssetManager` から `Asset` の読み込みまたは読み込み失敗を受け取るハンドラのインターフェース定義。
     * `AssetLoadHandler` とは異なる。こちらは `AssetManager` を経由してのアセットの読み込み処理を行う場合のハンドラである。
     */
    interface AssetManagerLoadHandler {
        /**
         * 読み込失敗の通知を受ける関数。
         * @param asset 読み込みに失敗したアセット
         * @param error 失敗の内容を表すエラー
         * @param manager アセットの読み込みを試みた`AssetManager`. この値の `retryLoad()` を呼び出すことで読み込みを再試行できる
         */
        _onAssetError(asset: Asset, error: AssetLoadError, manager: AssetManager): void;
        /**
         * 読み込み完了の通知を受ける関数。
         * @param asset 読み込みが完了したアセット
         */
        _onAssetLoad(asset: Asset): void;
    }
}
declare namespace g {
    /**
     * `Asset` の読み込み失敗を通知するインターフェース。
     */
    interface AssetLoadFailureInfo {
        /**
         * 読み込みに失敗したアセット。
         */
        asset: Asset;
        /**
         * 失敗の内容を表すエラー。
         * `error.retriable` が偽である場合、エンジンは強制的にゲーム続行を断念する (`Game#terminateGame()` を行う) 。
         */
        error: AssetLoadError;
        /**
         * 読み込み再試行をキャンセルするかどうか。
         * 初期値は偽である。
         * ゲーム開発者はこの値を真に変更することで、再試行をさせない(ゲーム続行を断念する)ことができる。
         * `error.retriable` が偽である場合、この値の如何にかかわらず再試行は行われない。
         */
        cancelRetry: boolean;
    }
}
declare namespace g {
    /**
     * `Asset` を管理するクラス。
     *
     * このクラスのインスタンスは `Game` に一つデフォルトで存在する(デフォルトアセットマネージャ)。
     * デフォルトアセットマネージャは、game.json に記述された通常のアセットを読み込むために利用される。
     *
     * ゲーム開発者は、game.json に記述のないリソースを取得するために、このクラスのインスタンスを独自に生成してよい。
     */
    class AssetManager implements AssetLoadHandler {
        static MAX_ERROR_COUNT: number;
        /**
         * このインスタンスが属するゲーム。
         */
        game: Game;
        /**
         * コンストラクタに渡されたアセットの設定。(assets.json が入っていることが期待される)
         */
        configuration: {
            [key: string]: any;
        };
        /**
         * 読み込み済みのアセット。
         * requestAssets() で読み込みをリクエストしたゲーム開発者はコールバックでアセットを受け取るので、この変数を参照する必要は通常ない
         * @private
         */
        _assets: {
            [key: string]: Asset;
        };
        /**
         * 読み込み済みのrequire解決用の仮想パスからアセットを引くためのテーブル。
         * アセットIDと異なり、ファイルパスは重複しうる (同じ画像を複数の名前で参照することはできる) ので、要素数は `_assets` 以下である。
         * この情報は逆引き用の補助的な値にすぎない。このクラスの読み込み済みアセットの管理はすべて `_assets` 経由で行う。
         * @private
         */
        _liveAssetVirtualPathTable: {
            [key: string]: Asset;
        };
        /**
         * 読み込み済みのアセットの絶対パスからrequire解決用の仮想パスを引くためのテーブル。
         * @private
         */
        _liveAbsolutePathTable: {
            [path: string]: string;
        };
        /**
         * 各アセットに対する参照の数。
         * 参照は requestAssets() で増え、unrefAssets() で減る。
         * なおロード中であっても参照に数える。つまり (this._refCounts[id] > 1) であるなら !!(this._assets[id] || this._loadings[id])
         * @private
         */
        _refCounts: {
            [key: string]: number;
        };
        /**
         * 読み込み中のアセットの情報。
         */
        private _loadings;
        /**
         * `AssetManager` のインスタンスを生成する。
         *
         * @param game このインスタンスが属するゲーム
         * @param conf このアセットマネージャに与えるアセット定義。game.json の `"assets"` に相当。
         */
        constructor(game: Game, conf?: AssetConfigurationMap, audioSystemConfMap?: AudioSystemConfigurationMap);
        /**
         * このインスタンスを破棄する。
         */
        destroy(): void;
        /**
         * このインスタンスが破棄済みであるかどうかを返す。
         */
        destroyed(): boolean;
        /**
         * `Asset` の読み込みを再試行する。
         *
         * 引数 `asset` は読み込みの失敗が (`Scene#assetLoadFail` で) 通知されたアセットでなければならない。
         * @param asset 読み込みを再試行するアセット
         */
        retryLoad(asset: Asset): void;
        /**
         * このインスタンスに与えられた `AssetConfigurationMap` のうち、グローバルアセットのIDをすべて返す。
         */
        globalAssetIds(): string[];
        /**
         * アセットの取得を要求する。
         *
         * 要求したアセットが読み込み済みでない場合、読み込みが行われる。
         * 取得した結果は `handler` を通して通知される。
         * ゲーム開発者はこのメソッドを呼び出してアセットを取得した場合、
         * 同じアセットID(または取得したアセット)で `unrefAsset()` を呼び出さなければならない。
         *
         * @param assetIdOrConf 要求するアセットのIDまたは設定
         * @param handler 要求結果を受け取るハンドラ
         */
        requestAsset(assetIdOrConf: string | DynamicAssetConfiguration, handler: AssetManagerLoadHandler): boolean;
        /**
         * アセットの参照カウントを減らす。
         * 引数の各要素で `unrefAsset()` を呼び出す。
         *
         * @param assetOrId 参照カウントを減らすアセットまたはアセットID
         */
        unrefAsset(assetOrId: string | Asset): void;
        /**
         * 複数のアセットの取得を要求する。
         * 引数の各要素で `requestAsset()` を呼び出す。
         *
         * @param assetIdOrConfs 取得するアセットのIDまたはアセット定義
         * @param handler 取得の結果を受け取るハンドラ
         */
        requestAssets(assetIdOrConfs: (string | DynamicAssetConfiguration)[], handler: AssetManagerLoadHandler): number;
        /**
         * 複数のアセットを解放する。
         * 引数の各要素で `unrefAsset()` を呼び出す。
         *
         * @param assetOrIds 参照カウントを減らすアセットまたはアセットID
         * @private
         */
        unrefAssets(assetOrIds: (string | Asset)[]): void;
        _normalize(configuration: any, audioSystemConfMap: AudioSystemConfigurationMap): any;
        /**
         * @private
         */
        _createAssetFor(idOrConf: string | DynamicAssetConfiguration): Asset;
        _releaseAsset(assetId: string): void;
        /**
         * 現在ロード中のアセットの数。(デバッグ用; 直接の用途はない)
         * @private
         */
        _countLoadingAsset(): number;
        /**
         * @private
         */
        _onAssetError(asset: Asset, error: AssetLoadError): void;
        /**
         * @private
         */
        _onAssetLoad(asset: Asset): void;
    }
}
declare namespace g {
    /**
     * node.js の require() ライクな読み込み処理を行い、その結果を返す。
     *
     * node.jsのrequireに限りなく近いモデルでrequireする。
     * ただしアセットIDで該当すればそちらを優先する。また node.js のコアモジュールには対応していない。
     * 通常、ゲーム開発者が利用するのは `Module#require()` であり、このメソッドはその内部実装を提供する。
     * @param game requireを実行するコンテキストを表すGameインスタンス
     * @param path requireのパス。相対パスと、Asset識別名を利用することが出来る。
     *              なお、./xxx.json のようにjsonを指定する場合、そのAssetはTextAssetである必要がある。
     *              その他の形式である場合、そのAssetはScriptAssetである必要がある。
     * @param currentModule このrequireを実行した Module
     * @returns {any} スクリプト実行結果。通常はScriptAsset#executeの結果。
     *                 例外的に、jsonであればTextAsset#dataをJSON.parseした結果が返る
     */
    function _require(game: Game, path: string, currentModule?: Module): any;
    /**
     * Node.js が提供する module の互換クラス。
     */
    class Module {
        /**
         * モジュールのID。
         * アセットIDとは異なることに注意。
         */
        id: string;
        /**
         * このモジュールのファイル名。
         * フルパスで与えられる。
         */
        filename: string;
        /**
         * このモジュールが公開する値。
         */
        exports: any;
        /**
         * このモジュールの親。一番最初にこのモジュール (のファイル) を require() したモジュール。
         * 該当するモジュールがなければ `null` である。
         */
        parent: Module;
        /**
         * このモジュールの読み込みが完了しているか。
         */
        loaded: boolean;
        /**
         * このモジュールが `require()` したモジュール。
         */
        children: Module[];
        /**
         * このモジュール内で `require()` した時の検索先ディレクトリ。
         */
        paths: string[];
        /**
         * このモジュールの評価時に与えられる `require()` 関数。
         */
        require: (path: string) => any;
        /**
         * @private
         */
        _dirname: string;
        /**
         * @private
         */
        _virtualDirname: string;
        /**
         * @private
         */
        _g: ScriptAssetExecuteEnvironment;
        constructor(game: Game, id: string, path: string);
    }
}
declare namespace g {
    /**
     * `ScriptAsset` の実行時、`g` 以下に加えられる値を定めたinterface。
     * `g` の実際の値は、本来の `g` のすべてのプロパティに加えて以下を持つ必要がある。
     *
     * 通常のゲーム開発者がこのクラスを直接利用する必要はない。
     * `ScriptAsset` を実行する場合は、暗黙にこのクラスを利用する `require()` を用いるべきである。
     */
    interface ScriptAssetExecuteEnvironment {
        /**
         * `ScriptAsset` にひも付けられた `Game` 。
         */
        game: g.Game;
        /**
         * この `ScriptAsset` が公開する値のプレースホルダ。
         * エンジンはここに代入された値を `module.exports` に代入されたものとみなす。
         */
        exports: any;
        /**
         * この `ScriptAsset` のファイルパスのうち、ディレクトリ部分。
         */
        dirname: string;
        /**
         * この `ScriptAsset` のファイルパス。
         */
        filename: string;
        /**
         * この `ScriptAsset` に対応するモジュール。
         */
        module: Module;
    }
}
declare namespace g {
    /**
     * `ScriptAsset` の実行コンテキスト。
     * 通常スクリプトアセットを実行するためにはこのクラスを経由する。
     *
     * ゲーム開発者がこのクラスを利用する必要はない。
     * スクリプトアセットを実行する場合は、暗黙にこのクラスを利用する `require()` を用いること。
     */
    class ScriptAssetContext implements RequireCacheable {
        /**
         * @private
         */
        _asset: ScriptAsset;
        /**
         * @private
         */
        _game: Game;
        /**
         * @private
         */
        _module: Module;
        /**
         * @private
         */
        _started: boolean;
        private _g;
        constructor(game: Game, asset: ScriptAsset);
        /**
         * @private
         */
        _cachedValue(): any;
        /**
         * @private
         */
        _executeScript(currentModule?: Module): any;
    }
}
declare namespace g {
    /**
     * 変換行列を表すインターフェース。
     * 通常ゲーム開発者が本インターフェースを直接利用する事はない。
     */
    interface Matrix {
        /**
         * 変更フラグ。
         * 本フラグが立っていても特に何も処理はされない。
         * 本フラグの操作、本フラグを参照して値を再計算することは、いずれも利用する側で適切に処理をする必要がある。
         * @private
         */
        _modified: boolean;
        /**
         * 変換本体。
         * CanvasRenderingContext2D#transformの値と等しい。
         * ```
         *   a c e
         * [ b d f ]
         *   0 0 1
         * ```
         * 配列の添え字では、 a(m11): 0, b(m12): 1, c(m21): 2, d(m22): 3, e(dx): 4, f(dy): 5 となる。
         * 参考: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/transform
         * @private
         */
        _matrix: [number, number, number, number, number, number];
        /**
         * この変換行列に別の変換行列を掛け合わせる。
         * @param matrix 掛け合わせる変換行列
         */
        multiply(matrix: Matrix): void;
        /**
         * この変換行列に別の変換行列を掛け合わせた新しい変換行列を返す。
         * @param matrix 掛け合わせる変換行列
         */
        multiplyNew(matrix: Matrix): Matrix;
        /**
         * 2D object利用の一般的な値を基に変換行列の値を再計算する。
         * @param width 対象の横幅
         * @param heigth 対象の縦幅
         * @param scaleX 対象の横方向への拡大率
         * @param scaleY 対象の縦方向への拡大率
         * @param angle 角度。単位は `degree` であり `radian` ではない
         * @param x x座標
         * @param y y座標
         */
        update(width: number, height: number, scaleX: number, scaleY: number, angle: number, x: number, y: number): void;
        /**
         * `update()` によって得られる行列の逆変換になるよう変換行列の値を再計算する。
         * @param width 対象の横幅
         * @param heigth 対象の縦幅
         * @param scaleX 対象の横方向への拡大率
         * @param scaleY 対象の縦方向への拡大率
         * @param angle 角度。単位は `degree` であり `radian` ではない
         * @param x x座標
         * @param y y座標
         */
        updateByInverse(width: number, height: number, scaleX: number, scaleY: number, angle: number, x: number, y: number): void;
        /**
         * 値を単位行列にリセットする。x/yの座標情報を初期値に反映させることも出来る。
         * @param x x座標。省略時は0として処理される
         * @param y y座標。省略時は0として処理される
         */
        reset(x?: number, y?: number): void;
        /**
         * この変換行列と同じ値を持つ変換行列を新しく作って返す。
         */
        clone(): Matrix;
        /**
         * 拡縮を変換行列に反映させる。
         * @param x X方向の拡縮律
         * @param y y方向の拡縮律
         */
        scale(x: number, y: number): void;
        /**
         * この変換行列を逆行列に変換した結果を引数の座標系に適用した座標値を返す。
         * この変換行列の値自体や、引数の値は変更されない。
         * @param point 逆行列を適用する座標
         */
        multiplyInverseForPoint(point: CommonOffset): CommonOffset;
        /**
         * この変換行列と引数の座標系が表す行列の積を返す。
         * @param point この変換行列との積を求める座標
         */
        multiplyPoint(point: CommonOffset): CommonOffset;
    }
    /**
     * 変換行列を一般的なJavaScriptのみで表したクラス。
     * 通常ゲーム開発者が本クラスを直接利用する事はない。
     * 各フィールド、メソッドの詳細は `Matrix` インターフェースの説明を参照。
     */
    class PlainMatrix {
        /**
         * @private
         */
        _modified: boolean;
        /**
         * @private
         */
        _matrix: [number, number, number, number, number, number];
        /**
         * 無変換の変換行列を表す `PlainMatrix` のインスタンスを作成する。
         */
        constructor();
        /**
         * 2Dオブジェクト利用の一般的な値を元に変換行列を表す `PlainMatrix` のインスタンスを生成する。
         * @param width 対象の横幅
         * @param height 対象の縦幅
         * @param scaleX 対象の横方向への拡大率
         * @param scaleY 対象の縦方向への拡大率
         * @param angle 角度。単位は `degree` であり `radian` ではない
         */
        constructor(width: number, height: number, scaleX: number, scaleY: number, angle: number);
        /**
         * 指定の `Matrix` と同じ変換行列を表す `PlainMatrix` のインスタンスを生成する。
         */
        constructor(src: Matrix);
        update(width: number, height: number, scaleX: number, scaleY: number, angle: number, x: number, y: number): void;
        updateByInverse(width: number, height: number, scaleX: number, scaleY: number, angle: number, x: number, y: number): void;
        multiply(matrix: Matrix): void;
        multiplyNew(matrix: Matrix): Matrix;
        reset(x?: number, y?: number): void;
        clone(): Matrix;
        multiplyInverseForPoint(point: CommonOffset): CommonOffset;
        scale(x: number, y: number): void;
        multiplyPoint(point: CommonOffset): CommonOffset;
    }
}
declare namespace g {
    /**
     * ユーティリティ。
     */
    module Util {
        /**
         * 2点間(P1..P2)の距離(pixel)を返す。
         * @param {number} p1x P1-X
         * @param {number} p1y P1-Y
         * @param {number} p2x P2-X
         * @param {number} p2y P2-Y
         */
        function distance(p1x: number, p1y: number, p2x: number, p2y: number): number;
        /**
         * 2点間(P1..P2)の距離(pixel)を返す。
         * @param {CommonOffset} p1 座標1
         * @param {CommonOffset} p2 座標2
         */
        function distanceBetweenOffsets(p1: CommonOffset, p2: CommonOffset): number;
        /**
         * 2つの矩形の中心座標(P1..P2)間の距離(pixel)を返す。
         * @param {CommonArea} p1 矩形1
         * @param {CommonArea} p2 矩形2
         */
        function distanceBetweenAreas(p1: CommonArea, p2: CommonArea): number;
        /**
         * 単位行列を生成して返す。
         * 戻り値は、実行しているプラットフォームにとって最適な単位行列型であることが保証される。
         */
        function createMatrix(): Matrix;
        /**
         * 2D objectの一般的な値を基に新しい変換行列を生成して返す。
         * 戻り値は、実行しているプラットフォームにとって最適な変換行列型であることが保証される。
         * @param width 対象の横幅
         * @param height 対象の縦幅
         * @param scaleX 対象の横方向への拡大率
         * @param scaleY 対象の縦方向への拡大率
         * @param angle 角度。単位はdegreeでありradianではない
         */
        function createMatrix(width: number, height: number, scaleX: number, scaleY: number, angle: number): Matrix;
        /**
         * e の描画内容を持つ Sprite を生成する。
         * @param scene 作成したSpriteを登録するScene
         * @param e Sprite化したいE
         * @param camera 使用カメラ
         */
        function createSpriteFromE(scene: Scene, e: E, camera?: Camera): Sprite;
        /**
         * scene の描画内容を持つ Sprite を生成する。
         * @param toScene 作ったSpriteを登録するScene
         * @param fromScene Sprite化したいScene
         * @param camera 使用カメラ
         */
        function createSpriteFromScene(toScene: Scene, fromScene: Scene, camera?: Camera): Sprite;
        /**
         * 引数 `src` が `undefined` または `Surface` でそのまま返す。
         * そうでなくかつ `ImageAsset` であれば `Surface` に変換して返す。
         *
         * @param src
         */
        function asSurface(src: Asset | Surface): Surface;
        /**
         * 与えられたパス文字列がファイルパスであると仮定して、対応するアセットを探す。
         * 見つかった場合そのアセットを、そうでない場合 `undefined` を返す。
         * 通常、ゲーム開発者がファイルパスを扱うことはなく、このメソッドを呼び出す必要はない。
         *
         * @param resolvedPath パス文字列
         * @param liveAssetPathTable パス文字列のプロパティに対応するアセットを格納したオブジェクト
         */
        function findAssetByPathAsFile(resolvedPath: string, liveAssetPathTable: {
            [key: string]: Asset;
        }): Asset;
        /**
         * 与えられたパス文字列がディレクトリパスであると仮定して、対応するアセットを探す。
         * 見つかった場合そのアセットを、そうでない場合 `undefined` を返す。
         * 通常、ゲーム開発者がファイルパスを扱うことはなく、このメソッドを呼び出す必要はない。
         * ディレクトリ内に package.json が存在する場合、package.json 自体もアセットとして
         * `liveAssetPathTable` から参照可能でなければならないことに注意。
         *
         * @param resolvedPath パス文字列
         * @param liveAssetPathTable パス文字列のプロパティに対応するアセットを格納したオブジェクト
         */
        function findAssetByPathAsDirectory(resolvedPath: string, liveAssetPathTable: {
            [key: string]: Asset;
        }): Asset;
        /**
         * idx文字目の文字のchar codeを返す。
         *
         * これはString#charCodeAt()と次の点で異なる。
         * - idx文字目が上位サロゲートの時これを16bit左シフトし、idx+1文字目の下位サロゲートと論理和をとった値を返す。
         * - idx文字目が下位サロゲートの時nullを返す。
         *
         * @param str 文字を取り出される文字列
         * @param idx 取り出される文字の位置
         */
        function charCodeAt(str: string, idx: number): number;
        type AnimatingHandler = {
            /**
             * @private
             */
            _onAnimatingStarted: () => void;
            /**
             * @private
             */
            _onAnimatingStopped: () => void;
        };
        /**
         * サーフェスのアニメーティングイベントへのハンドラ登録。
         *
         * これはゲームエンジンが利用するものであり、ゲーム開発者が呼び出す必要はない。
         *
         * @param animatingHandler アニメーティングハンドラ
         * @param surface サーフェス
         */
        function setupAnimatingHandler(animatingHandler: AnimatingHandler, surface: Surface): void;
        /**
         * アニメーティングハンドラを別のサーフェスへ移動する。
         *
         * これはゲームエンジンが利用するものであり、ゲーム開発者が呼び出す必要はない。
         *
         * @param animatingHandler アニメーティングハンドラ
         * @param beforeSurface ハンドラ登録を解除するサーフェス
         * @param afterSurface ハンドラを登録するサーフェス
         */
        function migrateAnimatingHandler(animatingHandler: AnimatingHandler, beforeSurface: Surface, afterSurface: Surface): void;
    }
}
declare namespace g {
    /**
     * オブジェクトの衝突を表す。
     * - 矩形交差による衝突
     * - 2点間の距離による衝突
     */
    module Collision {
        /**
         * 矩形交差による衝突判定を行い、その結果を返す。
         * 戻り値は、矩形t1, t2が交差しているとき真、でなければ偽。
         * @param {number} x1 t1-X
         * @param {number} y1 t1-Y
         * @param {number} width1 t1幅
         * @param {number} height1 t1高さ
         * @param {number} x2 t2-X
         * @param {number} y2 t2-Y
         * @param {number} width2 t2幅
         * @param {number} height2 t2高さ
         */
        function intersect(x1: number, y1: number, width1: number, height1: number, x2: number, y2: number, width2: number, height2: number): boolean;
        /**
         * 矩形交差による衝突判定を行い、その結果を返す。
         * 戻り値は、矩形t1, t2が交差しているとき真、でなければ偽。
         * @param {CommonArea} t1 矩形1
         * @param {CommonArea} t2 矩形2
         */
        function intersectAreas(t1: CommonArea, t2: CommonArea): boolean;
        /**
         * 2点間の距離による衝突判定を行い、その結果を返す。
         * 戻り値は、2点間の距離が閾値以内であるとき真、でなければ偽。
         * @param {number} t1x t1-X
         * @param {number} t1y t1-X
         * @param {number} t2x t1-X
         * @param {number} t2y t1-X
         * @param {number} [distance=1] 衝突判定閾値 [pixel]
         */
        function within(t1x: number, t1y: number, t2x: number, t2y: number, distance?: number): boolean;
        /**
         * 2つの矩形の中心座標間距離による衝突判定を行い、その結果を返す。
         * 戻り値は、2点間の距離が閾値以内であるとき真、でなければ偽。
         * @param {CommonArea} t1 矩形1
         * @param {CommonArea} t2 矩形2
         * @param {number} [distance=1] 衝突判定閾値 [pixel]
         */
        function withinAreas(t1: CommonArea, t2: CommonArea, distance?: number): boolean;
    }
}
declare namespace g {
    /**
     * ハンドラの関数の型。
     *
     * この関数がtruthyな値を返した場合、ハンドラ登録は解除される。
     */
    type HandlerFunction<T> = (arg: T) => void | boolean;
    /**
     * Triggerのハンドラ。
     */
    interface TriggerHandler<T> {
        /**
         * ハンドラの関数。
         */
        func: HandlerFunction<T>;
        /**
         * ハンドラのオーナー。
         * `func` 呼び出しの際に `this` として利用される値。
         */
        owner: any;
        /**
         * 呼び出し後、 `remove()` されるべきである時またその時のみ、真。
         */
        once: boolean;
        /**
         * ハンドラの名前。
         */
        name: string | null | undefined;
    }
    /**
     * Triggerを追加する際に指定するパラメータ。
     */
    interface TriggerAddParameters<T> {
        /**
         * ハンドラの関数。
         */
        func: HandlerFunction<T>;
        /**
         * ハンドラのオーナー。
         * `func` 呼び出しの際に `this` として利用される値。
         */
        owner?: any;
        /**
         * ハンドラの名前。
         */
        name?: string;
        /**
         * ハンドラのリストの挿入先インデックス。
         * 通常、指定する必要はない。省略した場合、ハンドラは末尾に追加される。
         */
        index?: number;
    }
    /**
     * Triggerを削除する際に指定するパラメータ。
     */
    interface TriggerRemoveConditions<T> {
        /**
         * ハンドラの関数。
         *
         * 登録時 `func` に指定された値がこの値と同値でないハンドラは削除されない。
         * 省略された場合、 `remove()` では `undefined` とみなされる。
         * 省略された場合、 `removeAll()` ではこの値に関係なく他の条件にマッチする限り削除される。
         */
        func?: HandlerFunction<T>;
        /**
         * ハンドラのオーナー。
         *
         * 登録時 `owner` に指定された値がこの値と同値でないハンドラは削除されない。
         * 省略された場合、 `remove()` では `undefined` とみなされる。
         * 省略された場合、 `removeAll()` ではこの値に関係なく他の条件にマッチする限り削除される。
         */
        owner?: any;
        /**
         * ハンドラの名前。
         *
         * 登録時 `name` に指定された値がこの値と同値でないハンドラは削除されない。
         * 省略された場合、 `remove()` では `undefined` とみなされる。
         * 省略された場合、 `removeAll()` ではこの値に関係なく他の条件にマッチする限り削除される。
         */
        name?: string;
    }
    /**
     * Triggerの検索条件を指定するパラメータ。
     */
    interface TriggerSearchConditions<T> {
        func?: HandlerFunction<T>;
        owner?: any;
        name?: string;
    }
    /**
     * イベント通知機構クラス。
     */
    class Trigger<T> {
        /**
         * 登録されているイベントハンドラの数。
         */
        length: number;
        /**
         * 登録されたすべてのハンドラ。
         * @private
         */
        _handlers: TriggerHandler<T>[];
        constructor();
        /**
         * このTriggerにハンドラを追加する。
         * @param func ハンドラの関数
         * @param owner ハンドラのオーナー。 `func` を呼び出す時に `this` として用いられる値
         */
        add(func: HandlerFunction<T>, owner?: any): void;
        /**
         * このTriggerにハンドラを追加する。
         * @param params 登録するハンドラの情報
         */
        add(params: TriggerAddParameters<T>): void;
        /**
         * このTriggerにハンドラを追加する。
         * 本メソッドにより追加されたハンドラは実行後に破棄される。
         * @param func ハンドラの関数
         * @param owner ハンドラのオーナー。 `func` を呼び出す時に `this` として用いられる値
         */
        addOnce(func: HandlerFunction<T>, owner?: any): void;
        /**
         * このTriggerにハンドラを追加する。
         * 本メソッドにより追加されたハンドラは実行後に破棄される。
         * @param params 登録するハンドラの情報
         */
        addOnce(params: TriggerAddParameters<T>): void;
        /**
         * このTriggerにハンドラを追加する。
         * @deprecated 互換性のために残されている。代わりに `add()` を利用すべきである。実装の変化のため、 `func` が `boolean` を返した時の動作はサポートされていない。
         */
        handle(owner: any, func?: HandlerFunction<T>, name?: string): void;
        /**
         * このTriggerを発火する。
         *
         * 登録された全ハンドラの関数を、引数 `arg` を与えて呼び出す。
         * 呼び出し後、次のいずれかの条件を満たす全ハンドラの登録は解除される。
         * * ハンドラが `addOnce()` で登録されていた場合
         * * ハンドラが `add()` で登録される際に `once: true` オプションが与えられていた場合
         * * 関数がtruthyな値を返した場合
         *
         * @param arg ハンドラに与えられる引数
         */
        fire(arg?: T): void;
        /**
         * 指定した条件に一致したハンドラが登録されているかを返す。
         * 指定されなかった条件は、条件として無視される(登録時の値に関わらず一致するとみなされる)。
         *
         * @param func 条件として用いるハンドラの関数
         * @param owner 条件として用いるハンドラのオーナー
         */
        contains(func: HandlerFunction<T> | null, owner?: any): boolean;
        /**
         * 指定した条件に一致したハンドラが登録されているかを返す。
         * 指定されなかった条件は、条件として無視される(登録時の値に関わらず一致するとみなされる)。
         *
         * @param params 検索の条件
         */
        contains(params: TriggerSearchConditions<T>): boolean;
        /**
         * 関数が `func` であり、かつオーナーが `owner` であるハンドラを削除する。
         * 同じ組み合わせで複数登録されている場合、一つだけ削除する。
         *
         * @param func 削除条件として用いるハンドラの関数
         * @param owner 削除条件として用いるハンドラのオーナー。省略した場合、 `undefined`
         */
        remove(func: HandlerFunction<T>, owner?: any): void;
        /**
         * 指定した条件に完全一致するハンドラを削除する。
         * 同じ組み合わせで複数登録されている場合、一つだけ削除する。
         *
         * @param params 削除するハンドラの条件
         */
        remove(params: TriggerRemoveConditions<T>): void;
        /**
         * 指定した条件に部分一致するイベントハンドラを削除する。
         *
         * 本メソッドは引数に与えた条件に一致したイベントハンドラを全て削除する。
         * 引数の条件を一部省略した場合、その値の内容が登録時と異なっていても対象のイベントハンドラは削除される。
         * 引数に与えた条件と完全に一致したイベントハンドラのみを削除したい場合は `this.remove()` を用いる。
         * 引数を省略した場合は全てのイベントハンドラを削除する。
         *
         * @param params 削除するイベントハンドラの条件
         */
        removeAll(params?: TriggerRemoveConditions<T>): void;
        /**
         * このTriggerを破棄する。
         */
        destroy(): void;
        /**
         * このTriggerが破棄されているかを返す。
         */
        destroyed(): boolean;
        /**
         * @private
         */
        _comparePartial(target: TriggerSearchConditions<T>, compare: TriggerSearchConditions<T>): boolean;
    }
    /**
     * 他のTriggerに反応して発火するイベント通知機構。
     */
    class ChainTrigger<T> extends Trigger<T> {
        /**
         * fireするきっかけとなる `Trigger` 。
         * この値は参照のためにのみ公開されている。外部から変更してはならない。
         */
        chain: Trigger<T>;
        /**
         * フィルタ。
         * `chain` がfireされたときに実行される。この関数が真を返した時のみ、このインスタンスはfireされる。
         */
        filter: (args?: T) => boolean | undefined;
        /**
         * フィルタのオーナー。
         * `filter` の呼び出し時、 `this` として与えられる。
         */
        filterOwner: any;
        /**
         * `chain`に実際に`add`されているか否か。
         * @private
         */
        _isActivated: boolean;
        /**
         * `ChainTrigger` のインスタンスを生成する。
         *
         * このインスタンスは、 `chain` がfireされたときに `filter` を実行し、真を返した場合に自身をfireする。
         * @param chain このインスタンスがfireするきっかけとなる Trigger
         * @param filter `chain` がfireされたときに実行される関数。省略された場合、または本関数の戻り値が真の場合、このインスタンスをfireする。
         * @param filterOwner `filter` 呼び出し時に使われる `this` の値。
         */
        constructor(chain: Trigger<T>, filter?: (args?: T) => boolean, filterOwner?: any);
        add(paramsOrHandler: any, owner?: any): void;
        addOnce(paramsOrHandler: any, owner?: any): void;
        remove(func: HandlerFunction<T>, owner?: any): void;
        remove(params: TriggerRemoveConditions<T>): void;
        removeAll(params?: TriggerRemoveConditions<T>): void;
        destroy(): void;
        /**
         * @private
         */
        _onChainTriggerFired(args: T): void;
    }
}
declare namespace g {
    /**
     * 一定時間で繰り返される処理を表すタイマー。
     *
     * ゲーム開発者が本クラスのインスタンスを直接生成することはなく、
     * 通常はScene#setTimeout、Scene#setIntervalによって間接的に利用する。
     */
    class Timer implements Destroyable {
        /**
         * 実行間隔（ミリ秒）。
         * この値は参照のみに利用され、直接値を変更することはできない。
         */
        interval: number;
        /**
         * `this.interval` 経過時にfireされるTrigger。
         */
        elapsed: Trigger<void>;
        /**
         * @private
         */
        _scaledInterval: number;
        /**
         * @private
         */
        _scaledElapsed: number;
        constructor(interval: number, fps: number);
        tick(): void;
        canDelete(): boolean;
        destroy(): void;
        destroyed(): boolean;
    }
}
declare namespace g {
    /**
     * `Scene#setTimeout` や `Scene#setInterval` の実行単位を表す。
     * ゲーム開発者が本クラスのインスタンスを直接生成することはなく、
     * 本クラスの機能を直接利用することはない。
     */
    class TimerIdentifier implements Destroyable {
        /**
         * @private
         */
        _timer: Timer;
        /**
         * @private
         */
        _handler: () => void;
        /**
         * @private
         */
        _handlerOwner: any;
        /**
         * @private
         */
        _fired: (c: TimerIdentifier) => void;
        /**
         * @private
         */
        _firedOwner: any;
        constructor(timer: Timer, handler: () => void, handlerOwner: any, fired?: (c: TimerIdentifier) => void, firedOwner?: any);
        destroy(): void;
        destroyed(): boolean;
        /**
         * @private
         */
        _fire(): void;
    }
    /**
     * Timerを管理する機構を提供する。
     * ゲーム開発者が本クラスを利用する事はない。
     */
    class TimerManager implements Destroyable {
        _timers: Timer[];
        _trigger: Trigger<void>;
        _identifiers: TimerIdentifier[];
        _fps: number;
        _registered: boolean;
        constructor(trigger: Trigger<void>, fps: number);
        destroy(): void;
        destroyed(): boolean;
        /**
         * 定期間隔で処理を実行するTimerを作成する。
         * 本Timerはフレーム経過によって動作する疑似タイマーであるため、実時間の影響は受けない
         * @param interval Timerの実行間隔（ミリ秒）
         * @returns 作成したTimer
         */
        createTimer(interval: number): Timer;
        /**
         * Timerを削除する。
         * @param timer 削除するTimer
         */
        deleteTimer(timer: Timer): void;
        setTimeout(handler: () => void, milliseconds: number, owner?: any): TimerIdentifier;
        clearTimeout(identifier: TimerIdentifier): void;
        setInterval(handler: () => void, interval: number, owner?: any): TimerIdentifier;
        clearInterval(identifier: TimerIdentifier): void;
        /**
         * すべてのTimerを時間経過させる。
         * @private
         */
        _tick(): void;
        /**
         * @private
         */
        _onTimeoutFired(identifier: TimerIdentifier): void;
        /**
         * @private
         */
        _clear(identifier: TimerIdentifier): void;
    }
}
declare namespace g {
    interface AudioPlayerEvent {
        player: AudioPlayer;
        audio: AudioAsset;
    }
    /**
     * サウンド再生を行うクラス。
     *
     * 本クラスのインスタンスは、 `AudioSystem#createPlayer()` によって明示的に、
     * または `AudioAsset#play()` によって暗黙的に生成される。
     * ゲーム開発者は本クラスのインスタンスを直接生成すべきではない。
     */
    class AudioPlayer {
        /**
         * 再生中のオーディオアセット。
         * 再生中のものがない場合、 `undefined` 。
         */
        currentAudio: AudioAsset;
        /**
         * `play()` が呼び出された時に通知される `Trigger` 。
         */
        played: Trigger<AudioPlayerEvent>;
        /**
         * `stop()` が呼び出された時に通知される `Trigger` 。
         */
        stopped: Trigger<AudioPlayerEvent>;
        /**
         * 音量。
         *
         * 0 (無音) 以上 1.0 (最大) 以下の数値である。
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を変更してはならない。
         * 音量を変更したい場合、  `changeVolume()` メソッドを用いること。
         */
        volume: number;
        /**
         * ミュート中か否か。
         * @private
         */
        _muted: boolean;
        /**
         * 再生速度の倍率。
         * @private
         */
        _playbackRate: number;
        /**
         * @private
         */
        _system: AudioSystem;
        /**
         * `AudioPlayer` のインスタンスを生成する。
         */
        constructor(system: AudioSystem);
        /**
         * `AudioAsset` を再生する。
         *
         * 再生後、 `this.played` がfireされる。
         * @param audio 再生するオーディオアセット
         */
        play(audio: AudioAsset): void;
        /**
         * 再生を停止する。
         *
         * 再生中でない場合、何もしない。
         * 停止後、 `this.stopped` がfireされる。
         */
        stop(): void;
        /**
         * 音声の終了を検知できるか否か。
         * 通常、ゲーム開発者がこのメソッドを利用する必要はない。
         */
        canHandleStopped(): boolean;
        /**
         * 音量を変更する。
         *
         * @param volume 音量。0以上1.0以下でなければならない
         */
        changeVolume(volume: number): void;
        /**
         * ミュート状態を変更する。
         *
         * エンジンユーザが `AudioPlayer` の派生クラスを実装する場合は、
         * このメソッドをオーバーライドして実際にミュート状態を変更する処理を行うこと。
         * オーバーライド先のメソッドはこのメソッドを呼びださなければならない。
         *
         * @param muted ミュート状態にするか否か
         * @private
         */
        _changeMuted(muted: boolean): void;
        /**
         * 再生速度を変更する。
         *
         * エンジンユーザが `AudioPlayer` の派生クラスを実装し、
         * かつ `this._supportsPlaybackRate()` をオーバライドして真を返すようにするならば、
         * このメソッドもオーバーライドして実際に再生速度を変更する処理を行うこと。
         * オーバーライド先のメソッドはこのメソッドを呼びださなければならない。
         *
         * @param rate 再生速度の倍率。0以上でなければならない。1.0で等倍である。
         * @private
         */
        _changePlaybackRate(rate: number): void;
        /**
         * 再生速度の変更に対応するか否か。
         *
         * エンジンユーザが `AudioPlayer` の派生クラスを実装し、
         * 再生速度の変更に対応する場合、このメソッドをオーバーライドして真を返さねばならない。
         * その場合 `_changePlaybackRate()` もオーバーライドし、実際の再生速度変更処理を実装しなければならない。
         *
         * なおここで「再生速度の変更に対応する」は、任意の速度で実際に再生できることを意味しない。
         * 実装は等倍速 (再生速度1.0) で実際に再生できなければならない。
         * しかしそれ以外の再生速度が指定された場合、実装はまるで音量がゼロであるかのように振舞ってもよい。
         *
         * このメソッドが偽を返す場合、エンジンは音声の非等倍速度再生に対するデフォルトの処理を実行する。
         * @private
         */
        _supportsPlaybackRate(): boolean;
        /**
         * 音量の変更を通知する。
         * @deprecated このメソッドは実験的に導入されたが、利用されていない。将来的に削除される。
         */
        _onVolumeChanged(): void;
    }
}
declare namespace g {
    abstract class AudioSystem {
        id: string;
        game: Game;
        /**
         * @private
         */
        _volume: number;
        /**
         * @private
         */
        _muted: boolean;
        /**
         * @private
         */
        _destroyRequestedAssets: {
            [key: string]: Asset;
        };
        /**
         * @private
         */
        _playbackRate: number;
        volume: number;
        constructor(id: string, game: Game);
        abstract stopAll(): void;
        abstract findPlayers(asset: AudioAsset): AudioPlayer[];
        abstract createPlayer(): AudioPlayer;
        requestDestroy(asset: Asset): void;
        /**
         * @private
         */
        _setMuted(value: boolean): void;
        /**
         * @private
         */
        _setPlaybackRate(value: number): void;
        /**
         * @private
         */
        abstract _onVolumeChanged(): void;
        /**
         * @private
         */
        abstract _onMutedChanged(): void;
        /**
         * @private
         */
        abstract _onPlaybackRateChanged(): void;
    }
    class MusicAudioSystem extends AudioSystem {
        /**
         * @private
         */
        _player: AudioPlayer;
        /**
         * 再生を抑止されている `AudioAsset` 。
         *
         * 再生速度に非対応の `AudioPlayer` の場合に、等倍速でない速度で再生を試みたアセット。
         * 再生速度が戻された場合に改めて再生されなおす。
         * この値は、 `this._player._supportsPlaybackRate()` が偽ある場合にのみ利用される。
         * @private
         */
        _suppressingAudio: AudioAsset;
        player: AudioPlayer;
        constructor(id: string, game: Game);
        findPlayers(asset: AudioAsset): AudioPlayer[];
        createPlayer(): AudioPlayer;
        stopAll(): void;
        /**
         * @private
         */
        _onVolumeChanged(): void;
        /**
         * @private
         */
        _onMutedChanged(): void;
        /**
         * @private
         */
        _onPlaybackRateChanged(): void;
        /**
         * @private
         */
        _onUnsupportedPlaybackRateChanged(): void;
        /**
         * @private
         */
        _onPlayerPlayed(e: AudioPlayerEvent): void;
        /**
         * @private
         */
        _onPlayerStopped(e: AudioPlayerEvent): void;
    }
    class SoundAudioSystem extends AudioSystem {
        players: AudioPlayer[];
        constructor(id: string, game: Game);
        createPlayer(): AudioPlayer;
        findPlayers(asset: AudioAsset): AudioPlayer[];
        stopAll(): void;
        /**
         * @private
         */
        _onMutedChanged(): void;
        /**
         * @private
         */
        _onPlaybackRateChanged(): void;
        /**
         * @private
         */
        _onPlayerPlayed(e: AudioPlayerEvent): void;
        /**
         * @private
         */
        _onPlayerStopped(e: AudioPlayerEvent): void;
        /**
         * @private
         */
        _onVolumeChanged(): void;
    }
}
declare namespace g {
    interface VideoPlayerEvent {
        player: VideoPlayer;
        video: VideoAsset;
    }
    /**
     * ビデオ再生を行うクラス。
     *
     * ゲーム開発者は本クラスのインスタンスを直接生成すべきではない。
     */
    class VideoPlayer {
        /**
         * 再生中のビデオアセット。
         * 再生中のものがない場合、 `undefined` 。
         */
        currentVideo: VideoAsset;
        /**
         * `play()` が呼び出された時に通知される `Trigger` 。
         */
        played: Trigger<VideoPlayerEvent>;
        /**
         * `stop()` が呼び出された時に通知される `Trigger` 。
         */
        stopped: Trigger<VideoPlayerEvent>;
        /**
         * 音量。
         *
         * 0 (無音) 以上 1.0 (最大) 以下の数値である。
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を変更してはならない。
         * 音量を変更したい場合、  `changeVolume()` メソッドを用いること。
         */
        volume: number;
        /**
         * @private
         */
        _loop: boolean;
        /**
         * `VideoPlayer` のインスタンスを生成する。
         */
        constructor(loop?: boolean);
        /**
         * `VideoAsset` を再生する。
         *
         * 再生後、 `this.played` がfireされる。
         * @param Video 再生するビデオアセット
         */
        play(videoAsset: VideoAsset): void;
        /**
         * 再生を停止する。
         *
         * 再生中でない場合、何もしない。
         * 停止後、 `this.stopped` がfireされる。
         */
        stop(): void;
        /**
         * 音量を変更する。
         *
         * エンジンユーザが `VideoPlayer` の派生クラスを実装する場合は、
         *  このメソッドをオーバーライドして実際に音量を変更する処理を行うこと。
         *  オーバーライド先のメソッドはこのメソッドを呼びださなければならない。
         * @param volume 音量。0以上1.0以下でなければならない
         */
        changeVolume(volume: number): void;
    }
}
declare namespace g {
    class VideoSystem {
    }
}
declare namespace g {
    /**
     * `Object2D` のコンストラクタに渡すことができるパラメータ。
     * 各メンバの詳細は `Object2D` の同名メンバの説明を参照すること。
     */
    interface Object2DParameterObject {
        /**
         * このオブジェクトの横位置。実際の座標位置はscaleX, scaleY, angleの値も考慮する必要がある。
         * @default 0
         */
        x?: number;
        /**
         * このオブジェクトの縦位置。実際の座標位置はscaleX, scaleY, angleの値も考慮する必要がある。
         * @default 0
         */
        y?: number;
        /**
         * このオブジェクトの横幅。実際の表示領域としてはscaleX, scaleY, angleの値も考慮する必要がある。
         * @default 0
         */
        width?: number;
        /**
         * このオブジェクトの縦幅。実際の表示領域としてはscaleX, scaleY, angleの値も考慮する必要がある。
         * @default 0
         */
        height?: number;
        /**
         * 0～1でオブジェクトの不透明度を表す。
         * この値が0の場合、Rendererは描画処理を省略する。
         * @default 1
         */
        opacity?: number;
        /**
         * オブジェクトの横方向の倍率。
         * @default 1
         */
        scaleX?: number;
        /**
         * オブジェクトの縦方向の倍率。
         * @default 1
         */
        scaleY?: number;
        /**
         * オブジェクトの回転。度数で指定する。
         * @default 0
         */
        angle?: number;
        /**
         * 描画時の合成方法を指定する。
         * 省略された場合、合成方法を指定しない（親の合成方法を利用する）。
         * @default undefined
         */
        compositeOperation?: CompositeOperation;
    }
    /**
     * 二次元の幾何的オブジェクト。位置とサイズ (に加えて傾きや透明度も) を持つ。
     * ゲーム開発者は `E` を使えばよく、通常このクラスを意識する必要はない。
     */
    class Object2D implements CommonArea {
        /**
         * このオブジェクトの横位置。
         * 初期値は `0` である。実際の座標位置はscaleX, scaleY, angleの値も考慮する必要がある。
         * `E` や `Camera2D` においてこの値を変更した場合、 `modified()` を呼び出す必要がある。
         */
        x: number;
        /**
         * このオブジェクトの縦位置。
         * 初期値は `0` である。実際の座標位置はscaleX, scaleY, angleの値も考慮する必要がある。
         * `E` や `Camera2D` においてこの値を変更した場合、 `modified()` を呼び出す必要がある。
         */
        y: number;
        /**
         * このオブジェクトの横幅。
         * 初期値は `0` である。実際の表示領域としてはscaleX, scaleY, angleの値も考慮する必要がある。
         * `E` や `Camera2D` においてこの値を変更した場合、 `modified()` を呼び出す必要がある。
         */
        width: number;
        /**
         * このオブジェクトの縦幅。
         * 初期値は `0` である。実際の表示領域としてはscaleX, scaleY, angleの値も考慮する必要がある。
         * `E` や `Camera2D` においてこの値を変更した場合、 `modified()` を呼び出す必要がある。
         */
        height: number;
        /**
         * 0～1でオブジェクトの不透明度を表す。
         * 初期値は `1` である。本値が0の場合、Rendererは描画処理を省略する。
         * `E` においてこの値を変更した場合、 `modified()` を呼び出す必要がある。
         */
        opacity: number;
        /**
         * オブジェクトの横方向の倍率。
         * 初期値は `1` である。
         * `E` や `Camera2D` においてこの値を変更した場合、 `modified()` を呼び出す必要がある。
         */
        scaleX: number;
        /**
         * オブジェクトの縦方向の倍率。
         * 初期値は `1` である。
         * `E` や `Camera2D` においてこの値を変更した場合、 `modified()` を呼び出す必要がある。
         */
        scaleY: number;
        /**
         * オブジェクトの回転。度数で指定する。
         * 初期値は `0` である。
         * `E` や `Camera2D` においてこの値を変更した場合、 `modified()` を呼び出す必要がある。
         */
        angle: number;
        /**
         * 描画時の合成方法を指定する。
         * 初期値は `undefined` となり、合成方法を指定しないことを意味する。
         * `E` においてこの値を変更した場合、 `modified()` を呼び出す必要がある。
         */
        compositeOperation: CompositeOperation;
        /**
         * 変換行列のキャッシュ。 `Object2D` は状態に変更があった時、本値の_modifiedをtrueにする必要がある。
         * 初期値は `undefined` であり、 `getMatrix()` によって必要な時に生成されるため、
         * `if (this._matrix) this._matrix._modified = true` という式で記述する必要がある。
         *
         * エンジンに組み込まれているSprite等のエンティティ群は、
         * すでに本処理を組み込んでいるため通常ゲーム開発者はこの値を意識する必要はない。
         * `Object2D` を継承したクラスを新たに作る場合には、本フィールドを適切に操作しなければならない。
         * @private
         */
        _matrix: Matrix;
        /**
         * デフォルト値で `Object2D` のインスタンスを生成する。
         */
        constructor();
        /**
         * 指定されたパラメータで `Object2D` のインスタンスを生成する。
         * @param param 初期化に用いるパラメータのオブジェクト
         */
        constructor(param: Object2DParameterObject);
        /**
         * オブジェクトを移動する。
         * このメソッドは `x` と `y` を同時に設定するためのユーティリティメソッドである。
         * `E` や `Camera2D` においてこのメソッドを呼び出した場合、 `modified()` を呼び出す必要がある。
         * @param x X座標
         * @param y Y座標
         */
        moveTo(x: number, y: number): void;
        /**
         * オブジェクトを移動する。
         * このメソッドは `x` と `y` を同時に設定するためのユーティリティメソッドである。
         * `E` や `Camera2D` においてこのメソッドを呼び出した場合、 `modified()` を呼び出す必要がある。
         * @param obj X,Y座標
         */
        moveTo(obj: CommonOffset): void;
        /**
         * オブジェクトを相対的に移動する。
         * このメソッドは `x` と `y` を同時に加算するためのユーティリティメソッドである。
         * `E` や `Camera2D` においてこのメソッドを呼び出した場合、 `modified()` を呼び出す必要がある。
         * @param x X座標に加算する値
         * @param y Y座標に加算する値
         */
        moveBy(x: number, y: number): void;
        /**
         * オブジェクトのサイズを設定する。
         * このメソッドは `width` と `height` を同時に設定するためのユーティリティメソッドである。
         * `E` や `Camera2D` においてこのメソッドを呼び出した場合、 `modified()` を呼び出す必要がある。
         * @param width 幅
         * @param height 高さ
         */
        resizeTo(width: number, height: number): void;
        /**
         * オブジェクトのサイズを設定する。
         * このメソッドは `width` と `height` を同時に設定するためのユーティリティメソッドである。
         * `E` や `Camera2D` においてこのメソッドを呼び出した場合、 `modified()` を呼び出す必要がある。
         * @param size 幅と高さ
         */
        resizeTo(size: CommonSize): void;
        /**
         * オブジェクトのサイズを相対的に変更する。
         * このメソッドは `width` と `height` を同時に加算するためのユーティリティメソッドである。
         * `E` や `Camera2D` においてこのメソッドを呼び出した場合、 `modified()` を呼び出す必要がある。
         * @param width 加算する幅
         * @param height 加算する高さ
         */
        resizeBy(width: number, height: number): void;
        /**
         * オブジェクトの拡大率を設定する。
         * このメソッドは `scaleX` と `scaleY` に同じ値を同時に設定するためのユーティリティメソッドである。
         * `E` や `Camera2D` においてこのメソッドを呼び出した場合、 `modified()` を呼び出す必要がある。
         * @param scale 拡大率
         */
        scale(scale: number): void;
        /**
         * このオブジェクトの変換行列を得る。
         */
        getMatrix(): Matrix;
        /**
         * 公開のプロパティから内部の変換行列キャッシュを更新する。
         * @private
         */
        _updateMatrix(): void;
    }
}
declare namespace g {
    /**
     * `E` のコンストラクタに渡すことができるパラメータ。
     * 各メンバの詳細は `E` の同名メンバの説明を参照すること。
     */
    interface EParameterObject extends Object2DParameterObject {
        /**
         * このエンティティが属するシーン。
         */
        scene: Scene;
        /**
         * このエンティティがローカルであるか否か。
         * コンストラクタで真が指定された時、または属するシーンがローカルシーンまたはローカルティック補間シーンである時、この値は真である。
         *
         * この値が真である場合、このエンティティに対する point イベントはこのゲームインスタンスにのみ通知され、
         * 他の参加者・視聴者には通知されない。また真である場合、 `id` の値の一意性は保証されない。
         * @default false
         */
        local?: boolean;
        /**
         * このエンティティの親
         * @default undefined
         */
        parent?: E | Scene;
        /**
         * このエンティティの全子エンティティ。
         * @default undefined
         */
        children?: E[];
        /**
         * このエンティティを表示できるカメラの配列。
         * この値が `undefined` または空配列である場合、このエンティティとその子孫はカメラによらず描画される。
         * 空でない配列である場合、このエンティティとその子孫は、配列内に含まれるカメラでの描画の際にのみ表示される。
         * @default undefined
         */
        targetCameras?: Camera[];
        /**
         * プレイヤーにとって触れられるオブジェクトであるかを表す。
         * この値が偽である場合、ポインティングイベントの対象にならない。
         * @default false
         */
        touchable?: boolean;
        /**
         * このエンティティの表示状態。
         * @default false
         */
        hidden?: boolean;
        /**
         * このエンティティに割り振られる `E#id` の値。
         * エンジンが一意の ID を設定するため、通常指定する必要はない。
         * この値は、スナップショットローダがエンティティを復元する際にのみ指定されるべきである。
         * @default undefined
         */
        id?: number;
        /**
         * ゲーム開発者向けのタグ情報管理コンテナ。
         * この値はゲームエンジンのロジックからは使用されず、ゲーム開発者は任意の目的に使用してよい。
         * @default undefined
         */
        tag?: any;
    }
    /**
     * akashic-engineに描画される全てのエンティティを表す基底クラス。
     * 本クラス単体に描画処理にはなく、直接利用する場合はchildrenを利用したコンテナとして程度で利用される。
     */
    class E extends Object2D implements CommonArea, Destroyable {
        /**
         * このエンティティに割り振られる `Game` 単位で一意のID。(ただし `local` が真である場合を除く)
         */
        id: number;
        /**
         * このエンティティがローカルであるか否か。
         * コンストラクタで真が指定された時、または属するシーンがローカルシーンまたはローカルティック補間シーンである時、この値は真である。
         *
         * この値が真である場合、このエンティティに対する point イベントはこのゲームインスタンスにのみ通知され、
         * 他の参加者・視聴者には通知されない。また真である場合、 `id` の値の一意性は保証されない。
         *
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を直接変更してはならない。
         */
        local: boolean;
        /**
         * このエンティティの全子エンティティ。
         * 子エンティティが存在しない場合、本フィールドの値は `undefined` または空配列である。
         */
        children: E[];
        /**
         * 親。
         */
        parent: E | Scene;
        /**
         * このエンティティが属するシーン。
         */
        scene: Scene;
        /**
         * 様々な状態を表すビットフラグ。
         */
        state: EntityStateFlags;
        /**
         * ゲーム開発者向けのタグ情報管理コンテナ。
         * この値はゲームエンジンのロジックからは使用されず、ゲーム開発者は任意の目的に使用してよい。
         */
        tag: any;
        /**
         * このEが「映り込む」カメラの集合。
         * 空でない配列が指定されている場合、配列内に存在しないCameraでの描画時にはこのEがスキップされる。
         * 初期値はundefinedである。targetCamerasがこの値を暗黙に生成するので、ゲーム開発者はそちらを使うべきである。
         * @private
         */
        _targetCameras: Camera[];
        /**
         * 子にtouchableなものが含まれているかどうかを表す。
         * @private
         */
        _hasTouchableChildren: boolean;
        private _update;
        private _message;
        private _pointDown;
        private _pointUp;
        private _pointMove;
        private _touchable;
        /**
         * 時間経過イベント。本イベントの一度のfireにつき、常に1フレーム分の時間経過が起こる。
         */
        readonly update: Trigger<void>;
        /**
         * このエンティティのmessageイベント。
         */
        readonly message: Trigger<MessageEvent>;
        /**
         * このエンティティのpoint downイベント。
         */
        readonly pointDown: Trigger<PointDownEvent>;
        /**
         * このエンティティのpoint upイベント。
         */
        readonly pointUp: Trigger<PointUpEvent>;
        /**
         * このエンティティのpoint moveイベント。
         */
        readonly pointMove: Trigger<PointMoveEvent>;
        /**
         * このエンティティを表示できるカメラの配列。
         *
         * 初期値は空配列である。
         * この値が `undefined` または空配列である場合、このエンティティとその子孫はカメラによらず描画される。
         * 空でない配列である場合、このエンティティとその子孫は、配列内に含まれるカメラでの描画の際にのみ表示される。
         *
         * この値を変更した場合、 `this.modified()` を呼び出す必要がある。
         */
        targetCameras: Camera[];
        /**
         * プレイヤーにとって触れられるオブジェクトであるかを表す。
         *
         * この値が偽である場合、ポインティングイベントの対象にならない。
         * 初期値は `false` である。
         *
         * `E` の他のプロパティと異なり、この値の変更後に `this.modified()` を呼び出す必要はない。
         */
        touchable: boolean;
        /**
         * 各種パラメータを指定して `E` のインスタンスを生成する。
         * @param param 初期化に用いるパラメータのオブジェクト
         */
        constructor(param: EParameterObject);
        /**
         * 自分自身と子孫の内容を描画する。
         *
         * このメソッドは、 `Renderer#draw()` からエンティティのツリー構造をトラバースする過程で暗黙に呼び出される。
         * 通常、ゲーム開発者がこのメソッドを呼び出す必要はない。
         * @param renderer 描画先に対するRenderer
         * @param camera 対象のカメラ。省略された場合、undefined
         */
        render(renderer: Renderer, camera?: Camera): void;
        /**
         * 自分自身の内容を描画する。
         *
         * このメソッドは、 `Renderer#draw()` からエンティティのツリー構造をトラバースする過程で暗黙に呼び出される。
         * 通常、ゲーム開発者がこのメソッドを呼び出す必要はない。
         *
         * 戻り値は、このエンティティの子孫の描画をスキップすべきであれば偽、でなければ真である。
         * (この値は、子孫の描画方法をカスタマイズする一部のサブクラスにおいて、通常の描画パスをスキップするために用いられる)
         *
         * @param renderer 描画先に対するRenderer
         * @param camera 対象のカメラ
         */
        renderSelf(renderer: Renderer, camera?: Camera): boolean;
        /**
         * このエンティティが属する `Game` を返す。
         */
        game(): Game;
        /**
         * 子を追加する。
         *
         * @param e 子エンティティとして追加するエンティティ
         */
        append(e: E): void;
        /**
         * 子を挿入する。
         *
         * `target` が`this` の子でない場合、`append(e)` と同じ動作となる。
         *
         * @param e 子エンティティとして追加するエンティティ
         * @param target 挿入位置にある子エンティティ
         */
        insertBefore(e: E, target: E): void;
        /**
         * 子を削除する。
         *
         * `e` が `this` の子でない場合、 `AssertionError` がthrowされる。
         * `e === undefined` であり親がない場合、 `AssertionError` がthrowされる。
         *
         * @param e 削除する子エンティティ。省略された場合、自身を親から削除する
         */
        remove(e?: E): void;
        /**
         * このエンティティを破棄する。
         *
         * 親がある場合、親からは `remove()` される。
         * 子孫を持っている場合、子孫も破棄される。
         */
        destroy(): void;
        /**
         * このエンティティが破棄済みであるかを返す。
         */
        destroyed(): boolean;
        /**
         * このエンティティに対する変更をエンジンに通知する。
         *
         * このメソッドの呼び出し後、 `this` に対する変更が各 `Renderer` の描画に反映される。
         * ただし逆は真ではない。すなわち、再描画は他の要因によって行われることもある。
         * ゲーム開発者は、このメソッドを呼び出していないことをもって再描画が行われていないことを仮定してはならない。
         *
         * 本メソッドは、このオブジェクトの `Object2D` 由来のプロパティ (`x`, `y`, `angle` など) を変更した場合にも呼びだす必要がある。
         * 本メソッドは、描画キャッシュの無効化処理を含まない。描画キャッシュを持つエンティティは、このメソッドとは別に `invalidate()` を提供している。
         * 描画キャッシュの無効化も必要な場合は、このメソッドではなくそちらを呼び出す必要がある。
         * @param isBubbling 通常ゲーム開発者が指定する必要はない。この変更通知が、(このエンティティ自身のみならず)子孫の変更の通知を含む場合、真を渡さなければならない。省略された場合、偽。
         */
        modified(isBubbling?: boolean): void;
        /**
         * このメソッドは、 `E#findPointSourceByPoint()` 内で子孫の探索をスキップすべきか判断するために呼ばれる。
         * 通常、子孫の描画方法をカスタマイズする一部のサブクラスにおいて、与えられた座標に対する子孫の探索を制御する場合に利用する。
         * ゲーム開発者がこのメソッドを呼び出す必要はない。
         *
         * 戻り値は、子孫の探索をスキップすべきであれば偽、でなければ真である。
         *
         * @param point このエンティティ（`this`）の位置を基準とした相対座標
         */
        shouldFindChildrenByPoint(point: CommonOffset): boolean;
        /**
         * 自身と自身の子孫の中で、その座標に反応する `PointSource` を返す。
         *
         * 戻り値は、対象が見つかった場合、 `target` に見つかったエンティティを持つ `PointSource` である。
         * 対象が見つからなかった場合、 `undefined` である。戻り値が `undefined` でない場合、その `target` プロパティは次を満たす:
         * - このエンティティ(`this`) またはその子孫である
         * - `E#touchable` が真である
         * - カメラ `camera` から可視である中で最も手前にある
         *
         * @param point 対象の座標
         * @param m `this` に適用する変換行列。省略された場合、単位行列
         * @param force touchable指定を無視する場合真を指定する。省略された場合、偽
         * @param camera 対象のカメラ。指定されなかった場合undefined
         */
        findPointSourceByPoint(point: CommonOffset, m?: Matrix, force?: boolean, camera?: Camera): PointSource;
        /**
         * このEが表示状態であるかどうかを返す。
         */
        visible(): boolean;
        /**
         * このEを表示状態にする。
         *
         * `this.hide()` によって非表示状態にされたエンティティを表示状態に戻す。
         * 生成直後のエンティティは表示状態であり、 `hide()` を呼び出さない限りこのメソッドを呼び出す必要はない。
         */
        show(): void;
        /**
         * このEを非表示状態にする。
         *
         * `this.show()` が呼ばれるまでの間、このエンティティは各 `Renderer` によって描画されない。
         * また `Game#findPointSource()` で返されることもなくなる。
         * `this#pointDown`, `pointMove`, `pointUp` なども通常の方法ではfireされなくなる。
         */
        hide(): void;
        /**
         * このEの包含矩形を計算する。
         *
         * @param c 使用カメラ。
         */
        calculateBoundingRect(c?: Camera): CommonRect;
        /**
         * @private
         */
        _calculateBoundingRect(m?: Matrix, c?: Camera): CommonRect;
        /**
         * @private
         */
        _enableTouchPropagation(): void;
        /**
         * @private
         */
        _disableTouchPropagation(): void;
        /**
         * @private
         */
        _isTargetOperation(e: PointEvent): boolean;
        private _findTouchableChildren(e);
    }
}
declare namespace g {
    /**
     * `CacheableE` のコンストラクタに渡すことができるパラメータ。
     */
    interface CacheableEParameterObject extends EParameterObject {
    }
    /**
     * 内部描画キャッシュを持つ `E` 。
     */
    abstract class CacheableE extends E {
        /**
         * エンジンが子孫を描画すべきであれば`true`、でなければ`false`を本クラスを継承したクラスがセットする。
         * デフォルト値は`true`となる。
         * @private
         */
        _shouldRenderChildren: boolean;
        /**
         * このエンティティの内部キャッシュ。
         * @private
         */
        _cache: Surface;
        /**
         * @private
         */
        _renderer: Renderer;
        /**
         * このエンティティを最後に描画した時の`Camrera`。
         *
         * @private
         */
        _renderedCamera: Camera;
        /**
         * 各種パラメータを指定して `CacheableE` のインスタンスを生成する。
         * @param param このエンティティに対するパラメータ
         */
        constructor(param: CacheableEParameterObject);
        /**
         * このエンティティの描画キャッシュ無効化をエンジンに通知する。
         * このメソッドを呼び出し後、描画キャッシュの再構築が行われ、各 `Renderer` に描画内容の変更が反映される。
         */
        invalidate(): void;
        /**
         * このエンティティ自身の描画を行う。
         * このメソッドはエンジンから暗黙に呼び出され、ゲーム開発者が呼び出す必要はない。
         */
        renderSelf(renderer: Renderer, camera?: Camera): boolean;
        /**
         * キャッシュの描画が必要な場合にこのメソッドが呼ばれる。
         * 本クラスを継承したエンティティはこのメソッド内で`renderer`に対してキャッシュの内容を描画しなければならない。
         * このメソッドはエンジンから暗黙に呼び出され、ゲーム開発者が呼び出す必要はない。
         */
        abstract renderCache(renderer: Renderer, camera?: Camera): void;
        /**
         * 利用している `Surface` を破棄した上で、このエンティティを破棄する。
         */
        destroy(): void;
    }
}
declare namespace g {
    /**
     * 操作対象とするストレージのリージョンを表す。
     */
    enum StorageRegion {
        /**
         * slotsを表す。
         */
        Slots = 1,
        /**
         * scoresを表す。
         */
        Scores = 2,
        /**
         * countsを表す。
         */
        Counts = 3,
        /**
         * valuesを表す。
         */
        Values = 4,
    }
    /**
     * 一括取得を行う場合のソート順。
     */
    enum StorageOrder {
        /**
         * 昇順。
         */
        Asc = 0,
        /**
         * 降順。
         */
        Desc = 1,
    }
    /**
     * 条件を表す。
     */
    enum StorageCondition {
        /**
         * 等価を表す（==）。
         */
        Equal = 1,
        /**
         * 「より大きい」を表す（>）。
         */
        GreaterThan = 2,
        /**
         * 「より小さい」を表す（<）。
         */
        LessThan = 3,
    }
    /**
     * Countsリージョンへの書き込み操作種別を表す。
     */
    enum StorageCountsOperation {
        /**
         * インクリメント操作を実行する。
         */
        Incr = 1,
        /**
         * デクリメント操作を実行する。
         */
        Decr = 2,
    }
    /**
     * `StorageWriter#write()` に指定する書き込みオプション。
     */
    interface StorageWriteOption {
        /**
         * 比較条件を表す。
         */
        condition?: StorageCondition;
        /**
         * 現在保存されている値と比較する値。
         */
        comparisonValue?: string | number;
        /**
         * 操作種別。
         */
        operation?: StorageCountsOperation;
    }
    /**
     * `StorageReadKey` に指定する取得オプション。
     */
    interface StorageReadOption {
        /**
         * リージョンキーでソートして一括取得を行う場合のソート順。
         */
        keyOrder?: StorageOrder;
        /**
         * 値でソートして一括取得を行う場合のソート順。
         */
        valueOrder?: StorageOrder;
    }
    /**
     * ストレージキーを表す。
     */
    interface StorageKey {
        /**
         * リージョン。
         */
        region: StorageRegion;
        /**
         * リージョンキー。
         */
        regionKey: string;
        /**
         * ゲームID。
         */
        gameId?: string;
        /**
         * ユーザID。
         */
        userId?: string;
    }
    /**
     * 値の読み込み時に指定するキーを表す。
     */
    interface StorageReadKey extends StorageKey {
        /**
         * 取得オプション。
         */
        option?: StorageReadOption;
    }
    /**
     * ストレージキーに対応する値を表す。
     */
    interface StorageValue {
        /**
         * 取得結果を表すデータ。
         */
        data: number | string;
        /**
         * データタグ。
         */
        tag?: string;
        /**
         * この `StorageValue` に対応する `StorageKey`。
         */
        storageKey?: StorageKey;
    }
    /**
     * `StorageLoader` の読み込みまたは読み込み失敗を受け取るハンドラのインターフェース定義。
     * 通常、このインターフェースをゲーム開発者が利用する必要はない。
     */
    interface StorageLoaderHandler {
        /**
         * 読み込失敗の通知を受ける関数。
         * @private
         */
        _onStorageLoadError(error: StorageLoadError): void;
        /**
         * 読み込完了の通知を受ける関数。
         * @private
         */
        _onStorageLoaded(): void;
    }
    /**
     * ストレージの値を保持するクラス。
     * ゲーム開発者がこのクラスのインスタンスを直接生成することはない。
     */
    class StorageValueStore {
        /**
         * @private
         */
        _keys: StorageKey[];
        /**
         * @private
         */
        _values: StorageValue[][];
        constructor(keys: StorageKey[], values?: StorageValue[][]);
        /**
         * 値の配列を `StorageKey` またはインデックスから取得する。
         * 通常、インデックスは `Scene` のコンストラクタに指定した `storageKeys` のインデックスに対応する。
         * @param keyOrIndex `StorageKey` 又はインデックス
         */
        get(keyOrIndex: StorageReadKey | number): StorageValue[];
        /**
         * 値を `StorageKey` またはインデックスから取得する。
         * 対応する値が複数ある場合は、先頭の値を取得する。
         * 通常、インデックスは `Scene` のコンストラクタに指定した `storageKeys` のインデックスに対応する。
         * @param keyOrIndex `StorageKey` 又はインデックス
         */
        getOne(keyOrIndex: StorageReadKey | number): StorageValue;
    }
    type StorageValueStoreSerialization = any;
    /**
     * ストレージの値をロードするクラス。
     * ゲーム開発者がこのクラスのインスタンスを直接生成することはなく、
     * 本クラスの機能を利用することもない。
     */
    class StorageLoader {
        /**
         * @private
         */
        _loaded: boolean;
        /**
         * @private
         */
        _storage: Storage;
        /**
         * @private
         */
        _valueStore: StorageValueStore;
        /**
         * @private
         */
        _handler: StorageLoaderHandler;
        /**
         * @private
         */
        _valueStoreSerialization: StorageValueStoreSerialization;
        constructor(storage: Storage, keys: StorageReadKey[], serialization?: StorageValueStoreSerialization);
        /**
         * @private
         */
        _load(handler: StorageLoaderHandler): void;
        /**
         * @private
         */
        _onLoaded(values: StorageValue[][], serialization?: StorageValueStoreSerialization): void;
        /**
         * @private
         */
        _onError(error: StorageLoadError): void;
    }
    /**
     * ストレージ。
     * ゲーム開発者がこのクラスのインスタンスを直接生成することはない。
     */
    class Storage {
        /**
         * @private
         */
        _game: Game;
        /**
         * @private
         */
        _write: (key: StorageKey, value: StorageValue, option: StorageWriteOption) => void;
        /**
         * @private
         */
        _load: (keys: StorageReadKey[], load: StorageLoader, serialization?: StorageValueStoreSerialization) => void;
        /**
         * @private
         */
        _requestedKeysForJoinPlayer: StorageReadKey[];
        constructor(game: Game);
        /**
         * ストレージに値を書き込む。
         * @param key ストレージキーを表す `StorageKey`
         * @param value 値を表す `StorageValue`
         * @param option 書き込みオプション
         */
        write(key: StorageKey, value: StorageValue, option?: StorageWriteOption): void;
        /**
         * 参加してくるプレイヤーの値をストレージから取得することを要求する。
         * 取得した値は `JoinEvent#storageValues` に格納される。
         * @param keys ストレージキーを表す `StorageReadKey` の配列。`StorageReadKey#userId` は無視される。
         */
        requestValuesForJoinPlayer(keys: StorageReadKey[]): void;
        /**
         * @private
         */
        _createLoader(keys: StorageReadKey[], serialization?: StorageValueStoreSerialization): StorageLoader;
        /**
         * @private
         */
        _registerWrite(write: (key: StorageKey, value: StorageValue, option: StorageWriteOption) => void): void;
        /**
         * @private
         */
        _registerLoad(load: (keys: StorageKey[], loader: StorageLoader, serialization?: StorageValueStoreSerialization) => void): void;
    }
}
declare namespace g {
    /**
     * SceneAssetHolder のコンストラクタに指定できるパラメータ。
     * 通常、ゲーム開発者が利用する必要はない。
     */
    interface SceneAssetHolderParameterObject {
        /**
         * 属するシーン。
         * このインスタンスが読み込んだアセットは、このシーンの `assets` から参照できる。
         * またこのシーンの破棄時に破棄される。
         */
        scene: Scene;
        /**
         * アセットの読み込みに利用するアセットマネージャ。
         */
        assetManager: AssetManager;
        /**
         * 読み込むアセット。
         */
        assetIds: (string | DynamicAssetConfiguration)[];
        /**
         * 読み込み完了の通知を受けるハンドラ
         */
        handler: () => void;
        /**
         * `handler` 呼び出し時、 `this` として使われる値。
         */
        handlerOwner?: any;
        /**
         * `handler` を直接呼ぶか。
         * 真である場合、 `handler` は読み込み完了後に直接呼び出される。
         * でなければ次の `Game#tick()` 呼び出し時点まで遅延される。
         * 省略された場合、偽。
         */
        direct?: boolean;
    }
    /**
     * シーンのアセットの読み込みと破棄を管理するクラス。
     * 本クラスのインスタンスをゲーム開発者が直接生成することはなく、ゲーム開発者が利用する必要もない。
     */
    class SceneAssetHolder {
        /**
         * 読み込みを待つ残りのアセット数。
         * この値は参照のためにのみ公開される。この値を外部から書き換えてはならない。
         */
        waitingAssetsCount: number;
        /**
         * @private
         */
        _scene: Scene;
        /**
         * @private
         */
        _assetManager: AssetManager;
        /**
         * @private
         */
        _handler: () => void;
        /**
         * @private
         */
        _handlerOwner: any;
        /**
         * @private
         */
        _direct: boolean;
        /**
         * @private
         */
        _assetIds: (string | DynamicAssetConfiguration)[];
        /**
         * @private
         */
        _assets: Asset[];
        /**
         * @private
         */
        _requested: boolean;
        constructor(param: SceneAssetHolderParameterObject);
        request(): boolean;
        destroy(): void;
        destroyed(): boolean;
        callHandler(): void;
        /**
         * @private
         */
        _onAssetError(asset: Asset, error: AssetLoadError, assetManager: AssetManager): void;
        /**
         * @private
         */
        _onAssetLoad(asset: Asset): void;
    }
    /**
     * `Scene` のコンストラクタに渡すことができるパラメータ。
     * 説明のない各メンバの詳細は `Scene` の同名メンバの説明を参照すること。
     */
    interface SceneParameterObject {
        /**
         * このシーンの属するゲーム。
         */
        game: Game;
        /**
         * このシーンで用いるアセットIDの配列。
         * なおアセットIDとは、 game.jsonのassetsオブジェクトに含まれるキー文字列である。
         * @default undefined
         */
        assetIds?: (string | DynamicAssetConfiguration)[];
        /**
         * このシーンで用いるストレージのキーを表す `StorageReadKey` の配列。
         * @default undefined
         */
        storageKeys?: StorageReadKey[];
        /**
         * このシーンのローカルティック消化ポリシー。
         *
         * * `LocalTickMode.FullLocal` が与えられた場合、このシーンはローカルシーンと呼ばれる。
         *   ローカルシーンでは、他プレイヤーと独立な時間進行処理(ローカルティックの消化)が行われる。
         * * `LocalTickMode.NonLocal` が与えられた場合、このシーンは非ローカルシーンと呼ばれる。
         *   非ローカルシーンでは、他プレイヤーと共通の時間進行処理((非ローカル)ティックの消化)が行われる(updateがfireされる)。
         *   ローカルティックを消化することはない。
         * * `LocalTickMode.InterpolateLocal` が与えられた場合、このシーンはローカルティック補間シーンと呼ばれる。
         *   ローカルティック補間シーンでは、非ローカルシーン同様にティックを消化するが、
         *   消化すべき非ローカルティックがない場合にローカルティックが補間され消化される。
         *
         * ローカルシーンに属するエンティティは、すべてローカルである(強制的にローカルエンティティとして生成される)。
         * ローカルシーンは特にアセットロード中のような、他プレイヤーと同期すべきでないシーンのために存在する機能である。
         *
         * `LocalTickMode` の代わりに `boolean` を与えることもできる。
         * 偽は `LocalTickMode.NonLocal` 、 真は `FullLocal` と解釈される。
         * @default LocalTickMode.NonLocal
         */
        local?: boolean | LocalTickMode;
        /**
         * このシーンの識別用の名前。
         * @default undefined
         */
        name?: string;
        /**
         * このシーンで復元するストレージデータ。
         *
         * falsyでない場合、 `Scene#serializeStorageValues()` の戻り値でなければならない。
         * この値を指定した場合、 `storageValues` の値は `serializeStorageValues()` を呼び出したシーン(元シーン)の持っていた値を再現したものになる。
         * この時、 `storageKeys` の値は元シーンと同じでなければならない。
         * @default undefined
         */
        storageValuesSerialization?: StorageValueStoreSerialization;
        /**
         * 時間経過の契機(ティック)をどのように生成するか。
         *
         * 省略された場合、 `TickGenerationMode.ByClock` 。
         * `Manual` を指定した場合、 `Game#raiseTick()` を呼び出さない限りティックが生成されない(時間経過しない)。
         * ただしローカルティック(ローカルシーンの間などの「各プレイヤー間で独立な時間経過処理」)はこの値の影響を受けない。
         * またこのシーンへの遷移直後、一度だけこの値に関わらずティックが生成される。
         */
        tickGenerationMode?: TickGenerationMode;
    }
    /**
     * そのSceneの状態を表す列挙子。
     *
     * - Destroyed: すでに破棄されているシーンで、再利用が不可能になっている状態を表す
     * - Standby: 初期化された状態のシーンで、シーンスタックへ追加されることを待っている状態を表す
     * - Active: シーンスタックの一番上にいるシーンで、ゲームのカレントシーンとして活性化されている状態を表す
     * - Deactive: シーンスタックにいるが一番上ではないシーンで、裏側で非活性状態になっていることを表す
     * - BeforeDestroyed: これから破棄されるシーンで、再利用が不可能になっている状態を表す
     */
    enum SceneState {
        Destroyed = 0,
        Standby = 1,
        Active = 2,
        Deactive = 3,
        BeforeDestroyed = 4,
    }
    enum SceneLoadState {
        Initial = 0,
        Ready = 1,
        ReadyFired = 2,
        LoadedFired = 3,
    }
    /**
     * シーンを表すクラス。
     */
    class Scene implements Destroyable, Registrable<E>, StorageLoaderHandler {
        /**
         * このシーンの子エンティティ。
         *
         * エンティティは `Scene#append()` によって追加され、 `Scene#remove()` によって削除される。
         */
        children: E[];
        /**
         * このシーンで利用できるアセット。
         *
         * アセットID をkeyに、対応するアセットのインスタンスを得ることができる。
         * keyはこのシーンの生成時、コンストラクタの第二引数 `assetIds` に渡された配列に含まれる文字列でなければならない。
         */
        assets: {
            [key: string]: Asset;
        };
        /**
         * このシーンの属するゲーム。
         */
        game: Game;
        /**
         * このシーンのローカルティック消化ポリシー。
         *
         * * `LocalTickMode.NonLocal` が与えられた場合、このシーンは非ローカルシーンと呼ばれる。
         *   非ローカルシーンでは、他プレイヤーと共通の時間進行処理((非ローカル)ティックの消化)が行われる(updateがfireされる)。
         * * `LocalTickMode.FullLocal` が与えられた場合、このシーンはローカルシーンと呼ばれる。
         *   ローカルシーンでは、他プレイヤーと独立な時間進行処理(ローカルティックの消化)が行われる。
         * * `LocalTickMode.InterpolateLocal` が与えられた場合、このシーンはローカルティック補間シーンと呼ばれる。
         *   ローカルティック補間シーンは、非ローカルシーン同様にティックを消化するが、
         *   消化すべき非ローカルティックがない場合にローカルティックが補間され消化される。
         *
         * ローカルシーンとローカルティック補間シーンに属するエンティティは、
         * すべてローカルである(強制的にローカルエンティティとして生成される)。
         * ローカルシーンは特にアセットロード中のような、他プレイヤーと同期すべきでないシーンのために存在する機能である。
         *
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を変更すべきではない。
         */
        local: LocalTickMode;
        /**
         * 時間経過の契機(ティック)をどのように生成するか。
         * `Manual` の場合、 `Game#raiseTick()` を呼び出さない限りティックが生成されない(時間経過しない)。
         * ただしローカルティック(ローカルシーンの間などの「各プレイヤー間で独立な時間経過処理」)はこの値の影響を受けない。
         * またこのシーンへの遷移直後、一度だけこの値に関わらずティックが生成される。
         *
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を変更すべきではない。
         */
        tickGenerationMode: TickGenerationMode;
        /**
         * シーンの識別用の名前。
         */
        name: string;
        /**
         * 時間経過イベント。本イベントの一度のfireにつき、常に1フレーム分の時間経過が起こる。
         */
        update: Trigger<void>;
        /**
         * 読み込み完了イベント。
         *
         * このシーンの生成時に(コンストラクタで)指定されたすべてのアセットの読み込みが終了した後、一度だけfireされる。
         * このシーンのアセットを利用するすべての処理は、このイベントのfire後に実行されなければならない。
         */
        loaded: Trigger<Scene>;
        /**
         * アセット読み込み成功イベント。
         *
         * このシーンのアセットが一つ読み込まれる度にfireされる。
         * アセット読み込み中の動作をカスタマイズしたい場合に用いる。
         */
        assetLoaded: Trigger<Asset>;
        /**
         * アセット読み込み失敗イベント。
         *
         * このシーンのアセットが一つ読み込みに失敗する度にfireされる。
         * アセット読み込み中の動作をカスタマイズしたい場合に用いる。
         * このイベントをhandleする場合、ハンドラは `AssetLoadFailureInfo#cancelRetry` を真にすることでゲーム続行を断念することができる。
         */
        assetLoadFailed: Trigger<AssetLoadFailureInfo>;
        /**
         * アセット読み込み完了イベント。
         *
         * このシーンのアセットが一つ読み込みに失敗または成功する度にfireされる。
         * アセット読み込み中の動作をカスタマイズしたい場合に用いる。
         */
        assetLoadCompleted: Trigger<Asset>;
        /**
         * シーンの状態。
         */
        state: SceneState;
        /**
         * シーンの状態変更イベント。
         * 状態が初期化直後の `Standby` 状態以外に変化するときfireされる。
         */
        stateChanged: Trigger<SceneState>;
        /**
         * 汎用メッセージイベント。
         */
        message: Trigger<MessageEvent>;
        /**
         * シーン内でのpoint downイベント。
         *
         * このイベントは `E#pointDown` とは独立にfireされる。
         * すなわち、シーン内に同じ位置でのpoint downイベントに反応する `E` がある場合もない場合もこのイベントはfireされる。
         */
        pointDownCapture: Trigger<PointDownEvent>;
        /**
         * シーン内でのpoint moveイベント。
         *
         * このイベントは `E#pointMove` とは独立にfireされる。
         * すなわち、シーン内に同じ位置でのpoint moveイベントに反応する `E` がある場合もない場合もこのイベントはfireされる。
         */
        pointMoveCapture: Trigger<PointMoveEvent>;
        /**
         * シーン内でのpoint upイベント。
         *
         * このイベントは `E#pointUp` とは独立にfireされる。
         * すなわち、シーン内に同じ位置でのpoint upイベントに反応する `E` がある場合もない場合もこのイベントはfireされる。
         */
        pointUpCapture: Trigger<PointUpEvent>;
        /**
         * シーン内での操作イベント。
         */
        operation: Trigger<OperationEvent>;
        /**
         * シーン内で利用可能なストレージの値を保持する `StorageValueStore`。
         */
        storageValues: StorageValueStore;
        /**
         * @private
         */
        _storageLoader: StorageLoader;
        /**
         * アセットとストレージの読み込みが終わったことを通知するTrigger。
         * @private
         */
        _ready: Trigger<Scene>;
        /**
         * 読み込みが開始されたか否か。
         * すなわち、 `_load()` が呼び出された後か否か。
         *
         * 歴史的経緯により、このフラグの意味は「読み込みが終わった後」でも「loadedがfireされた後」でもない点に注意。
         * なお前者「(アセットとストレージの)読み込みが終わった後」は `_loadingState === SceneLoadState.Ready` に与えられる。
         *
         * シーンの読み込みは概ね次の順で処理が進行する。
         * * `_loaded` が真になる
         * * 各種読み込みが完了する
         * * `_loadingState` が `SceneLoadState.Ready` になる
         * * `_ready` がfireされる
         * * `_loadingState` が `SceneLoadState.ReadyFired` になる
         * * `loaded` がfireされる
         * * `_loadingState` が `SceneLoadState.LoadedFired` になる
         * @private
         */
        _loaded: boolean;
        /**
         * 先読みが要求されたか否か。
         * すなわち、 `prefetch()` が呼び出された後か否か。
         * @private
         */
        _prefetchRequested: boolean;
        /**
         * アセットとストレージの読み込みが終わった後か否か。
         * 「 `loaded` がfireされた後」ではない点に注意。
         * @private
         */
        _loadingState: SceneLoadState;
        /**
         * タイマー。通常は本変数直接ではなく、createTimer/deleteTimer/setInterval/clearInterval等の機構を利用する。
         * @private
         */
        _timer: TimerManager;
        /**
         * シーンのアセットの保持者。
         * @private
         */
        _sceneAssetHolder: SceneAssetHolder;
        /**
         * `Scene#requestAssets()` で動的に要求されたアセットの保持者。
         * @private
         */
        _assetHolders: SceneAssetHolder[];
        /**
         * 各種パラメータを指定して `Scene` のインスタンスを生成する。
         * @param param 初期化に用いるパラメータのオブジェクト
         */
        constructor(param: SceneParameterObject);
        /**
         * このシーンが変更されたことをエンジンに通知する。
         *
         * このメソッドは、このシーンに紐づいている `E` の `modified()` を呼び出すことで暗黙に呼び出される。
         * 通常、ゲーム開発者がこのメソッドを呼び出す必要はない。
         * @param isBubbling この関数をこのシーンの子の `modified()` から呼び出す場合、真を渡さなくてはならない。省略された場合、偽。
         */
        modified(isBubbling?: boolean): void;
        /**
         * このシーンを破棄する。
         *
         * 破棄処理の開始時に、このシーンの `stateChanged` が引数 `BeforeDestroyed` でfireされる。
         * 破棄処理の終了時に、このシーンの `stateChanged` が引数 `Destroyed` でfireされる。
         * このシーンに紐づいている全ての `E` と全てのTimerは破棄される。
         * `Scene#setInterval()`, `Scene#setTimeout()` に渡された関数は呼び出されなくなる。
         *
         * このメソッドは `Scene#end` や `Game#popScene` などによって要求されたシーンの遷移時に暗黙に呼び出される。
         * 通常、ゲーム開発者がこのメソッドを呼び出す必要はない。
         */
        destroy(): void;
        /**
         * 破棄済みであるかを返す。
         */
        destroyed(): boolean;
        /**
         * 一定間隔で定期的に処理を実行するTimerを作成して返す。
         *
         * 戻り値は作成されたTimerである。
         * 通常は `Scene#setInterval` を利用すればよく、ゲーム開発者がこのメソッドを呼び出す必要はない。
         * `Timer` はフレーム経過処理(`Scene#update`)で実現される疑似的なタイマーである。実時間の影響は受けない。
         * @param interval Timerの実行間隔（ミリ秒）
         */
        createTimer(interval: number): Timer;
        /**
         * Timerを削除する。
         * @param timer 削除するTimer
         */
        deleteTimer(timer: Timer): void;
        /**
         * 一定間隔で定期的に実行される処理を作成する。
         *
         * `interval` ミリ秒おきに `owner` を `this` として `handler` を呼び出す。
         * 戻り値は `Scene#clearInterval` の引数に指定して定期実行を解除するために使える値である。
         * このタイマーはフレーム経過処理(`Scene#update`)で実現される疑似的なタイマーである。実時間の影響は受けない。
         * 関数は指定時間の経過直後ではなく、経過後最初のフレームで呼び出される。
         * @param handler 処理
         * @param interval 実行間隔(ミリ秒)
         * @param owner handlerの所有者。省略された場合、null
         */
        setInterval(handler: () => void, interval: number, owner?: any): TimerIdentifier;
        /**
         * 一定間隔で定期的に実行される処理を作成する。
         * `interval` ミリ秒おきに `owner` を `this` として `handler` を呼び出す。
         * @param interval 実行間隔(ミリ秒)
         * @param owner handlerの所有者。省略された場合、null
         * @param handler 処理
         * @deprecated この引数順は現在非推奨である。関数を先に指定するものを利用すべきである。
         */
        setInterval(interval: number, owner: any, handler: () => void): TimerIdentifier;
        /**
         * 一定間隔で定期的に実行される処理を作成する。
         * `interval` ミリ秒おきに `owner` を `this` として `handler` を呼び出す。
         * @param interval 実行間隔(ミリ秒)
         * @param handler 処理
         * @deprecated この引数順は現在非推奨である。関数を先に指定するものを利用すべきである。
         */
        setInterval(interval: number, handler: () => void): TimerIdentifier;
        /**
         * setIntervalで作成した定期処理を解除する。
         * @param identifier 解除対象
         */
        clearInterval(identifier: TimerIdentifier): void;
        /**
         * 一定時間後に一度だけ実行される処理を作成する。
         *
         * `milliseconds` ミリ秒後(以降)に、一度だけ `owner` を `this` として `handler` を呼び出す。
         * 戻り値は `Scene#clearTimeout` の引数に指定して処理を削除するために使える値である。
         *
         * このタイマーはフレーム経過処理(`Scene#update`)で実現される疑似的なタイマーである。実時間の影響は受けない。
         * 関数は指定時間の経過直後ではなく、経過後最初のフレームで呼び出される。
         * (理想的なケースでは、30FPSなら50msのコールバックは66.6ms時点で呼び出される)
         * 時間経過に対して厳密な処理を行う必要があれば、自力で `Scene#update` 通知を処理すること。
         *
         * @param handler 処理
         * @param milliseconds 時間(ミリ秒)
         * @param owner handlerの所有者。省略された場合、null
         */
        setTimeout(handler: () => void, milliseconds: number, owner?: any): TimerIdentifier;
        /**
         * 一定時間後に一度だけ実行される処理を作成する。
         *
         * `milliseconds` ミリ秒後(以降)に、一度だけ `owner` を `this` として `handler` を呼び出す。
         * @param handler 処理
         * @param milliseconds 時間(ミリ秒)
         * @param owner handlerの所有者。省略された場合、null
         * @deprecated この引数順は現在非推奨である。関数を先に指定するものを利用すべきである。
         */
        setTimeout(milliseconds: number, owner: any, handler: () => void): TimerIdentifier;
        /**
         * 一定時間後に一度だけ実行される処理を作成する。
         *
         * `milliseconds` ミリ秒後(以降)に、一度だけ `handler` を呼び出す。
         * @param handler 処理
         * @param milliseconds 時間(ミリ秒)
         * @deprecated この引数順は現在非推奨である。関数を先に指定するものを利用すべきである。
         */
        setTimeout(milliseconds: number, handler: () => void): TimerIdentifier;
        /**
         * setTimeoutで作成した処理を削除する。
         * @param identifier 解除対象
         */
        clearTimeout(identifier: TimerIdentifier): void;
        /**
         * このシーンが現在のシーンであるかどうかを返す。
         */
        isCurrentScene(): boolean;
        /**
         * 次のシーンへの遷移を要求する。
         *
         * このメソッドは、 `toPush` が真ならば `Game#pushScene()` の、でなければ `Game#replaceScene` のエイリアスである。
         * このメソッドは要求を行うだけである。呼び出し直後にはシーン遷移は行われていないことに注意。
         * このシーンが現在のシーンでない場合、 `AssertionError` がthrowされる。
         * @param next 遷移後のシーン
         * @param toPush 現在のシーンを残したままにするなら真、削除して遷移するなら偽を指定する。省略された場合偽
         */
        gotoScene(next: Scene, toPush?: boolean): void;
        /**
         * このシーンの削除と、一つ前のシーンへの遷移を要求する。
         *
         * このメソッドは `Game#popScene()` のエイリアスである。
         * このメソッドは要求を行うだけである。呼び出し直後にはシーン遷移は行われていないことに注意。
         * このシーンが現在のシーンでない場合、 `AssertionError` がthrowされる。
         */
        end(): void;
        /**
         * このSceneにエンティティを登録する。
         *
         * このメソッドは各エンティティに対して暗黙に呼び出される。ゲーム開発者がこのメソッドを明示的に呼び出す必要はない。
         * @param e 登録するエンティティ
         */
        register(e: E): void;
        /**
         * このSceneからエンティティの登録を削除する。
         *
         * このメソッドは各エンティティに対して暗黙に呼び出される。ゲーム開発者がこのメソッドを明示的に呼び出す必要はない。
         * @param e 登録を削除するエンティティ
         */
        unregister(e: E): void;
        /**
         * 子エンティティを追加する。
         *
         * `this.children` の末尾に `e` を追加する(`e` はそれまでに追加されたすべての子エンティティより手前に表示される)。
         *
         * @param e 子エンティティとして追加するエンティティ
         */
        append(e: E): void;
        /**
         * 子エンティティを挿入する。
         *
         * `this.children` の`target`の位置に `e` を挿入する。
         * `target` が`this` の子でない場合、`append(e)`と同じ動作となる。
         *
         * @param e 子エンティティとして追加するエンティティ
         * @param target 挿入位置にある子エンティティ
         */
        insertBefore(e: E, target: E): void;
        /**
         * 子エンティティを削除する。
         * `this` の子から `e` を削除する。 `e` が `this` の子でない場合、何もしない。
         * @param e 削除する子エンティティ
         */
        remove(e: E): void;
        /**
         * シーン内でその座標に反応する `PointSource` を返す。
         * @param point 対象の座標
         * @param force touchable指定を無視する場合真を指定する。指定されなかった場合偽
         * @param camera 対象のカメラ。指定されなかった場合undefined
         */
        findPointSourceByPoint(point: CommonOffset, force?: boolean, camera?: Camera): PointSource;
        /**
         * アセットの先読みを要求する。
         *
         * `Scene` に必要なアセットは、通常、`Game#pushScene()` などによるシーン遷移にともなって暗黙に読み込みが開始される。
         * ゲーム開発者はこのメソッドを呼び出すことで、シーン遷移前にアセット読み込みを開始する(先読みする)ことができる。
         * 先読み開始後、シーン遷移時までに読み込みが完了していない場合、通常の読み込み処理同様にローディングシーンが表示される。
         *
         * このメソッドは `StorageLoader` についての先読み処理を行わない点に注意。
         * ストレージの場合、書き込みが行われる可能性があるため、順序を無視して先読みすることはできない。
         */
        prefetch(): void;
        /**
         * シーンが読み込んだストレージの値をシリアライズする。
         *
         * `Scene#storageValues` の内容をシリアライズする。
         */
        serializeStorageValues(): StorageValueStoreSerialization;
        requestAssets(assetIds: (string | DynamicAssetConfiguration)[], handler: () => void): void;
        /**
         * @private
         */
        _activate(): void;
        /**
         * @private
         */
        _deactivate(): void;
        /**
         * @private
         */
        _needsLoading(): boolean;
        /**
         * @private
         */
        _load(): void;
        /**
         * @private
         */
        _onSceneAssetsLoad(): void;
        /**
         * @private
         */
        _onStorageLoadError(error: StorageLoadError): void;
        /**
         * @private
         */
        _onStorageLoaded(): void;
        /**
         * @private
         */
        _notifySceneReady(): void;
        /**
         * @private
         */
        _fireReady(): void;
        /**
         * @private
         */
        _fireLoaded(): void;
    }
}
declare namespace g {
    interface LoadingSceneParameterObject extends SceneParameterObject {
        /**
         * 読み込み完了時に暗黙に呼び出される `LoadingScene#end()` を抑止するか否か。
         *
         * この値を真にする場合、ゲーム開発者はローディングシーンを終了するために明示的に `end()` を呼び出す必要がある。
         * `end()` の呼び出しは `targetReady` のfire後でなければならない点に注意すること。
         *
         * @default false
         */
        explicitEnd?: boolean;
    }
    /**
     * Assetの読み込み中に表示されるシーン。
     *
     * 本シーンは通常のシーンと異なり、ゲーム内時間(`Game#age`)と独立に実行される。
     * アセットやストレージデータを読み込んでいる間、ゲーム内時間が進んでいない状態でも、
     * `LoadingScene` は画面に変化を与えることができる(`update` がfireされる)。
     *
     * ゲーム開発者は、ローディング中の演出を実装した独自の `LoadingScene` を
     * `Game#loadingScene` に代入することでエンジンに利用させることができる。
     *
     * ゲーム内時間と独立に処理される `LoadingScene` での処理には再現性がない(他プレイヤーと状態が共有されない)。
     * そのため `Game` に対して副作用のある操作を行ってはならない点に注意すること。
     */
    class LoadingScene extends Scene {
        /**
         * ローディングシーンの読み込み待ち対象シーンが切り替わった場合にfireされるTrigger。
         * ゲーム開発者は、このTriggerにaddしてローディングシーンの内容を初期化することができる。
         */
        targetReset: Trigger<Scene>;
        /**
         * ローディングシーンの読み込みが完了した時にfireされるTrigger。
         * `explicitEnd` に真を渡して生成した場合、ローディングシーンを終了するには
         * このTriggerのfire後に明示的に `end()` を呼び出す必要がある。
         */
        targetReady: Trigger<Scene>;
        /**
         * ローディングシーンの読み込み待ち対象シーンがアセットを読み込む度にfireされるTrigger。
         */
        targetAssetLoaded: Trigger<Asset>;
        /**
         * @private
         */
        _explicitEnd: boolean;
        /**
         * @private
         */
        _targetScene: Scene;
        /**
         * `LoadingScene` のインスタンスを生成する。
         * @param param 初期化に用いるパラメータのオブジェクト
         */
        constructor(param: LoadingSceneParameterObject);
        destroy(): void;
        /**
         * アセットロード待ち対象シーンを変更する。
         *
         * このメソッドは、新たにシーンのロード待ちが必要になった場合にエンジンによって呼び出される。
         * (派生クラスはこの処理をオーバーライドしてもよいが、その場合その中で
         * このメソッド自身 (`g.LoadingScene.prototype.reset`) を呼び出す (`call()` する) 必要がある。)
         *
         * @param targetScene アセットロード待ちが必要なシーン
         */
        reset(targetScene: Scene): void;
        /**
         * アセットロード待ち対象シーンの残りのロード待ちアセット数を取得する。
         */
        getTargetWaitingAssetsCount(): number;
        /**
         * ローディングシーンを終了する。
         *
         * `Scene#end()` と異なり、このメソッドの呼び出しはこのシーンを破棄しない。(ローディングシーンは再利用される。)
         * このメソッドが呼び出される時、 `targetReady` がfireされた後でなければならない。
         */
        end(): void;
        /**
         * @private
         */
        _clearTargetScene(): void;
        /**
         * @private
         */
        _doReset(): void;
        /**
         * @private
         */
        _fireTriggerOnTargetAssetLoad(asset: Asset): void;
        /**
         * @private
         */
        _fireTriggerOnTargetReady(scene: Scene): void;
    }
}
declare namespace g {
    /**
     * `DeafultLoadingScene` のコンストラクタに渡すことができるパラメータ。
     * 汎用性のあるクラスではなく、カスタマイズすべき余地は大きくないので LoadingSceneParameterObject は継承していない。
     */
    interface DefaultLoadingSceneParameterObject {
        /**
         * このシーンが属する `Game` 。
         */
        game: Game;
    }
    /**
     * デフォルトローディングシーン。
     *
     * `Game#_defaultLoadingScene` の初期値として利用される。
     * このシーンはいかなるアセットも用いてはならない。
     */
    class DefaultLoadingScene extends LoadingScene {
        private _totalWaitingAssetCount;
        private _gauge;
        private _gaugeUpdateCount;
        private _barWidth;
        private _barHeight;
        /**
         * `DeafultLoadingScene` のインスタンスを生成する。
         * @param param 初期化に用いるパラメータのオブジェクト
         */
        constructor(param: DefaultLoadingSceneParameterObject);
        /**
         * @private
         */
        _onLoaded(): boolean;
        /**
         * @private
         */
        _onUpdateGuage(): void;
        /**
         * @private
         */
        _onTargetReset(targetScene: Scene): void;
        /**
         * @private
         */
        _onTargetAssetLoaded(asset: Asset): void;
    }
}
declare namespace g {
    /**
     * `Sprite` のコンストラクタに渡すことができるパラメータ。
     * 各メンバの詳細は `Sprite` の同名メンバの説明を参照すること。
     *
     * 値に `width` または `height` が含まれていない場合、
     * `Sprite` のコンストラクタはそれぞれ `src.width`、 `src.height` が指定されたかのように振る舞う。
     */
    interface SpriteParameterObject extends EParameterObject {
        /**
         * 画像として使う `Surface` または `ImageAsset` 。
         */
        src: Surface | Asset;
        /**
         * `surface` の描画対象部分の幅。
         * 描画はこの値を `this.width` に拡大または縮小する形で行われる。
         * 省略された場合、値に `width` があれば `width` 、なければ `src.width` 。
         * @default (width !== undefined) ? width : src.width
         */
        srcWidth?: number;
        /**
         * `surface` の描画対象部分の高さ。
         * 描画はこの値を `this.height` に拡大または縮小する形で行われる。
         * 省略された場合、値に `height` があれば `height` 、なければ `src.height` 。
         * @default height || src.height
         */
        srcHeight?: number;
        /**
         * `surface` の描画対象部分の左端。
         * @default 0
         */
        srcX?: number;
        /**
         * `surface` の描画対象部分の上端。
         * @default 0
         */
        srcY?: number;
    }
    /**
     * 画像を描画するエンティティ。
     */
    class Sprite extends E {
        /**
         * 描画する画像。
         * `srcX` ・ `srcY` ・ `srcWidth` ・ `srcHeight` の作る矩形がこの画像の範囲外を示す場合、描画結果は保証されない。
         * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
         */
        surface: Surface;
        /**
         * `surface` の描画対象部分の幅。
         * 描画はこの値を `this.width` に拡大または縮小する形で行われる。
         * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
         */
        srcWidth: number;
        /**
         * `surface` の描画対象部分の高さ。
         * 描画はこの値を `this.height` に拡大または縮小する形で行われる。
         * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
         */
        srcHeight: number;
        /**
         * `surface` の描画対象部分の左端。
         * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
         */
        srcX: number;
        /**
         * `surface` の描画対象部分の上端。
         * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
         */
        srcY: number;
        /**
         * @private
         */
        _stretchMatrix: Matrix;
        /**
         * @private
         */
        _beforeSurface: Surface;
        /**
         * 各種パラメータを指定して `Sprite` のインスタンスを生成する。
         * @param param `Sprite` に設定するパラメータ
         */
        constructor(param: SpriteParameterObject);
        /**
         * @private
         */
        _onUpdate(): void;
        /**
         * @private
         */
        _onAnimatingStarted(): void;
        /**
         * @private
         */
        _onAnimatingStopped(): void;
        /**
         * このエンティティ自身の描画を行う。
         * このメソッドはエンジンから暗黙に呼び出され、ゲーム開発者が呼び出す必要はない。
         */
        renderSelf(renderer: Renderer, camera?: Camera): boolean;
        /**
         * このエンティティの描画キャッシュ無効化をエンジンに通知する。
         * このメソッドを呼び出し後、描画キャッシュの再構築が行われ、各 `Renderer` に描画内容の変更が反映される。
         */
        invalidate(): void;
        /**
         * このエンティティを破棄する。
         * デフォルトでは利用している `Surface` の破棄は行わない点に注意。
         * @param destroySurface trueを指定した場合、このエンティティが抱える `Surface` も合わせて破棄する
         */
        destroy(destroySurface?: boolean): void;
        private _invalidateSelf();
    }
}
declare namespace g {
    /**
     * `FrameSprite` のコンストラクタに渡すことができるパラメータ。
     * 各メンバの詳細は `FrameSprite` の同名メンバの説明を参照すること。
     */
    interface FrameSpriteParameterObject extends SpriteParameterObject {
        /**
         * 画像として使う `Surface` または `ImageAsset` 。
         */
        src: Surface | ImageAsset;
        /**
         * このエンティティの幅
         */
        width: number;
        /**
         * このエンティティの高さ
         */
        height: number;
        /**
         * 最初に表示される画像片のインデックス。
         * `start()` 呼び出しによりタイマーで自動的に書き換えられていくが、ゲーム開発者が明示的に値を設定してもよい。
         * @default 0
         */
        frameNumber?: number;
        /**
         * アニメーションの内容。
         *
         * アニメーションの各フレームでの表示内容を指定するインデックスの配列を指定する。
         * インデックスは、コンストラクタに渡された画像を幅 `srcWidth`, 高さ `srcHeight` 単位の小さな画像(画像片)の集まりであるとみなして、
         * 各画像片を特定する値である。左上の画像片を 0, その右隣の画像片を 1 として左上から右下に順に割り振られる。
         * @default [0]
         */
        frames?: number[];
        /**
         * アニメーションの更新頻度(ミリ秒)。
         * 省略された場合、 `start()` 時にFPSの逆数に設定される。(つまり、1フレームごとに画像が切り替わっていく)
         * @default (1000 / game.fps)
         */
        interval?: number;
    }
    /**
     * フレームとタイマーによるアニメーション機構を持つ `Sprite` 。
     *
     * このクラスは、コンストラクタで渡された画像を、
     * 幅 `srcWidth`, 高さ `srcHeight` 単位で区切られた小さな画像(以下、画像片)の集まりであると解釈する。
     * 各画像片は、左上から順に 0 から始まるインデックスで参照される。
     *
     * ゲーム開発者は、このインデックスからなる配列を `FrameSprite#frames` に設定する。
     * `FrameSprite` は、 `frames` に指定されたインデックス(が表す画像片)を順番に描画することでアニメーションを実現する。
     * アニメーションは `interval` ミリ秒ごとに進み、 `frames` の内容をループする。
     *
     * このクラスにおける `srcWidth`, `srcHeight` の扱いは、親クラスである `Sprite` とは異なっていることに注意。
     */
    class FrameSprite extends Sprite {
        /**
         * 現在表示されている画像片のインデックス。
         *
         * `start()` 呼び出しによりタイマーで自動的に書き換えられていくが、ゲーム開発者が明示的に値を設定してもよい。
         * 初期値は `0` である。
         * この値を変更した場合、 `this.modified()` を呼び出す必要がある。
         */
        frameNumber: number;
        /**
         * アニメーションの内容。
         *
         * アニメーションの各フレームでの表示内容を指定するインデックスの配列を指定する。初期値は `[0]` である。
         * インデックスは、コンストラクタに渡された画像を幅 `srcWidth`, 高さ `srcHeight` 単位の小さな画像(画像片)の集まりであるとみなして、
         * 各画像片を特定する値である。左上の画像片を 0, その右隣の画像片を 1 として左上から右下に順に割り振られる。
         *
         * この値を変更した場合、 `this.modified()` を呼び出す必要がある。
         */
        frames: number[];
        /**
         * アニメーションの更新頻度(ミリ秒)。
         * 指定しなかった場合、 `start()` 時にFPSの逆数に設定される。(つまり、1フレームごとに画像が切り替わっていく)
         * この値を変更した場合、反映には `this.start()` を呼び出す必要がある。
         */
        interval: number;
        /**
         * @private
         */
        _timer: Timer;
        /**
         * @private
         */
        _lastUsedIndex: number;
        /**
         * `Sprite` から `FrameSprite` を作成する。
         * @param sprite 画像として使う`Sprite`
         * @param width 作成されるエンティティの高さ。省略された場合、 `sprite.width`
         * @param hegith 作成されるエンティティの高さ。省略された場合、 `sprite.height`
         */
        static createBySprite(sprite: Sprite, width?: number, height?: number): FrameSprite;
        /**
         * 各種パラメータを指定して `FrameSprite` のインスタンスを生成する。
         * @param param `FrameSprite` に設定するパラメータ
         */
        constructor(param: FrameSpriteParameterObject);
        /**
         * アニメーションを開始する。
         */
        start(): void;
        /**
         * このエンティティを破棄する。
         * デフォルトでは利用している `Surface` の破棄は行わない点に注意。
         * @param destroySurface trueを指定した場合、このエンティティが抱える `Surface` も合わせて破棄する
         */
        destroy(destroySurface?: boolean): void;
        /**
         * アニメーションを停止する。
         */
        stop(): void;
        /**
         * このエンティティに対する変更をエンジンに通知する。詳細は `E#modified()` のドキュメントを参照。
         */
        modified(isBubbling?: boolean): void;
        /**
         * @private
         */
        _onElapsed(): void;
        /**
         * @private
         */
        _free(): void;
        /**
         * @private
         */
        _changeFrame(): void;
        private _modifiedSelf(isBubbling?);
    }
}
declare namespace g {
    /**
     * Playerの情報を表すインターフェース。
     */
    interface Player {
        id: string;
        name?: string;
    }
}
declare namespace g {
    /**
     * イベントの種別。
     */
    enum EventType {
        /**
         * 不明なイベント。
         * ゲーム開発者はこの値を利用してはならない。
         */
        Unknown = 0,
        /**
         * プレイヤーの参加を表すイベント。
         */
        Join = 1,
        /**
         * プレイヤーの離脱を表すイベント。
         */
        Leave = 2,
        /**
         * タイムスタンプを表すイベント。
         */
        Timestamp = 3,
        /**
         * 乱数生成器の生成を表すイベント。
         * この値は利用されていない。
         */
        Seed = 4,
        /**
         * ポイントダウンイベント。
         */
        PointDown = 5,
        /**
         * ポイントムーブイベント。
         */
        PointMove = 6,
        /**
         * ポイントアップイベント。
         */
        PointUp = 7,
        /**
         * 汎用的なメッセージを表すイベント。
         */
        Message = 8,
        /**
         * 操作プラグインが通知する操作を表すイベント。
         */
        Operation = 9,
    }
    /**
     * イベントを表すインターフェース。
     */
    interface Event {
        /**
         * イベントの種別。
         */
        type: EventType;
        /**
         * イベントの優先度。
         * 非常に多くのイベントが発生した場合、この値の低いイベントは、高いイベントよりも優先的に破棄・遅延される。
         *
         * ゲーム開発者がイベントを生成する場合、この値に 0 以上 2 以下の整数を指定することができる。
         * ただしその値は単に参考値としてのみ利用される。
         * エンジンはイベントの生成した主体などに応じて、この値を任意に変更する可能性がある。
         */
        priority: number;
        /**
         * このイベントがローカルであるか否か。
         */
        local?: boolean;
    }
    /**
     * ポインティングソースによって対象となるエンティティを表すインターフェース。
     * エンティティとエンティティから見た相対座標によって構成される。
     */
    interface PointSource {
        target: E;
        point: CommonOffset;
        local?: boolean;
    }
    /**
     * ポインティング操作を表すイベント。
     * PointEvent#targetでそのポインティング操作の対象となったエンティティが、
     * PointEvent#pointでそのエンティティから見ての相対座標が取得できる。
     *
     * 本イベントはマルチタッチに対応しており、PointEvent#pointerIdを参照することで識別することが出来る。
     *
     * abstract
     */
    class PointEvent implements Event {
        /**
         * 本クラスはどのtypeにも属さない。
         */
        type: EventType;
        priority: number;
        local: boolean;
        player: Player;
        pointerId: number;
        point: CommonOffset;
        target: E;
        constructor(pointerId: number, target: E, point: CommonOffset, player?: Player, local?: boolean, priority?: number);
    }
    /**
     * ポインティング操作の開始を表すイベント。
     */
    class PointDownEvent extends PointEvent {
        type: EventType;
        constructor(pointerId: number, target: E, point: CommonOffset, player?: Player, local?: boolean, priority?: number);
    }
    /**
     * ポインティング操作の終了を表すイベント。
     * PointDownEvent後にのみ発生する。
     *
     * PointUpEvent#startDeltaによってPointDownEvent時からの移動量が、
     * PointUpEvent#prevDeltaによって直近のPointMoveEventからの移動量が取得出来る。
     * PointUpEvent#pointにはPointDownEvent#pointと同じ値が格納される。
     */
    class PointUpEvent extends PointEvent {
        type: EventType;
        startDelta: CommonOffset;
        prevDelta: CommonOffset;
        constructor(pointerId: number, target: E, point: CommonOffset, prevDelta: CommonOffset, startDelta: CommonOffset, player?: Player, local?: boolean, priority?: number);
    }
    /**
     * ポインティング操作の移動を表すイベント。
     * PointDownEvent後にのみ発生するため、MouseMove相当のものが本イベントとして発生することはない。
     *
     * PointMoveEvent#startDeltaによってPointDownEvent時からの移動量が、
     * PointMoveEvent#prevDeltaによって直近のPointMoveEventからの移動量が取得出来る。
     * PointMoveEvent#pointにはPointMoveEvent#pointと同じ値が格納される。
     *
     * 本イベントは、プレイヤーがポインティングデバイスを移動していなくても、
     * カメラの移動等視覚的にポイントが変化している場合にも発生する。
     */
    class PointMoveEvent extends PointEvent {
        type: EventType;
        startDelta: CommonOffset;
        prevDelta: CommonOffset;
        constructor(pointerId: number, target: E, point: CommonOffset, prevDelta: CommonOffset, startDelta: CommonOffset, player?: Player, local?: boolean, priority?: number);
    }
    /**
     * 汎用的なメッセージを表すイベント。
     * MessageEvent#dataによってメッセージ内容を取得出来る。
     */
    class MessageEvent implements Event {
        type: EventType;
        priority: number;
        local: boolean;
        player: Player;
        data: any;
        constructor(data: any, player?: Player, local?: boolean, priority?: number);
    }
    /**
     * 操作プラグインが通知する操作を表すイベント。
     * プラグインを識別する `OperationEvent#code` と、プラグインごとの内容 `OperationEvent#data` を持つ。
     */
    class OperationEvent implements Event {
        type: EventType;
        priority: number;
        local: boolean;
        player: Player;
        code: number;
        data: any;
        constructor(code: number, data: any, player?: Player, local?: boolean, priority?: number);
    }
    /**
     * プレイヤーの参加を表すイベント。
     * JoinEvent#playerによって、参加したプレイヤーを取得出来る。
     */
    class JoinEvent implements Event {
        type: EventType;
        priority: number;
        player: Player;
        storageValues: StorageValueStore;
        constructor(player: Player, storageValues?: StorageValueStore, priority?: number);
    }
    /**
     * プレイヤーの離脱を表すイベント。
     * LeaveEvent#playerによって、離脱したプレイヤーを取得出来る。
     */
    class LeaveEvent implements Event {
        type: EventType;
        priority: number;
        player: Player;
        constructor(player: Player, priority?: number);
    }
    /**
     * タイムスタンプを表すイベント。
     */
    class TimestampEvent implements Event {
        type: EventType;
        priority: number;
        player: Player;
        timestamp: number;
        constructor(timestamp: number, player: Player, priority?: number);
    }
    /**
     * 新しい乱数の発生を表すイベント。
     * SeedEvent#generatorによって、本イベントで発生したRandomGeneratorを取得出来る。
     */
    class SeedEvent implements Event {
        type: EventType;
        priority: number;
        generator: RandomGenerator;
        constructor(generator: RandomGenerator, priority?: number);
    }
}
declare namespace g {
    /**
     * ログレベル。
     *
     * - Error: サーバ側でも収集される、ゲーム続行不可能なクリティカルなエラーログ
     * - Warn: サーバ側でも収集される、ゲーム続行可能だが危険な状態であることを示す警告ログ
     * - Info: クライアントでのみ収集される情報ログ
     * - Debug: サンドボックス環境でのみ収集される開発時限定のログ。リリース時には本処理をすべて消してリリースすることが望ましい
     */
    enum LogLevel {
        Error = 0,
        Warn = 1,
        Info = 2,
        Debug = 3,
    }
    /**
     * ログ出力情報。
     */
    interface Log {
        /**
         * ログレベル。
         */
        level: LogLevel;
        /**
         * ログの出力元である `Game` 。
         */
        game: Game;
        /**
         * ログ内容。
         */
        message: string;
        /**
         * ゲーム開発者が任意に利用できる、汎用のログ補助情報。
         */
        cause?: any;
    }
    /**
     * デバッグ/エラー用のログ出力機構。
     */
    class Logger {
        /**
         * この `Logger` に紐づく `Game` 。
         */
        game: Game;
        /**
         * ログ出力イベント。
         * ログ出力は、このイベントをfireして各ハンドラにログ内容を渡すことで実現される。
         */
        logging: Trigger<Log>;
        /**
         * `Logger` のインスタンスを生成する。
         * @param game この `Logger` に紐づく `Game` 。
         */
        constructor(game: Game);
        /**
         * `LogLevel.Error` のログを出力する。
         * @param message ログメッセージ
         * @param cause 追加の補助情報。省略された場合、 `undefined`
         */
        error(message: string, cause?: any): void;
        /**
         * `LogLevel.Warn` のログを出力する。
         * @param message ログメッセージ
         * @param cause 追加の補助情報。省略された場合、 `undefined`
         */
        warn(message: string, cause?: any): void;
        /**
         * `LogLevel.Info` のログを出力する。
         * @param message ログメッセージ
         * @param cause 追加の補助情報。省略された場合、 `undefined`
         */
        info(message: string, cause?: any): void;
        /**
         * `LogLevel.Debug` のログを出力する。
         * @param message ログメッセージ
         * @param cause 追加の補助情報。省略された場合、 `undefined`
         */
        debug(message: string, cause?: any): void;
    }
}
declare namespace g {
    /**
     * Assetの設定の共通部分。
     */
    interface AssetConfigurationBase {
        /**
         * Assetの種類。"image", "audio", "script", "text" のいずれか。
         */
        type: string;
        /**
         * 幅。 `type` が `"image"`, `"video"` の場合にのみ存在。
         */
        width?: number;
        /**
         * 高さ。 `type` が `"image"`, `"video"` の場合にのみ存在。
         */
        height?: number;
        /**
         * AudioAssetのsystem指定。 `type` が `"audio"` の場合にのみ存在。
         */
        systemId?: string;
        /**
         * 再生時間。 `type` が `"audio"` の場合にのみ存在。
         */
        duration?: number;
        /**
         * ループ。 `type` が `"audio"` または `"video"` の場合にのみ存在。
         */
        loop?: boolean;
        /**
         * width,heightではなく実サイズを用いる指定。 `type` が `"video"` の場合にのみ存在。
         */
        useRealSize?: boolean;
        /**
         * ヒント。akashic-engineが最適なパフォーマンスを発揮するための情報。`type` が `"audio"` の場合にのみ存在。
         */
        hint?: AudioAssetHint;
    }
    /**
     * Assetの設定を表すインターフェース。
     * game.json の "assets" の各プロパティに記述される値の型。
     */
    interface AssetConfiguration extends AssetConfigurationBase {
        /**
         * Assetを表すファイルへの絶対パス。
         */
        path: string;
        /**
         * Assetを表すファイルのrequire解決用の仮想ツリーにおけるパス。
         * `type` が `"script"` の場合にのみ存在する。
         * 省略するとエンジンにより自動的に設定される。
         */
        virtualPath?: string;
        /**
         * グローバルアセットか否か。省略された場合、偽。
         * この値が真であるアセットは、ゲームコンテンツから常に `Game#assets` 経由で参照できる。`Scene` のコンストラクタで利用を宣言する必要がない。
         */
        global?: boolean;
    }
    /**
     * (実行時に定義される)Assetの設定を表すインターフェース。
     * game.jsonに記述される値の型ではない点に注意。
     */
    interface DynamicAssetConfiguration extends AssetConfigurationBase {
        /**
         * このアセットのIDとして用いる値。
         * この値はひとつのAssetManagerの中でユニークでなければならない。
         */
        id: string;
        /**
         * Assetを表すファイルのURI。
         */
        uri: string;
    }
    /**
     * アセット宣言
     */
    type AssetConfigurationMap = {
        [key: string]: AssetConfiguration;
    };
    /**
     * AudioSystemの設定を表すインターフェース。
     */
    interface AudioSystemConfiguration {
        loop?: boolean;
        hint?: AudioAssetHint;
    }
    /**
     * オーディオシステム宣言
     */
    type AudioSystemConfigurationMap = {
        [key: string]: AudioSystemConfiguration;
    };
    /**
     * AudioSystemの設定を表すインターフェース。
     */
    interface AudioAssetHint {
        streaming?: boolean;
    }
    /**
     * ゲームの設定を表すインターフェース。
     * game.jsonによって定義される。
     */
    interface GameConfiguration {
        /**
         * ゲーム画面の幅。
         */
        width: number;
        /**
         * ゲーム画面の高さ。
         */
        height: number;
        /**
         * ゲームのFPS。省略時は30。
         */
        fps?: number;
        /**
         * エントリポイント。require() できるパス。
         *
         * 省略された場合、アセット mainScene (典型的には script/mainScene.js)と
         * スナップショットローダ snapshotLoader (典型的には script/snapshotLoader.js; 必要なら)を使う従来の挙動が採用される。
         * 省略可能だが、省略は非推奨である。
         */
        main?: string;
        /**
         * AudioSystemの追加定義。キーにsystem名を書く。不要(デフォルトの "sound" と "music" しか使わない)なら省略してよい。
         */
        audio?: AudioSystemConfigurationMap;
        /**
         * アセット宣言。ユニットテスト記述の都合上省略を許すが、通常非undefinedでしか使わない。
         */
        assets?: AssetConfigurationMap;
        /**
         * 操作プラグインの情報。
         */
        operationPlugins?: OperationPluginInfo[];
        /**
         * スクリプトアセットの簡略記述用テーブル。
         *
         * グローバルアセットである *.js ファイル、*.json ファイルに限り、この配列にファイル名(コンテンツルートディレクトリから相対パス)を書くことができる。
         * ここにファイル名を書いた場合、 `assets` でのアセット定義は不要であり、拡張子 js であれば `ScriptAsset` として、
         * 拡張子 json であれば `TextAsset` として扱われる。また常に "global": true として扱われる。
         * ここに記述されたファイルのアセットIDは不定である。ゲーム開発者がこのファイルを読み込むためには、相対パスによる (`require()` を用いねばならない)
         */
        globalScripts?: string[];
        /**
         * デフォルトローディングシーンについての指定。
         * 省略時または "default" を指定すると `DefaultLoadingScene` を表示する。
         * デフォルトローディングシーンを非表示にしたい場合は "none" を指定する。
         */
        defaultLoadingScene?: "default" | "none";
    }
}
declare namespace g {
    interface GameResetParameterObject {
        /**
         * `Game#age` に設定する値。
         * 省略された場合、元の値が維持される。
         */
        age?: number;
        /**
         * `Game#random` に設定する値。
         * 省略された場合、元の値が維持される。
         */
        randGen?: RandomGenerator;
    }
    /**
     * コンテンツそのものを表すクラス。
     *
     * 本クラスのインスタンスは暗黙に生成され、ゲーム開発者が生成することはない。
     * ゲーム開発者はg.gameによって本クラスのインスタンスを参照できる。
     *
     * 多くの機能を持つが、本クラスをゲーム開発者が利用するのは以下のようなケースである。
     * 1. Sceneの生成時、コンストラクタに引数として渡す
     * 2. Sceneに紐付かないイベント Game#join, Game#leave, Game#seed を処理する
     * 3. 乱数を発生させるため、Game#randomにアクセスしRandomGeneratorを取得する
     * 4. ログを出力するため、Game#loggerでコンテンツに紐付くLoggerを取得する
     * 5. ゲームのメタ情報を確認するため、Game#width, Game#height, Game#fpsにアクセスする
     * 6. グローバルアセットを取得するため、Game#assetsにアクセスする
     * 7. LoadingSceneを変更するため、Game#loadingSceneにゲーム開発者の定義したLoadingSceneを指定する
     * 8. スナップショット機能を作るため、Game#snapshotRequestにアクセスする
     * 9. 現在フォーカスされているCamera情報を得るため、Game#focusingCameraにアクセスする
     * 10.AudioSystemを直接制御するため、Game#audioにアクセスする
     * 11.Sceneのスタック情報を調べるため、Game#scenesにアクセスする
     */
    abstract class Game implements Registrable<E> {
        /**
         * このコンテンツに関連付けられるエンティティ。(ローカルなエンティティを除く)
         */
        db: {
            [idx: number]: E;
        };
        /**
         * このコンテンツを描画するためのオブジェクト群。
         */
        renderers: Renderer[];
        /**
         * シーンのスタック。
         */
        scenes: Scene[];
        /**
         * このGameで利用可能な乱数生成機群。
         */
        random: RandomGenerator;
        /**
         * 処理待ちのイベント。
         */
        events: Event[];
        /**
         * プレイヤーがゲームに参加したことを表すイベント。
         */
        join: Trigger<JoinEvent>;
        /**
         * プレイヤーがゲームから離脱したことを表すイベント。
         */
        leave: Trigger<LeaveEvent>;
        /**
         * 新しい乱数シードが発生したことを示すイベント。
         */
        seed: Trigger<SeedEvent>;
        /**
         * 画面更新が必要かのフラグ。
         */
        modified: boolean;
        /**
         * このコンテンツの累計経過時間。
         * 通常は `this.scene().local` が偽である状態で `tick()` の呼ばれた回数だが、シーン切り替え時等 `tick()` が呼ばれた時以外で加算される事もある。
         */
        age: number;
        /**
         * フレーム辺りの時間経過間隔。初期値は30である。
         */
        fps: number;
        /**
         * ゲーム画面の幅。
         */
        width: number;
        /**
         * ゲーム画面の高さ。
         */
        height: number;
        /**
         * グローバルアセットのマップ。this._initialScene.assets のエイリアス。
         */
        assets: {
            [key: string]: Asset;
        };
        /**
         * グローバルアセットが読み込み済みの場合真。でなければ偽。
         */
        isLoaded: boolean;
        /**
         * アセットのロード中に表示するシーン。
         * ゲーム開発者はこの値を書き換えることでローディングシーンを変更してよい。
         */
        loadingScene: LoadingScene;
        /**
         * Assetの読み込みに使うベースパス。
         * ゲーム開発者が参照する必要はない。
         * 値はプラットフォーム由来のパス(絶対パス)とゲームごとの基準パス(相対パス)をつないだものになる。
         */
        assetBase: string;
        /**
         * このゲームを実行している「自分」のID。
         *
         * この値は、 `Game#join` で渡される `Player` のフィールド `id` と等価性を比較できる値である。
         * すなわちゲーム開発者は、join してきた`Player`の `id` とこの値を比較することで、
         * このゲームのインスタンスを実行している「自分」が参加者であるか否かを決定することができる。
         *
         * この値は必ずしも常に存在するとは限らないことに注意。存在しない場合、 `undefined` である。
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を変更すべきではない。
         */
        selfId: string;
        /**
         * 本ゲームで利用可能なオーディオシステム群。デフォルトはmusicとsoundが登録されている。
         * SE・声・音楽等で分けたい場合、本プロパティにvoice等のAudioSystemを登録することで実現する。
         */
        audio: {
            [key: string]: AudioSystem;
        };
        /**
         * デフォルトで利用されるオーディオシステムのID。デフォルト値はsound。
         */
        defaultAudioSystemId: string;
        /**
         * ログ出力を行う部品。プラットフォームに依存しないエラーやデバッグ情報の出力を行う。
         */
        logger: Logger;
        /**
         * スナップショット要求通知。
         * ゲーム開発者はこれをhandleして可能ならスナップショットを作成しGame#saveSnapshotを呼び出すべきである。
         */
        snapshotRequest: Trigger<void>;
        /**
         * 外部インターフェース。
         *
         * 実行環境によって、環境依存の値が設定される。
         * ゲーム開発者はこの値を用いる場合、各実行環境のドキュメントを参照すべきである。
         */
        external: any;
        /**
         * 各種リソースのファクトリ。
         */
        resourceFactory: ResourceFactory;
        /**
         * ストレージ。
         */
        storage: Storage;
        /**
         * ゲーム開発者向けのコンテナ。
         *
         * この値はゲームエンジンのロジックからは使用されず、ゲーム開発者は任意の目的に使用してよい。
         */
        vars: any;
        /**
         * このゲームの各プレイを識別する値。
         *
         * このゲームに複数のプレイヤーがいる場合、すなわち `Game#join` が複数回fireされている場合、各プレイヤー間でこの値は同一である。
         * この値は、特に `game.external` で提供される外部APIに与えるなど、Akashic Engine外部とのやりとりで使われることを想定する値である。
         *
         * 実行中、この値が変化しないことは保証されない。ゲーム開発者はこの値を保持すべきではない。
         * また、この値に応じてゲームの処理や内部状態を変化させるべきではない。
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を変更すべきではない。
         */
        playId: string;
        /**
         * ロードしている操作プラグインを保持するオブジェクト。
         */
        operationPlugins: {
            [key: number]: OperationPlugin;
        };
        /**
         * 画面サイズの変更時にfireされるTrigger。
         */
        resized: Trigger<CommonSize>;
        /**
         * イベントとTriggerのマップ。
         * @private
         */
        _eventTriggerMap: {
            [key: number]: Trigger<Event>;
        };
        /**
         * グローバルアセットを読み込むための初期シーン。必ずシーンスタックの一番下に存在する。これをpopScene()することはできない。
         * @private
         */
        _initialScene: Scene;
        /**
         * デフォルトローディングシーン。
         *
         * `this.loadingScene` が指定されていない時にローディングシーンとして利用される。
         * また `this.loadingScene` がアセットを利用する場合、その読み込み待ちの間にも利用される。
         *
         * ここに代入される `LoadingScene` はアセットを用いてはならない。
         * 初期値は `new g.DefaultLoadingScene(this)` である。
         * @private
         */
        _defaultLoadingScene: LoadingScene;
        /**
         * `this.scenes` の変化時にfireされるTrigger。
         * このTriggerはアセットロード(Scene#loadedのfire)を待たず、変化した時点で即fireされることに注意。
         * @private
         */
        _sceneChanged: Trigger<Scene>;
        /**
         * ScriptAssetの実行結果キャッシュ。
         * g.require経由の場合ここに格納される。
         * @private
         */
        _scriptCaches: {
            [key: string]: RequireCacheable;
        };
        /**
         * グローバルアセットの読み込み待ちハンドラ。
         * @private
         */
        _loaded: Trigger<Game>;
        /**
         * _start() 呼び出しから戻る直前を通知するTrigger。
         * エントリポイント実行後のシーン遷移直後にfireされる。
         * このTriggerのfireは一度とは限らないことに注意。_loadAndStart()呼び出しの度に一度fireされる。
         * @private
         */
        _started: Trigger<void>;
        /**
         * エントリポイント(mainスクリプト)のパス。
         * @private
         */
        _main: string;
        /**
         * _loadAndStart() に渡された、エントリポイント(mainスクリプト)に渡す引数。
         * @private
         */
        _mainParameter: GameMainParameterObject;
        /**
         * アセットの管理者。
         * @private
         */
        _assetManager: AssetManager;
        /**
         * Game#audioの管理者。
         * @private
         */
        _audioSystemManager: AudioSystemManager;
        /**
         * 操作プラグインの管理者。
         * @private
         */
        _operationPluginManager: OperationPluginManager;
        /**
         * 操作プラグインによる操作を通知するTrigger。
         * @private
         */
        _operationPluginOperated: Trigger<InternalOperationPluginOperation>;
        /**
         * `this.db` のlastInsertId。
         * `this.db` が空の場合、0が代入されており、以後インクリメントして利用される。
         * @private
         */
        _idx: number;
        /**
         * このゲームに紐づくローカルなエンティティ (`E#local` が真のもの)
         * @private
         */
        _localDb: {
            [id: number]: E;
        };
        /**
         * ローカルエンティティ用の `this._idx` 。
         * @private
         */
        _localIdx: number;
        /**
         * 次に生成されるカメラのID。
         * 初期値は 0 であり、以後カメラ生成のたびにインクリメントして利用される。
         * @private
         */
        _cameraIdx: number;
        /**
         * `this.terminateGame()` が呼び出された後か否か。
         * これが真の場合、 `this.tick()` は何も行わない。
         * @private
         */
        _isTerminated: boolean;
        /**
         * 使用中のカメラの実体。
         *
         * focusingcameraがこの値を暗黙的に生成するので、通常ゲーム開発者はこの値を直接指定する必要はない。
         * @private
         */
        _focusingCamera: Camera;
        /**
         * このゲームの設定(game.json の内容)。
         * @private
         */
        _configuration: GameConfiguration;
        /**
         * 実行待ちのシーン遷移要求。
         */
        private _sceneChangeRequests;
        /**
         * 使用中のカメラ。
         *
         * `Game#draw()`, `Game#findPointSource()` のデフォルト値として使用される。
         * この値を変更した場合、変更を描画に反映するためには `Game#modified` に真を代入しなければならない。
         * (ただしこの値が非 `undefined` の時、`Game#focusingCamera.modified()` を呼び出す場合は
         * `Game#modified` の操作は省略できる。)
         */
        focusingCamera: Camera;
        /**
         * `Game` のインスタンスを生成する。
         * @param gameConfiguration この `Game` の設定。典型的には game.json の内容をパースしたものを期待する
         * @param resourceFactory この `Game` が用いる、リソースのファクトリ
         * @param assetBase アセットのパスの基準となるディレクトリ。省略された場合、空文字列
         * @param selfId このゲームを実行するユーザのID。省略された場合、`undefined`
         * @param operationPluginViewInfo このゲームの操作プラグインに与えるviewの情報
         */
        constructor(gameConfiguration: GameConfiguration, resourceFactory: ResourceFactory, assetBase?: string, selfId?: string, operationPluginViewInfo?: OperationPluginViewInfo);
        /**
         * シーンスタックへのシーンの追加と、そのシーンへの遷移を要求する。
         *
         * このメソッドは要求を行うだけである。呼び出し直後にはシーン遷移は行われていないことに注意。
         * 実際のシーン遷移は次のフレームまでに(次のupdateのfireまでに)行われる。
         * このメソッドの呼び出しにより、現在のシーンの `stateChanged` が引数 `SceneState.Deactive` でfireされる。
         * その後 `scene.stateChanged` が引数 `SceneState.Active` でfireされる。
         * @param scene 遷移後のシーン
         */
        pushScene(scene: Scene): void;
        /**
         * 現在のシーンの置き換えを要求する。
         *
         * 現在のシーンをシーンスタックから取り除き、指定のシーンを追加することを要求する。
         * このメソッドは要求を行うだけである。呼び出し直後にはシーン遷移は行われていないことに注意。
         * 実際のシーン遷移は次のフレームまでに(次のupdateのfireまでに)行われる。
         * 引数 `preserveCurrent` が偽の場合、このメソッドの呼び出しにより現在のシーンは破棄される。
         * またその時 `stateChanged` が引数 `SceneState.Destroyed` でfireされる。
         * その後 `scene.stateChanged` が引数 `SceneState.Active` でfireされる。
         *
         * @param scene 遷移後のシーン
         * @param preserveCurrent 真の場合、現在のシーンを破棄しない(ゲーム開発者が明示的に破棄せねばならない)。省略された場合、偽
         */
        replaceScene(scene: Scene, preserveCurrent?: boolean): void;
        /**
         * 一つ前のシーンに戻ることを要求する。
         *
         * このメソッドは要求を行うだけである。呼び出し直後にはシーン遷移は行われていないことに注意。
         * 実際のシーン遷移は次のフレームまでに(次のupdateのfireまでに)行われる。
         * 引数 `preserveCurrent` が偽の場合、このメソッドの呼び出しにより現在のシーンは破棄される。
         * またその時 `stateChanged` が引数 `SceneState.Destroyed` でfireされる。
         * その後一つ前のシーンの `stateChanged` が引数 `SceneState.Active` でfireされる。
         *
         * @param preserveCurrent 真の場合、現在のシーンを破棄しない(ゲーム開発者が明示的に破棄せねばならない)。省略された場合、偽
         */
        popScene(preserveCurrent?: boolean): void;
        /**
         * 現在のシーンを返す。
         * ない場合、 `undefined` を返す。
         */
        scene(): Scene;
        /**
         * この `Game` の時間経過とそれに伴う処理を行う。
         *
         * 現在の `Scene` に対して `Scene#update` をfireし、 `this.events` に設定されたイベントを処理する。
         * このメソッドの呼び出し後、 `this.events.length` は0である。
         * このメソッドは暗黙に呼び出される。ゲーム開発者がこのメソッドを利用する必要はない。
         *
         * 戻り値は呼び出し前後でシーンが変わった(別のシーンに遷移した)場合、真。でなければ偽。
         * @param advanceAge 偽を与えた場合、`this.age` を進めない。省略された場合、ローカルシーン以外ならageを進める。
         */
        tick(advanceAge?: boolean): boolean;
        /**
         * このGameを描画する。
         *
         * このゲームに紐づけられた `Renderer` (`this.renderers` に含まれるすべての `Renderer` で、この `Game` の描画を行う。
         * このメソッドは暗黙に呼び出される。ゲーム開発者がこのメソッドを利用する必要はない。
         *
         * @param camera 対象のカメラ。省略された場合 `Game.focusingCamera`
         */
        render(camera?: Camera): void;
        /**
         * その座標に反応する `PointSource` を返す。
         *
         * 戻り値は、対象が見つかった場合、 `target` に見つかった `E` を持つ `PointSource` である。
         * 対象が見つからなかった場合、 `undefined` である。
         *
         * 戻り値が `undefined` でない場合、その `target` プロパティは次を満たす:
         * - `E#touchable` が真である
         * - カメラ `camera` から可視である中で最も手前にある
         *
         * @param point 対象の座標
         * @param camera 対象のカメラ。指定しなければ `Game.focusingCamera` が使われる
         */
        findPointSource(point: CommonOffset, camera?: Camera): PointSource;
        /**
         * このGameにエンティティを登録する。
         *
         * このメソッドは各エンティティに対して暗黙に呼び出される。ゲーム開発者がこのメソッドを明示的に利用する必要はない。
         * `e.id` が `undefined` である場合、このメソッドの呼び出し後、 `e.id` には `this` に一意の値が設定される。
         * `e.local` が偽である場合、このメソッドの呼び出し後、 `this.db[e.id] === e` が成立する。
         * `e.local` が真である場合、 `e.id` の値は不定である。
         *
         * @param e 登録するエンティティ
         */
        register(e: E): void;
        /**
         * このGameからエンティティの登録を削除する。
         *
         * このメソッドは各エンティティに対して暗黙に呼び出される。ゲーム開発者がこのメソッドを明示的に利用する必要はない。
         * このメソッドの呼び出し後、 `this.db[e.id]` は未定義である。
         * @param e 登録を削除するエンティティ
         */
        unregister(e: E): void;
        /**
         * このゲームを離脱する。
         *
         * 多人数プレイの場合、他のクライアントでは `Game#leave` イベントがfireされる。
         * このメソッドの呼び出し後、このクライアントの操作要求は送信されない。
         */
        leaveGame(): void;
        /**
         * このゲームを終了する。
         *
         * エンジンに対して続行の断念を通知する。
         * このメソッドの呼び出し後、このクライアントの操作要求は送信されない。
         * またこのクライアントのゲーム実行は行われない(updateを含むイベントのfireはおきない)。
         */
        terminateGame(): void;
        /**
         * イベントを発生させる。
         *
         * ゲーム開発者は、このメソッドを呼び出すことで、エンジンに指定のイベントを発生させることができる。
         *
         * @param e 発生させるイベント
         */
        abstract raiseEvent(e: Event): void;
        /**
         * ティックを発生させる。
         *
         * ゲーム開発者は、このメソッドを呼び出すことで、エンジンに時間経過を要求することができる。
         * 現在のシーンのティック生成モード `Scene#tickGenerationMode` が `TickGenerationMode.Manual` でない場合、エラー。
         *
         * @param events そのティックで追加で発生させるイベント
         */
        abstract raiseTick(events?: Event[]): void;
        /**
         * イベントフィルタを追加する。
         *
         * 一つ以上のイベントフィルタが存在する場合、このゲームで発生したイベントは、通常の処理の代わりにイベントフィルタに渡される。
         * エンジンは、イベントフィルタが戻り値として返したイベントを、まるでそのイベントが発生したかのように処理する。
         *
         * イベントフィルタはローカルイベントに対しても適用される。
         * イベントフィルタはローカルティック補完シーンやローカルシーンの間であっても適用される。
         * 複数のイベントフィルタが存在する場合、そのすべてが適用される。適用順は登録の順である。
         *
         * @param filter 追加するイベントフィルタ
         */
        abstract addEventFilter(filter: EventFilter): void;
        /**
         * イベントフィルタを削除する。
         *
         * @param filter 削除するイベントフィルタ
         */
        abstract removeEventFilter(filter: EventFilter): void;
        /**
         * このインスタンスにおいてスナップショットの保存を行うべきかを返す。
         *
         * スナップショット保存に対応するゲームであっても、
         * 必ずしもすべてのインスタンスにおいてスナップショット保存を行うべきとは限らない。
         * たとえば多人数プレイ時には、複数のクライアントで同一のゲームが実行される。
         * スナップショットを保存するのはそのうちの一つのインスタンスのみでよい。
         * 本メソッドはそのような場合に、自身がスナップショットを保存すべきかどうかを判定するために用いることができる。
         *
         * スナップショット保存に対応するゲームは、このメソッドが真を返す時にのみ `Game#saveSnapshot()` を呼び出すべきである。
         * 戻り値は、スナップショットの保存を行うべきであれば真、でなければ偽である。
         */
        abstract shouldSaveSnapshot(): boolean;
        /**
         * スナップショットを保存する。
         *
         * 引数 `snapshot` の値は、スナップショット読み込み関数 (snapshot loader) に引数として渡されるものになる。
         * このメソッドを呼び出すゲームは必ずsnapshot loaderを実装しなければならない。
         * (snapshot loaderとは、idが "snapshotLoader" であるglobalなScriptAssetに定義された関数である。
         * 詳細はスナップショットについてのドキュメントを参照)
         *
         * このメソッドは `Game#shouldSaveSnapshot()` が真を返す `Game` に対してのみ呼び出されるべきである。
         * そうでない場合、このメソッドの動作は不定である。
         *
         * このメソッドを呼び出す推奨タイミングは、Trigger `Game#snapshotRequest` をhandleすることで得られる。
         * ゲームは、 `snapshotRequest` がfireされたとき (それが可能なタイミングであれば) スナップショットを
         * 生成してこのメソッドに渡すべきである。ゲーム開発者は推奨タイミング以外でもこのメソッドを呼び出すことができる。
         * ただしその頻度は推奨タイミングの発火頻度と同程度に抑えられるべきである。
         *
         * @param snapshot 保存するスナップショット。JSONとして妥当な値でなければならない。
         * @param timestamp 保存時の時刻。 `g.TimestampEvent` を利用するゲームの場合、それらと同じ基準の時間情報を与えなければならない。
         */
        abstract saveSnapshot(snapshot: any, timestamp?: number): void;
        /**
         * @private
         */
        _fireSceneReady(scene: Scene): void;
        /**
         * @private
         */
        _fireSceneLoaded(scene: Scene): void;
        /**
         * @private
         */
        _callSceneAssetHolderHandler(assetHolder: SceneAssetHolder): void;
        /**
         * @private
         */
        _normalizeConfiguration(gameConfiguration: GameConfiguration): GameConfiguration;
        /**
         * @private
         */
        _setAudioPlaybackRate(playbackRate: number): void;
        /**
         * @private
         */
        _setMuted(muted: boolean): void;
        /**
         * g.OperationEventのデータをデコードする。
         * @private
         */
        _decodeOperationPluginOperation(code: number, op: (number | string)[]): any;
        /**
         * ゲーム状態のリセット。
         * @private
         */
        _reset(param?: GameResetParameterObject): void;
        /**
         * ゲームを開始する。
         *
         * 存在するシーンをすべて(_initialScene以外; あるなら)破棄し、グローバルアセットを読み込み、完了後ゲーム開発者の実装コードの実行を開始する。
         * このメソッドの二度目以降の呼び出しの前には、 `this._reset()` を呼び出す必要がある。
         * @param param ゲームのエントリポイントに渡す値
         * @private
         */
        _loadAndStart(param?: GameMainParameterObject): void;
        /**
         * グローバルアセットの読み込みを開始する。
         * 単体テスト用 (mainSceneなど特定アセットの存在を前提にする_loadAndStart()はテストに使いにくい) なので、通常ゲーム開発者が利用することはない
         * @private
         */
        _startLoadingGlobalAssets(): void;
        /**
         * @private
         */
        _updateEventTriggers(scene: Scene): void;
        /**
         * @private
         */
        _onInitialSceneLoaded(): void;
        /**
         * @private
         */
        abstract _leaveGame(): void;
        /**
         * @private
         */
        _terminateGame(): void;
        /**
         * 要求されたシーン遷移を実行する。
         *
         * `pushScene()` 、 `replaceScene()` や `popScene()` によって要求されたシーン遷移を実行する。
         * 通常このメソッドは、毎フレーム一度、フレームの最後に呼び出されることを期待する (`Game#tick()` がこの呼び出しを行う)。
         * ただしゲーム開始時 (グローバルアセット読み込み・スナップショットローダ起動後またはmainScene実行開始時) に関しては、
         * シーン追加がゲーム開発者の記述によらない (`tick()` の外側である) ため、それぞれの箇所で明示的にこのメソッドを呼び出す。
         * @private
         */
        _flushSceneChangeRequests(): void;
        private _doPopScene(preserveCurrent, fireSceneChanged);
        private _start();
        private _doPushScene(scene, loadingScene?);
    }
}
declare namespace g {
    /**
     * カメラを表すインターフェース。
     */
    interface Camera {
        /**
         * 紐づいている `Game` 。
         */
        game: Game;
        /**
         * このカメラのID。
         * カメラ生成時に暗黙に設定される値。
         * `local` が真である場合、この値は `undefined` である。
         */
        id: number;
        /**
         * このカメラがローカルであるか否か。
         */
        local: boolean;
        /**
         * @private
         */
        _modifiedCount: number;
        /**
         * @private
         */
        _applyTransformToRenderer: (renderer: Renderer) => void;
        serialize: () => any;
    }
    interface Camera2DSerialization {
        id: number;
        param: Camera2DParameterObject;
    }
    /**
     * `Camera2D` のコンストラクタに渡すことができるパラメータ。
     * 各メンバの詳細は `Camera2D` の同名メンバの説明を参照すること。
     *
     * 例外的に、`Camera2D` のコンストラクタは `width`, `height` のみ無視することに注意。
     */
    interface Camera2DParameterObject extends Object2DParameterObject {
        /**
         * このカメラに紐づける `Game` 。
         */
        game: Game;
        /**
         * このカメラがローカルであるか否か。
         * @default false
         */
        local?: boolean;
        /**
         * このカメラの名前。
         * @default undefined
         */
        name?: string;
    }
    /**
     * 2D世界におけるカメラ。
     */
    class Camera2D extends Object2D implements Camera {
        /**
         * 紐づいている `Game` 。
         */
        game: Game;
        /**
         * このカメラのID。
         *
         * カメラ生成時に暗黙に設定される値。
         * `local` が真である場合、この値は `undefined` である。
         *
         * ひとつの実行環境中、ある `Game` に対して、ある `undefined` ではない `id` を持つカメラは、最大でもひとつしか存在しない。
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を直接変更してはならない。
         */
        id: number;
        /**
         * このカメラがローカルであるか否か。
         *
         * 初期値は偽である。
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を直接変更してはならない。
         */
        local: boolean;
        /**
         * このカメラの名前。
         * 初期値は `undefined` である。
         */
        name: string;
        /**
         * @private
         */
        _modifiedCount: number;
        /**
         * 与えられたシリアリゼーションでカメラを復元する。
         *
         * @param ser `Camera2D#serialize()` の戻り値
         * @param game 復元されたカメラの属する Game
         */
        static deserialize(ser: any, game: Game): Camera2D;
        /**
         * 指定されたパラメータで `Camera2D` のインスタンスを生成する。
         * @param param 初期化に用いるパラメータのオブジェクト
         */
        constructor(param: Camera2DParameterObject);
        /**
         * カメラ状態の変更をエンジンに通知する。
         *
         * このメソッドの呼び出し後、このカメラのプロパティに対する変更が各 `Renderer` の描画に反映される。
         * ただし逆は真ではない。すなわち、再描画は他の要因によって行われることもある。
         * ゲーム開発者は、このメソッドを呼び出していないことをもって再描画が行われていないことを仮定してはならない。
         *
         * 本メソッドは、このオブジェクトの `Object2D` 由来のプロパティ (`x`, `y`, `angle` など) を変更した場合にも呼びだす必要がある。
         */
        modified(): void;
        /**
         * このカメラをシリアライズする。
         *
         * このメソッドの戻り値を `Camera2D#deserialize()` に渡すことで同じ値を持つカメラを復元することができる。
         */
        serialize(): any;
        /**
         * @private
         */
        _applyTransformToRenderer(renderer: Renderer): void;
        /**
         * @private
         */
        _updateMatrix(): void;
    }
}
declare namespace g {
    /**
     * ゲームの描画を行うクラス。
     *
     * 描画は各エンティティによって行われる。通常、ゲーム開発者が本クラスを利用する必要はない。
     */
    abstract class Renderer {
        draw(game: Game, camera?: Camera): void;
        begin(): void;
        abstract clear(): void;
        /**
         * 指定されたSurfaceの描画を行う。
         *
         * @param surface 描画するSurface
         * @param offsetX 描画元のX座標。0以上の数値でなければならない
         * @param offsetY 描画元のY座標。0以上の数値でなければならない
         * @param width 描画する矩形の幅。0より大きい数値でなければならない
         * @param height 描画する矩形の高さ。0より大きい数値でなければならない
         * @param destOffsetX 描画先のX座標。0以上の数値でなければならない
         * @param destOffsetY 描画先のY座標。0以上の数値でなければならない
         */
        abstract drawImage(surface: Surface, offsetX: number, offsetY: number, width: number, height: number, destOffsetX: number, destOffsetY: number): void;
        abstract drawSprites(surface: g.Surface, offsetX: number[], offsetY: number[], width: number[], height: number[], canvasOffsetX: number[], canvasOffsetY: number[], count: number): void;
        /**
         * 指定されたSystemLabelの描画を行う。
         *
         * @param text 描画するText内容
         * @param x 描画元のX座標。0以上の数値でなければならない
         * @param y 描画元のY座標。0以上の数値でなければならない
         * @param maxWidth 描画する矩形の幅。0より大きい数値でなければならない
         * @param fontSize 描画する矩形の高さ。0より大きい数値でなければならない
         * @param textAlign 描画するテキストのアラインメント
         * @param textBaseline 描画するテキストのベースライン
         * @param textColor 描画する文字色。CSS Colorでなければならない
         * @param fontFamily 描画するフォントファミリ
         * @param strokeWidth 描画する輪郭幅。0以上の数値でなければならない
         * @param strokeColor 描画する輪郭色。CSS Colorでなければならない
         * @param strokeOnly 文字色の描画フラグ
         */
        abstract drawSystemText(text: string, x: number, y: number, maxWidth: number, fontSize: number, textAlign: TextAlign, textBaseline: TextBaseline, textColor: string, fontFamily: FontFamily, strokeWidth: number, strokeColor: string, strokeOnly: boolean): void;
        abstract translate(x: number, y: number): void;
        abstract transform(matrix: number[]): void;
        abstract opacity(opacity: number): void;
        abstract save(): void;
        abstract restore(): void;
        abstract fillRect(x: number, y: number, width: number, height: number, cssColor: string): void;
        abstract setCompositeOperation(operation: CompositeOperation): void;
        abstract setTransform(matrix: number[]): void;
        abstract setOpacity(opacity: number): void;
        end(): void;
    }
}
declare namespace g {
    /**
     * 描画領域を表すクラス。
     *
     * このクラスのインスタンスは、エンジンによって暗黙に生成される。
     * ゲーム開発者はこのクラスのインスタンスを明示的に生成する必要はなく、またできない。
     */
    abstract class Surface implements CommonSize, Destroyable {
        /**
         * 描画領域の幅。
         * この値を直接書き換えてはならない。
         */
        width: number;
        /**
         * 描画領域の高さ。
         * この値を直接書き換えてはならない。
         */
        height: number;
        /**
         * 本Surfaceの画像が動画であるかを示す値。真の時、動画。
         * この値は参照のみに利用され、変更してはならない。
         */
        isDynamic: boolean;
        /**
         * アニメーション再生開始イベント。
         * isDynamicが偽の時undefined。
         */
        animatingStarted: Trigger<void>;
        /**
         * アニメーション再生停止イベント。
         * isDynamicが偽の時undefined。
         */
        animatingStopped: Trigger<void>;
        /**
         * 描画可能な実体。
         * 具体的には renderer().drawImage() の実装が描画対象として利用できる値。
         * @private
         */
        _drawable: any;
        /**
         * 本Surfaceが破棄済であるかを示す値。
         * @private
         */
        _destroyed: boolean;
        /**
         * `Surface` のインスタンスを生成する。
         * @param width 描画領域の幅（整数値でなければならない）
         * @param height 描画領域の高さ（整数値でなければならない）
         * @param drawable 描画可能な実体。省略された場合、 `undefined`
         * @param isDynamic drawableが動画であることを示す値。動画である時、真を渡さなくてはならない。省略された場合、偽。
         */
        constructor(width: number, height: number, drawable?: any, isDynamic?: boolean);
        /**
         * このSurfaceへの描画手段を提供するRendererを生成して返す。
         */
        abstract renderer(): Renderer;
        /**
         * このSurfaceが動画を再生中であるかどうかを判定する。
         */
        abstract isPlaying(): boolean;
        /**
         * このSurfaceの破棄を行う。
         * 以後、このSurfaceを利用することは出来なくなる。
         */
        destroy(): void;
        /**
         * このSurfaceが破棄済であるかどうかを判定する。
         */
        destroyed(): boolean;
    }
}
declare namespace g {
    /**
     * `Label` のコンストラクタに渡すことができるパラメータ。
     * 各メンバの詳細は `Label` の同名メンバの説明を参照すること。
     */
    interface LabelParameterObject extends CacheableEParameterObject {
        /**
         * 描画する文字列。
         */
        text: string;
        /**
         * 描画に利用されるフォント。
         */
        font: Font;
        /**
         * フォントサイズ。
         * 0 以上の数値でなければならない。そうでない場合、動作は不定である。
         *
         * これは `LabelParameterObject#font` で
         * 与えられたフォントを `fontSize` フォントサイズ相当で描画するよう指示する値である。
         * 歴史的経緯によりフォントサイズと説明されているが、実際には拡大縮小率を求めるため
         * に用いられている。
         */
        fontSize: number;
        /**
         * 文字列の描画位置。
         * `TextAlign.Left` 以外にする場合、 `widthAutoAdjust` を `false` にすべきである。(`widthAutoAdjust` の項を参照)
         * @default TextAlign.Left
         */
        textAlign?: TextAlign;
        /**
         * このラベルの最大幅。
         * @default undefined
         */
        maxWidth?: number;
        /**
         * `width` プロパティを `this.text` の描画に必要な幅で自動的に更新するかを表す。
         * `textAlign` を `TextAlign.Left` 以外にする場合、この値は `false` にすべきである。
         * (`textAlign` は `width` を元に描画位置を調整するため、 `true` の場合左寄せで右寄せでも描画結果が変わらなくなる)
         * @default true
         */
        widthAutoAdjust?: boolean;
        /**
         * 文字列の描画色をCSS Color形式で指定する。
         * 元の描画色に重ねて表示されるため、アルファ値を指定した場合は元の描画色が透けて表示される。
         * 省略された場合、この場合描画色の変更を行わない。
         * @default undefined
         */
        textColor?: string;
    }
    /**
     * 単一行のテキストを描画するエンティティ。
     * 本クラスの利用には `BitmapFont` または `DynamicFont` が必要となる。
     */
    class Label extends CacheableE {
        /**
         * 描画する文字列。
         * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
         */
        text: string;
        /**
         * 描画に利用されるフォント。
         * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
         */
        font: Font;
        /**
         * 文字列の描画位置。
         * 初期値は `TextAlign.Left` である。
         * `TextAlign.Left` 以外にする場合、 `widthAutoAdjust` を `false` にすべきである。(`widthAutoAdjust` の項を参照)
         * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
         */
        textAlign: TextAlign;
        /**
         * キャッシュされたグリフ情報。
         * 通常、ゲーム開発者がこのプロパティを参照する必要はない。
         */
        glyphs: Glyph[];
        /**
         * フォントサイズ。
         * 0 以上の数値でなければならない。そうでない場合、動作は不定である。
         * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
         */
        fontSize: number;
        /**
         * このラベルの最大幅。
         * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
         */
        maxWidth: number;
        /**
         * `width` プロパティを `this.text` の描画に必要な幅で自動的に更新するかを表す。
         * 初期値は `true` である。
         * `textAlign` を `TextAlign.Left` 以外にする場合、この値は `false` にすべきである。
         * (`textAlign` は `width` を元に描画位置を調整するため、 `true` の場合左寄せで右寄せでも描画結果が変わらなくなる)
         *
         * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
         */
        widthAutoAdjust: boolean;
        /**
         * 文字列の描画色をCSS Color形式で指定する。
         * 元の描画色に重ねて表示されるため、アルファ値を指定した場合は元の描画色が透けて表示される。
         * 初期値は `undefined` となり、 描画色の変更を行わない。
         */
        textColor: string;
        /**
         * @private
         */
        _textWidth: number;
        /**
         * @private
         */
        _game: Game;
        /**
         * 各種パラメータを指定して `Label` のインスタンスを生成する。
         * @param param このエンティティに指定するパラメータ
         */
        constructor(param: LabelParameterObject);
        /**
         * `width` と `textAlign` を設定し、 `widthAutoAdjust` を `false` に設定する。
         *
         * このメソッドは `this.textAlign` を設定するためのユーティリティである。
         * `textAlign` を `TextAlign.Left` 以外に設定する場合には、通常 `width` や `widthAutoAdjust` も設定する必要があるため、それらをまとめて行う。
         * このメソッドの呼び出し後、 `this.invalidate()` を呼び出す必要がある。
         * @param width 幅
         * @param textAlign テキストの描画位置
         */
        aligning(width: number, textAlign: TextAlign): void;
        /**
         * このエンティティの描画キャッシュ無効化をエンジンに通知する。
         * このメソッドを呼び出し後、描画キャッシュの再構築が行われ、各 `Renderer` に描画内容の変更が反映される。
         */
        invalidate(): void;
        renderCache(renderer: Renderer): void;
        /**
         * このエンティティを破棄する。
         * 利用している `BitmapFont` の破棄は行わないため、 `BitmapFont` の破棄はコンテンツ製作者が明示的に行う必要がある。
         */
        destroy(): void;
        private _invalidateSelf();
    }
}
declare namespace g {
    /**
     * グリフの領域を表すインターフェース。
     */
    interface GlyphArea {
        x: number;
        y: number;
        width?: number;
        height?: number;
        offsetX?: number;
        offsetY?: number;
        advanceWidth?: number;
    }
    /**
     * グリフ。
     */
    class Glyph {
        /**
         * 文字コード。
         */
        code: number;
        /**
         * サーフェス上の文字のX座標。
         *
         * `this.surface` が `undefined` である時、この値は不定である。
         */
        x: number;
        /**
         * サーフェス上の文字のY座標。
         *
         * `this.surface` が `undefined` である時、この値は不定である。
         */
        y: number;
        /**
         * 文字の横幅。
         *
         * `this.surface` が `undefined` である時、この値は不定である。
         */
        width: number;
        /**
         * 文字の縦幅。
         *
         * `this.surface` が `undefined` である時、この値は不定である。
         */
        height: number;
        /**
         * 文字を印字したサーフェス。
         *
         * 描画すべき内容がない場合 `surface` は `undefined` である。
         */
        surface: Surface;
        /**
         * X軸方向についての描画位置調整量。
         *
         * 基準座標からこの値を加算した位置に描画することで正しい文字間隔に配置される。
         *
         * `this.surface` が `undefined` である時、この値は不定である。
         */
        offsetX: number;
        /**
         * Y軸方向についての描画位置調整量。
         *
         * 基準座標からこの値を加算した位置に描画することで文字のベースラインが一致する。
         *
         * `this.surface` が `undefined` である時、この値は不定である。
         */
        offsetY: number;
        /**
         * この文字の次の文字の開始位置までの幅。
         */
        advanceWidth: number;
        /**
         * `this.surface` が有効か否か。
         *
         * `this.surface` が破棄された、または生成後に書き換えられた時は偽。
         */
        isSurfaceValid: boolean;
        _atlas: SurfaceAtlas;
        /**
         * `Glyph` のインスタンスを生成する。
         */
        constructor(code: number, x: number, y: number, width: number, height: number, offsetX?: number, offsetY?: number, advanceWidth?: number, surface?: Surface, isSurfaceValid?: boolean);
        /**
         * グリフの描画上の幅を求める。
         * 通常、ゲーム開発者がこのメソッドを呼び出す必要はない。
         * @param fontSize フォントサイズ
         */
        renderingWidth(fontSize: number): number;
    }
}
declare namespace g {
    /**
     * `FilledRect` のコンストラクタに渡すことができるパラメータ。
     * 各メンバの詳細は `FilledRect` の同名メンバの説明を参照すること。
     */
    interface FilledRectParameterObject extends EParameterObject {
        /**
         * 矩形を塗りつぶす色。
         */
        cssColor: string;
        /**
         * このオブジェクトの横幅。
         */
        width: number;
        /**
         * このオブジェクトの縦幅。
         */
        height: number;
    }
    /**
     * 塗りつぶされた矩形を表すエンティティ。
     */
    class FilledRect extends E {
        /**
         * 矩形を塗りつぶす色。
         * この値を変更した場合、 `this.modified()` を呼び出す必要がある。
         */
        cssColor: string;
        /**
         * 各種パラメータを指定して `FilledRect` のインスタンスを生成する。
         * @param param このエンティティに対するパラメータ
         */
        constructor(param: FilledRectParameterObject);
        /**
         * このエンティティ自身の描画を行う。
         * このメソッドはエンジンから暗黙に呼び出され、ゲーム開発者が呼び出す必要はない。
         */
        renderSelf(renderer: Renderer): boolean;
    }
}
declare namespace g {
    /**
     * `Pane` のコンストラクタに渡すことができるパラメータ。
     * 各メンバの詳細は `Pane` の同名メンバの説明を参照すること。
     */
    interface PaneParameterObject extends CacheableEParameterObject {
        /**
         * このオブジェクトの横幅。実際の表示領域としてはscaleX, scaleY, angleの値も考慮する必要がある。
         */
        width: number;
        /**
         * このオブジェクトの縦幅。実際の表示領域としてはscaleX, scaleY, angleの値も考慮する必要がある。
         */
        height: number;
        /**
         * 背景画像として使う `ImageAsset` または `Surface` 。
         * 省略された場合、背景には何も描かれない。
         * @default undefined
         */
        backgroundImage?: ImageAsset | Surface;
        /**
         * 子孫エンティティの描画位置・クリッピングサイズを決めるパディング。
         * @default 0
         */
        padding?: CommonRect | number;
        /**
         * 背景画像の描画方法を指定する `SurfaceEffector` 。
         * `undefined` の場合、描画方法をカスタマイズしない。
         * @default undefined
         */
        backgroundEffector?: SurfaceEffector;
    }
    /**
     * 枠を表すエンティティ。
     * クリッピングやパディング、バックグラウンドイメージの演出等の機能を持つため、
     * メニューやメッセージ、ステータスのウィンドウ等に利用されることが期待される。
     * このエンティティの子要素は、このエンティティの持つ `Surface` に描画される。
     */
    class Pane extends CacheableE {
        /**
         * 背景画像の `Surface` 。
         * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
         */
        backgroundImage: Surface;
        /**
         * 背景画像の拡大・縮小に用いられる `SurfaceEffector` 。
         * (ex. 背景に「枠」の部分を持つ画像を使い、枠部分の拡大率を固定したいような場合は、 `NinePatchSurfaceEffector` を指定すればよい)
         * この値を変更した場合、 `this.invalidate()` を呼び出す必要がある。
         */
        backgroundEffector: SurfaceEffector;
        /**
         * @private
         */
        _padding: CommonRect | number;
        /**
         * @private
         */
        _paddingChanged: boolean;
        /**
         * @private
         */
        _normalizedPadding: CommonRect;
        /**
         * @private
         */
        _bgSurface: Surface;
        /**
         * @private
         */
        _bgRenderer: Renderer;
        /**
         * @private
         */
        _oldWidth: number;
        /**
         * @private
         */
        _oldHeight: number;
        /**
         * @private
         */
        _childrenArea: CommonArea;
        /**
         * @private
         */
        _childrenSurface: Surface;
        /**
         * @private
         */
        _childrenRenderer: Renderer;
        /**
         * 各種パラメータを指定して `Pane` のインスタンスを生成する。
         * @param param このエンティティに指定するパラメータ
         */
        constructor(param: PaneParameterObject);
        /**
         * パディング。
         * このエンティティの子孫は、パディングに指定された分だけ右・下にずれた場所に描画され、またパディングの矩形サイズでクリッピングされる。
         */
        padding: CommonRect | number;
        /**
         * このエンティティに対する変更をエンジンに通知する。
         * このメソッドの呼び出し後、 `this` に対する変更が各 `Renderer` の描画に反映される。
         * このメソッドは描画キャッシュの無効化を保証しない。描画キャッシュの無効化も必要な場合、 `invalidate()`を呼び出さなければならない。
         * 詳細は `E#modified()` のドキュメントを参照。
         */
        modified(isBubbling?: boolean): void;
        shouldFindChildrenByPoint(point: CommonOffset): boolean;
        renderCache(renderer: Renderer, camera?: Camera): void;
        /**
         * このエンティティを破棄する。また、バックバッファで利用している `Surface` も合わせて破棄される。
         * ただし、 `backgroundImage` に利用している `Surface` の破棄は行わない。
         * @param destroySurface trueを指定した場合、 `backgroundImage` に利用している `Surface` も合わせて破棄する。
         */
        destroy(destroySurface?: boolean): void;
        /**
         * @private
         */
        _renderBackground(): void;
        /**
         * @private
         */
        _renderChildren(camera?: Camera): void;
        /**
         * @private
         */
        _initialize(): void;
        /**
         * このPaneの包含矩形を計算する。
         * Eを継承する他のクラスと異なり、Paneは子要素の位置を包括矩形に含まない。
         * @private
         */
        _calculateBoundingRect(m?: Matrix, c?: Camera): CommonRect;
    }
}
declare namespace g {
    /**
     * `Surface` に対して様々な表現によって書き込む事が出来ることを表すインターフェース。
     *
     * `Surface` を受け取る一部のクラスは、同時に `SurfaceEffector` を受け取り、
     * `Surface` の描画方法をカスタマイズできるようになっている。(現在は `Pane` のみ)
     * ゲーム開発者は、そのようなクラスに対して `SurfaceEffector` のインスタンスを生成して渡すことができる。
     * 通常、 `SurfaceEffector` の個別のメソッドをゲーム開発者が呼び出す必要はない。
     */
    interface SurfaceEffector {
        /**
         * 指定の大きさに拡大・縮小した描画結果の `Surface` を生成して返す。
         *
         * 通常、このメソッドはエンジンによって暗黙に呼び出される。ゲーム開発者が明示的に呼び出す必要はない。
         * @param srcSurface 拡大・縮小して描画する `Surface`
         * @param width 描画する幅
         * @param height 描画する高さ
         */
        render(srcSurface: Surface, width: number, height: number): Surface;
    }
}
declare namespace g {
    /**
     * 操作プラグインが生成・通知する操作の情報。
     */
    interface OperationPluginOperation {
        /**
         * この操作の内容。
         */
        data: (number | string)[];
        /**
         * この操作がローカルであるか否か。
         *
         * 真である場合、この操作によって生成される `OperationEvent` はローカルイベントになる (`local` に真が与えられる)。
         * 省略された場合、偽。
         */
        local?: boolean;
        /**
         * この操作に対する要求優先度。
         */
        priority?: number;
    }
    /**
     * エンジン内部で用いる、操作プラグインが生成・通知する操作の情報。
     * 本インターフェースをゲーム開発者が利用する必要はない。
     */
    interface InternalOperationPluginOperation extends OperationPluginOperation {
        /**
         * @private
         */
        _code: number;
    }
}
declare namespace g {
    /**
     * 操作プラグインの実装すべきインターフェース。
     * Static methodについては `OperationPluginStatic` を参照。
     */
    interface OperationPlugin {
        /**
         * このプラグインが生成した操作を通知する `Trigger` 。
         */
        operationTrigger: g.Trigger<OperationPluginOperation | (number | string)[]>;
        /**
         * このプラグインを開始する。
         * このメソッドの呼び出し以降、 `this.operationTrigger` がfireされる可能性がある。
         */
        start(): void;
        /**
         * このプラグインを停止する。
         * このメソッドの呼び出し以降、 `this.operationTrigger` がfireされることはない。
         */
        stop(): void;
        /**
         * `operationTrigger` で通知した操作のデコードを行う。
         *
         * 通常、`operationTrigger` で通知した操作の情報は、 `g.OperationEvent#data` に保持されてゲームスクリプトに渡される。
         * このメソッドが存在する場合、 通知した操作をこのメソッドに渡して呼び出したその戻り値が `g.OperationEvent#data` に与えられるようになる。
         */
        decode?(op: (number | string)[]): any;
    }
}
declare namespace g {
    /**
     * Operation Pluginの実装すべきstatic methodについての定義。
     */
    interface OperationPluginStatic {
        /**
         * OperationPluginを生成する。
         * @param game このプラグインに紐づく `Game`
         * @param viewInfo このプラグインが参照すべきviewの情報。環境によっては `null` でありうる。
         * @param option game.jsonに指定されたこのプラグイン向けのオプション
         */
        new (game: Game, viewInfo: OperationPluginViewInfo, option?: any): OperationPlugin;
        /**
         * 実行環境がこのpluginをサポートしているか返す。
         */
        isSupported: () => boolean;
    }
}
declare namespace g {
    /**
     * 操作プラグインのインスタンス生成に必要な情報。
     */
    interface OperationPluginInfo {
        /**
         * このプラグインに割り当てるコード番号。
         * このプラグインが通知する操作から生成された `OperationEvent` が、 `code` にこの値を持つ。
         */
        code: number;
        /**
         * プラグインの定義を含むスクリプトファイルのパス。
         *
         * プラグインの定義を得るために、この値が require() に渡される。
         * 相対パスであるとき、その基準は game.json のあるディレクトリである。
         * また対応するスクリプトアセットは `"global": true` が指定されていなければならない。
         */
        script: string;
        /**
         * プラグインを new する際に引き渡すオプション。
         */
        option?: any;
        /**
         * このプラグインを手動で `start()` するか否か。
         *
         * 真である場合、このプラグインの `start()` は暗黙に呼び出されなくなる。
         * 指定されなかった場合、偽。
         */
        manualStart?: boolean;
    }
    /**
     * エンジン内部で用いる、操作プラグインの管理情報
     * 本インターフェースをゲーム開発者が利用する必要はない。
     */
    interface InternalOperationPluginInfo extends OperationPluginInfo {
        /**
         * @private
         */
        _plugin: OperationPlugin;
    }
}
declare namespace g {
    /**
     * 操作プラグインが参照する、抽象化されたview。
     *
     * 各操作プラグインは、この値に加えたevent listenerを元にoperationTriggerをfireしてよい。
     */
    interface OperationPluginView {
        /**
         * イベントリスナを追加する。
         *
         * @param type listenするタイプ。利用可能な文字列は環境に依存する
         * @param callback イベントリスナ
         * @param useCapture capturing phaseで発火するか。通常、この引数を指定する必要はない
         */
        addEventListener(type: string, callback: (event: any) => any, useCapture?: boolean): void;
        /**
         * イベントリスナを削除する。
         *
         * @param type 削除するイベントリスナのタイプ
         * @param callback 削除するイベントリスナ
         * @param useCapture capturing phaseで発火するか。通常、この引数を指定する必要はない
         */
        removeEventListener(type: string, callback: (event: any) => any, useCapture?: boolean): void;
    }
}
declare namespace g {
    /**
     * 操作プラグインが参照する、抽象化されたviewの情報。
     */
    interface OperationPluginViewInfo {
        /**
         * 抽象化されたview。
         */
        view: OperationPluginView;
        /**
         * このviewのタイプ。
         * `null` または `undefined` の場合、`view` はDOMのHTMLElementと互換であると期待してよい。
         */
        type?: string;
    }
}
declare namespace g {
    /**
     * 操作プラグインを管理するクラス。
     * 本クラスのインスタンスをゲーム開発者が直接生成することはなく、ゲーム開発者が利用する必要もない。
     */
    class OperationPluginManager {
        /**
         * 操作プラグインの操作を通知する `Trigger` 。
         */
        operated: Trigger<InternalOperationPluginOperation>;
        /**
         * ロードしている操作プラグインを保持するオブジェクト。
         */
        plugins: {
            [key: number]: OperationPlugin;
        };
        private _game;
        private _viewInfo;
        private _infos;
        private _initialized;
        constructor(game: Game, viewInfo: OperationPluginViewInfo, infos: InternalOperationPluginInfo[]);
        /**
         * 初期化する。
         * このメソッドの呼び出しは、`this.game._loaded` のfire後でなければならない。
         */
        initialize(): void;
        destroy(): void;
        stopAll(): void;
        private _doAutoStart();
        private _loadOperationPlugins();
    }
}
declare namespace g {
    /**
     * スクリプトアセット内で参照可能な値。
     * スクリプトアセットを実行した `Game` を表す。
     */
    var game: Game;
    /**
     * スクリプトアセット内で参照可能な値。
     * スクリプトアセットのファイルパスのうち、ディレクトリ部分を表す。
     */
    var dirname: string;
    /**
     * スクリプトアセット内で参照可能な値。
     * スクリプトアセットのファイルパス。
     */
    var filename: string;
}
declare namespace g {
    /**
     * 文字列描画のフォントウェイト。
     */
    enum FontWeight {
        /**
         * 通常のフォントウェイト。
         */
        Normal = 0,
        /**
         * 太字のフォントウェイト。
         */
        Bold = 1,
    }
    /**
     * SurfaceAtlasの空き領域管理クラス。
     *
     * 本クラスのインスタンスをゲーム開発者が直接生成することはなく、ゲーム開発者が利用する必要もない。
     */
    class SurfaceAtlasSlot {
        x: number;
        y: number;
        width: number;
        height: number;
        prev: SurfaceAtlasSlot;
        next: SurfaceAtlasSlot;
        constructor(x: number, y: number, width: number, height: number);
    }
    /**
     * サーフェスアトラス。
     *
     * 与えられたサーフェスの指定された領域をコピーし一枚のサーフェスにまとめる。
     *
     * 本クラスのインスタンスをゲーム開発者が直接生成することはなく、ゲーム開発者が利用する必要もない。
     */
    class SurfaceAtlas implements Destroyable {
        /**
         * @private
         */
        _surface: Surface;
        /**
         * @private
         */
        _emptySurfaceAtlasSlotHead: SurfaceAtlasSlot;
        /**
         * @private
         */
        _accessScore: number;
        /**
         * @private
         */
        _usedRectangleAreaSize: CommonSize;
        constructor(surface: Surface);
        /**
         * @private
         */
        _acquireSurfaceAtlasSlot(width: number, height: number): SurfaceAtlasSlot;
        /**
         * @private
         */
        _updateUsedRectangleAreaSize(slot: SurfaceAtlasSlot): void;
        /**
         * サーフェスの追加。
         *
         * @param surface サーフェスアトラス上に配置される画像のサーフェス。
         * @param rect サーフェス上の領域を表す矩形。この領域内の画像がサーフェスアトラス上に複製・配置される。
         */
        addSurface(surface: Surface, rect: CommonArea): SurfaceAtlasSlot;
        /**
        * このSurfaceAtlasの破棄を行う。
        * 以後、このSurfaceを利用することは出来なくなる。
        */
        destroy(): void;
        /**
         * このSurfaceAtlasが破棄済であるかどうかを判定する。
         */
        destroyed(): boolean;
        /**
         * _surfaceを複製する。
         *
         * 複製されたSurfaceは文字を格納するのに必要な最低限のサイズになる。
         */
        duplicateSurface(resourceFactory: ResourceFactory): Surface;
    }
    /**
     * `DynamicFont` のコンストラクタに渡すことができるパラメータ。
     * 各メンバの詳細は `DynamicFont` の同名メンバの説明を参照すること。
     */
    interface DynamicFontParameterObject {
        /**
         * ゲームインスタンス。
         */
        game: Game;
        /**
         * フォントファミリ。
         *
         * g.FontFamilyの定義する定数、フォント名、またはそれらの配列で指定する。
         */
        fontFamily: FontFamily | string | (g.FontFamily | string)[];
        /**
         * フォントサイズ。
         */
        size: number;
        /**
         * ヒント。
         *
         * 詳細は `DynamicFontHint` を参照。
         */
        hint?: DynamicFontHint;
        /**
         * フォント色。CSS Colorで指定する。
         * @default "black"
         */
        fontColor?: string;
        /**
         * フォントウェイト。
         * @default FontWeight.Normal
         */
        fontWeight?: FontWeight;
        /**
         * 輪郭幅。
         * @default 0
         */
        strokeWidth?: number;
        /**
         * 輪郭色。
         * @default 0
         */
        strokeColor?: string;
        /**
         * 文字の輪郭のみを描画するか否か。
         * @default false
         */
        strokeOnly?: boolean;
    }
    /**
     * DynamicFontが効率よく動作するためのヒント。
     *
     * ゲーム開発者はDynamicFontが効率よく動作するための各種初期値・最大値などを
     * 提示できる。DynamicFontはこれを参考にするが、そのまま採用するとは限らない。
     */
    interface DynamicFontHint {
        /**
         * 初期アトラス幅。
         */
        initialAtlasWidth?: number;
        /**
         * 初期アトラス高さ。
         */
        initialAtlasHeight?: number;
        /**
         * 最大アトラス幅。
         */
        maxAtlasWidth?: number;
        /**
         * 最大アトラス高さ。
         */
        maxAtlasHeight?: number;
        /**
         * 最大アトラス数。
         */
        maxAtlasNum?: number;
        /**
         * あらかじめグリフを生成する文字のセット。
         */
        presetChars?: string;
        /**
         * ベースライン。
         */
        baselineHeight?: number;
    }
    /**
     * ビットマップフォントを逐次生成するフォント。
     */
    class DynamicFont implements Font {
        /**
         * フォントファミリ。
         *
         * このプロパティは読み出し専用である。
         */
        fontFamily: FontFamily | string | (g.FontFamily | string)[];
        /**
         * フォントサイズ。
         */
        size: number;
        /**
         * ヒント。
         */
        hint: DynamicFontHint;
        /**
         * フォント色。CSS Colorで指定する。
         * @default "black"
         */
        fontColor: string;
        /**
         * フォントウェイト。
         * @default FontWeight.Normal
         */
        fontWeight: FontWeight;
        /**
         * 輪郭幅。
         * 0 以上の数値でなければならない。 0 を指定した場合、輪郭は描画されない。
         * @default 0
         */
        strokeWidth: number;
        /**
         * 輪郭色。CSS Colorで指定する。
         * @default "black"
         */
        strokeColor: string;
        /**
         * 文字の輪郭のみを描画するか切り替える。
         * `true` を指定した場合、輪郭のみ描画される。
         * `false` を指定した場合、文字と輪郭が描画される。
         * @default false
         */
        strokeOnly: boolean;
        /**
         * @private
         */
        _resourceFactory: ResourceFactory;
        /**
         * @private
         */
        _glyphs: {
            [key: number]: Glyph;
        };
        /**
         * @private
         */
        _glyphFactory: GlyphFactory;
        /**
         * @private
         */
        _atlases: SurfaceAtlas[];
        /**
         * @private
         */
        _currentAtlasIndex: number;
        /**
         * @private
         */
        _destroyed: boolean;
        /**
         * @private
         */
        _atlasSize: CommonSize;
        /**
         * 各種パラメータを指定して `DynamicFont` のインスタンスを生成する。
         * @param param `DynamicFont` に設定するパラメータ
         */
        constructor(param: DynamicFontParameterObject);
        /**
         * グリフの取得。
         *
         * 取得に失敗するとnullが返る。
         *
         * 取得に失敗した時、次のようにすることで成功するかもしれない。
         * - DynamicFont生成時に指定する文字サイズを小さくする
         * - アトラスの初期サイズ・最大サイズを大きくする
         *
         * @param code 文字コード
         */
        glyphForCharacter(code: number): Glyph;
        /**
         * BtimapFontの生成。
         *
         * 実装上の制限から、このメソッドを呼び出す場合、maxAtlasNum が 1 または undefined/null(1として扱われる) である必要がある。
         * そうでない場合、失敗する可能性がある。
         *
         * @param missingGlyph `BitmapFont#map` に存在しないコードポイントの代わりに表示するべき文字。最初の一文字が用いられる。
         */
        asBitmapFont(missingGlyphChar?: string): BitmapFont;
        /**
         * @private
         */
        _removeLowUseAtlas(): SurfaceAtlas;
        /**
         * @private
         */
        _reallocateAtlas(): void;
        /**
         * @private
         */
        _addToAtlas(glyph: Glyph): SurfaceAtlas;
        destroy(): void;
        destroyed(): boolean;
    }
}
declare namespace g {
    /**
     * `Game#audio` の管理クラス。
     *
     * 複数の `AudioSystem` に一括で必要な状態設定を行う。
     * 本クラスのインスタンスをゲーム開発者が直接生成することはなく、ゲーム開発者が利用する必要もない。
     */
    class AudioSystemManager {
        /**
         * @private
         */
        _game: Game;
        /**
         * @private
         */
        _muted: boolean;
        /**
         * @private
         */
        _playbackRate: number;
        constructor(game: Game);
        /**
         * @private
         */
        _setMuted(muted: boolean): void;
        /**
         * @private
         */
        _setPlaybackRate(rate: number): void;
    }
}
declare namespace g {
    /**
     * 描画時の合成方法。
     */
    enum CompositeOperation {
        /**
         * 先に描画された領域の上に描画する。
         */
        SourceOver = 0,
        /**
         * 先に描画された領域と重なった部分のみを描画する。
         */
        SourceAtop = 1,
        /**
         * 先に描画された領域と重なった部分の色を加算して描画する。
         */
        Lighter = 2,
        /**
         * 先に描画された領域を全て無視して描画する。
         */
        Copy = 3,
    }
}
declare namespace g {
    /**
     * イベントフィルタ。
     *
     * このシグネチャは試験的なものであり、将来的に互換性なく変更される可能性がある。
     */
    type EventFilter = (events: any[]) => any[];
}
declare namespace g {
    /**
     * グリフファクトリ。
     *
     * `DynamicFont` はこれを利用してグリフを生成する。
     *
     * 本クラスのインスタンスをゲーム開発者が直接生成することはなく、ゲーム開発者が利用する必要もない。
     */
    abstract class GlyphFactory {
        /**
         * フォントファミリ。
         *
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を変更すべきではない。
         */
        fontFamily: FontFamily | string | (g.FontFamily | string)[];
        /**
         * フォントサイズ。
         *
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を変更すべきではない。
         */
        fontSize: number;
        /**
         * ベースライン。
         *
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を変更すべきではない。
         */
        baselineHeight: number;
        /**
         * フォント色。CSS Colorで指定する。
         *
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を変更すべきではない。
         */
        fontColor: string;
        /**
         * フォントウェイト。
         *
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を変更すべきではない。
         */
        fontWeight: g.FontWeight;
        /**
         * 輪郭幅。
         *
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を変更すべきではない。
         */
        strokeWidth: number;
        /**
         * 輪郭色。
         *
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を変更すべきではない。
         */
        strokeColor: string;
        /**
         * 輪郭を描画しているか否か。
         *
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を変更すべきではない。
         */
        strokeOnly: boolean;
        /**
         * `GlyphFactory` を生成する。
         *
         * @param fontFamily フォントファミリ。g.FontFamilyの定義する定数、フォント名、またはそれらの配列
         * @param fontSize フォントサイズ
         * @param baselineHeight ベースラインの高さ
         * @param strokeWidth 輪郭幅
         * @param strokeColor 輪郭色
         * @param strokeOnly 輪郭を描画するか否か
         * @param fontWeight フォントウェイト
         */
        constructor(fontFamily: FontFamily | string | (g.FontFamily | string)[], fontSize: number, baselineHeight?: number, fontColor?: string, strokeWidth?: number, strokeColor?: string, strokeOnly?: boolean, fontWeight?: FontWeight);
        /**
         * グリフの生成。
         *
         * `DynamicFont` はこれを用いてグリフを生成する。
         *
         * @param code 文字コード
         */
        abstract create(code: number): Glyph;
    }
}
declare namespace g {
    /**
     * フォント。
     */
    interface Font extends Destroyable {
        /**
         * フォントサイズ。
         *
         * この値は参照のためにのみ公開されている。ゲーム開発者はこの値を変更すべきではない。
         */
        size: number;
        /**
         * グリフの取得。
         *
         * 取得に失敗するとnullが返る。
         *
         * @param code 文字コード
         */
        glyphForCharacter(code: number): Glyph;
    }
}
declare namespace g {
    /**
     * ゲームのエントリポイントに渡される引数。
     */
    interface GameMainParameterObject {
        /**
         * スナップショット。
         *
         * 以前にこのゲームによって `Game#saveSnapshot()` を呼び出した時に渡した値のいずれかが与えられる。
         * 指定された場合、ゲーム開発者は `saveSnapshot()` 呼び出し時のゲームの実行状態を再現せねばならない。
         */
        snapshot?: any;
        /**
         * ローカル起動時引数。
         */
        args?: any;
        /**
         * グローバル起動引数。
         * `snapshot` が指定される場合は常に指定されない。
         */
        globalArgs?: any;
    }
}
declare namespace g {
    /**
     * シーンに与えるローカルティックの種類
     */
    enum LocalTickMode {
        /**
         * ローカルティックを受け取らない。
         * 通常の(非ローカル)シーン。
         */
        NonLocal = 0,
        /**
         * ローカルティックのみ受け取る。
         * ローカルシーン。
         */
        FullLocal = 1,
        /**
         * 消化すべきティックがない場合にローカルティックを受け取る。
         * ローカルティック補間シーン。
         */
        InterpolateLocal = 2,
    }
}
declare namespace g {
    /**
     * ナインパッチによる描画処理を提供するSurfaceEffector。
     *
     * このSurfaceEffectorは、画像素材の拡大・縮小において「枠」の表現を実現するものである。
     * 画像の上下左右の「枠」部分の幅・高さを渡すことで、上下の「枠」を縦に引き延ばすことなく、
     * また左右の「枠」を横に引き延ばすことなく画像を任意サイズに拡大・縮小できる。
     * ゲームにおけるメッセージウィンドウやダイアログの表現に利用することを想定している。
     */
    class NinePatchSurfaceEffector implements SurfaceEffector {
        game: Game;
        borderWidth: CommonRect;
        /**
         * `NinePatchSurfaceEffector` のインスタンスを生成する。
         * @param game このインスタンスが属する `Game`
         * @param borderWidth 上下左右の「拡大しない」領域の大きさ。すべて同じ値なら数値一つを渡すことができる。省略された場合、 `4`
         */
        constructor(game: Game, borderWidth?: CommonRect | number);
        /**
         * 指定の大きさに拡大・縮小した描画結果の `Surface` を生成して返す。詳細は `SurfaceEffector#render` の項を参照。
         */
        render(srcSurface: Surface, width: number, height: number): Surface;
    }
}
declare namespace g {
    /**
     * パスユーティリティ。
     * 通常、ゲーム開発者がファイルパスを扱うことはなく、このモジュールのメソッドを呼び出す必要はない。
     */
    module PathUtil {
        interface PathComponents {
            host: string;
            path: string;
        }
        /**
         * 二つのパス文字列をつなぎ、相対パス表現 (".", "..") を解決して返す。
         * @param base 左辺パス文字列 (先頭の "./" を除き、".", ".." を含んではならない)
         * @param path 右辺パス文字列
         */
        function resolvePath(base: string, path: string): string;
        /**
         * パス文字列からディレクトリ名部分を切り出して返す。
         * @param path パス文字列
         */
        function resolveDirname(path: string): string;
        /**
         * パス文字列から拡張子部分を切り出して返す。
         * @param path パス文字列
         */
        function resolveExtname(path: string): string;
        /**
         * パス文字列から、node.js において require() の探索範囲になるパスの配列を作成して返す。
         * @param path ディレクトリを表すパス文字列
         */
        function makeNodeModulePaths(path: string): string[];
        /**
         * 与えられたパス文字列に与えられた拡張子を追加する。
         * @param path パス文字列
         * @param ext 追加する拡張子
         */
        function addExtname(path: string, ext: string): string;
        /**
         * 与えられたパス文字列からホストを切り出す。
         * @param path パス文字列
         */
        function splitPath(path: string): PathComponents;
    }
}
declare namespace g {
    /**
     * 文字列描画のフォントファミリ。
     * 現バージョンのakashic-engineの `SystemLabel` 及び `DynamicFont` において、この値の指定は参考値に過ぎない。
     * そのため、 それらにおいて 'fontFamily` プロパティを指定した際、実行環境によっては無視される事がありえる。
     */
    enum FontFamily {
        /**
         * サンセリフ体。ＭＳ Ｐゴシック等
         */
        SansSerif = 0,
        /**
         * セリフ体。ＭＳ 明朝等
         */
        Serif = 1,
        /**
         * 等幅。ＭＳ ゴシック等
         */
        Monospace = 2,
    }
}
declare namespace g {
    /**
     * `BitmapFont` のコンストラクタに渡すことができるパラメータ。
     * 各メンバの詳細は `BitmapFont` の同名メンバの説明を参照すること。
     */
    interface BitmapFontParameterObject {
        /**
         * 文字データとして利用する画像を表す `Surface` または `Asset`。文字を敷き詰めたもの。
         */
        src: Surface | Asset;
        /**
         * 各文字から画像上の位置・サイズなどを特定する情報。コードポイントから `GlyphArea` への写像。
         */
        map: {
            [key: string]: GlyphArea;
        };
        /**
         * `map` で指定を省略した文字に使われる、デフォルトの文字の幅。
         */
        defaultGlyphWidth: number;
        /**
         * `map` で指定を省略した文字に使われる、デフォルトの文字の高さ
         */
        defaultGlyphHeight: number;
        /**
         * `map` に存在しないコードポイントの代わりに表示するべき文字の `GlyphArea` 。
         * @default undefined
         */
        missingGlyph?: GlyphArea;
    }
    /**
     * ラスタ画像によるフォント。
     */
    class BitmapFont implements Font {
        surface: Surface;
        defaultGlyphWidth: number;
        defaultGlyphHeight: number;
        map: {
            [key: string]: GlyphArea;
        };
        missingGlyph: GlyphArea;
        size: number;
        /**
         * 各種パラメータを指定して `BitmapFont` のインスタンスを生成する。
         * @param param `BitmapFont` に設定するパラメータ
         */
        constructor(param: BitmapFontParameterObject);
        /**
         * コードポイントに対応するグリフを返す。
         * @param code コードポイント
         */
        glyphForCharacter(code: number): Glyph;
        /**
         * 利用している `Surface` を破棄した上で、このフォントを破棄する。
         */
        destroy(): void;
        /**
         * 破棄されたオブジェクトかどうかを判定する。
         */
        destroyed(): boolean;
    }
}
declare namespace g {
    /**
     * `SystemLabel` のコンストラクタに渡すことができるパラメータ。
     * 各メンバの詳細は `SystemLabel` の同名メンバの説明を参照すること。
     */
    interface SystemLabelParameterObject extends EParameterObject {
        /**
         * 描画する文字列。
         */
        text: string;
        /**
         * フォントサイズ。
         * 0 以上の数値でなければならない。そうでない場合、動作は不定である。
         */
        fontSize: number;
        /**
         * 文字列の描画位置。
         * `TextAlign.Left` 以外にする場合、 `widthAutoAdjust` を `false` にすべきである。(`widthAutoAdjust` の項を参照)
         * @default TextAlign.Left
         */
        textAlign?: TextAlign;
        /**
         * 文字列のベースライン。
         * @default TextBaseline.Alphabetic
         */
        textBaseline?: TextBaseline;
        /**
         * 描画時に考慮すべき最大幅。
         * 数値である場合、エンジンはこの幅を超える長さの文字列について、この幅に収まるように描画するよう要求する。その方法は環境に依存する。
         * @default undefined
         */
        maxWidth?: number;
        /**
         * 文字色。CSS Colorで指定する。
         * @default "black"
         */
        textColor?: string;
        /**
         * フォントファミリ。
         * 現バージョンのakashic-engineの `SystemLabel` において、この値の指定は参考値に過ぎない。
         * そのため、実行環境によっては無視される事がありうる。
         * @default FontFamily.SansSerif
         */
        fontFamily?: FontFamily;
        /**
         * 輪郭幅。
         * 0 以上の数値でなければならない。 0 を指定した場合、輪郭は描画されない。
         * @default 0
         */
        strokeWidth?: number;
        /**
         * 輪郭色。CSS Colorで指定する。
         * @default "black"
         */
        strokeColor?: string;
        /**
         * 文字の描画スタイルを切り替える。
         * `true` を指定した場合、文字全体は描画されず、輪郭のみ描画される。
         * `false` を指定した場合、文字全体と輪郭が描画される。
         * @default false
         */
        strokeOnly?: boolean;
    }
    /**
     * 文字列描画のベースライン。
     */
    enum TextBaseline {
        /**
         * em squareの上。
         */
        Top = 0,
        /**
         * em squareの中央。
         */
        Middle = 1,
        /**
         * 標準的とされるベースライン。Bottomよりやや上方。
         */
        Alphabetic = 2,
        /**
         * em squareの下。
         */
        Bottom = 3,
    }
    /**
     * システムフォントで文字列を描画するエンティティ。
     *
     * ここでいうシステムフォントとは、akashic-engine実行環境でのデフォルトフォントである。
     * システムフォントは実行環境によって異なる場合がある。したがって `SystemLabel` による描画結果が各実行環境で同一となることは保証されない。
     * その代わりに `SystemLabel` は、Assetの読み込みなしで文字列を描画する機能を提供する。
     *
     * 絵文字などを含むユニコード文字列をすべて `BitmapFont` で提供する事は難しいことから、
     * このクラスは、事実上akashic-engineにおいてユーザ入力文字列を取り扱う唯一の手段である。
     *
     * `SystemLabel` はユーザインタラクションの対象に含めるべきではない。
     * 上述のとおり、各実行環境で描画内容の同一性が保証されないためである。
     * ユーザ入力文字列を含め、 `SystemLabel` によって提示される情報は、参考程度に表示されるなどに留めるべきである。
     * 具体的には `SystemLabel` を `touchable` にする、 `Util.createSpriteFromE()` の対象に含めるなどを行うべきではない。
     * ボタンのようなエンティティのキャプション部分も出来る限り `Label` を用いるべきで、 `SystemLabel` を利用するべきではない。
     *
     * また、akashic-engineは `SystemLabel` の描画順を保証しない。
     * 実行環境によって、次のどちらかが成立する:
     * * `SystemLabel` は、他エンティティ同様に `Scene#children` のツリー構造のpre-order順で描かれる。
     * * `SystemLabel` は、他の全エンティティが描画された後に(画面最前面に)描画される。
     *
     * 実行環境に依存しないゲームを作成するためには、`SystemLabel` はこのいずれでも正しく動作するように利用される必要がある。
     */
    class SystemLabel extends E {
        /**
         * 描画する文字列。
         * この値を変更した場合、 `this.modified()` を呼び出す必要がある。
         */
        text: string;
        /**
         * 文字列の描画位置。
         * 初期値は `TextAlign.Left` である。
         * この値を変更した場合、 `this.modified()` を呼び出す必要がある。
         */
        textAlign: TextAlign;
        /**
         * 文字列のベースライン。
         * 初期値は `TextBaseline.Alphabetic` である。
         * この値を変更した場合、 `this.modified()` を呼び出す必要がある。
         */
        textBaseline: TextBaseline;
        /**
         * フォントサイズ。
         * 0以上の数値でなければならない。そうでない場合、動作は不定である。
         * この値を変更した場合、 `this.modified()` を呼び出す必要がある。
         */
        fontSize: number;
        /**
         * 描画時に考慮すべき最大幅。
         * 初期値は `undefined` である。
         * 数値である場合、エンジンはこの幅を超える長さの文字列について、この幅に収まるように描画するよう要求する。その方法は環境に依存する。
         * この値を変更した場合、 `this.modified()` を呼び出す必要がある。
         */
        maxWidth: number;
        /**
         * 文字色。CSS Colorで指定する。
         * 初期値は "black" である。
         * この値を変更した場合、 `this.modified()` を呼び出す必要がある。
         */
        textColor: string;
        /**
         * フォントファミリ。
         * 初期値は `FontFamily.SansSerif` である。
         * 現バージョンのakashic-engineの `SystemLabel` において、この値の指定は参考値に過ぎない。
         * そのため、実行環境によっては無視される事がありうる。
         * この値を変更した場合、 `this.modified()` を呼び出す必要がある。
         */
        fontFamily: FontFamily;
        /**
         * 輪郭幅。初期値は `0` である。
         * 0以上の数値でなければならない。0を指定した場合、輪郭は描画されない。
         * この値を変更した場合、 `this.modified()` を呼び出す必要がある。
         */
        strokeWidth: number;
        /**
         * 輪郭色。CSS Colorで指定する。
         * 初期値は "black" である。
         * この値を変更した場合、 `this.modified()` を呼び出す必要がある。
         */
        strokeColor: string;
        /**
         * 文字の描画スタイルを切り替える。初期値は `false` である。
         * `true` を指定した場合、文字全体は描画されず、輪郭のみ描画される。
         * `false` を指定した場合、文字全体と輪郭が描画される。
         * この値を変更した場合、 `this.modified()` を呼び出す必要がある。
         */
        strokeOnly: boolean;
        /**
         * 各種パラメータを指定して `SystemLabel` のインスタンスを生成する。
         * @param param このエンティティに指定するパラメータ
         */
        constructor(param: SystemLabelParameterObject);
        renderSelf(renderer: Renderer, camera?: Camera): boolean;
    }
}
declare namespace g {
    /**
     * テキストの描画位置。
     */
    enum TextAlign {
        /**
         * 左寄せ。
         */
        Left = 0,
        /**
         * 中央寄せ。
         */
        Center = 1,
        /**
         * 右寄せ。
         */
        Right = 2,
    }
}
declare namespace g {
    /**
     * 時間経過の契機(ティック)をどのように生成するか。
     * ただしローカルティック(ローカルシーンの間などの「各プレイヤー間で独立な時間経過処理」)はこのモードの影響を受けない。
     */
    enum TickGenerationMode {
        /**
         * 実際の時間経過に従う。
         */
        ByClock = 0,
        /**
         * 時間経過は明示的に要求する。
         * この値を用いる `Scene` の間は、 `Game#raiseTick()` を呼び出さない限り時間経過が起きない。
         */
        Manual = 1,
    }
}
declare namespace g {
    class Xorshift {
        private _state0U;
        private _state0L;
        private _state1U;
        private _state1L;
        static deserialize(ser: XorshiftSerialization): Xorshift;
        initState(seed: number): void;
        constructor(seed: number);
        randomInt(): number[];
        random(): number;
        nextInt(min: number, sup: number): number;
        serialize(): XorshiftSerialization;
    }
    /**
     * serialize/deserialize用のインターフェース
     */
    interface XorshiftSerialization {
        _state0U: number;
        _state0L: number;
        _state1U: number;
        _state1L: number;
    }
}
declare namespace g {
    /**
     * Xorshiftを用いた乱数生成期。
     */
    class XorshiftRandomGenerator extends RandomGenerator {
        private _xorshift;
        static deserialize(ser: XorshiftRandomGeneratorSerialization): XorshiftRandomGenerator;
        constructor(seed: number, xorshift?: XorshiftSerialization);
        get(min: number, max: number): number;
        serialize(): XorshiftRandomGeneratorSerialization;
    }
    /**
     * serialize/deserialize用のインターフェース
     */
    interface XorshiftRandomGeneratorSerialization {
        /**
         * @private
         */
        _seed: number;
        /**
         * @private
         */
        _xorshift: XorshiftSerialization;
    }
}

export = g;
