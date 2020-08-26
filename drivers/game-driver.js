require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Clock = void 0;
var g = require("@akashic/akashic-engine");
/**
 * FPS管理用のクロック。
 *
 * `pdi.Looper` の定期または不定期の呼び出しを受け付け、指定されたFPSから求めた
 * 1フレーム分の時間(1フレーム時間)が経過するたびに `frameTrigger` をfireする。
 */
var Clock = /** @class */ (function () {
    function Clock(param) {
        this.fps = param.fps;
        this.scaleFactor = param.scaleFactor || 1;
        this.frameTrigger = new g.Trigger();
        this.rawFrameTrigger = new g.Trigger();
        this._platform = param.platform;
        this._maxFramePerOnce = param.maxFramePerOnce;
        this._deltaTimeBrokenThreshold = param.deltaTimeBrokenThreshold || Clock.DEFAULT_DELTA_TIME_BROKEN_THRESHOLD;
        if (param.frameHandler) {
            this.frameTrigger.add(param.frameHandler, param.frameHandlerOwner);
        }
        this.running = false;
        this._totalDeltaTime = 0;
        this._onLooperCall_bound = this._onLooperCall.bind(this);
        this._looper = this._platform.createLooper(this._onLooperCall_bound);
        this._waitTime = 0;
        this._waitTimeDoubled = 0;
        this._waitTimeMax = 0;
        this._skipFrameWaitTime = 0;
        this._realMaxFramePerOnce = 0;
    }
    Clock.prototype.start = function () {
        if (this.running)
            return;
        this._totalDeltaTime = 0;
        this._updateWaitTimes(this.fps, this.scaleFactor);
        this._looper.start();
        this.running = true;
    };
    Clock.prototype.stop = function () {
        if (!this.running)
            return;
        this._looper.stop();
        this.running = false;
    };
    /**
     * `scaleFactor` を変更する。
     * start()した後にも呼び出せるが、1フレーム以下の経過時間情報はリセットされる点に注意。
     */
    Clock.prototype.changeScaleFactor = function (scaleFactor) {
        if (this.running) {
            this.stop();
            this.scaleFactor = scaleFactor;
            this.start();
        }
        else {
            this.scaleFactor = scaleFactor;
        }
    };
    Clock.prototype._onLooperCall = function (deltaTime) {
        var rawDeltaTime = deltaTime;
        if (deltaTime <= 0) {
            // 時間が止まっているか巻き戻っている。初回呼び出しか、あるいは何かがおかしい。時間経過0と見なす。
            return this._waitTime - this._totalDeltaTime;
        }
        if (deltaTime > this._deltaTimeBrokenThreshold) {
            // 間隔が長すぎる。何かがおかしい。時間経過を1フレーム分とみなす。
            deltaTime = this._waitTime;
        }
        var totalDeltaTime = this._totalDeltaTime;
        totalDeltaTime += deltaTime;
        if (totalDeltaTime <= this._skipFrameWaitTime) {
            // 1フレーム分消化するほどの時間が経っていない。
            this._totalDeltaTime = totalDeltaTime;
            return this._waitTime - totalDeltaTime;
        }
        var frameCount = (totalDeltaTime < this._waitTimeDoubled) ? 1
            : (totalDeltaTime > this._waitTimeMax) ? this._realMaxFramePerOnce
                : (totalDeltaTime / this._waitTime) | 0;
        var fc = frameCount;
        var arg = {
            deltaTime: rawDeltaTime,
            interrupt: false
        };
        while (fc > 0 && this.running && !arg.interrupt) {
            --fc;
            this.frameTrigger.fire(arg);
            arg.deltaTime = 0; // 同ループによる2度目以降の呼び出しは差分を0とみなす。
        }
        totalDeltaTime -= ((frameCount - fc) * this._waitTime);
        this.rawFrameTrigger.fire();
        this._totalDeltaTime = totalDeltaTime;
        return this._waitTime - totalDeltaTime;
    };
    Clock.prototype._updateWaitTimes = function (fps, scaleFactor) {
        var realFps = fps * scaleFactor;
        this._waitTime = 1000 / realFps;
        this._waitTimeDoubled = Math.max((2000 / realFps) | 0, 1);
        this._waitTimeMax = Math.max(scaleFactor * (1000 * this._maxFramePerOnce / realFps) | 0, 1);
        this._skipFrameWaitTime = (this._waitTime * Clock.ANTICIPATE_RATE) | 0;
        this._realMaxFramePerOnce = this._maxFramePerOnce * scaleFactor;
    };
    /**
     * 経過時間先取りの比率。
     *
     * FPSから定まる「1フレーム」の経過時間が経っていなくても、この割合の時間が経過していれば1フレーム分の計算を進めてしまう。
     * その代わりに次フレームまでの所要時間を長くする。
     * 例えば20FPSであれば50msで1フレームだが、50*0.8 = 40ms 時点で1フレーム進めてしまい、次フレームまでの時間を60msにする。
     */
    Clock.ANTICIPATE_RATE = 0.8;
    /**
     * 異常値とみなして無視する `Looper` の呼び出し間隔[ms]のデフォルト値。
     */
    Clock.DEFAULT_DELTA_TIME_BROKEN_THRESHOLD = 150;
    return Clock;
}());
exports.Clock = Clock;

},{"@akashic/akashic-engine":"@akashic/akashic-engine"}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBuffer = void 0;
var pdi = require("@akashic/akashic-pdi");
var g = require("@akashic/akashic-engine");
var PointEventResolver_1 = require("./PointEventResolver");
/**
 * AMFlowとPDIから流れ込むイベントを蓄積するバッファ。
 *
 * AMFLowから受信するかどうか、AMFlowに送るかどうかは外部から切り替えることができる。
 * 状態によっては、`_amflow` の認証で `subscribeEvent` と `sendEvent` のいずれかまたは両方の権限を取得している必要がある。
 * 詳細は `setMode()` のコメントを参照。
 */
var EventBuffer = /** @class */ (function () {
    function EventBuffer(param) {
        this._amflow = param.amflow;
        this._isLocalReceiver = true;
        this._isReceiver = false;
        this._isSender = false;
        this._isDiscarder = false;
        this._defaultEventPriority = 0;
        this._buffer = [];
        this._joinLeaveBuffer = [];
        this._localBuffer = [];
        this._filters = null;
        this._unfilteredLocalEvents = [];
        this._unfilteredEvents = [];
        this._pointEventResolver = new PointEventResolver_1.PointEventResolver({ game: param.game });
        this._onEvent_bound = this.onEvent.bind(this);
    }
    EventBuffer.isEventLocal = function (pev) {
        switch (pev[0 /* Code */]) {
            case 0 /* Join */:
                return pev[5 /* Local */];
            case 1 /* Leave */:
                return pev[3 /* Local */];
            case 2 /* Timestamp */:
                return pev[4 /* Local */];
            case 32 /* Message */:
                return pev[4 /* Local */];
            case 33 /* PointDown */:
                return pev[7 /* Local */];
            case 34 /* PointMove */:
                return pev[11 /* Local */];
            case 35 /* PointUp */:
                return pev[11 /* Local */];
            case 64 /* Operation */:
                return pev[5 /* Local */];
            default:
                throw g.ExceptionFactory.createAssertionError("EventBuffer.isEventLocal");
        }
    };
    /**
     * モードを切り替える。
     *
     * この関数の呼び出す場合、最後に呼び出された _amflow#authenticate() から得た Permission は次の条件を満たさねばならない:
     * * 引数 `param.isReceiver` に真を渡す場合、次に偽を渡すまでの間、 `subscribeEvent` が真であること。
     * * 引数 `param.isSender` に真を渡す場合、次に偽を渡すまでの間、 `sendEvent` が真であること。
     */
    EventBuffer.prototype.setMode = function (param) {
        if (param.isLocalReceiver != null) {
            this._isLocalReceiver = param.isLocalReceiver;
        }
        if (param.isReceiver != null) {
            if (this._isReceiver !== param.isReceiver) {
                this._isReceiver = param.isReceiver;
                if (param.isReceiver) {
                    this._amflow.onEvent(this._onEvent_bound);
                }
                else {
                    this._amflow.offEvent(this._onEvent_bound);
                }
            }
        }
        if (param.isSender != null) {
            this._isSender = param.isSender;
        }
        if (param.isDiscarder != null) {
            this._isDiscarder = param.isDiscarder;
        }
        if (param.defaultEventPriority != null) {
            this._defaultEventPriority = 3 /* Priority */ & param.defaultEventPriority;
        }
    };
    EventBuffer.prototype.getMode = function () {
        return {
            isLocalReceiver: this._isLocalReceiver,
            isReceiver: this._isReceiver,
            isSender: this._isSender,
            isDiscarder: this._isDiscarder,
            defaultEventPriority: this._defaultEventPriority
        };
    };
    EventBuffer.prototype.onEvent = function (pev) {
        if (EventBuffer.isEventLocal(pev)) {
            if (this._isLocalReceiver && !this._isDiscarder) {
                this._unfilteredLocalEvents.push(pev);
            }
            return;
        }
        if (this._isReceiver && !this._isDiscarder) {
            this._unfilteredEvents.push(pev);
        }
        if (this._isSender) {
            if (pev[1 /* EventFlags */] == null) {
                pev[1 /* EventFlags */] = this._defaultEventPriority;
            }
            this._amflow.sendEvent(pev);
        }
    };
    EventBuffer.prototype.onPointEvent = function (e) {
        var pev;
        switch (e.type) {
            case 0 /* Down */:
                pev = this._pointEventResolver.pointDown(e);
                break;
            case 1 /* Move */:
                pev = this._pointEventResolver.pointMove(e);
                break;
            case 2 /* Up */:
                pev = this._pointEventResolver.pointUp(e);
                break;
        }
        if (!pev)
            return;
        this.onEvent(pev);
    };
    /**
     * filterを無視してイベントを追加する。
     */
    EventBuffer.prototype.addEventDirect = function (pev) {
        if (EventBuffer.isEventLocal(pev)) {
            if (!this._isLocalReceiver || this._isDiscarder)
                return;
            this._localBuffer.push(pev);
            return;
        }
        if (this._isReceiver && !this._isDiscarder) {
            if (pev[0 /* Code */] === 0 /* Join */ || pev[0 /* Code */] === 1 /* Leave */) {
                this._joinLeaveBuffer.push(pev);
            }
            else {
                this._buffer.push(pev);
            }
        }
        if (this._isSender) {
            if (pev[1 /* EventFlags */] == null) {
                pev[1 /* EventFlags */] = this._defaultEventPriority;
            }
            this._amflow.sendEvent(pev);
        }
    };
    EventBuffer.prototype.readEvents = function () {
        var ret = this._buffer;
        if (ret.length === 0)
            return null;
        this._buffer = [];
        return ret;
    };
    EventBuffer.prototype.readJoinLeaves = function () {
        var ret = this._joinLeaveBuffer;
        if (ret.length === 0)
            return null;
        this._joinLeaveBuffer = [];
        return ret;
    };
    EventBuffer.prototype.readLocalEvents = function () {
        var ret = this._localBuffer;
        if (ret.length === 0)
            return null;
        this._localBuffer = [];
        return ret;
    };
    EventBuffer.prototype.addFilter = function (filter, handleEmpty) {
        if (!this._filters)
            this._filters = [];
        this._filters.push({ func: filter, handleEmpty: !!handleEmpty });
    };
    EventBuffer.prototype.removeFilter = function (filter) {
        if (!this._filters)
            return;
        if (!filter) {
            this._filters = null;
            return;
        }
        for (var i = this._filters.length - 1; i >= 0; --i) {
            if (this._filters[i].func === filter)
                this._filters.splice(i, 1);
        }
    };
    EventBuffer.prototype.processEvents = function (isLocal) {
        var ulpevs = this._unfilteredLocalEvents;
        var upevs = this._unfilteredEvents;
        this._unfilteredLocalEvents = [];
        var pevs = ulpevs;
        if (!isLocal && upevs.length > 0) {
            pevs = (pevs.length > 0) ? pevs.concat(upevs) : upevs;
            this._unfilteredEvents = [];
        }
        if (this._filters) {
            for (var i = 0; i < this._filters.length; ++i) {
                var filter = this._filters[i];
                if (pevs.length > 0 || filter.handleEmpty)
                    pevs = this._filters[i].func(pevs) || [];
            }
        }
        for (var i = 0; i < pevs.length; ++i) {
            var pev = pevs[i];
            if (EventBuffer.isEventLocal(pev)) {
                this._localBuffer.push(pev);
            }
            else if (pev[0 /* Code */] === 0 /* Join */ || pev[0 /* Code */] === 1 /* Leave */) {
                this._joinLeaveBuffer.push(pev);
            }
            else {
                this._buffer.push(pev);
            }
        }
    };
    return EventBuffer;
}());
exports.EventBuffer = EventBuffer;

},{"./PointEventResolver":14,"@akashic/akashic-engine":"@akashic/akashic-engine","@akashic/akashic-pdi":1}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventConverter = void 0;
var g = require("@akashic/akashic-engine");
var EventConverter = /** @class */ (function () {
    function EventConverter(param) {
        this._game = param.game;
        this._playerTable = {};
    }
    /**
     * playlog.Eventからg.Eventへ変換する。
     */
    EventConverter.prototype.toGameEvent = function (pev) {
        var pointerId;
        var entityId;
        var target;
        var point;
        var startDelta;
        var prevDelta;
        var local;
        var timestamp;
        var eventCode = pev[0 /* Code */];
        // TODO: transient event 対応
        var prio = pev[1 /* EventFlags */];
        var playerId = pev[2 /* PlayerId */];
        var player = this._playerTable[playerId] || { id: playerId };
        switch (eventCode) {
            case 0 /* Join */:
                player = {
                    id: playerId,
                    name: pev[3 /* PlayerName */]
                };
                this._playerTable[playerId] = player;
                var store = undefined;
                if (pev[4 /* StorageData */]) {
                    var keys = [];
                    var values = [];
                    pev[4 /* StorageData */].map(function (data) {
                        keys.push(data.readKey);
                        values.push(data.values);
                    });
                    store = new g.StorageValueStore(keys, values);
                }
                return new g.JoinEvent(player, store, prio);
            case 1 /* Leave */:
                delete this._playerTable[player.id];
                return new g.LeaveEvent(player, prio);
            case 2 /* Timestamp */:
                timestamp = pev[3 /* Timestamp */];
                return new g.TimestampEvent(timestamp, player, prio);
            case 32 /* Message */:
                local = pev[4 /* Local */];
                return new g.MessageEvent(pev[3 /* Message */], player, local, prio);
            case 33 /* PointDown */:
                local = pev[7 /* Local */];
                pointerId = pev[3 /* PointerId */];
                entityId = pev[6 /* EntityId */];
                target = (entityId == null) ? undefined
                    : (entityId >= 0) ? this._game.db[entityId]
                        : this._game._localDb[entityId];
                point = {
                    x: pev[4 /* X */],
                    y: pev[5 /* Y */]
                };
                return new g.PointDownEvent(pointerId, target, point, player, local, prio);
            case 34 /* PointMove */:
                local = pev[11 /* Local */];
                pointerId = pev[3 /* PointerId */];
                entityId = pev[10 /* EntityId */];
                target = (entityId == null) ? undefined
                    : (entityId >= 0) ? this._game.db[entityId]
                        : this._game._localDb[entityId];
                point = {
                    x: pev[4 /* X */],
                    y: pev[5 /* Y */]
                };
                startDelta = {
                    x: pev[6 /* StartDeltaX */],
                    y: pev[7 /* StartDeltaY */]
                };
                prevDelta = {
                    x: pev[8 /* PrevDeltaX */],
                    y: pev[9 /* PrevDeltaY */]
                };
                return new g.PointMoveEvent(pointerId, target, point, prevDelta, startDelta, player, local, prio);
            case 35 /* PointUp */:
                local = pev[11 /* Local */];
                pointerId = pev[3 /* PointerId */];
                entityId = pev[10 /* EntityId */];
                target = (entityId == null) ? undefined
                    : (entityId >= 0) ? this._game.db[entityId]
                        : this._game._localDb[entityId];
                point = {
                    x: pev[4 /* X */],
                    y: pev[5 /* Y */]
                };
                startDelta = {
                    x: pev[6 /* StartDeltaX */],
                    y: pev[7 /* StartDeltaY */]
                };
                prevDelta = {
                    x: pev[8 /* PrevDeltaX */],
                    y: pev[9 /* PrevDeltaY */]
                };
                return new g.PointUpEvent(pointerId, target, point, prevDelta, startDelta, player, local, prio);
            case 64 /* Operation */:
                local = pev[5 /* Local */];
                var operationCode = pev[3 /* OperationCode */];
                var operationData = pev[4 /* OperationData */];
                var decodedData = this._game._decodeOperationPluginOperation(operationCode, operationData);
                return new g.OperationEvent(operationCode, decodedData, player, local, prio);
            default:
                // TODO handle error
                throw g.ExceptionFactory.createAssertionError("EventConverter#toGameEvent");
        }
    };
    /**
     * g.Eventからplaylog.Eventに変換する。
     */
    EventConverter.prototype.toPlaylogEvent = function (e, preservePlayer) {
        var targetId;
        var playerId;
        var priority = e.priority; // NOTE: このレイヤーでは priority (eventFlags) の中身を精査しないこととする
        switch (e.type) {
            case g.EventType.Join:
            case g.EventType.Leave:
                // game-driver は決して Join と Leave を生成しない
                throw g.ExceptionFactory.createAssertionError("EventConverter#toPlaylogEvent: Invalid type: " + g.EventType[e.type]);
            case g.EventType.Timestamp:
                var ts = e;
                playerId = preservePlayer ? ts.player.id : this._game.player.id;
                return [
                    2 /* Timestamp */,
                    priority,
                    playerId,
                    ts.timestamp // 3: タイムスタンプ
                ];
            case g.EventType.PointDown:
                var pointDown = e;
                targetId = pointDown.target ? pointDown.target.id : null;
                playerId = preservePlayer ? pointDown.player.id : this._game.player.id;
                return [
                    33 /* PointDown */,
                    priority,
                    playerId,
                    pointDown.pointerId,
                    pointDown.point.x,
                    pointDown.point.y,
                    targetId,
                    !!pointDown.local // 7?: 直前のポイントムーブイベントからのY座標の差
                ];
            case g.EventType.PointMove:
                var pointMove = e;
                targetId = pointMove.target ? pointMove.target.id : null;
                playerId = preservePlayer ? pointMove.player.id : this._game.player.id;
                return [
                    34 /* PointMove */,
                    priority,
                    playerId,
                    pointMove.pointerId,
                    pointMove.point.x,
                    pointMove.point.y,
                    pointMove.startDelta.x,
                    pointMove.startDelta.y,
                    pointMove.prevDelta.x,
                    pointMove.prevDelta.y,
                    targetId,
                    !!pointMove.local // 11?: 直前のポイントムーブイベントからのY座標の差
                ];
            case g.EventType.PointUp:
                var pointUp = e;
                targetId = pointUp.target ? pointUp.target.id : null;
                playerId = preservePlayer ? pointUp.player.id : this._game.player.id;
                return [
                    35 /* PointUp */,
                    priority,
                    playerId,
                    pointUp.pointerId,
                    pointUp.point.x,
                    pointUp.point.y,
                    pointUp.startDelta.x,
                    pointUp.startDelta.y,
                    pointUp.prevDelta.x,
                    pointUp.prevDelta.y,
                    targetId,
                    !!pointUp.local // 11?: 直前のポイントムーブイベントからのY座標の差
                ];
            case g.EventType.Message:
                var message = e;
                playerId = preservePlayer ? message.player.id : this._game.player.id;
                return [
                    32 /* Message */,
                    priority,
                    playerId,
                    message.data,
                    !!message.local // 4?: ローカル
                ];
            case g.EventType.Operation:
                var op = e;
                playerId = preservePlayer ? op.player.id : this._game.player.id;
                return [
                    64 /* Operation */,
                    priority,
                    playerId,
                    op.code,
                    op.data,
                    !!op.local // 5?: ローカル
                ];
            default:
                throw g.ExceptionFactory.createAssertionError("Unknown type: " + e.type);
        }
    };
    EventConverter.prototype.makePlaylogOperationEvent = function (op) {
        var playerId = this._game.player.id;
        var priority = (op.priority != null) ? 3 /* Priority */ & op.priority : 0;
        return [
            64 /* Operation */,
            priority,
            playerId,
            op._code,
            op.data,
            !!op.local // 5: ローカル
        ];
    };
    return EventConverter;
}());
exports.EventConverter = EventConverter;

},{"@akashic/akashic-engine":"@akashic/akashic-engine"}],5:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * `GameLoop` の実行モード。
 */
