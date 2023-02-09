/**
 * @packageDocumentation
 * @module ObnizCore.Components
 */

import Obniz from '../../index';
import { ComponentAbstract } from '../ComponentAbstact';
import { ObnizUtil } from '../utils/util';

export interface LogicAnalyzerOptions {
  /**
   * target pin no
   */
  io: number;

  /**
   * a period(second) to read io value. (ms)
   */
  interval: number;

  /**
   * how long the logicAnalyzer will collect the data.
   */
  duration: number;
}

/**
 * The default trigger is "value change", but it tends to be interrupted by some noise.
 * Configure triggerValue/triggerValueSamples to filter it.
 *
 * This trigger setting means "trigger when true/(or false) continues for more than X times after io change"
 *
 * ![](media://logiana_1.png)
 */
export interface LogicAnalyzerOptionsExt extends LogicAnalyzerOptions {
  /**
   * desired start value. true/false
   */
  triggerValue: boolean;

  /**
   * after how many samples will the recording start.
   */
  triggerValueSamples: number;
}

/**
 * LogicAnalyzer records samples read from io periodically.
 * This is useful for digital bus signal check.
 *
 * Only one LogicAnalyzer can be used per obniz Board.
 *
 * ### How it works
 * LogicAnalyzer starts logging by a trigger.
 * The default trigger is "value change".
 *
 * When it occurs, data will be recorded for a desired duration.
 * After that is done, LogicAnalyzer starts monitoring changes in io (= continue working).
 * One sample becomes one 1/0.
 *
 * ![](media://logiana_0.png)
 *
 * Sampling interval and duration can be configured.
 * For example, if interval is 1 ms and duration is 800ms, you will get 800 arrays of data.
 * The data will be in multiples of 8.
 *
 * @category Measurement
 */
export class LogicAnalyzer extends ComponentAbstract {
  /**
   * This is a callback function that will be called when data arrives.
   *
   * The received data is in 0/1 array.
   * And every data represents 0,1 of io in a particular instance.
   *
   * ```javascript
   * // Javascript Example
   * obniz.logicAnalyzer.start({io:0, interval:2, duration:1000});  // start on io0. 1ms interval and 1sec long.
   *
   * obniz.logicAnalyzer.onmeasured = function(array) {
   *   console.log(array);
   * }
   * ```
   */
  public onmeasured?: (array: number[]) => void;
  private measured?: number[];
  private params: any;

  constructor(obniz: Obniz) {
    super(obniz);

    this.on('/response/logicAnalyzer/data', (obj) => {
      if (this.onmeasured) {
        this.Obniz._runUserCreatedFunction(this.onmeasured, obj.data);
      } else {
        if (!this.measured) {
          this.measured = [];
        }
        this.measured.push(obj.data);
      }
    });
    this._reset();
  }

  /**
   * @ignore
   * @private
   */
  public _reset() {
    this.onmeasured = undefined;
  }

  /**
   * This starts the logic analyzer on a given io.
   *
   * For example, if you want to collect the data after io0 changes every 2ms for 1sec long, set as below.
   *
   * ```javascript
   * // Javascript Example
   * obniz.logicAnalyzer.start({io:0, interval:2, duration:1000});  // start on io0. 2ms interval and 1sec long.
   * obniz.logicAnalyzer.onmeasured = function(array) {
   *   console.log(array);
   * }
   * ```
   *
   * The trigger is an optional configuration.
   *
   * Without this, logicAnalyzer recognizes any io level change as trigger and start. Trigger specifies the start position.
   * Value means start value, true/false. Samples means how much that value consists.
   * So, with the below sample code, you will only receive data that start with "0, 0, 0"
   *
   * ```javascript
   * // Javascript Example
   * obniz.logicAnalyzer.start({io:0, interval:2, duration:1000, triggerValue:false, triggerValueSamples:3});  // start on io0. 2ms interval and 1sec long.
   * obniz.logicAnalyzer.onmeasured = function(array) {
   *   console.log(array);
   * }
   * ```
   *
   * @param params
   */
  public start(params: LogicAnalyzerOptions | LogicAnalyzerOptionsExt) {
    const err = ObnizUtil._requiredKeys(params, ['io', 'interval', 'duration']);
    if (err) {
      throw new Error(
        "LogicAnalyzer start param '" + err + "' required, but not found "
      );
    }
    this.params = ObnizUtil._keyFilter(params, [
      'io',
      'interval',
      'duration',
      'triggerValue',
      'triggerValueSamples',
    ]);

    const obj: any = {};
    obj.logic_analyzer = {
      io: [this.params.io],
      interval: this.params.interval,
      duration: this.params.duration,
    };
    if (this.params.triggerValueSamples > 0) {
      obj.logic_analyzer.trigger = {
        value: !!this.params.triggerValue,
        samples: this.params.triggerValueSamples,
      };
    }

    this.Obniz.send(obj);
    return;
  }

  /**
   * This stops the logicAnalyzer.
   *
   * ```javascript
   * // Javascript Example
   * obniz.logicAnalyzer.start({io:0, interval:2, duration:1000});  // start on io0. 1ms interval and 1sec long.
   * obniz.logicAnalyzer.end();
   * ```
   */
  public end() {
    const obj = {
      logic_analyzer: null,
    };
    this.Obniz.send(obj);
    return;
  }

  public schemaBasePath(): string {
    return 'logic_analyzer';
  }
}