var ExecutionMode;
(function (ExecutionMode) {
    /**
     * `GameLoop` がactiveである。
     *
     * `GameLoop#_executionMode` がこの値である場合、そのインスタンスは:
     *  - playlog.Eventを外部から受け付ける
     *  - playlog.Tickを生成し外部へ送信する
     */
    ExecutionMode[ExecutionMode["Active"] = 0] = "Active";
    /**
     * `GameLoop` がpassiveである。
     *
     * `GameLoop#_executionMode` がこの値である場合、そのインスタンスは:
     *  - playlog.Eventを外部に送信する
     *  - playlog.Tickを受信し、それに基づいて `g.Game#tick()` を呼び出す
     */
    ExecutionMode[ExecutionMode["Passive"] = 1] = "Passive";
})(ExecutionMode || (ExecutionMode = {}));
exports.default = ExecutionMode;

},{}],7:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
var g = require("@akashic/akashic-engine");
/**
 * Gameクラス。
 *
 * このクラスはakashic-engineに由来するクラスであり、
 * アンダースコアで始まるプロパティ (e.g. _foo) を外部から参照する場合がある点に注意。
 * (akashic-engine においては、_foo は「ゲーム開発者向けでない」ことしか意味しない。)
 */
var Game = /** @class */ (function (_super) {
    __extends(Game, _super);
    function Game(param) {
        var _this = _super.call(this, param.configuration, param.resourceFactory, param.assetBase, param.player.id, param.operationPluginViewInfo) || this;
        _this.agePassedTrigger = new g.Trigger();
        _this.targetTimeReachedTrigger = new g.Trigger();
        _this.skippingChangedTrigger = new g.Trigger();
        _this.abortTrigger = new g.Trigger();
        _this.player = param.player;
        _this.raiseEventTrigger = new g.Trigger();
        _this.raiseTickTrigger = new g.Trigger();
        _this.snapshotTrigger = new g.Trigger();
        _this.isSnapshotSaver = !!param.isSnapshotSaver;
        _this._getCurrentTimeFunc = null;
        _this._eventFilterFuncs = null;
        _this._notifyPassedAgeTable = {};
        _this._notifiesTargetTimeReached = false;
        _this._isSkipAware = false;
        _this._gameArgs = param.gameArgs;
        _this._globalGameArgs = param.globalGameArgs;
        _this.skippingChangedTrigger.add(_this._onSkippingChanged, _this);
        return _this;
    }
    /**
     * 特定age到達時の通知を要求する。
     * @param age 通知を要求するage
     */
    Game.prototype.requestNotifyAgePassed = function (age) {
        this._notifyPassedAgeTable[age] = true;
    };
    /**
     * 特定age到達時の通知要求を解除する。
     * @param age 通知要求を解除するage
     */
    Game.prototype.cancelNotifyAgePassed = function (age) {
        delete this._notifyPassedAgeTable[age];
    };
    /**
     * 次に目標時刻を到達した時点を通知するよう要求する。
     * 重複呼び出しはサポートしていない。すなわち、呼び出し後 `targetTimeReachedTrigger` がfireされるまでの呼び出しは無視される。
     */
    Game.prototype.requestNotifyTargetTimeReached = function () {
        this._notifiesTargetTimeReached = true;
    };
    /**
     * 目標時刻を到達した時点を通知要求を解除する。
     */
    Game.prototype.cancelNofityTargetTimeReached = function () {
        this._notifiesTargetTimeReached = false;
    };
    Game.prototype.fireAgePassedIfNeeded = function () {
        var age = this.age - 1; // 通過済みのageを確認するため -1 する。
        if (this._notifyPassedAgeTable[age]) {
            delete this._notifyPassedAgeTable[age];
            this.agePassedTrigger.fire(age);
            return true;
        }
        return false;
    };
    /**
     * `Game` が利用する時刻取得関数をセットする。
     * このメソッドは `Game#_load()` 呼び出しに先行して呼び出されていなければならない。
     */
    Game.prototype.setCurrentTimeFunc = function (fun) {
        this._getCurrentTimeFunc = fun;
    };
    /**
     * `Game` のイベントフィルタ関連実装をセットする。
     * このメソッドは `Game#_load()` 呼び出しに先行して呼び出されていなければならない。
     */
    Game.prototype.setEventFilterFuncs = function (funcs) {
        this._eventFilterFuncs = funcs;
    };
    Game.prototype.setStorageFunc = function (funcs) {
        this.storage._registerLoad(funcs.storageGetFunc);
        this.storage._registerWrite(funcs.storagePutFunc);
        // TODO: akashic-engine 側で書き換えられるようにする
        this.storage.requestValuesForJoinPlayer = funcs.requestValuesForJoinFunc;
    };
    Game.prototype.getIsSkipAware = function () {
        return this._isSkipAware;
    };
    Game.prototype.setIsSkipAware = function (aware) {
        this._isSkipAware = aware;
    };
    Game.prototype.getCurrentTime = function () {
        // GameLoopの同名メソッドとは戻り値が異なるが、 `Game.getCurrentTime()` は `Date.now()` の代替として使用されるため、整数値を返す。
        return Math.floor(this._getCurrentTimeFunc());
    };
    Game.prototype.raiseEvent = function (event) {
        this.raiseEventTrigger.fire(event);
    };
    // TODO: (WIP) playlog.Event[] をとるべきか検討し対応する。
    Game.prototype.raiseTick = function (events) {
        if (!this.scene() || this.scene().tickGenerationMode !== g.TickGenerationMode.Manual)
            throw g.ExceptionFactory.createAssertionError("Game#raiseTick(): tickGenerationMode for the current scene is not Manual.");
        this.raiseTickTrigger.fire(events);
    };
    Game.prototype.addEventFilter = function (filter, handleEmpty) {
        this._eventFilterFuncs.addFilter(filter, handleEmpty);
    };
    Game.prototype.removeEventFilter = function (filter) {
        this._eventFilterFuncs.removeFilter(filter);
    };
    Game.prototype.shouldSaveSnapshot = function () {
        return this.isSnapshotSaver;
    };
    // NOTE: 現状実装が `shouldSaveSnapshot()` と等価なので、簡易対応としてこの実装を用いる。
    Game.prototype.isActiveInstance = function () {
        return this.shouldSaveSnapshot();
    };
    Game.prototype.saveSnapshot = function (gameSnapshot, timestamp) {
        if (timestamp === void 0) { timestamp = this._getCurrentTimeFunc(); }
        if (!this.shouldSaveSnapshot())
            return;
        this.snapshotTrigger.fire({
            frame: this.age,
            timestamp: timestamp,
            data: {
                randGenSer: this.random[0].serialize(),
                gameSnapshot: gameSnapshot
            }
        });
    };
    Game.prototype._destroy = function () {
        this.agePassedTrigger.destroy();
        this.agePassedTrigger = null;
        this.targetTimeReachedTrigger.destroy();
        this.targetTimeReachedTrigger = null;
        this.skippingChangedTrigger.destroy();
        this.skippingChangedTrigger = null;
        this.abortTrigger.destroy();
        this.abortTrigger = null;
        this.player = null;
        this.raiseEventTrigger.destroy();
        this.raiseEventTrigger = null;
        this.raiseTickTrigger.destroy();
        this.raiseTickTrigger = null;
        this.snapshotTrigger.destroy();
        this.snapshotTrigger = null;
        this.isSnapshotSaver = false;
        this._getCurrentTimeFunc = null;
        this._eventFilterFuncs = null;
        this._notifyPassedAgeTable = null;
        this._gameArgs = null;
        this._globalGameArgs = null;
        _super.prototype._destroy.call(this);
    };
    Game.prototype._restartWithSnapshot = function (snapshot) {
        var data = snapshot.data;
        this._eventFilterFuncs.removeFilter();
        if (data.seed != null) {
            // 例外ケース: 第0スタートポイントでスナップショットは持っていないので特別対応
            var randGen = new g.XorshiftRandomGenerator(data.seed);
            this._reset({ age: snapshot.frame, randGen: randGen });
            this._loadAndStart({ args: this._gameArgs, globalArgs: this._globalGameArgs });
        }
        else {
            var randGen = new g.XorshiftRandomGenerator(0, data.randGenSer);
            this._reset({ age: snapshot.frame, randGen: randGen });
            this._loadAndStart({ snapshot: data.gameSnapshot });
        }
    };
    Game.prototype._leaveGame = function () {
        // do nothing.
    };
    Game.prototype._abortGame = function () {
        this.abortTrigger.fire();
    };
    Game.prototype._onRawTargetTimeReached = function (targetTime) {
        if (this._notifiesTargetTimeReached) {
            this._notifiesTargetTimeReached = false;
            this.targetTimeReachedTrigger.fire(targetTime);
        }
    };
    Game.prototype._onSkippingChanged = function (skipping) {
        if (this._isSkipAware) {
            this.skippingChanged.fire(skipping);
        }
    };
    return Game;
}(g.Game));
exports.Game = Game;

},{"@akashic/akashic-engine":"@akashic/akashic-engine"}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameDriver = void 0;
var es6_promise_1 = require("es6-promise");
var g = require("@akashic/akashic-engine");
var ExecutionMode_1 = require("./ExecutionMode");
var Game_1 = require("./Game");
var EventBuffer_1 = require("./EventBuffer");
var GameLoop_1 = require("./GameLoop");
var PdiUtil_1 = require("./PdiUtil");
var GAME_DESTROYED_MESSAGE = "GAME_DESTROYED";
var GameDriver = /** @class */ (function () {
    function GameDriver(param) {
        this.errorTrigger = new g.Trigger();
        if (param.errorHandler)
            this.errorTrigger.add(param.errorHandler, param.errorHandlerOwner);
        this.configurationLoadedTrigger = new g.Trigger();
        this.gameCreatedTrigger = new g.Trigger();
        this._platform = param.platform;
        this._loadConfigurationFunc = PdiUtil_1.PdiUtil.makeLoadConfigurationFunc(param.platform);
        this._player = param.player;
        this._rendererRequirement = null;
        this._playId = null;
        this._game = null;
        this._gameLoop = null;
        this._eventBuffer = null;
        this._openedAmflow = false;
        this._playToken = null;
        this._permission = null;
        this._hidden = false;
        this._destroyed = false;
    }
    /**
     * `GameDriver` を初期化する。
     */
    GameDriver.prototype.initialize = function (param, callback) {
        this.doInitialize(param).then(function () { callback(); }, callback);
    };
    /**
     * `GameDriver` の各種状態を変更する。
     *
     * 引数 `param` のうち、省略されなかった値が新たに設定される。
     * `startGame()` によりゲームが開始されていた場合、暗黙に `stopGame()` が行われ、完了後 `startGame()` される。
     */
    GameDriver.prototype.changeState = function (param, callback) {
        var _this = this;
        var pausing = this._gameLoop && this._gameLoop.running;
        if (pausing)
            this._gameLoop.stop();
        this.initialize(param, function (err) {
            if (err) {
                callback(err);
                return;
            }
            if (pausing)
                _this._gameLoop.start();
            callback();
        });
    };
    /**
     * ゲームを開始する。
     * このメソッドの呼び出しは、 `initialize()` の完了後でなければならない。
     */
    GameDriver.prototype.startGame = function () {
        if (!this._gameLoop) {
            this.errorTrigger.fire(new Error("Not initialized"));
            return;
        }
        this._gameLoop.start();
    };
    /**
     * ゲームを(一時的に)止める。
     *
     * このメソッドの呼び出し後、 `startGame()` が呼び出されるまで、 `Game#tick()` は呼び出されない。
     * Active であればティックの生成が行われず、 Passive であれば受信したティックは蓄積される。
     */
    GameDriver.prototype.stopGame = function () {
        if (this._gameLoop) {
            this._gameLoop.stop();
        }
    };
    /**
     * このドライバが次にティックを生成する場合の、ageの値を設定する。
     * `ExecutionMode.Active` でない場合、動作に影響を与えない。
     * このメソッドの呼び出しは、 `initialize()` の完了後でなければならない。
     *
     * @param age 次に生成されるティックのage
     */
    GameDriver.prototype.setNextAge = function (age) {
        this._gameLoop.setNextAge(age);
    };
    GameDriver.prototype.getPermission = function () {
        return this._permission;
    };
    GameDriver.prototype.getDriverConfiguration = function () {
        return {
            playId: this._playId,
            playToken: this._playToken,
            executionMode: this._gameLoop ? this._gameLoop.getExecutionMode() : undefined,
            eventBufferMode: this._eventBuffer ? this._eventBuffer.getMode() : undefined
        };
    };
    GameDriver.prototype.getLoopConfiguration = function () {
        return this._gameLoop ? this._gameLoop.getLoopConfiguration() : null;
    };
    GameDriver.prototype.getHidden = function () {
        return this._hidden;
    };
    /**
     * PDIに対してプライマリサーフェスのリセットを要求する。
     *
     * @param width プライマリサーフェスの幅。
     * @param height プライマリサーフェスの高さ。
     * @param rendererCandidates Rendererのタイプ。
     */
    GameDriver.prototype.resetPrimarySurface = function (width, height, rendererCandidates) {
        rendererCandidates = rendererCandidates ? rendererCandidates
            : this._rendererRequirement ? this._rendererRequirement.rendererCandidates
                : null;
        var game = this._game;
        var pf = this._platform;
        var primarySurface = pf.getPrimarySurface();
        game.renderers = game.renderers.filter(function (renderer) { return renderer !== primarySurface.renderer(); });
        pf.setRendererRequirement({
            primarySurfaceWidth: width,
            primarySurfaceHeight: height,
            rendererCandidates: rendererCandidates
        });
        this._rendererRequirement = {
            primarySurfaceWidth: width,
            primarySurfaceHeight: height,
            rendererCandidates: rendererCandidates
        };
        game.renderers.push(pf.getPrimarySurface().renderer());
        game.width = width;
        game.height = height;
        game.resized.fire({ width: width, height: height });
        game.modified = true;
    };
    GameDriver.prototype.doInitialize = function (param) {
        var _this = this;
        var p = new es6_promise_1.Promise(function (resolve, reject) {
            if (_this._gameLoop && _this._gameLoop.running) {
                return reject(new Error("Game is running. Must be stopped."));
            }
            if (_this._gameLoop && param.loopConfiguration) {
                _this._gameLoop.setLoopConfiguration(param.loopConfiguration);
            }
            if (param.hidden != null) {
                _this._hidden = param.hidden;
                if (_this._game) {
                    _this._game._setMuted(param.hidden);
                }
            }
            resolve();
        }).then(function () {
            _this._assertLive();
            return _this._doSetDriverConfiguration(param.driverConfiguration);
        });
        if (!param.configurationUrl)
            return p;
        return p.then(function () {
            _this._assertLive();
            return _this._loadConfiguration(param.configurationUrl, param.assetBase, param.configurationBase);
        }).then(function (conf) {
            _this._assertLive();
            return _this._createGame(conf, _this._player, param);
        });
    };
    GameDriver.prototype.destroy = function () {
        var _this = this;
        // NOTE: ここで破棄されるTriggerのfire中に呼ばれるとクラッシュするので、同期的処理だが念のためPromiseに包んで非同期で実行する
        return new es6_promise_1.Promise(function (resolve, reject) {
            _this.stopGame();
            if (_this._game) {
                _this._game._destroy();
                _this._game = null;
            }
            _this.errorTrigger.destroy();
            _this.errorTrigger = null;
            _this.configurationLoadedTrigger.destroy();
            _this.configurationLoadedTrigger = null;
            _this.gameCreatedTrigger.destroy();
            _this.gameCreatedTrigger = null;
            if (_this._platform.destroy) {
                _this._platform.destroy();
            }
            else {
                _this._platform.setRendererRequirement(undefined);
            }
            _this._platform = null;
            _this._loadConfigurationFunc = null;
            _this._player = null;
            _this._rendererRequirement = null;
            _this._playId = null;
            _this._gameLoop = null;
            _this._eventBuffer = null;
            _this._openedAmflow = false;
            _this._playToken = null;
            _this._permission = null;
            _this._hidden = false;
            _this._destroyed = true;
            resolve();
        });
    };
    GameDriver.prototype._doSetDriverConfiguration = function (dconf) {
        var _this = this;
        if (dconf == null) {
            return es6_promise_1.Promise.resolve();
        }
        // デフォルト値の補完
        if (dconf.playId === undefined)
            dconf.playId = this._playId;
        if (dconf.playToken === undefined)
            dconf.playToken = this._playToken;
        if (dconf.eventBufferMode === undefined) {
            if (dconf.executionMode === ExecutionMode_1.default.Active) {
                dconf.eventBufferMode = { isReceiver: true, isSender: false };
            }
            else if (dconf.executionMode === ExecutionMode_1.default.Passive) {
                dconf.eventBufferMode = { isReceiver: false, isSender: true };
            }
        }
        var p = es6_promise_1.Promise.resolve();
        if (this._playId !== dconf.playId) {
            p = p.then(function () {
                _this._assertLive();
                return _this._doOpenAmflow(dconf.playId);
            });
        }
        if (this._playToken !== dconf.playToken) {
            p = p.then(function () {
                _this._assertLive();
                return _this._doAuthenticate(dconf.playToken);
            });
        }
        return p.then(function () {
            _this._assertLive();
            if (dconf.eventBufferMode != null) {
                if (dconf.eventBufferMode.defaultEventPriority == null) {
                    dconf.eventBufferMode.defaultEventPriority = 3 /* Priority */ & _this._permission.maxEventPriority;
                }
                if (_this._eventBuffer) {
                    _this._eventBuffer.setMode(dconf.eventBufferMode);
                }
            }
            if (dconf.executionMode != null) {
                if (_this._gameLoop) {
                    _this._gameLoop.setExecutionMode(dconf.executionMode);
                }
            }
        });
    };
    GameDriver.prototype._doCloseAmflow = function () {
        var _this = this;
        return new es6_promise_1.Promise(function (resolve, reject) {
            if (!_this._openedAmflow)
                return resolve();
            _this._platform.amflow.close(function (err) {
                _this._openedAmflow = false;
                var error = _this._getCallbackError(err);
                if (error) {
                    return reject(error);
                }
                resolve();
            });
        });
    };
    GameDriver.prototype._doOpenAmflow = function (playId) {
        var _this = this;
        if (playId === undefined) {
            return es6_promise_1.Promise.resolve();
        }
        var p = this._doCloseAmflow();
        return p.then(function () {
            _this._assertLive();
            return new es6_promise_1.Promise(function (resolve, reject) {
                if (playId === null)
                    return resolve();
                _this._platform.amflow.open(playId, function (err) {
                    var error = _this._getCallbackError(err);
                    if (error) {
                        return reject(error);
                    }
                    _this._openedAmflow = true;
                    _this._playId = playId;
                    if (_this._game)
                        _this._updateGamePlayId(_this._game);
                    resolve();
                });
            });
        });
    };
    GameDriver.prototype._doAuthenticate = function (playToken) {
        var _this = this;
        if (playToken == null)
            return es6_promise_1.Promise.resolve();
        return new es6_promise_1.Promise(function (resolve, reject) {
            _this._platform.amflow.authenticate(playToken, function (err, permission) {
                var error = _this._getCallbackError(err);
                if (error) {
                    return reject(error);
                }
                _this._playToken = playToken;
                _this._permission = permission;
                if (_this._game) {
                    _this._game.isSnapshotSaver = _this._permission.writeTick;
                }
                resolve();
            });
        });
    };
    GameDriver.prototype._loadConfiguration = function (configurationUrl, assetBase, configurationBase) {
        var _this = this;
        return new es6_promise_1.Promise(function (resolve, reject) {
            _this._loadConfigurationFunc(configurationUrl, assetBase, configurationBase, function (err, conf) {
                var error = _this._getCallbackError(err);
                if (error) {
                    return reject(error);
                }
                _this.configurationLoadedTrigger.fire(conf);
                resolve(conf);
            });
        });
    };
    GameDriver.prototype._putZerothStartPoint = function (data) {
        var _this = this;
        return new es6_promise_1.Promise(function (resolve, reject) {
            // AMFlowは第0スタートポイントに関して「書かれるまで待つ」という動作をするため、「なければ書き込む」ことはできない。
            var zerothStartPoint = { frame: 0, timestamp: data.startedAt, data: data };
            _this._platform.amflow.putStartPoint(zerothStartPoint, function (err) {
                var error = _this._getCallbackError(err);
                if (error) {
                    return reject(error);
                }
                resolve();
            });
        });
    };
    GameDriver.prototype._getZerothStartPointData = function () {
        var _this = this;
        return new es6_promise_1.Promise(function (resolve, reject) {
            _this._platform.amflow.getStartPoint({ frame: 0 }, function (err, startPoint) {
                var error = _this._getCallbackError(err);
                if (error) {
                    return reject(error);
                }
                var data = startPoint.data;
                if (typeof data.seed !== "number") // 型がないので一応確認
                    return reject(new Error("GameDriver#_getRandomSeed: No seed found."));
                resolve(data);
            });
        });
    };
    GameDriver.prototype._createGame = function (conf, player, param) {
        var _this = this;
        var putSeed = (param.driverConfiguration.executionMode === ExecutionMode_1.default.Active) && this._permission.writeTick;
        var p;
        if (putSeed) {
            p = this._putZerothStartPoint({
                seed: Date.now(),
                globalArgs: param.globalGameArgs,
                fps: conf.fps,
                startedAt: Date.now()
            });
        }
        else {
            p = es6_promise_1.Promise.resolve();
        }
        p = p.then(function () {
            _this._assertLive();
            return _this._getZerothStartPointData();
        });
        return p.then(function (zerothData) {
            _this._assertLive();
            var pf = _this._platform;
            var driverConf = param.driverConfiguration || {
                eventBufferMode: { isReceiver: true, isSender: false },
                executionMode: ExecutionMode_1.default.Active
            };
            var seed = zerothData.seed;
            var args = param.gameArgs;
            var globalArgs = zerothData.globalArgs;
            var startedAt = zerothData.startedAt;
            var rendererRequirement = {
                primarySurfaceWidth: conf.width,
                primarySurfaceHeight: conf.height,
                rendererCandidates: conf.renderers // TODO: akashic-engineのGameConfigurationにrenderersの定義を加える
            };
            pf.setRendererRequirement(rendererRequirement);
            var game = new Game_1.Game({
                configuration: conf,
                player: player,
                resourceFactory: pf.getResourceFactory(),
                assetBase: param.assetBase,
                isSnapshotSaver: _this._permission.writeTick,
                operationPluginViewInfo: (pf.getOperationPluginViewInfo ? pf.getOperationPluginViewInfo() : null),
                gameArgs: args,
                globalGameArgs: globalArgs
            });
            var eventBuffer = new EventBuffer_1.EventBuffer({ game: game, amflow: pf.amflow });
            eventBuffer.setMode(driverConf.eventBufferMode);
            pf.setPlatformEventHandler(eventBuffer);
            game.setEventFilterFuncs({
                addFilter: eventBuffer.addFilter.bind(eventBuffer),
                removeFilter: eventBuffer.removeFilter.bind(eventBuffer)
            });
            game.renderers.push(pf.getPrimarySurface().renderer());
            var gameLoop = new GameLoop_1.GameLoop({
                game: game,
                amflow: pf.amflow,
                platform: pf,
                executionMode: driverConf.executionMode,
                eventBuffer: eventBuffer,
                configuration: param.loopConfiguration,
                startedAt: startedAt,
                profiler: param.profiler
            });
            gameLoop.rawTargetTimeReachedTrigger.add(game._onRawTargetTimeReached, game);
            game.setCurrentTimeFunc(gameLoop.getCurrentTime.bind(gameLoop));
            game._reset({ age: 0, randGen: new g.XorshiftRandomGenerator(seed) });
            _this._updateGamePlayId(game);
            if (_this._hidden)
                game._setMuted(true);
            game.snapshotTrigger.add(function (startPoint) {
                _this._platform.amflow.putStartPoint(startPoint, function (err) {
                    var error = _this._getCallbackError(err);
                    if (error) {
                        _this.errorTrigger.fire(error);
                    }
                });
            });
            _this._game = game;
            _this._eventBuffer = eventBuffer;
            _this._gameLoop = gameLoop;
            _this._rendererRequirement = rendererRequirement;
            _this.gameCreatedTrigger.fire(game);
            _this._game._loadAndStart({ args: param.gameArgs || undefined }); // TODO: Game#_restartWithSnapshot()と統合すべき
        });
    };
    GameDriver.prototype._updateGamePlayId = function (game) {
        var _this = this;
        game.playId = this._playId;
        game.external.send = function (data) {
            _this._platform.sendToExternal(_this._playId, data);
        };
    };
    // 非同期処理中にゲームがdestroy済みかどうか判定するためのメソッド
    GameDriver.prototype._assertLive = function () {
        if (this._destroyed) {
            throw new Error(GAME_DESTROYED_MESSAGE);
        }
    };
    // コールバック時にエラーが発生もしくはゲームがdestroy済みの場合はErrorを返す
    GameDriver.prototype._getCallbackError = function (err) {
        if (err) {
            return err;
        }
        else if (this._destroyed) {
            return new Error(GAME_DESTROYED_MESSAGE);
        }
        return null;
    };
    return GameDriver;
}());
exports.GameDriver = GameDriver;

},{"./EventBuffer":3,"./ExecutionMode":6,"./Game":7,"./GameLoop":9,"./PdiUtil":13,"@akashic/akashic-engine":"@akashic/akashic-engine","es6-promise":24}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameLoop = void 0;
var g = require("@akashic/akashic-engine");
var constants = require("./constants");
var LoopMode_1 = require("./LoopMode");
var LoopRenderMode_1 = require("./LoopRenderMode");
var ExecutionMode_1 = require("./ExecutionMode");
var Clock_1 = require("./Clock");
var ProfilerClock_1 = require("./ProfilerClock");
var EventConverter_1 = require("./EventConverter");
var TickController_1 = require("./TickController");
/**
 * ゲームのメインループ管理クラス。
 * clock frameの度にTickBufferに蓄積されたTickを元にゲームを動かす。
 *
 * start() から stop() までの間、最後に呼び出された _amflow.authenticate() は Permission#readTick を返していなければならない。
 */
var GameLoop = /** @class */ (function () {
    function GameLoop(param) {
        this.errorTrigger = new g.Trigger();
        this.rawTargetTimeReachedTrigger = new g.Trigger();
        this.running = false;
        this._currentTime = param.startedAt;
        this._frameTime = 1000 / param.game.fps;
        this._omittedTickDuration = 0;
        if (param.errorHandler) {
            this.errorTrigger.add(param.errorHandler, param.errorHandlerOwner);
        }
        var conf = param.configuration;
        this._startedAt = param.startedAt;
        this._targetTimeFunc = conf.targetTimeFunc || null;
        this._targetTimeOffset = conf.targetTimeOffset || null;
        this._originDate = conf.originDate || null;
        this._realTargetTimeOffset = (this._originDate != null) ? this._originDate : (this._targetTimeOffset || 0) + this._startedAt;
        this._delayIgnoreThreshold = conf.delayIgnoreThreshold || constants.DEFAULT_DELAY_IGNORE_THRESHOLD;
        this._skipTicksAtOnce = conf.skipTicksAtOnce || constants.DEFAULT_SKIP_TICKS_AT_ONCE;
        this._skipThreshold = conf.skipThreshold || constants.DEFAULT_SKIP_THRESHOLD;
        this._skipThresholdTime = this._skipThreshold * this._frameTime;
        // this._skipAwareGame はないことに注意 (Game#getIsSkipAware()) を使う
        this._jumpTryThreshold = conf.jumpTryThreshold || constants.DEFAULT_JUMP_TRY_THRESHOLD;
        this._jumpIgnoreThreshold = conf.jumpIgnoreThreshold || constants.DEFAULT_JUMP_IGNORE_THRESHOLD;
        this._pollingTickThreshold = conf._pollingTickThreshold || constants.DEFAULT_POLLING_TICK_THRESHOLD;
        this._playbackRate = conf.playbackRate || 1;
        var loopRenderMode = (conf.loopRenderMode != null) ? conf.loopRenderMode : LoopRenderMode_1.default.AfterRawFrame;
        this._loopRenderMode = null; // 後の_setLoopRenderMode()で初期化
        this._omitInterpolatedTickOnReplay = (conf.omitInterpolatedTickOnReplay != null) ? conf.omitInterpolatedTickOnReplay : true;
        this._loopMode = conf.loopMode;
        this._amflow = param.amflow;
        this._game = param.game;
        this._eventBuffer = param.eventBuffer;
        this._executionMode = param.executionMode;
        this._sceneTickMode = null;
        this._sceneLocalMode = null;
        this._targetAge = (conf.targetAge != null) ? conf.targetAge : null;
        this._waitingStartPoint = false;
        this._lastRequestedStartPointAge = -1;
        this._lastRequestedStartPointTime = -1;
        this._waitingNextTick = false;
        this._consumedLatestTick = false;
        this._skipping = false;
        this._lastPollingTickTime = 0;
        // todo: 本来は、パフォーマンス測定機構を含まないリリースモードによるビルド方式も提供すべき。
        if (!param.profiler) {
            this._clock = new Clock_1.Clock({
                fps: param.game.fps,
                scaleFactor: this._playbackRate,
                platform: param.platform,
                maxFramePerOnce: 5
            });
        }
        else {
            this._clock = new ProfilerClock_1.ProfilerClock({
                fps: param.game.fps,
                scaleFactor: this._playbackRate,
                platform: param.platform,
                maxFramePerOnce: 5,
                profiler: param.profiler
            });
        }
        this._tickController = new TickController_1.TickController({
            amflow: param.amflow,
            clock: this._clock,
            game: param.game,
            eventBuffer: param.eventBuffer,
            executionMode: param.executionMode,
            startedAt: param.startedAt,
            errorHandler: this.errorTrigger.fire,
            errorHandlerOwner: this.errorTrigger
        });
        this._eventConverter = new EventConverter_1.EventConverter({ game: param.game });
        this._tickBuffer = this._tickController.getBuffer();
        this._onGotStartPoint_bound = this._onGotStartPoint.bind(this);
        this._setLoopRenderMode(loopRenderMode);
        this._game.setIsSkipAware(conf.skipAwareGame != null ? conf.skipAwareGame : true);
        this._game.setStorageFunc(this._tickController.storageFunc());
        this._game.raiseEventTrigger.add(this._onGameRaiseEvent, this);
        this._game.raiseTickTrigger.add(this._onGameRaiseTick, this);
        this._game._started.add(this._onGameStarted, this);
        this._game._operationPluginOperated.add(this._onGameOperationPluginOperated, this);
        this._tickBuffer.gotNextTickTrigger.add(this._onGotNextFrameTick, this);
        this._tickBuffer.gotNoTickTrigger.add(this._onGotNoTick, this);
        this._tickBuffer.start();
        this._updateGamePlaybackRate();
        this._handleSceneChange();
    }
    GameLoop.prototype.start = function () {
        this.running = true;
        this._clock.start();
    };
    GameLoop.prototype.stop = function () {
        this._clock.stop();
        this.running = false;
    };
    GameLoop.prototype.setNextAge = function (age) {
        this._tickController.setNextAge(age);
    };
    GameLoop.prototype.getExecutionMode = function () {
        return this._executionMode;
    };
    GameLoop.prototype.setExecutionMode = function (execMode) {
        this._executionMode = execMode;
        this._tickController.setExecutionMode(execMode);
    };
    GameLoop.prototype.getLoopConfiguration = function () {
        return {
            loopMode: this._loopMode,
            delayIgnoreThreshold: this._delayIgnoreThreshold,
            skipTicksAtOnce: this._skipTicksAtOnce,
            skipThreshold: this._skipThreshold,
            skipAwareGame: this._game.getIsSkipAware(),
            jumpTryThreshold: this._jumpTryThreshold,
            jumpIgnoreThreshold: this._jumpIgnoreThreshold,
            playbackRate: this._playbackRate,
            loopRenderMode: this._loopRenderMode,
            targetTimeFunc: this._targetTimeFunc,
            targetTimeOffset: this._targetTimeOffset,
            originDate: this._originDate,
            omitInterpolatedTickOnReplay: this._omitInterpolatedTickOnReplay,
            targetAge: this._targetAge
        };
    };
    GameLoop.prototype.setLoopConfiguration = function (conf) {
        if (conf.loopMode != null)
            this._loopMode = conf.loopMode;
        if (conf.delayIgnoreThreshold != null)
            this._delayIgnoreThreshold = conf.delayIgnoreThreshold;
        if (conf.skipTicksAtOnce != null)
            this._skipTicksAtOnce = conf.skipTicksAtOnce;
        if (conf.skipThreshold != null) {
            this._skipThreshold = conf.skipThreshold;
            this._skipThresholdTime = this._skipThreshold * this._frameTime;
        }
        if (conf.skipAwareGame != null)
            this._game.setIsSkipAware(conf.skipAwareGame);
        if (conf.jumpTryThreshold != null)
            this._jumpTryThreshold = conf.jumpTryThreshold;
        if (conf.jumpIgnoreThreshold != null)
            this._jumpIgnoreThreshold = conf.jumpIgnoreThreshold;
        if (conf.playbackRate != null) {
            this._playbackRate = conf.playbackRate;
            this._clock.changeScaleFactor(this._playbackRate);
            this._updateGamePlaybackRate();
        }
        if (conf.loopRenderMode != null)
            this._setLoopRenderMode(conf.loopRenderMode);
        if (conf.targetTimeFunc != null) {
            this._targetTimeFunc = conf.targetTimeFunc;
        }
        if (conf.targetTimeOffset != null)
            this._targetTimeOffset = conf.targetTimeOffset;
        if (conf.originDate != null)
            this._originDate = conf.originDate;
        this._realTargetTimeOffset = (this._originDate != null) ? this._originDate : (this._targetTimeOffset || 0) + this._startedAt;
        if (conf.omitInterpolatedTickOnReplay != null)
            this._omitInterpolatedTickOnReplay = conf.omitInterpolatedTickOnReplay;
        if (conf.targetAge != null) {
            if (this._targetAge !== conf.targetAge) {
                // targetAgeの変化によって必要なティックが変化した可能性がある。
                // 一度リセットして _onFrame() で改めて _waitingNextTick を求め直す。
                this._waitingNextTick = false;
            }
            this._targetAge = conf.targetAge;
        }
    };
    GameLoop.prototype.addTickList = function (tickList) {
        this._tickBuffer.addTickList(tickList);
    };
    GameLoop.prototype.getCurrentTime = function () {
        return this._currentTime;
    };
    /**
     * 早送り状態に入る。
     *
     * すべての早回し(1フレームでの複数ティック消費)で早送り状態に入るわけではないことに注意。
     * 少々の遅れはこのクラスが暗黙に早回しして吸収する。
     * 早送り状態は、暗黙の早回しでは吸収しきれない規模の早回しの開始時に通知される。
     * 具体的な値との関連は `skipThreshold` など `LoopConfiguration` のメンバを参照のこと。
     */
    GameLoop.prototype._startSkipping = function () {
        this._skipping = true;
        this._updateGamePlaybackRate();
        this._game.skippingChangedTrigger.fire(true);
    };
    /**
     * 早送り状態を終える。
     */
    GameLoop.prototype._stopSkipping = function () {
        this._skipping = false;
        this._updateGamePlaybackRate();
        this._game.skippingChangedTrigger.fire(false);
    };
    /**
     * Gameの再生速度設定を変える。
     * 実際に再生速度(ティックの消費速度)を決めているのはこのクラスである点に注意。
     */
    GameLoop.prototype._updateGamePlaybackRate = function () {
        var realPlaybackRate = this._skipping ? (this._playbackRate * this._skipTicksAtOnce) : this._playbackRate;
        this._game._setAudioPlaybackRate(realPlaybackRate);
    };
    GameLoop.prototype._handleSceneChange = function () {
        var scene = this._game.scene();
        var localMode = scene ? scene.local : g.LocalTickMode.FullLocal; // シーンがない場合はローカルシーン同様に振る舞う(ティックは消化しない)
        var tickMode = scene ? scene.tickGenerationMode : g.TickGenerationMode.ByClock;
        if (this._sceneLocalMode !== localMode || this._sceneTickMode !== tickMode) {
            this._sceneLocalMode = localMode;
            this._sceneTickMode = tickMode;
            this._clock.frameTrigger.remove(this._onFrame, this);
            this._clock.frameTrigger.remove(this._onLocalFrame, this);
            switch (localMode) {
                case g.LocalTickMode.FullLocal:
                    // ローカルシーン: TickGenerationMode に関係なくローカルティックのみ
                    this._tickController.stopTick();
                    this._clock.frameTrigger.add(this._onLocalFrame, this);
                    break;
                case g.LocalTickMode.NonLocal:
                case g.LocalTickMode.InterpolateLocal:
                    if (tickMode === g.TickGenerationMode.ByClock) {
                        this._tickController.startTick();
                    }
                    else {
                        // Manual の場合: storageDataが乗る可能性がある最初のTickだけ生成させ、あとは生成を止める。(Manualの仕様どおりの挙動)
                        // storageDataがある場合は送らないとPassiveのインスタンスがローディングシーンを終えられない。
                        this._tickController.startTickOnce();
                    }
                    this._clock.frameTrigger.add(this._onFrame, this);
                    break;
                default:
                    this.errorTrigger.fire(new Error("Unknown LocalTickMode: " + localMode));
                    return;
            }
        }
    };
    /**
     * ローカルシーンのフレーム処理。
     *
     * `this._clock` の管理する時間経過に従い、ローカルシーンにおいて1フレーム時間につき1回呼び出される。
     */
    GameLoop.prototype._onLocalFrame = function () {
        this._doLocalTick();
    };
    GameLoop.prototype._doLocalTick = function () {
        var game = this._game;
        var pevs = this._eventBuffer.readLocalEvents();
        this._currentTime += this._frameTime;
        if (pevs) {
            for (var i = 0, len = pevs.length; i < len; ++i)
                game.events.push(this._eventConverter.toGameEvent(pevs[i]));
        }
        var sceneChanged = game.tick(false, Math.floor(this._omittedTickDuration / this._frameTime));
        this._omittedTickDuration = 0;
        if (sceneChanged)
            this._handleSceneChange();
    };
    /**
     * 非ローカルシーンのフレーム処理。
     *
     * `this._clock` の管理する時間経過に従い、非ローカルシーンにおいて1フレーム時間につき1回呼び出される。
     */
    GameLoop.prototype._onFrame = function (frameArg) {
        if (this._loopMode !== LoopMode_1.default.Replay || !this._targetTimeFunc) {
            this._onFrameNormal(frameArg);
        }
        else {
            var givenTargetTime = this._targetTimeFunc();
            var targetTime = givenTargetTime + this._realTargetTimeOffset;
            var prevTime = this._currentTime;
            this._onFrameForTimedReplay(targetTime, frameArg);
            // 目標時刻到達判定: 進めなくなり、あと1フレームで目標時刻を過ぎるタイミングを到達として通知する。
            // 時間進行を進めていっても目標時刻 "以上" に進むことはないので「過ぎた」タイミングは使えない点に注意。
            // (また、それでもなお (prevTime <= targetTime) の条件はなくせない点にも注意。巻き戻す時は (prevTime > targetTime) になる)
            if ((prevTime === this._currentTime) && (prevTime <= targetTime) && (targetTime <= prevTime + this._frameTime))
                this.rawTargetTimeReachedTrigger.fire(givenTargetTime);
        }
    };
    /**
     * 時刻関数が与えられている場合のフレーム処理。
     *
     * 通常ケース (`_onFrameNormal()`) とは主に次の点で異なる:
     *  1. `Replay` 時の実装しか持たない (`Realtime` は時刻関数を使わずとにかく最新ティックを目指すので不要)
     *  2. ローカルティック補間をタイムスタンプに従ってしか行わない
     * 後者は、ティック受信待ちなどの状況で起きるローカルティック補間がなくなることを意味する。
     */
    GameLoop.prototype._onFrameForTimedReplay = function (targetTime, frameArg) {
        var sceneChanged = false;
        var game = this._game;
        var timeGap = targetTime - this._currentTime;
        var frameGap = (timeGap / this._frameTime);
        if ((frameGap > this._jumpTryThreshold || frameGap < 0) &&
            (!this._waitingStartPoint) &&
            (this._lastRequestedStartPointTime < this._currentTime)) {
            // スナップショットを要求だけして続行する(スナップショットが来るまで進める限りは進む)。
            this._waitingStartPoint = true;
            this._lastRequestedStartPointTime = targetTime;
            this._amflow.getStartPoint({ timestamp: targetTime }, this._onGotStartPoint_bound);
        }
        if (frameGap <= 0) {
            if (this._skipping)
                this._stopSkipping();
            return;
        }
        if (!this._skipping) {
            if ((frameGap > this._skipThreshold || this._tickBuffer.currentAge === 0) &&
                (this._tickBuffer.hasNextTick() || (this._omitInterpolatedTickOnReplay && this._consumedLatestTick))) {
                // ここでは常に `frameGap > 0` であることに注意。0の時にskipに入ってもすぐ戻ってしまう
                this._startSkipping();
            }
        }
        var consumedFrame = 0;
        for (; consumedFrame < this._skipTicksAtOnce; ++consumedFrame) {
            var nextFrameTime = this._currentTime + this._frameTime;
            if (!this._tickBuffer.hasNextTick()) {
                if (!this._waitingNextTick) {
                    this._startWaitingNextTick();
                    if (!this._consumedLatestTick)
                        this._tickBuffer.requestTicks();
                }
                if (this._omitInterpolatedTickOnReplay && this._sceneLocalMode === g.LocalTickMode.InterpolateLocal) {
                    if (this._consumedLatestTick) {
                        // 最新のティックが存在しない場合は現在時刻を目標時刻に合わせる。
                        // (_doLocalTick() により現在時刻が this._frameTime 進むのでその直前まで進める)
                        this._currentTime = targetTime - this._frameTime;
                    }
                    // ティックがなく、目標時刻に到達していない場合、補間ティックを挿入する。
                    // (経緯上ここだけフラグ名と逆っぽい挙動になってしまっている点に注意。TODO フラグを改名する)
                    if (targetTime > nextFrameTime)
                        this._doLocalTick();
                }
                break;
            }
            var nextTickTime = this._tickBuffer.readNextTickTime();
            if (nextTickTime == null)
                nextTickTime = nextFrameTime;
            if (targetTime < nextFrameTime) {
                // 次フレームに進むと目標時刻を超過する＝次フレーム時刻までは進めない＝補間ティックは必要ない。
                if (nextTickTime <= targetTime) {
                    // 特殊ケース: 目標時刻より手前に次ティックがあるので、目標時刻までは進んで次ティックは消化してしまう。
                    // (この処理がないと、特にリプレイで「最後のティックの0.1フレーム時間前」などに来たときに進めなくなってしまう。)
                    nextFrameTime = targetTime;
                }
                else {
                    break;
                }
            }
            else {
                if (nextFrameTime < nextTickTime) {
                    if (this._omitInterpolatedTickOnReplay && this._skipping) {
                        // スキップ中、ティック補間不要なら即座に次ティック時刻(かその手前の目標時刻)まで進める。
                        // (_onFrameNormal()の対応箇所と異なり、ここでは「次ティック時刻の "次フレーム時刻"」に切り上げないことに注意。
                        //  時間ベースリプレイでは目標時刻 "以後" には進めないという制約がある。これを単純な実装で守るべく切り上げを断念している)
                        if (targetTime <= nextTickTime) {
                            // 次ティック時刻まで進めると目標時刻を超えてしまう: 目標時刻直前まで動いて抜ける(目標時刻直前までは来ないと目標時刻到達通知が永久にできない)
                            this._omittedTickDuration += targetTime - this._currentTime;
                            this._currentTime = Math.floor(targetTime / this._frameTime) * this._frameTime;
                            break;
                        }
                        nextFrameTime = nextTickTime;
                        this._omittedTickDuration += nextTickTime - this._currentTime;
                    }
                    else {
                        if (this._sceneLocalMode === g.LocalTickMode.InterpolateLocal) {
                            this._doLocalTick();
                        }
                        continue;
                    }
                }
            }
            this._currentTime = nextFrameTime;
            var tick = this._tickBuffer.consume();
            var consumedAge = -1;
            var plEvents = this._eventBuffer.readLocalEvents();
            if (plEvents) {
                for (var j = 0, len = plEvents.length; j < len; ++j) {
                    game.events.push(this._eventConverter.toGameEvent(plEvents[j]));
                }
            }
            if (typeof tick === "number") {
                consumedAge = tick;
                sceneChanged = game.tick(true, Math.floor(this._omittedTickDuration / this._frameTime));
            }
            else {
                consumedAge = tick[0 /* Age */];
                var pevs = tick[1 /* Events */];
                if (pevs) {
                    for (var j = 0, len = pevs.length; j < len; ++j) {
                        game.events.push(this._eventConverter.toGameEvent(pevs[j]));
                    }
                }
                sceneChanged = game.tick(true, Math.floor(this._omittedTickDuration / this._frameTime));
            }
            this._omittedTickDuration = 0;
            if (game._notifyPassedAgeTable[consumedAge]) {
                // ↑ 無駄な関数コールを避けるため汚いが外部から事前チェック
                if (game.fireAgePassedIfNeeded()) {
                    // age到達通知したらドライバユーザが何かしている可能性があるので抜ける
                    frameArg.interrupt = true;
                    break;
                }
            }
            if (sceneChanged) {
                this._handleSceneChange();
                break; // シーンが変わったらローカルシーンに入っているかもしれないので一度抜ける
            }
        }
        if (this._skipping && (targetTime - this._currentTime < this._frameTime))
            this._stopSkipping();
    };
    /**
     * 非ローカルシーンの通常ケースのフレーム処理。
     * 時刻関数が与えられていない、またはリプレイでない場合に用いられる。
     */
    GameLoop.prototype._onFrameNormal = function (frameArg) {
        var sceneChanged = false;
        var game = this._game;
        // NOTE: ブラウザが長時間非アクティブ状態 (裏タブに遷移していたなど) であったとき、長時間ゲームループが呼ばれないケースがある。
        // もしその期間がスキップの閾値を超えていたら、即座にスキップに入る。
        if (!this._skipping && frameArg.deltaTime > this._skipThresholdTime) {
            this._startSkipping();
            // ただしティック待ちが無ければすぐにスキップを抜ける。
            if (this._waitingNextTick)
                this._stopSkipping();
        }
        if (this._waitingNextTick) {
            if (this._sceneLocalMode === g.LocalTickMode.InterpolateLocal)
                this._doLocalTick();
            return;
        }
        var targetAge;
        var ageGap;
        var currentAge = this._tickBuffer.currentAge;
        if (this._loopMode === LoopMode_1.default.Realtime) {
            targetAge = this._tickBuffer.knownLatestAge + 1;
            ageGap = targetAge - currentAge;
        }
        else {
            if (this._targetAge === null) {
                // targetAgeがない: ただリプレイして見ているだけの状態。1フレーム時間経過 == 1age消化。
                targetAge = null;
                ageGap = 1;
            }
            else if (this._targetAge === currentAge) {
                // targetAgeに到達した: targetAgeなし状態になる。
                targetAge = this._targetAge = null;
                ageGap = 1;
            }
            else {
                // targetAgeがあり、まだ到達していない。
                targetAge = this._targetAge;
                ageGap = targetAge - currentAge;
            }
        }
        if ((ageGap > this._jumpTryThreshold || ageGap < 0) &&
            (!this._waitingStartPoint) &&
            (this._lastRequestedStartPointAge < currentAge)) {
            // スナップショットを要求だけして続行する(スナップショットが来るまで進める限りは進む)。
            //
            // 上の条件が _lastRequestedStartPointAge を参照しているのは、スナップショットで飛んだ後もなお
            // `ageGap` が大きい場合に、延々スナップショットをリクエストし続けるのを避けるためである。
            // 実際にはageが進めば新たなスナップショットが保存されている可能性もあるので、
            // `targetAge` が変わればリクエストし続けるのが全くの無駄というわけではない。
            // が、`Realtime` で実行している場合 `targetAge` は毎フレーム変化してしまうし、
            // スナップショットがそれほど頻繁に保存されるとは思えない(すべきでもない)。ここでは割り切って抑制しておく。
            this._waitingStartPoint = true;
            this._lastRequestedStartPointAge = targetAge;
            this._amflow.getStartPoint({ frame: targetAge }, this._onGotStartPoint_bound);
        }
        if (ageGap <= 0) {
            if (ageGap === 0) {
                if (currentAge === 0) {
                    // NOTE: Manualのシーンでは age=1 のティックが長時間受信できない場合がある。(TickBuffer#addTick()が呼ばれない)
                    // そのケースでは最初のティックの受信にポーリング時間(初期値: 10秒)かかってしまうため、ここで最新ティックを要求する。
                    // (初期シーンがNonLocalであってもティックの進行によりManualのシーンに移行してしまう可能性があるため、常に最新のティックを要求している。)
                    this._tickBuffer.requestTicks();
                }
                // 既知最新ティックに追いついたので、ポーリング処理により後続ティックを要求する。
                // NOTE: Manualのシーンでは最新ティックの生成そのものが長時間起きない可能性がある。
                // (Manualでなくても、最新ティックの受信が長時間起きないことはありうる(長いローディングシーンなど))
                this._startWaitingNextTick();
            }
            if (this._sceneLocalMode === g.LocalTickMode.InterpolateLocal) {
                // ティック待ちの間、ローカルティックを(補間して)消費: 上の暫定対処のrequestTicks()より後に行うべきである点に注意。
                // ローカルティックを消費すると、ゲームスクリプトがraiseTick()する(_waitingNextTickが立つのはおかしい)可能性がある。
                this._doLocalTick();
            }
            if (this._skipping)
                this._stopSkipping();
            return;
        }
        if (!this._skipping && (ageGap > this._skipThreshold || currentAge === 0) && this._tickBuffer.hasNextTick()) {
            // ここでは常に (ageGap > 0) であることに注意。(0の時にskipに入ってもすぐ戻ってしまう)
            this._startSkipping();
        }
        var loopCount = (!this._skipping && ageGap <= this._delayIgnoreThreshold) ? 1 : Math.min(ageGap, this._skipTicksAtOnce);
        var consumedFrame = 0;
        for (; consumedFrame < loopCount; ++consumedFrame) {
            // ティック時刻確認
            var nextFrameTime = this._currentTime + this._frameTime;
            var nextTickTime = this._tickBuffer.readNextTickTime();
            if (nextTickTime != null && nextFrameTime < nextTickTime) {
                if (this._loopMode === LoopMode_1.default.Realtime || (this._omitInterpolatedTickOnReplay && this._skipping)) {
                    // リアルタイムモード(と早送り中のリプレイでティック補間しない場合)ではティック時刻を気にせず続行するが、
                    // リプレイモードに切り替えた時に矛盾しないよう時刻を補正する(当該ティック時刻まで待った扱いにする)。
                    nextFrameTime = Math.ceil(nextTickTime / this._frameTime) * this._frameTime;
                    this._omittedTickDuration += nextFrameTime - this._currentTime;
                }
                else {
                    if (this._sceneLocalMode === g.LocalTickMode.InterpolateLocal) {
                        this._doLocalTick();
                        continue;
                    }
                    break;
                }
            }
            this._currentTime = nextFrameTime;
            var tick = this._tickBuffer.consume();
            var consumedAge = -1;
            if (tick != null) {
                var plEvents = this._eventBuffer.readLocalEvents();
                if (plEvents) {
                    for (var i = 0, len = plEvents.length; i < len; ++i) {
                        game.events.push(this._eventConverter.toGameEvent(plEvents[i]));
                    }
                }
                if (typeof tick === "number") {
                    consumedAge = tick;
                    sceneChanged = game.tick(true, Math.floor(this._omittedTickDuration / this._frameTime));
                }
                else {
                    consumedAge = tick[0 /* Age */];
                    var pevs = tick[1 /* Events */];
                    if (pevs) {
                        for (var j = 0, len = pevs.length; j < len; ++j) {
                            game.events.push(this._eventConverter.toGameEvent(pevs[j]));
                        }
                    }
                    sceneChanged = game.tick(true, Math.floor(this._omittedTickDuration / this._frameTime));
                }
                this._omittedTickDuration = 0;
            }
            else {
                // 時間は経過しているが消費すべきティックが届いていない
                this._tickBuffer.requestTicks();
                this._startWaitingNextTick();
                break;
            }
            if (game._notifyPassedAgeTable[consumedAge]) {
                // ↑ 無駄な関数コールを避けるため汚いが外部から事前チェック
                if (game.fireAgePassedIfNeeded()) {
                    // age到達通知したらドライバユーザが何かしている可能性があるので抜ける
                    frameArg.interrupt = true;
                    break;
                }
            }
            if (sceneChanged) {
                this._handleSceneChange();
                break; // シーンが変わったらローカルシーンに入っているかもしれないので一度抜ける
            }
        }
        if (this._skipping && (targetAge - this._tickBuffer.currentAge < 1))
            this._stopSkipping();
    };
    GameLoop.prototype._onGotNextFrameTick = function () {
        this._consumedLatestTick = false;
        if (!this._waitingNextTick)
            return;
        if (this._loopMode === LoopMode_1.default.FrameByFrame) {
            // コマ送り実行時、Tickの受信は実行に影響しない。
            return;
        }
        this._stopWaitingNextTick();
    };
    GameLoop.prototype._onGotNoTick = function () {
        if (this._waitingNextTick)
            this._consumedLatestTick = true;
    };
    GameLoop.prototype._onGotStartPoint = function (err, startPoint) {
        this._waitingStartPoint = false;
        if (err) {
            this.errorTrigger.fire(err);
            return;
        }
        if (!this._targetTimeFunc || this._loopMode === LoopMode_1.default.Realtime) {
            var targetAge = (this._loopMode === LoopMode_1.default.Realtime) ? this._tickBuffer.knownLatestAge + 1 : this._targetAge;
            if (targetAge === null || targetAge < startPoint.frame) {
                // 要求した時点と今で目標age(targetAge)が変わっている。
                // 現在の状況では飛ぶ必要がないか、得られたStartPointでは目標ageより未来に飛んでしまう。
                return;
            }
            var currentAge = this._tickBuffer.currentAge;
            if (currentAge <= targetAge && startPoint.frame < currentAge + this._jumpIgnoreThreshold) {
                // 今の目標age(targetAge)は過去でない一方、得られたStartPointは至近未来または過去のもの → 飛ぶ価値なし。
                return;
            }
        }
        else {
            var targetTime = this._targetTimeFunc() + this._realTargetTimeOffset;
            if (targetTime < startPoint.timestamp) {
                // 要求した時点と今で目標時刻(targetTime)が変わっている。得られたStartPointでは目標時刻より未来に飛んでしまう。
                return;
            }
            var currentTime = this._currentTime;
            if (currentTime <= targetTime && startPoint.timestamp < currentTime + (this._jumpIgnoreThreshold * this._frameTime)) {
                // 今の目標時刻(targetTime)は過去でない一方、得られたStartPointは至近未来または過去のもの → 飛ぶ価値なし。
                return;
            }
        }
        // リセットから `g.Game#_start()` まで(エントリポイント実行まで)の間、processEvents() は起こらないようにする。
        // すなわちこれ以降 `_onGameStarted()` までの間 EventBuffer からイベントは取得できない。しかしそもそもこの状態では
        // イベントを処理するシーンがいない = 非ローカルティックは生成されない = 非ローカルティック生成時にのみ行われるイベントの取得もない。
        this._clock.frameTrigger.remove(this._onEventsProcessed, this);
        if (this._skipping)
            this._stopSkipping();
        this._tickBuffer.setCurrentAge(startPoint.frame);
        this._currentTime = startPoint.timestamp || startPoint.data.timestamp || 0; // data.timestamp は後方互換性のために存在。現在は使っていない。
        this._waitingNextTick = false; // 現在ageを変えた後、さらに後続のTickが足りないかどうかは_onFrameで判断する。
        this._consumedLatestTick = false; // 同上。
        this._lastRequestedStartPointAge = -1; // 現在ageを変えた時はリセットしておく(場合によっては不要だが、安全のため)。
        this._lastRequestedStartPointTime = -1; // 同上。
        this._omittedTickDuration = 0;
        this._game._restartWithSnapshot(startPoint);
        this._handleSceneChange();
    };
    GameLoop.prototype._onGameStarted = function () {
        // 必ず先頭に挿入することで、同じClockを参照する `TickGenerator` のティック生成などに毎フレーム先行してイベントフィルタを適用する。
        // 全体的に `this._clock` のhandle順は動作順に直結するので注意が必要。
        this._clock.frameTrigger.add({ index: 0, owner: this, func: this._onEventsProcessed });
    };
    GameLoop.prototype._onEventsProcessed = function () {
        this._eventBuffer.processEvents(this._sceneLocalMode === g.LocalTickMode.FullLocal);
    };
    GameLoop.prototype._setLoopRenderMode = function (mode) {
        if (mode === this._loopRenderMode)
            return;
        this._loopRenderMode = mode;
        switch (mode) {
            case LoopRenderMode_1.default.AfterRawFrame:
                this._clock.rawFrameTrigger.add(this._renderOnRawFrame, this);
                break;
            case LoopRenderMode_1.default.None:
                this._clock.rawFrameTrigger.remove(this._renderOnRawFrame, this);
                break;
            default:
                this.errorTrigger.fire(new Error("GameLoop#_setLoopRenderMode: unknown mode: " + mode));
                break;
        }
    };
    GameLoop.prototype._renderOnRawFrame = function () {
        var game = this._game;
        if (game.modified && game.scenes.length > 0) {
            game.render();
        }
    };
    GameLoop.prototype._onGameRaiseEvent = function (e) {
        var pev = this._eventConverter.toPlaylogEvent(e);
        this._eventBuffer.onEvent(pev);
    };
    GameLoop.prototype._onGameRaiseTick = function (es) {
        if (this._executionMode !== ExecutionMode_1.default.Active)
            return;
        // TODO: イベントフィルタの中で呼ばれるとおかしくなる(フィルタ中のイベントがtickに乗らない)。
        if (es) {
            for (var i = 0; i < es.length; ++i)
                this._eventBuffer.addEventDirect(this._eventConverter.toPlaylogEvent(es[i]));
        }
        this._tickController.forceGenerateTick();
    };
    GameLoop.prototype._onGameOperationPluginOperated = function (op) {
        var pev = this._eventConverter.makePlaylogOperationEvent(op);
        this._eventBuffer.onEvent(pev);
    };
    GameLoop.prototype._onPollingTick = function () {
        // この関数が呼ばれる時、 `this._waitingNextTick` は必ず真である。
        // TODO: rawFrameTriggerのfire時に前回呼び出し時からの経過時間を渡せばnew Dateする必要はなくなる。
        var time = Date.now();
        if (time - this._lastPollingTickTime > this._pollingTickThreshold) {
            this._lastPollingTickTime = time;
            this._tickBuffer.requestTicks();
        }
    };
    GameLoop.prototype._startWaitingNextTick = function () {
        this._waitingNextTick = true;
        // TODO: Active時はポーリングしない (要 Active/Passive 切り替えの対応)
        this._clock.rawFrameTrigger.add(this._onPollingTick, this);
        this._lastPollingTickTime = Date.now();
        if (this._skipping)
            this._stopSkipping();
    };
    GameLoop.prototype._stopWaitingNextTick = function () {
        this._waitingNextTick = false;
        this._clock.rawFrameTrigger.remove(this._onPollingTick, this);
    };
    return GameLoop;
}());
exports.GameLoop = GameLoop;

},{"./Clock":2,"./EventConverter":4,"./ExecutionMode":6,"./LoopMode":11,"./LoopRenderMode":12,"./ProfilerClock":15,"./TickController":18,"./constants":23,"@akashic/akashic-engine":"@akashic/akashic-engine"}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JoinResolver = exports.JoinLeaveRequest = void 0;
var g = require("@akashic/akashic-engine");
var JoinLeaveRequest = /** @class */ (function () {
    function JoinLeaveRequest(pev, joinResolver, amflow, keys) {
        this.joinResolver = joinResolver;
        this.pev = pev;
        if (pev[0 /* Code */] === 0 /* Join */ && keys) {
            this.resolved = false;
            amflow.getStorageData(keys, this._onGotStorageData.bind(this));
        }
        else {
            this.resolved = true;
        }
    }
    JoinLeaveRequest.prototype._onGotStorageData = function (err, sds) {
        this.resolved = true;
        if (err) {
            this.joinResolver.errorTrigger.fire(err);
            return;
        }
        this.pev[4 /* StorageData */] = sds;
    };
    return JoinLeaveRequest;
}());
exports.JoinLeaveRequest = JoinLeaveRequest;
var JoinResolver = /** @class */ (function () {
    function JoinResolver(param) {
        this.errorTrigger = new g.Trigger();
        if (param.errorHandler)
            this.errorTrigger.add(param.errorHandler, param.errorHandlerOwner);
        this._amflow = param.amflow;
        this._keysForJoin = null;
        this._requested = [];
    }
    JoinResolver.prototype.request = function (pev) {
        this._requested.push(new JoinLeaveRequest(pev, this, this._amflow, this._keysForJoin));
    };
    JoinResolver.prototype.readResolved = function () {
        var len = this._requested.length;
        if (len === 0 || !this._requested[0].resolved)
            return null;
        var ret = [];
        for (var i = 0; i < len; ++i) {
            var req = this._requested[i];
            if (!req.resolved)
                break;
            ret.push(req.pev);
        }
        this._requested.splice(0, i);
        return ret;
    };
    JoinResolver.prototype.setRequestValuesForJoin = function (keys) {
        this._keysForJoin = keys;
    };
    return JoinResolver;
}());
exports.JoinResolver = JoinResolver;

},{"@akashic/akashic-engine":"@akashic/akashic-engine"}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * `GameLoop` のループ制御のモード。
 * `GameLoop` は、この値に応じて `g.Game#tick()` の呼び出し方法を変える。
 */
var LoopMode;
(function (LoopMode) {
    /**
     * 最新フレームに最大限追いつくモード。
     *
     * Passiveである場合、自分の現在フレームが取得済みの最新フレームから大きく遅れているなら、
     * 早送りやスナップショットによるジャンプを行う。
     *
     * ローカルティック補間シーンにおいては、ティックの受信を待っている間ティック補間を行う。すなわち:
     *  * 次ティックがある場合: ローカルティックを生成せず、ただちに次ティックを消化する(補間しない)
     *  * 次ティックがない場合: ローカルティックを生成して消化する(補間する)
     */
    LoopMode[LoopMode["Realtime"] = 0] = "Realtime";
    /**
     * 追いつこうとするフレームを自分で制御するモード。
     *
     * `Realtime` と同様早送りやスナップショットによるジャンプを行うが、
     * その基準フレームとして `LoopConfiguration#targetAge` (を保持する `GameLoop#_targetAge`) を使う。
     * 早送りやスナップショットによるジャンプを行う。
     *
     * ローカルティック補間シーンにおいては、ティックのタイムスタンプ情報にできるだけ忠実にティック補間を行う。すなわち:
     *  * 次ティックがある場合: 現在時刻が次ティックのタイムスタンプか目標時刻に至るまで、ローカルティックを生成して消化する(補間する)。
     *  * 次ティックがない場合: 何もしない(補間しない)。
     * ただし LoopConfiguration#omitInterpolatedTickOnReplay が真の場合は、次の規則が追加で適用される。
     *  * 次ティックがある場合、スキップ中ならば: ローカルティックを生成せず、ただちに次ティックを消化する(補間しない; Realtimeと同じになる)
     *  * 次ティックがない場合、目標時刻に到達していなければ: ローカルティックを生成して消化する(補間する; Realtimeと同じになる)
     */
    LoopMode[LoopMode["Replay"] = 1] = "Replay";
    /**
     * 正しく使っていない。削除する予定。
     *
     * コマ送りモード。
     * `GameLoop#step()` 呼び出し時に1フレーム進む。それ以外の方法では進まない。
     * 早送りやスナップショットによるジャンプは行わない。
     */
    LoopMode[LoopMode["FrameByFrame"] = 2] = "FrameByFrame";
})(LoopMode || (LoopMode = {}));
exports.default = LoopMode;

},{}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * `GameLoop` が描画を行う基準。
 */
var LoopRenderMode;
(function (LoopRenderMode) {
    /**
     * 毎raw frame後に描画する。
     * raw frameの詳細についてはClock.tsのコメントを参照。
     */
    LoopRenderMode[LoopRenderMode["AfterRawFrame"] = 0] = "AfterRawFrame";
    /**
     * 描画をまったく行わない。
     */
    LoopRenderMode[LoopRenderMode["None"] = 1] = "None";
})(LoopRenderMode || (LoopRenderMode = {}));
exports.default = LoopRenderMode;

},{}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdiUtil = void 0;
var es6_promise_1 = require("es6-promise");
var g = require("@akashic/akashic-engine");
var PdiUtil;
(function (PdiUtil) {
    /**
     * 与えられた `Platform` の `loadGameConfiguration()` をラップした、`GameConfiguration` 読み込み関数を作成して返す。
     *
     * 戻り値の関数は、次の点で `Platform#loadGameConfiguration()` と異なる。
     * * "definitions" フィールドを解決する (再帰的に読み込みを行い、_mergeGameConfiguration() でカスケード解決する)
     * * "assetBase" を使って `GameConfiguration` 内のアセットのパスを絶対パスに変換する
     * * "configurationBase" を使って "definitions" フィールド内のパスを絶対パスに変換する
     *
     * @param pf ラップする `loadGameConfiguration()` を持つ `Platform`
     */
    function makeLoadConfigurationFunc(pf) {
        function loadResolvedConfiguration(url, assetBase, configurationBase, callback) {
            pf.loadGameConfiguration(url, function (err, conf) {
                if (err) {
                    callback(err, null);
                    return;
                }
                try {
                    conf = PdiUtil._resolveConfigurationBasePath(conf, ((assetBase != null) ? assetBase : g.PathUtil.resolveDirname(url)));
                }
                catch (e) {
                    callback(e, null);
                    return;
                }
                if (!conf.definitions) {
                    callback(null, conf);
                    return;
                }
                var defs = conf.definitions.map(function (def) {
                    if (typeof def === "string") {
                        var resolvedUrl = configurationBase != null ? g.PathUtil.resolvePath(configurationBase, def) : def;
                        return promisifiedLoad(resolvedUrl, undefined, configurationBase);
                    }
                    else {
                        var resolvedUrl = configurationBase != null ? g.PathUtil.resolvePath(configurationBase, def.url) : def.url;
                        return promisifiedLoad(resolvedUrl, def.basePath, configurationBase);
                    }
                });
                es6_promise_1.Promise.all(defs)
                    .then(function (confs) { return callback(null, confs.reduce(PdiUtil._mergeGameConfiguration)); })
                    .catch(function (e) { return callback(e, null); });
            });
        }
        function promisifiedLoad(url, assetBase, configurationBase) {
            return new es6_promise_1.Promise(function (resolve, reject) {
                loadResolvedConfiguration(url, assetBase, configurationBase, function (err, conf) {
                    err ? reject(err) : resolve(conf);
                });
            });
        }
        return loadResolvedConfiguration;
    }
    PdiUtil.makeLoadConfigurationFunc = makeLoadConfigurationFunc;
    /**
     * 与えられた `GameConfiguration` のパス(相対パスになっている)を絶対パスに変える。
     * @param configuration 対象の `GameConfiguration`
     * @param assetBase アセットの相対パスの基準となるパス
     */
    function _resolveConfigurationBasePath(configuration, assetBase) {
        function resolvePath(base, path) {
            var ret = g.PathUtil.resolvePath(base, path);
            if (ret.indexOf(base) !== 0)
                throw g.ExceptionFactory.createAssertionError("PdiUtil._resolveConfigurationBasePath: invalid path: " + path);
            return ret;
        }
        var assets = configuration.assets;
        if (assets instanceof Object) {
            for (var p in assets) {
                if (!assets.hasOwnProperty(p))
                    continue;
                if ("path" in assets[p]) {
                    assets[p].virtualPath = assets[p].virtualPath || assets[p].path;
                    assets[p].path = resolvePath(assetBase, assets[p].path);
                }
            }
        }
        if (configuration.globalScripts) {
            configuration.globalScripts.forEach(function (path) {
                if (assets.hasOwnProperty(path))
                    throw g.ExceptionFactory.createAssertionError("PdiUtil._resolveConfigurationBasePath: asset ID already exists: " + path);
                assets[path] = {
                    type: /\.json$/i.test(path) ? "text" : "script",
                    virtualPath: path,
                    path: resolvePath(assetBase, path),
                    global: true
                };
            });
            delete configuration.globalScripts;
        }
        return configuration;
    }
    PdiUtil._resolveConfigurationBasePath = _resolveConfigurationBasePath;
    /**
     * 与えられたオブジェクト二つを「マージ」する。
     * ここでマージとは、オブジェクトのフィールドをイテレートし、
     * プリミティブ値であれば上書き、配列であればconcat、オブジェクトであれば再帰的にマージする処理である。
     *
     * @param target マージされるオブジェクト。この値は破壊される
     * @param source マージするオブジェクト
     */
    function _mergeObject(target, source) {
        var ks = Object.keys(source);
        for (var i = 0, len = ks.length; i < len; ++i) {
            var k = ks[i];
            var sourceVal = source[k];
            var sourceValType = typeof sourceVal;
            var targetValType = typeof target[k];
            if (sourceValType !== targetValType) {
                target[k] = sourceVal;
                continue;
            }
            switch (typeof sourceVal) {
                case "string":
                case "number":
                case "boolean":
                    target[k] = sourceVal;
                    break;
                case "object":
                    if (sourceVal == null) {
                        target[k] = sourceVal;
                    }
                    else if (Array.isArray(sourceVal)) {
                        target[k] = target[k].concat(sourceVal);
                    }
                    else {
                        PdiUtil._mergeObject(target[k], sourceVal);
                    }
                    break;
                default:
                    throw new Error("PdiUtil._mergeObject(): unknown type");
            }
        }
        return target;
    }
    PdiUtil._mergeObject = _mergeObject;
    function _mergeGameConfiguration(target, source) {
        return PdiUtil._mergeObject(target, source);
    }
    PdiUtil._mergeGameConfiguration = _mergeGameConfiguration;
})(PdiUtil = exports.PdiUtil || (exports.PdiUtil = {}));

},{"@akashic/akashic-engine":"@akashic/akashic-engine","es6-promise":24}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointEventResolver = void 0;
/**
 * pdi.PointEventからg.Eventへの変換機構。
 *
 * ほぼ座標しか持たないpdi.PointEventに対して、g.Point(Down|Move|Up)Eventはその座標にあるエンティティや、
 * (g.Point(Move|Up)Eventの場合)g.PointDownEventからの座標の差分を持っている。
 * それらの足りない情報を管理・追加して、pdi.PointEventをg.Eventに変換するクラス。
 * PDI実装はpointDown()なしでpointMove()を呼び出してくることも考えられるため、
 * Down -> Move -> Up の流れを保証する機能も持つ。
 */
var PointEventResolver = /** @class */ (function () {
    function PointEventResolver(param) {
        this._game = param.game;
        this._pointEventMap = {};
    }
    PointEventResolver.prototype.pointDown = function (e) {
        var player = this._game.player;
        var source = this._game.findPointSource(e.offset);
        var point = source.point ? source.point : e.offset;
        var targetId = source.target ? source.target.id : null;
        this._pointEventMap[e.identifier] = {
            targetId: targetId,
            local: source.local,
            point: point,
            start: { x: e.offset.x, y: e.offset.y },
            prev: { x: e.offset.x, y: e.offset.y }
        };
        // NOTE: 優先度は機械的にJoinedをつけておく。Joinしていない限りPointDownEventなどはリジェクトされる。
        var ret = [
            33 /* PointDown */,
            2 /* Joined */,
            player.id,
            e.identifier,
            point.x,
            point.y,
            targetId // 6?: エンティティID
        ];
        if (source.local)
            ret.push(source.local); // 7?: ローカル
        return ret;
    };
    PointEventResolver.prototype.pointMove = function (e) {
        var player = this._game.player;
        var holder = this._pointEventMap[e.identifier];
        if (!holder)
            return null;
        var prev = { x: 0, y: 0 };
        var start = { x: 0, y: 0 };
        this._pointMoveAndUp(holder, e.offset, prev, start);
        var ret = [
            34 /* PointMove */,
            2 /* Joined */,
            player.id,
            e.identifier,
            holder.point.x,
            holder.point.y,
            start.x,
            start.y,
            prev.x,
            prev.y,
            holder.targetId // 10?: エンティティID
        ];
        if (holder.local)
            ret.push(holder.local); // 11?: ローカル
        return ret;
    };
    PointEventResolver.prototype.pointUp = function (e) {
        var player = this._game.player;
        var holder = this._pointEventMap[e.identifier];
        if (!holder)
            return null;
        var prev = { x: 0, y: 0 };
        var start = { x: 0, y: 0 };
        this._pointMoveAndUp(holder, e.offset, prev, start);
        delete this._pointEventMap[e.identifier];
        var ret = [
            35 /* PointUp */,
            2 /* Joined */,
            player.id,
            e.identifier,
            holder.point.x,
            holder.point.y,
            start.x,
            start.y,
            prev.x,
            prev.y,
            holder.targetId // 10?: エンティティID
        ];
        if (holder.local)
            ret.push(holder.local); // 11?: ローカル
        return ret;
    };
    PointEventResolver.prototype._pointMoveAndUp = function (holder, offset, prevDelta, startDelta) {
        startDelta.x = offset.x - holder.start.x;
        startDelta.y = offset.y - holder.start.y;
        prevDelta.x = offset.x - holder.prev.x;
        prevDelta.y = offset.y - holder.prev.y;
        holder.prev.x = offset.x;
        holder.prev.y = offset.y;
    };
    return PointEventResolver;
}());
exports.PointEventResolver = PointEventResolver;

},{}],15:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfilerClock = void 0;
var Clock_1 = require("./Clock");
/**
 * プロファイラーを有するクロック。
 *
 * note: _onLooperCall()のみをオーバーライドし、 `this._profiler.~~` を追加しただけとなっています。
 */
var ProfilerClock = /** @class */ (function (_super) {
    __extends(ProfilerClock, _super);
    function ProfilerClock(param) {
        var _this = _super.call(this, param) || this;
        _this._profiler = param.profiler;
        return _this;
    }
    ProfilerClock.prototype._onLooperCall = function (deltaTime) {
        var rawDeltaTime = deltaTime;
        if (deltaTime <= 0) {
            // 時間が止まっているか巻き戻っている。初回呼び出しか、あるいは何かがおかしい。時間経過0と見なす。
            return this._waitTime - this._totalDeltaTime;
        }
        if (deltaTime > this._deltaTimeBrokenThreshold) {
            // 間隔が長すぎる。何かがおかしい。時間経過を1フレーム分とみなす。
            deltaTime = this._waitTime;
        }
        var totalDeltaTime = this._totalDeltaTime;
        totalDeltaTime += deltaTime;
        if (totalDeltaTime <= this._skipFrameWaitTime) {
            // 1フレーム分消化するほどの時間が経っていない。
            this._totalDeltaTime = totalDeltaTime;
            return this._waitTime - totalDeltaTime;
        }
        this._profiler.timeEnd(1 /* RawFrameInterval */);
        this._profiler.time(1 /* RawFrameInterval */);
        var frameCount = (totalDeltaTime < this._waitTimeDoubled) ? 1
            : (totalDeltaTime > this._waitTimeMax) ? this._realMaxFramePerOnce
                : (totalDeltaTime / this._waitTime) | 0;
        var fc = frameCount;
        var arg = {
            deltaTime: rawDeltaTime,
            interrupt: false
        };
        this._profiler.setValue(0 /* SkippedFrameCount */, fc - 1);
        while (fc > 0 && this.running && !arg.interrupt) {
            --fc;
            this._profiler.time(2 /* FrameTime */);
            this.frameTrigger.fire(arg);
            this._profiler.timeEnd(2 /* FrameTime */);
            arg.deltaTime = 0; // 同ループによる2度目以降の呼び出しは差分を0とみなす。
        }
        totalDeltaTime -= ((frameCount - fc) * this._waitTime);
        this._profiler.time(3 /* RenderingTime */);
        this.rawFrameTrigger.fire();
        this._profiler.timeEnd(3 /* RenderingTime */);
        this._totalDeltaTime = totalDeltaTime;
        this._profiler.flush();
        return this._waitTime - totalDeltaTime;
    };
    return ProfilerClock;
}(Clock_1.Clock));
exports.ProfilerClock = ProfilerClock;

},{"./Clock":2}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageResolver = void 0;
var g = require("@akashic/akashic-engine");
var ExecutionMode_1 = require("./ExecutionMode");
/**
 * ストレージの読み書きを担うクラス。
 * Gameのストレージアクセスはすべてこのクラスが一次受けする(一次受けする関数を提供する)。
 *
 * ただし読み込みに関しては、実際にはこのクラスでは行わない。
 * Activeモードの場合、ストレージから読み込んだデータはTickに乗せる必要がある。
 * このクラスはTickGeneratorにリクエストを通知し、読み込みはTickGeneratorが解決する。
 * Passiveモードやスナップショットからの復元の場合、ストレージのデータは `TickBuffer` で受信したTickから得られる。
 * このクラスは、読み込みリクエストを得られたストレージデータと付き合わせて完了を通知する役割を持つ。
 */
var StorageResolver = /** @class */ (function () {
    function StorageResolver(param) {
        this.errorTrigger = new g.Trigger();
        if (param.errorHandler)
            this.errorTrigger.add(param.errorHandler, param.errorHandlerOwner);
        this.getStorageFunc = this._getStorage.bind(this);
        this.putStorageFunc = this._putStorage.bind(this);
        this.requestValuesForJoinFunc = this._requestValuesForJoin.bind(this);
        this._game = param.game;
        this._amflow = param.amflow;
        this._tickGenerator = param.tickGenerator;
        this._tickBuffer = param.tickBuffer;
        this._executionMode = null; // 後続のsetExecutionMode()で設定する。
        this.setExecutionMode(param.executionMode);
        this._unresolvedLoaders = {};
        this._unresolvedStorages = {};
        this._onStoragePut_bound = this._onStoragePut.bind(this);
    }
    /**
     * ExecutionModeを変更する。
     */
    StorageResolver.prototype.setExecutionMode = function (executionMode) {
        if (this._executionMode === executionMode)
            return;
        this._executionMode = executionMode;
        var tickBuf = this._tickBuffer;
        var tickGen = this._tickGenerator;
        if (executionMode === ExecutionMode_1.default.Active) {
            tickBuf.gotStorageTrigger.remove(this._onGotStorageOnTick, this);
            tickGen.gotStorageTrigger.add(this._onGotStorageOnTick, this);
        }
        else {
            tickGen.gotStorageTrigger.remove(this._onGotStorageOnTick, this);
            tickBuf.gotStorageTrigger.add(this._onGotStorageOnTick, this);
        }
    };
    StorageResolver.prototype._onGotStorageOnTick = function (storageOnTick) {
        var resolvingAge = storageOnTick.age;
        var storageData = storageOnTick.storageData;
        var loader = this._unresolvedLoaders[resolvingAge];
        if (!loader) {
            this._unresolvedStorages[resolvingAge] = storageData;
            return;
        }
        delete this._unresolvedLoaders[resolvingAge];
        var serialization = resolvingAge;
        var values = storageData.map(function (d) { return d.values; });
        loader._onLoaded(values, serialization);
    };
    StorageResolver.prototype._getStorage = function (keys, loader, ser) {
        var resolvingAge;
        if (ser != null) {
            // akashic-engineにとって `ser' の型は単にanyである。実態は実装(game-driver)に委ねられている。
            // game-driverはシリアリゼーションとして「ストレージが含められていたTickのage」を採用する。
            resolvingAge = ser;
            this._tickBuffer.requestTicks(resolvingAge, 1); // request しておけば後は _onGotStorageOnTick() に渡ってくる
        }
        else {
            if (this._executionMode === ExecutionMode_1.default.Active) {
                resolvingAge = this._tickGenerator.requestStorageTick(keys);
            }
            else {
                resolvingAge = this._game.age; // TODO: gameを参照せずともageがとれるようにすべき。
                this._tickBuffer.requestTicks(resolvingAge, 1); // request しておけば後は _onGotStorageOnTick() に渡ってくる
            }
        }
        var sd = this._unresolvedStorages[resolvingAge];
        if (!sd) {
            this._unresolvedLoaders[resolvingAge] = loader;
            return;
        }
        delete this._unresolvedStorages[resolvingAge];
        var serialization = resolvingAge;
        var values = sd.map(function (d) { return d.values; });
        loader._onLoaded(values, serialization);
    };
    StorageResolver.prototype._putStorage = function (key, value, option) {
        if (this._executionMode === ExecutionMode_1.default.Active) {
            this._amflow.putStorageData(key, value, option, this._onStoragePut_bound);
        }
    };
    StorageResolver.prototype._requestValuesForJoin = function (keys) {
        this._tickGenerator.setRequestValuesForJoin(keys);
    };
    StorageResolver.prototype._onStoragePut = function (err) {
        if (err)
            this.errorTrigger.fire(err);
    };
    return StorageResolver;
}());
exports.StorageResolver = StorageResolver;

},{"./ExecutionMode":6,"@akashic/akashic-engine":"@akashic/akashic-engine"}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TickBuffer = void 0;
var g = require("@akashic/akashic-engine");
var ExecutionMode_1 = require("./ExecutionMode");
/**
 * AMFlowから流れ込むTickを蓄積するバッファ。
 *
 * 主に以下を行う。
 * * 受信済みのTickの管理
 * * 現在age・既知の最新age・直近の欠けているTickの管理
 * * 足りなそうなTickの先行リクエスト
 * * 処理済みTickの破棄
 */
var TickBuffer = /** @class */ (function () {
    function TickBuffer(param) {
        this.currentAge = 0;
        this.knownLatestAge = -1;
        this.gotNextTickTrigger = new g.Trigger();
        this.gotNoTickTrigger = new g.Trigger();
        this.gotStorageTrigger = new g.Trigger();
        this._amflow = param.amflow;
        this._prefetchThreshold = param.prefetchThreshold || TickBuffer.DEFAULT_PREFETCH_THRESHOLD;
        this._sizeRequestOnce = param.sizeRequestOnce || TickBuffer.DEFAULT_SIZE_REQUEST_ONCE;
        this._executionMode = param.executionMode;
        this._startedAt = param.startedAt || 0;
        this._oldTimestampThreshold = (param.startedAt != null) ? (param.startedAt - (86400 * 1000 * 10)) : 0; // 数字は適当な値(10日分)。
        this._receiving = false;
        this._tickRanges = [];
        this._nearestAbsentAge = this.currentAge;
        this._nextTickTimeCache = null;
        this._addTick_bound = this.addTick.bind(this);
        this._onTicks_bound = this._onTicks.bind(this);
    }
    TickBuffer.prototype.start = function () {
        this._receiving = true;
        this._updateAmflowReceiveState();
    };
    TickBuffer.prototype.stop = function () {
        this._receiving = false;
        this._updateAmflowReceiveState();
    };
    TickBuffer.prototype.setExecutionMode = function (execMode) {
        // TODO: getTickList()中にauthenticate()しなおした場合の挙動確認
        if (this._executionMode === execMode)
            return;
        this._dropUntil(this.knownLatestAge + 1); // 既存データは捨てる(特にPassive->Activeで既存Tickを上書きする必要がありうる)
        this.knownLatestAge = this.currentAge;
        this._nextTickTimeCache = null;
        this._nearestAbsentAge = this.currentAge;
        this._executionMode = execMode;
        this._updateAmflowReceiveState();
    };
    TickBuffer.prototype.setCurrentAge = function (age) {
        this._dropUntil(age);
        this._nextTickTimeCache = null;
        this.currentAge = age;
        this._nearestAbsentAge = this._findNearestAbscentAge(age);
    };
    TickBuffer.prototype.hasNextTick = function () {
        return this.currentAge !== this._nearestAbsentAge;
    };
    TickBuffer.prototype.consume = function () {
        if (this.currentAge === this._nearestAbsentAge)
            return null;
        var age = this.currentAge;
        var range = this._tickRanges[0];
        if (age === range.start) {
            this._nextTickTimeCache = null;
            ++this.currentAge;
            ++range.start;
            if (age + this._prefetchThreshold === this._nearestAbsentAge) {
                this.requestTicks(this._nearestAbsentAge, this._sizeRequestOnce);
            }
            if (range.start === range.end)
                this._tickRanges.shift();
            return (range.ticks.length > 0 && range.ticks[0][0 /* Age */] === age) ? range.ticks.shift() : age;
        }
        // range.start < age。外部から前に追加された場合。破棄してリトライする。
        this._dropUntil(this.currentAge);
        return this.consume();
    };
    TickBuffer.prototype.readNextTickTime = function () {
        if (this._nextTickTimeCache != null)
            return this._nextTickTimeCache;
        if (this.currentAge === this._nearestAbsentAge)
            return null;
        var age = this.currentAge;
        var range = this._tickRanges[0];
        if (age === range.start) {
            if (range.ticks.length === 0)
                return null;
            var tick = range.ticks[0];
            if (tick[0 /* Age */] !== age)
                return null;
            var pevs = tick[1 /* Events */];
            if (!pevs)
                return null;
            for (var i = 0; i < pevs.length; ++i) {
                if (pevs[i][0 /* Code */] === 2 /* Timestamp */) {
                    var nextTickTime = pevs[i][3 /* Timestamp */];
                    // 暫定処理: 旧仕様(相対時刻)用ワークアラウンド。小さすぎる時刻は相対とみなす
                    if (nextTickTime < this._oldTimestampThreshold)
                        nextTickTime += this._startedAt;
                    this._nextTickTimeCache = nextTickTime;
                    return nextTickTime;
                }
            }
            return null;
        }
        // range.start < age。外部から前に追加された場合。破棄してリトライする。
        this._dropUntil(this.currentAge);
        return this.readNextTickTime();
    };
    TickBuffer.prototype.requestTicks = function (from, len) {
        if (from === void 0) { from = this.currentAge; }
        if (len === void 0) { len = this._sizeRequestOnce; }
        if (this._executionMode !== ExecutionMode_1.default.Passive)
            return;
        this._amflow.getTickList(from, from + len, this._onTicks_bound);
    };
    TickBuffer.prototype.addTick = function (tick) {
        var age = tick[0 /* Age */];
        var gotNext = (this.currentAge === age) && (this._nearestAbsentAge === age);
        if (this.knownLatestAge < age) {
            this.knownLatestAge = age;
        }
        if (tick[2 /* StorageData */]) {
            this.gotStorageTrigger.fire({ age: tick[0 /* Age */], storageData: tick[2 /* StorageData */] });
        }
        var i = this._tickRanges.length - 1;
        for (; i >= 0; --i) {
            var range = this._tickRanges[i];
            if (age >= range.start)
                break;
        }
        var nextRange = this._tickRanges[i + 1];
        if (i < 0) {
            // 既知のどの tick よりも過去、または単に既知の tick がない。
            // NOTE: _tickRanges[0]を過去方向に拡張できるかもしれないが、
            //       addTickはほぼ最新フレームしか受信しないので気にせず新たにTickRangeを作る。
            this._tickRanges.unshift(this._createTickRangeFromTick(tick));
        }
        else {
            var range = this._tickRanges[i];
            if (age === range.end) {
                // 直近の TickRange のすぐ後に続く tick だった。
                ++range.end;
                if (tick[1 /* Events */]) {
                    range.ticks.push(tick);
                }
            }
            else if (age > range.end) {
                // 既存 TickList に続かない tick だった。新規に TickList を作って挿入
                this._tickRanges.splice(i + 1, 0, this._createTickRangeFromTick(tick));
            }
            else {
                // (start <= age < end) 既存 tick と重複している。何もしない。
            }
        }
        if (this._nearestAbsentAge === age) {
            ++this._nearestAbsentAge;
            if (nextRange && this._nearestAbsentAge === nextRange.start) {
                // 直近の欠けているageを追加したら前後のrangeが繋がってしまった。諦めて_nearestAbsentAgeを求め直す。
                this._nearestAbsentAge = this._findNearestAbscentAge(this._nearestAbsentAge);
            }
        }
        if (gotNext)
            this.gotNextTickTrigger.fire();
    };
    TickBuffer.prototype.addTickList = function (tickList) {
        var start = tickList[0 /* From */];
        var end = tickList[1 /* To */] + 1;
        var ticks = tickList[2 /* TicksWithEvents */];
        var origStart = start;
        var origEnd = end;
        if (this.knownLatestAge < end - 1) {
            this.knownLatestAge = end - 1;
        }
        // 今回挿入分の開始ageよりも「後」に開始される最初のrangeを探す
        var i = 0;
        var len = this._tickRanges.length;
        for (i = 0; i < len; ++i) {
            var range = this._tickRanges[i];
            if (start < range.start)
                break;
        }
        var insertPoint = i;
        // 左側が重複しうるrangeを探して重複を除く
        if (i > 0) {
            // 左側が重複しうるrangeは、今回挿入分の開始ageの直前に始まるもの
            --i;
            var leftEndAge = this._tickRanges[i].end;
            if (start < leftEndAge)
                start = leftEndAge;
        }
        // 右側で重複しうるrangeを探して重複を除く
        for (; i < len; ++i) {
            var range = this._tickRanges[i];
            if (end <= range.end)
                break;
        }
        if (i < len) {
            var rightStartAge = this._tickRanges[i].start;
            if (end > rightStartAge)
                end = rightStartAge;
        }
        if (start >= end) {
            // 今回挿入分はすべて重複だった。何もせずreturn
            return { start: start, end: start, ticks: [] };
        }
        if (!ticks)
            ticks = [];
        if (origStart !== start || origEnd !== end) {
            ticks = ticks.filter(function (tick) {
                var age = tick[0 /* Age */];
                return start <= age && age < end;
            });
        }
        for (var j = 0; j < ticks.length; ++j) {
            var tick = ticks[j];
            if (tick[2 /* StorageData */])
                this.gotStorageTrigger.fire({ age: tick[0 /* Age */], storageData: tick[2 /* StorageData */] });
        }
        var tickRange = { start: start, end: end, ticks: ticks };
        var delLen = Math.max(0, i - insertPoint);
        this._tickRanges.splice(insertPoint, delLen, tickRange);
        if (start <= this._nearestAbsentAge && this._nearestAbsentAge < end) {
            this._nearestAbsentAge = this._findNearestAbscentAge(this._nearestAbsentAge);
        }
        return tickRange;
    };
    TickBuffer.prototype._updateAmflowReceiveState = function () {
        if (this._receiving && this._executionMode === ExecutionMode_1.default.Passive) {
            this._amflow.onTick(this._addTick_bound);
        }
        else {
            this._amflow.offTick(this._addTick_bound);
        }
    };
    TickBuffer.prototype._onTicks = function (err, ticks) {
        if (err)
            throw new Error();
        if (!ticks) {
            this.gotNoTickTrigger.fire();
            return;
        }
        var mayGotNext = (this.currentAge === this._nearestAbsentAge);
        var inserted = this.addTickList(ticks);
        if (mayGotNext && (inserted.start <= this.currentAge && this.currentAge < inserted.end)) {
            this.gotNextTickTrigger.fire();
        }
        if (!inserted.ticks.length) {
            this.gotNoTickTrigger.fire();
        }
    };
    TickBuffer.prototype._findNearestAbscentAge = function (age) {
        var i = 0, len = this._tickRanges.length;
        for (; i < len; ++i) {
            if (age <= this._tickRanges[i].end)
                break;
        }
        for (; i < len; ++i) {
            var range = this._tickRanges[i];
            if (age < range.start)
                break;
            age = range.end;
        }
        return age;
    };
    TickBuffer.prototype._dropUntil = function (age) {
        // [start,end) が全部 age 以前のものを削除
        var i;
        for (i = 0; i < this._tickRanges.length; ++i) {
            if (age < this._tickRanges[i].end)
                break;
        }
        this._tickRanges = this._tickRanges.slice(i);
        if (this._tickRanges.length === 0)
            return;
        // start を書き換えることで、[start, age) の範囲を削除
        var range = this._tickRanges[0];
        if (age < range.start)
            return;
        range.start = age;
        for (i = 0; i < range.ticks.length; ++i) {
            if (age <= range.ticks[i][0 /* Age */])
                break;
        }
        range.ticks = range.ticks.slice(i);
    };
    TickBuffer.prototype._createTickRangeFromTick = function (tick) {
        var age = tick[0 /* Age */];
        var range = {
            start: age,
            end: age + 1,
            ticks: []
        };
        if (tick[1 /* Events */]) {
            range.ticks.push(tick);
        }
        return range;
    };
    TickBuffer.DEFAULT_PREFETCH_THRESHOLD = 30 * 60; // 数字は適当に30FPSで1分間分。30FPS * 60秒。
    TickBuffer.DEFAULT_SIZE_REQUEST_ONCE = 30 * 60 * 5; // 数字は適当に30FPSで5分間分。
    return TickBuffer;
}());
exports.TickBuffer = TickBuffer;

},{"./ExecutionMode":6,"@akashic/akashic-engine":"@akashic/akashic-engine"}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TickController = void 0;
var g = require("@akashic/akashic-engine");
var ExecutionMode_1 = require("./ExecutionMode");
var TickBuffer_1 = require("./TickBuffer");
var TickGenerator_1 = require("./TickGenerator");
var sr = require("./StorageResolver");
/**
 * `GameLoop` に流れるTickを管理するクラス。
 *
 * `GameLoop` に対して `TickGenerator` と `AMFlow` を隠蔽し、
 * Active/Passiveに(ほぼ)関係なくTickを扱えるようにする。
 */
var TickController = /** @class */ (function () {
    function TickController(param) {
        this.errorTrigger = new g.Trigger();
        if (param.errorHandler)
            this.errorTrigger.add(param.errorHandler, param.errorHandlerOwner);
        this._amflow = param.amflow;
        this._clock = param.clock;
        this._started = false;
        this._executionMode = param.executionMode;
        this._generator = new TickGenerator_1.TickGenerator({
            amflow: param.amflow,
            eventBuffer: param.eventBuffer,
            errorHandler: this.errorTrigger.fire,
            errorHandlerOwner: this.errorTrigger
        });
        this._buffer = new TickBuffer_1.TickBuffer({
            amflow: param.amflow,
            executionMode: param.executionMode,
            startedAt: param.startedAt
        });
        this._storageResolver = new sr.StorageResolver({
            game: param.game,
            amflow: param.amflow,
            tickGenerator: this._generator,
            tickBuffer: this._buffer,
            executionMode: param.executionMode,
            errorHandler: this.errorTrigger.fire,
            errorHandlerOwner: this.errorTrigger
        });
        this._generator.tickTrigger.add(this._onTickGenerated, this);
        this._clock.frameTrigger.add(this._generator.next, this._generator);
    }
    TickController.prototype.startTick = function () {
        this._started = true;
        this._updateGeneratorState();
    };
    TickController.prototype.stopTick = function () {
        this._started = false;
        this._updateGeneratorState();
    };
    TickController.prototype.startTickOnce = function () {
        this._started = true;
        this._generator.tickTrigger.addOnce(this._stopTriggerOnTick, this);
        this._updateGeneratorState();
    };
    TickController.prototype.setNextAge = function (age) {
        this._generator.setNextAge(age);
    };
    TickController.prototype.forceGenerateTick = function () {
        this._generator.forceNext();
    };
    TickController.prototype.getBuffer = function () {
        return this._buffer;
    };
    TickController.prototype.storageFunc = function () {
        return {
            storageGetFunc: this._storageResolver.getStorageFunc,
            storagePutFunc: this._storageResolver.putStorageFunc,
            requestValuesForJoinFunc: this._storageResolver.requestValuesForJoinFunc
        };
    };
    TickController.prototype.setExecutionMode = function (execMode) {
        if (this._executionMode === execMode)
            return;
        this._executionMode = execMode;
        this._updateGeneratorState();
        this._buffer.setExecutionMode(execMode);
        this._storageResolver.setExecutionMode(execMode);
    };
    TickController.prototype._stopTriggerOnTick = function () {
        this.stopTick();
    };
    TickController.prototype._updateGeneratorState = function () {
        var toGenerate = (this._started && this._executionMode === ExecutionMode_1.default.Active);
        this._generator.startStopGenerate(toGenerate);
    };
    TickController.prototype._onTickGenerated = function (tick) {
        this._amflow.sendTick(tick);
        this._buffer.addTick(tick);
    };
    return TickController;
}());
exports.TickController = TickController;

},{"./ExecutionMode":6,"./StorageResolver":16,"./TickBuffer":17,"./TickGenerator":19,"@akashic/akashic-engine":"@akashic/akashic-engine"}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TickGenerator = void 0;
var g = require("@akashic/akashic-engine");
var JoinResolver_1 = require("./JoinResolver");
/**
 * `playlog.Tick` の生成器。
 * `next()` が呼ばれる度に、EventBuffer に蓄積されたイベントを集めてtickを生成、`tickTrigger` で通知する。
 */
var TickGenerator = /** @class */ (function () {
    function TickGenerator(param) {
        this.tickTrigger = new g.Trigger();
        this.gotStorageTrigger = new g.Trigger();
        this.errorTrigger = new g.Trigger();
        if (param.errorHandler)
            this.errorTrigger.add(param.errorHandler, param.errorHandlerOwner);
        this._amflow = param.amflow;
        this._eventBuffer = param.eventBuffer;
        this._joinResolver = new JoinResolver_1.JoinResolver({
            amflow: param.amflow,
            errorHandler: this.errorTrigger.fire,
            errorHandlerOwner: this.errorTrigger
        });
        this._nextAge = 0;
        this._storageDataForNext = null;
        this._generatingTick = false;
        this._waitingStorage = false;
        this._onGotStorageData_bound = this._onGotStorageData.bind(this);
    }
    TickGenerator.prototype.next = function () {
        if (!this._generatingTick || this._waitingStorage)
            return;
        var joinLeaves = this._eventBuffer.readJoinLeaves();
        if (joinLeaves) {
            for (var i = 0; i < joinLeaves.length; ++i)
                this._joinResolver.request(joinLeaves[i]);
        }
        var evs = this._eventBuffer.readEvents();
        var resolvedJoinLeaves = this._joinResolver.readResolved();
        if (resolvedJoinLeaves) {
            if (evs) {
                evs.push.apply(evs, resolvedJoinLeaves);
            }
            else {
                evs = resolvedJoinLeaves;
            }
        }
        var sds = this._storageDataForNext;
        this._storageDataForNext = null;
        this.tickTrigger.fire([
            this._nextAge++,
            evs,
            sds // 2?: ストレージデータ
        ]);
    };
    TickGenerator.prototype.forceNext = function () {
        if (this._waitingStorage) {
            this.errorTrigger.fire(new Error("TickGenerator#forceNext(): cannot generate tick while waiting storage."));
            return;
        }
        var origValue = this._generatingTick;
        this._generatingTick = true;
        this.next();
        this._generatingTick = origValue;
    };
    TickGenerator.prototype.startStopGenerate = function (toGenerate) {
        this._generatingTick = toGenerate;
    };
    TickGenerator.prototype.startTick = function () {
        this._generatingTick = true;
    };
    TickGenerator.prototype.stopTick = function () {
        this._generatingTick = false;
    };
    TickGenerator.prototype.setNextAge = function (age) {
        if (this._waitingStorage) {
            // エッジケース: 次のtickにストレージを乗せるはずだったが、ageが変わってしまうのでできない。
            // Activeでストレージ要求(シーン切り替え)して待っている間にここに来るとこのパスにかかる。
            // 現実にはActiveで実行開始した後にageを変えるケースは想像しにくい(tickが飛び飛びになったり重複したりする)。
            this.errorTrigger.fire(new Error("TickGenerator#setNextAge(): cannot change the next age while waiting storage."));
            return;
        }
        this._nextAge = age;
    };
    /**
     * 次に生成するtickにstorageDataを持たせる。
     * 取得が完了するまで、次のtickは生成されない。
     */
    TickGenerator.prototype.requestStorageTick = function (keys) {
        if (this._waitingStorage) {
            var err = g.ExceptionFactory.createAssertionError("TickGenerator#requestStorageTick(): Unsupported: multiple storage request");
            this.errorTrigger.fire(err);
            return -1;
        }
        this._waitingStorage = true;
        this._amflow.getStorageData(keys, this._onGotStorageData_bound);
        return this._nextAge;
    };
    TickGenerator.prototype.setRequestValuesForJoin = function (keys) {
        this._joinResolver.setRequestValuesForJoin(keys);
    };
    TickGenerator.prototype._onGotStorageData = function (err, sds) {
        this._waitingStorage = false;
        if (err) {
            this.errorTrigger.fire(err);
            return;
        }
        this._storageDataForNext = sds;
        this.gotStorageTrigger.fire({ age: this._nextAge, storageData: sds });
    };
    return TickGenerator;
}());
exports.TickGenerator = TickGenerator;

},{"./JoinResolver":10,"@akashic/akashic-engine":"@akashic/akashic-engine"}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._cloneDeep = exports.MemoryAmflowClient = void 0;
var MemoryAmflowClient = /** @class */ (function () {
    function MemoryAmflowClient(param) {
        this._playId = param.playId;
        this._putStorageDataSyncFunc = param.putStorageDataSyncFunc || (function () { throw new Error("Implementation not given"); });
        this._getStorageDataSyncFunc = param.getStorageDataSyncFunc || (function () { throw new Error("Implementation not given"); });
        this._tickHandlers = [];
        this._eventHandlers = [];
        this._events = [];
        this._tickList = null;
        if (param.startPoints) {
            this._tickList = param.tickList;
            this._startPoints = param.startPoints;
        }
        else {
            this._startPoints = [];
        }
    }
    MemoryAmflowClient.prototype.dump = function () {
        return {
            tickList: this._tickList,
            startPoints: this._startPoints
        };
    };
    MemoryAmflowClient.prototype.open = function (playId, callback) {
        var _this = this;
        setTimeout(function () {
            if (playId !== _this._playId)
                return void callback(new Error("MemoryAmflowClient#open: unknown playId"));
            callback(null);
        }, 0);
    };
    MemoryAmflowClient.prototype.close = function (callback) {
        setTimeout(function () { callback(null); }, 0);
    };
    MemoryAmflowClient.prototype.authenticate = function (token, callback) {
        setTimeout(function () {
            switch (token) {
                case MemoryAmflowClient.TOKEN_ACTIVE:
                    callback(null, {
                        writeTick: true,
                        readTick: true,
                        subscribeTick: false,
                        sendEvent: false,
                        subscribeEvent: true,
                        maxEventPriority: 2
                    });
                    break;
                case MemoryAmflowClient.TOKEN_PASSIVE:
                    callback(null, {
                        writeTick: false,
                        readTick: true,
                        subscribeTick: true,
                        sendEvent: true,
                        subscribeEvent: false,
                        maxEventPriority: 2
                    });
                    break;
                default:
                    callback(null, {
                        writeTick: true,
                        readTick: true,
                        subscribeTick: true,
                        sendEvent: true,
                        subscribeEvent: true,
                        maxEventPriority: 2
                    });
                    break;
            }
        }, 0);
    };
    MemoryAmflowClient.prototype.sendTick = function (tick) {
        tick = _cloneDeep(tick); // 元の値が後から変更されてもいいようにコピーしておく
        if (!this._tickList) {
            this._tickList = [tick[0 /* Age */], tick[0 /* Age */], []];
        }
        else {
            // 既に存在するTickListのfrom~to間にtickが挿入されることは無い
            if (this._tickList[0 /* From */] <= tick[0 /* Age */] &&
                tick[0 /* Age */] <= this._tickList[1 /* To */])
                throw new Error("illegal age tick");
            this._tickList[1 /* To */] = tick[0 /* Age */];
        }
        if (!!tick[1 /* Events */] || !!tick[2 /* StorageData */]) {
            if (!!tick[1 /* Events */]) {
                tick[1 /* Events */] = tick[1 /* Events */]
                    .filter(function (event) { return !(event[1 /* EventFlags */] & 8 /* Transient */); });
            }
            this._tickList[2 /* TicksWithEvents */].push(tick);
        }
        this._tickHandlers.forEach(function (h) { return h(tick); });
    };
    MemoryAmflowClient.prototype.onTick = function (handler) {
        this._tickHandlers.push(handler);
    };
    MemoryAmflowClient.prototype.offTick = function (handler) {
        this._tickHandlers = this._tickHandlers.filter(function (h) { return (h !== handler); });
    };
    MemoryAmflowClient.prototype.sendEvent = function (pev) {
        pev = _cloneDeep(pev); // 元の値が後から変更されてもいいようにコピーしておく
        if (this._eventHandlers.length === 0) {
            this._events.push(pev);
            return;
        }
        this._eventHandlers.forEach(function (h) { return h(pev); });
    };
    MemoryAmflowClient.prototype.onEvent = function (handler) {
        var _this = this;
        this._eventHandlers.push(handler);
        if (this._events.length > 0) {
            this._events.forEach(function (pev) {
                _this._eventHandlers.forEach(function (h) { return h(pev); });
            });
            this._events = [];
        }
    };
    MemoryAmflowClient.prototype.offEvent = function (handler) {
        this._eventHandlers = this._eventHandlers.filter(function (h) { return (h !== handler); });
    };
    MemoryAmflowClient.prototype.getTickList = function (optsOrBegin, endOrCallback, callback) {
        if (!this._tickList)
            return void setTimeout(function () { return callback(null, null); }, 0);
        // TODO: @akashic/amflow@3.0.0 追従
        if (typeof optsOrBegin !== "number" ||
            typeof endOrCallback !== "number" ||
            typeof callback !== "function") {
            if (typeof endOrCallback === "function") {
                endOrCallback(new Error("not implemented"));
                return;
            }
            throw new Error("not implemented");
        }
        var from = Math.max(optsOrBegin, this._tickList[0 /* From */]);
        var to = Math.min(endOrCallback, this._tickList[1 /* To */]);
        var ticks = this._tickList[2 /* TicksWithEvents */].filter(function (tick) {
            var age = tick[0 /* Age */];
            return from <= age && age <= to;
        });
        var tickList = [from, to, ticks];
        setTimeout(function () { return callback(null, tickList); }, 0);
    };
    MemoryAmflowClient.prototype.putStartPoint = function (startPoint, callback) {
        var _this = this;
        setTimeout(function () {
            _this._startPoints.push(startPoint);
            callback(null);
        }, 0);
    };
    MemoryAmflowClient.prototype.getStartPoint = function (opts, callback) {
        var _this = this;
        setTimeout(function () {
            if (!_this._startPoints || _this._startPoints.length === 0)
                return void callback(new Error("no startpoint"));
            var index = 0;
            if (opts.frame != null) {
                var nearestFrame = _this._startPoints[0].frame;
                for (var i = 1; i < _this._startPoints.length; ++i) {
                    var frame = _this._startPoints[i].frame;
                    if (frame <= opts.frame && nearestFrame < frame) {
                        nearestFrame = frame;
                        index = i;
                    }
                }
            }
            else {
                var nearestTimestamp = _this._startPoints[0].timestamp;
                for (var i = 1; i < _this._startPoints.length; ++i) {
                    var timestamp = _this._startPoints[i].timestamp;
                    if (timestamp <= opts.timestamp && nearestTimestamp < timestamp) {
                        nearestTimestamp = timestamp;
                        index = i;
                    }
                }
            }
            callback(null, _this._startPoints[index]);
        }, 0);
    };
    MemoryAmflowClient.prototype.putStorageData = function (key, value, options, callback) {
        var _this = this;
        setTimeout(function () {
            try {
                _this._putStorageDataSyncFunc(key, value, options);
                callback(null);
            }
            catch (e) {
                callback(e);
            }
        }, 0);
    };
    MemoryAmflowClient.prototype.getStorageData = function (keys, callback) {
        var _this = this;
        setTimeout(function () {
            try {
                var data = _this._getStorageDataSyncFunc(keys);
                callback(null, data);
            }
            catch (e) {
                callback(e);
            }
        }, 0);
    };
    /**
     * 与えられていたティックリストを部分的に破棄する。
     * @param age ティックを破棄する基準のage(このageのティックも破棄される)
     */
    MemoryAmflowClient.prototype.dropAfter = function (age) {
        if (!this._tickList)
            return;
        var from = this._tickList[0 /* From */];
        var to = this._tickList[1 /* To */];
        if (age <= from) {
            this._tickList = null;
            this._startPoints = [];
        }
        else if (age <= to) {
            this._tickList[1 /* To */] = age - 1;
            this._tickList[2 /* TicksWithEvents */] = this._tickList[2 /* TicksWithEvents */].filter(function (tick) {
                var ta = tick[0 /* Age */];
                return from <= ta && ta <= (age - 1);
            });
            this._startPoints = this._startPoints.filter(function (sp) { return sp.frame < age; });
        }
    };
    /**
     * `writeTick` 権限を持つトークン。
     * この値は authenticate() の挙動以外は変更しない。
     * 他メソッド(sendEvent()など)の呼び出しは(権限に反していても)エラーを起こすとは限らない。
     */
    MemoryAmflowClient.TOKEN_ACTIVE = "mamfc-token:active";
    /**
     * `subscribeTick` 権限を持つトークン。
     * この値は authenticate() の挙動以外は変更しない。
     * 他メソッド(sendTick()など)の呼び出しは(権限に反していても)エラーを起こすとは限らない。
     */
    MemoryAmflowClient.TOKEN_PASSIVE = "mamfc-token:passive";
    return MemoryAmflowClient;
}());
exports.MemoryAmflowClient = MemoryAmflowClient;
function _cloneDeep(v) {
    if (v && typeof v === "object") {
        if (Array.isArray(v)) {
            return v.map(_cloneDeep);
        }
        else {
            return Object.keys(v).reduce(function (acc, k) { return (acc[k] = _cloneDeep(v[k]), acc); }, {});
        }
    }
    return v;
}
exports._cloneDeep = _cloneDeep;

},{}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplayAmflowProxy = void 0;
var ReplayAmflowProxy = /** @class */ (function () {
    function ReplayAmflowProxy(param) {
        this._amflow = param.amflow;
        this._tickList = param.tickList;
        this._startPoints = param.startPoints;
    }
    /**
     * 与えられていたティックリストを部分的に破棄する。
     * ReplayAmflowProxy の独自メソッド。
     * @param age ティックを破棄する基準のage(このageのティックも破棄される)
     */
    ReplayAmflowProxy.prototype.dropAfter = function (age) {
        if (!this._tickList)
            return;
        var givenFrom = this._tickList[0 /* From */];
        var givenTo = this._tickList[1 /* To */];
        var givenTicksWithEvents = this._tickList[2 /* TicksWithEvents */];
        if (age <= givenFrom) {
            this._tickList = null;
            this._startPoints = [];
        }
        else if (age <= givenTo) {
            this._tickList[1 /* To */] = age - 1;
            this._tickList[2 /* TicksWithEvents */] = this._sliceTicks(givenTicksWithEvents, givenTo, age - 1);
            this._startPoints = this._startPoints.filter(function (sp) { return sp.frame < age; });
        }
    };
    ReplayAmflowProxy.prototype.open = function (playId, callback) {
        this._amflow.open(playId, callback);
    };
    ReplayAmflowProxy.prototype.close = function (callback) {
        this._amflow.close(callback);
    };
    ReplayAmflowProxy.prototype.authenticate = function (token, callback) {
        this._amflow.authenticate(token, callback);
    };
    ReplayAmflowProxy.prototype.sendTick = function (tick) {
        this._amflow.sendTick(tick);
    };
    ReplayAmflowProxy.prototype.onTick = function (handler) {
        this._amflow.onTick(handler);
    };
    ReplayAmflowProxy.prototype.offTick = function (handler) {
        this._amflow.offTick(handler);
    };
    ReplayAmflowProxy.prototype.sendEvent = function (event) {
        this._amflow.sendEvent(event);
    };
    ReplayAmflowProxy.prototype.onEvent = function (handler) {
        this._amflow.onEvent(handler);
    };
    ReplayAmflowProxy.prototype.offEvent = function (handler) {
        this._amflow.offEvent(handler);
    };
    ReplayAmflowProxy.prototype.getTickList = function (optsOrBegin, endOrCallback, callback) {
        var _this = this;
        // TODO: @akashic/amflow@3.0.0 追従
        if (typeof optsOrBegin !== "number" ||
            typeof endOrCallback !== "number" ||
            typeof callback !== "function") {
            if (typeof endOrCallback === "function") {
                endOrCallback(new Error("not implemented"));
                return;
            }
            throw new Error("not implemented");
        }
        var from = optsOrBegin;
        var to = endOrCallback;
        if (!this._tickList) {
            // TODO: 後方互換性のため旧インタフェースを一時的に利用する
            this._amflow.getTickList(from, to, callback);
            return;
        }
        var givenFrom = this._tickList[0 /* From */];
        var givenTo = this._tickList[1 /* To */];
        var givenTicksWithEvents = this._tickList[2 /* TicksWithEvents */];
        var fromInGiven = givenFrom <= from && from <= givenTo;
        var toInGiven = givenFrom <= to && to <= givenTo;
        if (fromInGiven && toInGiven) { // 手持ちが要求範囲を包含
            setTimeout(function () {
                callback(null, [from, to, _this._sliceTicks(givenTicksWithEvents, from, to)]);
            }, 0);
        }
        else {
            this._amflow.getTickList(from, to, function (err, tickList) {
                if (err)
                    return void callback(err);
                if (!tickList) {
                    // 何も得られなかった。手持ちの重複範囲を返すだけ。
                    if (!fromInGiven && !toInGiven) {
                        if (to < givenFrom || givenTo < from) { // 重複なし
                            callback(null, tickList);
                        }
                        else { // 要求範囲が手持ちを包含
                            callback(null, [givenFrom, givenTo, _this._sliceTicks(givenTicksWithEvents, from, to)]);
                        }
                    }
                    else if (fromInGiven) { // 前半重複
                        callback(null, [from, givenTo, _this._sliceTicks(givenTicksWithEvents, from, to)]);
                    }
                    else { // 後半重複
                        callback(null, [givenFrom, to, _this._sliceTicks(givenTicksWithEvents, from, to)]);
                    }
                }
                else {
                    // 何かは得られた。手持ちとマージする。
                    if (!fromInGiven && !toInGiven) {
                        if (to < givenFrom || givenTo < from) { // 重複なし
                            callback(null, tickList);
                        }
                        else { // 要求範囲が手持ちを包含
                            var ticksWithEvents = tickList[2 /* TicksWithEvents */];
                            if (ticksWithEvents) {
                                var beforeGiven = _this._sliceTicks(ticksWithEvents, from, givenFrom - 1);
                                var afterGiven = _this._sliceTicks(ticksWithEvents, givenTo + 1, to);
                                ticksWithEvents = beforeGiven.concat(givenTicksWithEvents, afterGiven);
                            }
                            else {
                                ticksWithEvents = givenTicksWithEvents;
                            }
                            callback(null, [from, to, ticksWithEvents]);
                        }
                    }
                    else if (fromInGiven) { // 前半重複
                        var ticksWithEvents = _this._sliceTicks(givenTicksWithEvents, from, to).concat(tickList[2 /* TicksWithEvents */] || []);
                        callback(null, [from, tickList[1 /* To */], ticksWithEvents]);
                    }
                    else { // 後半重複
                        var ticksWithEvents = (tickList[2 /* TicksWithEvents */] || []).concat(_this._sliceTicks(givenTicksWithEvents, from, to));
                        callback(null, [tickList[0 /* From */], to, ticksWithEvents]);
                    }
                }
            });
        }
    };
    ReplayAmflowProxy.prototype.putStartPoint = function (startPoint, callback) {
        this._amflow.putStartPoint(startPoint, callback);
    };
    ReplayAmflowProxy.prototype.getStartPoint = function (opts, callback) {
        var _this = this;
        var index = 0;
        if (this._startPoints.length > 0) {
            if (opts.frame != null) {
                var nearestFrame = this._startPoints[0].frame;
                for (var i = 1; i < this._startPoints.length; ++i) {
                    var frame = this._startPoints[i].frame;
                    if (frame <= opts.frame && nearestFrame < frame) {
                        nearestFrame = frame;
                        index = i;
                    }
                }
            }
            else {
                var nearestTimestamp = this._startPoints[0].timestamp;
                for (var i = 1; i < this._startPoints.length; ++i) {
                    var timestamp = this._startPoints[i].timestamp;
                    if (timestamp <= opts.timestamp && nearestTimestamp < timestamp) {
                        nearestTimestamp = timestamp;
                        index = i;
                    }
                }
            }
        }
        var givenTo = this._tickList ? this._tickList[1 /* To */] : -1;
        if (opts.frame > givenTo) {
            this._amflow.getStartPoint(opts, function (err, startPoint) {
                if (err) {
                    callback(err);
                    return;
                }
                if (givenTo < startPoint.frame) {
                    callback(null, startPoint);
                }
                else {
                    // 与えられたティックリストの範囲内のスタートポイントが見つかったとしてもなかったかのように振る舞う
                    callback(null, _this._startPoints[index]);
                }
            });
        }
        else {
            setTimeout(function () {
                callback(null, _this._startPoints[index]);
            }, 0);
        }
    };
    ReplayAmflowProxy.prototype.putStorageData = function (key, value, options, callback) {
        this._amflow.putStorageData(key, value, options, callback);
    };
    ReplayAmflowProxy.prototype.getStorageData = function (keys, callback) {
        this._amflow.getStorageData(keys, callback);
    };
    ReplayAmflowProxy.prototype._sliceTicks = function (ticks, from, to) {
        return ticks.filter(function (t) {
            var age = t[0 /* Age */];
            return from <= age && age <= to;
        });
    };
    return ReplayAmflowProxy;
}());
exports.ReplayAmflowProxy = ReplayAmflowProxy;

},{}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleProfiler = void 0;
var g = require("@akashic/akashic-engine");
var SimpleProfiler = /** @class */ (function () {
    function SimpleProfiler(param) {
        this._interval = param.interval != null ? param.interval : SimpleProfiler.DEFAULT_INTERVAL;
        if (param.limit != null) {
            this._limit = param.limit >= SimpleProfiler.DEFAULT_LIMIT ? param.limit : SimpleProfiler.DEFAULT_LIMIT;
        }
        else {
            this._limit = SimpleProfiler.DEFAULT_LIMIT;
        }
        this._calculateProfilerValueTrigger = new g.Trigger();
        if (param.getValueHandler) {
            this._calculateProfilerValueTrigger.add(param.getValueHandler, param.getValueHandlerOwner);
        }
        this._reset();
    }
    SimpleProfiler.prototype.time = function (type) {
        this._beforeTimes[type] = this._getCurrentTime();
    };
    SimpleProfiler.prototype.timeEnd = function (type) {
        var now = this._getCurrentTime();
        var value = this._beforeTimes[type] != null ? now - this._beforeTimes[type] : 0;
        this._values[type].push({
            time: now,
            value: value
        });
    };
    SimpleProfiler.prototype.flush = function () {
        var now = this._getCurrentTime();
        if (this._beforeFlushTime === 0)
            this._beforeFlushTime = now;
        if (this._beforeFlushTime + this._interval < now) {
            this._calculateProfilerValueTrigger.fire(this.getProfilerValue(this._interval));
            this._beforeFlushTime = now;
        }
        if (this._values[1 /* RawFrameInterval */].length > this._limit) {
            for (var i in this._values) {
                if (this._values.hasOwnProperty(i))
                    this._values[i] = this._values[i].slice(-SimpleProfiler.BACKUP_MARGIN);
            }
        }
    };
    SimpleProfiler.prototype.setValue = function (type, value) {
        this._values[type].push({
            time: this._getCurrentTime(),
            value: value
        });
    };
    /**
     * 現在時刻から、指定した時間までを遡った期間の `SimpleProfilerValue` を取得する。
     */
    SimpleProfiler.prototype.getProfilerValue = function (time) {
        var rawFrameInterval = this._calculateProfilerValue(1 /* RawFrameInterval */, time);
        return {
            skippedFrameCount: this._calculateProfilerValue(0 /* SkippedFrameCount */, time),
            rawFrameInterval: rawFrameInterval,
            framePerSecond: {
                ave: 1000 / rawFrameInterval.ave,
                max: 1000 / rawFrameInterval.min,
                min: 1000 / rawFrameInterval.max
            },
            frameTime: this._calculateProfilerValue(2 /* FrameTime */, time),
            renderingTime: this._calculateProfilerValue(3 /* RenderingTime */, time)
        };
    };
    SimpleProfiler.prototype._reset = function () {
        this._startTime = this._getCurrentTime();
        this._beforeFlushTime = 0;
        this._beforeTimes = [];
        this._beforeTimes[1 /* RawFrameInterval */] = 0;
        this._beforeTimes[2 /* FrameTime */] = 0;
        this._beforeTimes[3 /* RenderingTime */] = 0;
        this._beforeTimes[0 /* SkippedFrameCount */] = 0;
        this._values = [];
        this._values[1 /* RawFrameInterval */] = [];
        this._values[2 /* FrameTime */] = [];
        this._values[3 /* RenderingTime */] = [];
        this._values[0 /* SkippedFrameCount */] = [];
    };
    SimpleProfiler.prototype._calculateProfilerValue = function (type, time) {
        var limit = this._getCurrentTime() - time;
        var sum = 0;
        var num = 0;
        var max = 0;
        var min = Number.MAX_VALUE;
        for (var i = this._values[type].length - 1; i >= 0; --i) {
            if (0 < num && this._values[type][i].time < limit)
                break;
            var value = this._values[type][i].value;
            if (max < value)
                max = value;
            if (value < min)
                min = value;
            sum += value;
            ++num;
        }
        return {
            ave: sum / num,
            max: max,
            min: min
        };
    };
    SimpleProfiler.prototype._getCurrentTime = function () {
        return +new Date();
    };
    SimpleProfiler.DEFAULT_INTERVAL = 1000;
    SimpleProfiler.DEFAULT_LIMIT = 1000;
    SimpleProfiler.BACKUP_MARGIN = 100;
    return SimpleProfiler;
}());
exports.SimpleProfiler = SimpleProfiler;

},{"@akashic/akashic-engine":"@akashic/akashic-engine"}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_POLLING_TICK_THRESHOLD = exports.DEFAULT_JUMP_IGNORE_THRESHOLD = exports.DEFAULT_JUMP_TRY_THRESHOLD = exports.DEFAULT_SKIP_THRESHOLD = exports.DEFAULT_SKIP_TICKS_AT_ONCE = exports.DEFAULT_DELAY_IGNORE_THRESHOLD = void 0;
/**
 * 遅延を無視する域値のデフォルト。
 * `LoopConfiguration#delayIgnoreThreshold` のデフォルト値。
 * このフレーム以下の遅延は遅れてないものとみなす(常時コマが飛ぶのを避けるため)。
 */
exports.DEFAULT_DELAY_IGNORE_THRESHOLD = 6;
/**
 * 「早送り」時倍率のデフォルト値。
 * `LoopConfiguration#skipTicksAtOnce` のデフォルト値。
 */
exports.DEFAULT_SKIP_TICKS_AT_ONCE = 100;
/**
 * 「早送り」状態に移る域値のデフォルト。
 * `LoopConfiguration#skipThreshold` のデフォルト値。
 */
exports.DEFAULT_SKIP_THRESHOLD = 100;
/**
 * スナップショットジャンプを試みる域値のデフォルト。
 * `LoopConfiguration#jumpTryThreshold` のデフォルト値。
 */
exports.DEFAULT_JUMP_TRY_THRESHOLD = 30000; // 30FPSの100倍早送りで換算3000FPSで進めても10秒かかる閾値
/**
 * 取得したスナップショットを無視する域値のデフォルト。
 * `LoopConfiguration#jumpIgnoreThreshold` のデフォルト値。
 */
exports.DEFAULT_JUMP_IGNORE_THRESHOLD = 15000; // 30FPSの100倍早送りで換算3000FPSで進めて5秒で済む閾値
/**
 * 最新ティックをポーリングする間隔(ms)のデフォルト。
 */
exports.DEFAULT_POLLING_TICK_THRESHOLD = 10000;

},{}],24:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   v4.2.8+1e68dce6
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.ES6Promise = factory());
}(this, (function () { 'use strict';

function objectOrFunction(x) {
  var type = typeof x;
  return x !== null && (type === 'object' || type === 'function');
}

function isFunction(x) {
  return typeof x === 'function';
}



var _isArray = void 0;
if (Array.isArray) {
  _isArray = Array.isArray;
} else {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
}

var isArray = _isArray;

var len = 0;
var vertxNext = void 0;
var customSchedulerFn = void 0;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  if (typeof vertxNext !== 'undefined') {
    return function () {
      vertxNext(flush);
    };
  }

  return useSetTimeout();
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var vertx = Function('return this')().require('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = void 0;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && typeof require === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;


  if (_state) {
    var callback = arguments[_state - 1];
    asap(function () {
      return invokeCallback(_state, child, callback, parent._result);
    });
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve$1(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(2);

function noop() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function tryThen(then$$1, value, fulfillmentHandler, rejectionHandler) {
  try {
    then$$1.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then$$1) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then$$1, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return resolve(promise, value);
    }, function (reason) {
      return reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$1) {
  if (maybeThenable.constructor === promise.constructor && then$$1 === then && maybeThenable.constructor.resolve === resolve$1) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$1 === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$$1)) {
      handleForeignThenable(promise, maybeThenable, then$$1);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function resolve(promise, value) {
  if (promise === value) {
    reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    var then$$1 = void 0;
    try {
      then$$1 = value.then;
    } catch (error) {
      reject(promise, error);
      return;
    }
    handleMaybeThenable(promise, value, then$$1);
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;


  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = void 0,
      callback = void 0,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value = void 0,
      error = void 0,
      succeeded = true;

  if (hasCallback) {
    try {
      value = callback(detail);
    } catch (e) {
      succeeded = false;
      error = e;
    }

    if (promise === value) {
      reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
    resolve(promise, value);
  } else if (succeeded === false) {
    reject(promise, error);
  } else if (settled === FULFILLED) {
    fulfill(promise, value);
  } else if (settled === REJECTED) {
    reject(promise, value);
  }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      resolve(promise, value);
    }, function rejectPromise(reason) {
      reject(promise, reason);
    });
  } catch (e) {
    reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
}

var Enumerator = function () {
  function Enumerator(Constructor, input) {
    this._instanceConstructor = Constructor;
    this.promise = new Constructor(noop);

    if (!this.promise[PROMISE_ID]) {
      makePromise(this.promise);
    }

    if (isArray(input)) {
      this.length = input.length;
      this._remaining = input.length;

      this._result = new Array(this.length);

      if (this.length === 0) {
        fulfill(this.promise, this._result);
      } else {
        this.length = this.length || 0;
        this._enumerate(input);
        if (this._remaining === 0) {
          fulfill(this.promise, this._result);
        }
      }
    } else {
      reject(this.promise, validationError());
    }
  }

  Enumerator.prototype._enumerate = function _enumerate(input) {
    for (var i = 0; this._state === PENDING && i < input.length; i++) {
      this._eachEntry(input[i], i);
    }
  };

  Enumerator.prototype._eachEntry = function _eachEntry(entry, i) {
    var c = this._instanceConstructor;
    var resolve$$1 = c.resolve;


    if (resolve$$1 === resolve$1) {
      var _then = void 0;
      var error = void 0;
      var didError = false;
      try {
        _then = entry.then;
      } catch (e) {
        didError = true;
        error = e;
      }

      if (_then === then && entry._state !== PENDING) {
        this._settledAt(entry._state, i, entry._result);
      } else if (typeof _then !== 'function') {
        this._remaining--;
        this._result[i] = entry;
      } else if (c === Promise$1) {
        var promise = new c(noop);
        if (didError) {
          reject(promise, error);
        } else {
          handleMaybeThenable(promise, entry, _then);
        }
        this._willSettleAt(promise, i);
      } else {
        this._willSettleAt(new c(function (resolve$$1) {
          return resolve$$1(entry);
        }), i);
      }
    } else {
      this._willSettleAt(resolve$$1(entry), i);
    }
  };

  Enumerator.prototype._settledAt = function _settledAt(state, i, value) {
    var promise = this.promise;


    if (promise._state === PENDING) {
      this._remaining--;

      if (state === REJECTED) {
        reject(promise, value);
      } else {
        this._result[i] = value;
      }
    }

    if (this._remaining === 0) {
      fulfill(promise, this._result);
    }
  };

  Enumerator.prototype._willSettleAt = function _willSettleAt(promise, i) {
    var enumerator = this;

    subscribe(promise, undefined, function (value) {
      return enumerator._settledAt(FULFILLED, i, value);
    }, function (reason) {
      return enumerator._settledAt(REJECTED, i, reason);
    });
  };

  return Enumerator;
}();

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject$1(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {Function} resolver
  Useful for tooling.
  @constructor
*/

var Promise$1 = function () {
  function Promise(resolver) {
    this[PROMISE_ID] = nextId();
    this._result = this._state = undefined;
    this._subscribers = [];

    if (noop !== resolver) {
      typeof resolver !== 'function' && needsResolver();
      this instanceof Promise ? initializePromise(this, resolver) : needsNew();
    }
  }

  /**
  The primary way of interacting with a promise is through its `then` method,
  which registers callbacks to receive either a promise's eventual value or the
  reason why the promise cannot be fulfilled.
   ```js
  findUser().then(function(user){
    // user is available
  }, function(reason){
    // user is unavailable, and you are given the reason why
  });
  ```
   Chaining
  --------
   The return value of `then` is itself a promise.  This second, 'downstream'
  promise is resolved with the return value of the first promise's fulfillment
  or rejection handler, or rejected if the handler throws an exception.
   ```js
  findUser().then(function (user) {
    return user.name;
  }, function (reason) {
    return 'default name';
  }).then(function (userName) {
    // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
    // will be `'default name'`
  });
   findUser().then(function (user) {
    throw new Error('Found user, but still unhappy');
  }, function (reason) {
    throw new Error('`findUser` rejected and we're unhappy');
  }).then(function (value) {
    // never reached
  }, function (reason) {
    // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
    // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
  });
  ```
  If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
   ```js
  findUser().then(function (user) {
    throw new PedagogicalException('Upstream error');
  }).then(function (value) {
    // never reached
  }).then(function (value) {
    // never reached
  }, function (reason) {
    // The `PedgagocialException` is propagated all the way down to here
  });
  ```
   Assimilation
  ------------
   Sometimes the value you want to propagate to a downstream promise can only be
  retrieved asynchronously. This can be achieved by returning a promise in the
  fulfillment or rejection handler. The downstream promise will then be pending
  until the returned promise is settled. This is called *assimilation*.
   ```js
  findUser().then(function (user) {
    return findCommentsByAuthor(user);
  }).then(function (comments) {
    // The user's comments are now available
  });
  ```
   If the assimliated promise rejects, then the downstream promise will also reject.
   ```js
  findUser().then(function (user) {
    return findCommentsByAuthor(user);
  }).then(function (comments) {
    // If `findCommentsByAuthor` fulfills, we'll have the value here
  }, function (reason) {
    // If `findCommentsByAuthor` rejects, we'll have the reason here
  });
  ```
   Simple Example
  --------------
   Synchronous Example
   ```javascript
  let result;
   try {
    result = findResult();
    // success
  } catch(reason) {
    // failure
  }
  ```
   Errback Example
   ```js
  findResult(function(result, err){
    if (err) {
      // failure
    } else {
      // success
    }
  });
  ```
   Promise Example;
   ```javascript
  findResult().then(function(result){
    // success
  }, function(reason){
    // failure
  });
  ```
   Advanced Example
  --------------
   Synchronous Example
   ```javascript
  let author, books;
   try {
    author = findAuthor();
    books  = findBooksByAuthor(author);
    // success
  } catch(reason) {
    // failure
  }
  ```
   Errback Example
   ```js
   function foundBooks(books) {
   }
   function failure(reason) {
   }
   findAuthor(function(author, err){
    if (err) {
      failure(err);
      // failure
    } else {
      try {
        findBoooksByAuthor(author, function(books, err) {
          if (err) {
            failure(err);
          } else {
            try {
              foundBooks(books);
            } catch(reason) {
              failure(reason);
            }
          }
        });
      } catch(error) {
        failure(err);
      }
      // success
    }
  });
  ```
   Promise Example;
   ```javascript
  findAuthor().
    then(findBooksByAuthor).
    then(function(books){
      // found books
  }).catch(function(reason){
    // something went wrong
  });
  ```
   @method then
  @param {Function} onFulfilled
  @param {Function} onRejected
  Useful for tooling.
  @return {Promise}
  */

  /**
  `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
  as the catch block of a try/catch statement.
  ```js
  function findAuthor(){
  throw new Error('couldn't find that author');
  }
  // synchronous
  try {
  findAuthor();
  } catch(reason) {
  // something went wrong
  }
  // async with promises
  findAuthor().catch(function(reason){
  // something went wrong
  });
  ```
  @method catch
  @param {Function} onRejection
  Useful for tooling.
  @return {Promise}
  */


  Promise.prototype.catch = function _catch(onRejection) {
    return this.then(null, onRejection);
  };

  /**
    `finally` will be invoked regardless of the promise's fate just as native
    try/catch/finally behaves
  
    Synchronous example:
  
    ```js
    findAuthor() {
      if (Math.random() > 0.5) {
        throw new Error();
      }
      return new Author();
    }
  
    try {
      return findAuthor(); // succeed or fail
    } catch(error) {
      return findOtherAuther();
    } finally {
      // always runs
      // doesn't affect the return value
    }
    ```
  
    Asynchronous example:
  
    ```js
    findAuthor().catch(function(reason){
      return findOtherAuther();
    }).finally(function(){
      // author was either found, or not
    });
    ```
  
    @method finally
    @param {Function} callback
    @return {Promise}
  */


  Promise.prototype.finally = function _finally(callback) {
    var promise = this;
    var constructor = promise.constructor;

    if (isFunction(callback)) {
      return promise.then(function (value) {
        return constructor.resolve(callback()).then(function () {
          return value;
        });
      }, function (reason) {
        return constructor.resolve(callback()).then(function () {
          throw reason;
        });
      });
    }

    return promise.then(callback, callback);
  };

  return Promise;
}();

Promise$1.prototype.then = then;
Promise$1.all = all;
Promise$1.race = race;
Promise$1.resolve = resolve$1;
Promise$1.reject = reject$1;
Promise$1._setScheduler = setScheduler;
Promise$1._setAsap = setAsap;
Promise$1._asap = asap;

/*global self*/
function polyfill() {
  var local = void 0;

  if (typeof global !== 'undefined') {
    local = global;
  } else if (typeof self !== 'undefined') {
    local = self;
  } else {
    try {
      local = Function('return this')();
    } catch (e) {
      throw new Error('polyfill failed because global object is unavailable in this environment');
    }
  }

  var P = local.Promise;

  if (P) {
    var promiseToString = null;
    try {
      promiseToString = Object.prototype.toString.call(P.resolve());
    } catch (e) {
      // silently ignored
    }

    if (promiseToString === '[object Promise]' && !P.cast) {
      return;
    }
  }

  local.Promise = Promise$1;
}

// Strange compat..
Promise$1.polyfill = polyfill;
Promise$1.Promise = Promise$1;

return Promise$1;

})));





}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":25}],25:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],"@akashic/game-driver":[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleProfiler = exports.MemoryAmflowClient = exports.ReplayAmflowProxy = exports.Game = exports.GameDriver = exports.ExecutionMode = exports.LoopRenderMode = exports.LoopMode = exports.EventIndex = void 0;
__exportStar(require("./constants"), exports);
var EventIndex = require("./EventIndex");
exports.EventIndex = EventIndex;
var LoopMode_1 = require("./LoopMode");
exports.LoopMode = LoopMode_1.default;
var LoopRenderMode_1 = require("./LoopRenderMode");
exports.LoopRenderMode = LoopRenderMode_1.default;
var ExecutionMode_1 = require("./ExecutionMode");
exports.ExecutionMode = ExecutionMode_1.default;
var GameDriver_1 = require("./GameDriver");
Object.defineProperty(exports, "GameDriver", { enumerable: true, get: function () { return GameDriver_1.GameDriver; } });
var Game_1 = require("./Game");
Object.defineProperty(exports, "Game", { enumerable: true, get: function () { return Game_1.Game; } });
var ReplayAmflowProxy_1 = require("./auxiliary/ReplayAmflowProxy");
Object.defineProperty(exports, "ReplayAmflowProxy", { enumerable: true, get: function () { return ReplayAmflowProxy_1.ReplayAmflowProxy; } });
var MemoryAmflowClient_1 = require("./auxiliary/MemoryAmflowClient");
Object.defineProperty(exports, "MemoryAmflowClient", { enumerable: true, get: function () { return MemoryAmflowClient_1.MemoryAmflowClient; } });
var SimpleProfiler_1 = require("./auxiliary/SimpleProfiler");
Object.defineProperty(exports, "SimpleProfiler", { enumerable: true, get: function () { return SimpleProfiler_1.SimpleProfiler; } });

},{"./EventIndex":5,"./ExecutionMode":6,"./Game":7,"./GameDriver":8,"./LoopMode":11,"./LoopRenderMode":12,"./auxiliary/MemoryAmflowClient":20,"./auxiliary/ReplayAmflowProxy":21,"./auxiliary/SimpleProfiler":22,"./constants":23}]},{},[]);
