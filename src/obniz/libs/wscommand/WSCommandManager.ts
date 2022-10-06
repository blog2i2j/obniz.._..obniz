/**
 * @packageDocumentation
 * @ignore
 */

import WSSchema from './WSSchema';
import { HW, WSCommandAbstract } from './WSCommandAbstract';

type WSCommandConstructor = new () => WSCommandAbstract;

interface PayloadChunk {
  /**
   * module number
   */
  module: number;

  /**
   * function index number
   */
  func: number;

  /**
   * payload for wscommand
   */
  payload: Uint8Array;

  /**
   * left binary array
   */
  next: Uint8Array;
}

export class WSCommandManager {
  public commandClasses: { [key: string]: WSCommandConstructor } = {};
  private commands: { [key: string]: WSCommandAbstract } = {};

  static get schema(): any {
    return WSSchema;
  }

  public addCommandClass(name: string, classObj: WSCommandConstructor): void {
    this.commandClasses[name] = classObj;
  }

  public createCommandInstances() {
    for (const [name, classObj] of Object.entries(this.commandClasses)) {
      this.commands[name] = new classObj();
    }
  }

  public framed(
    module: number,
    func: number,
    payload: Uint8Array | null
  ): Uint8Array {
    let payload_length = 0;
    if (payload) {
      payload_length = payload.length;
    }
    let length_type: 0 | 1 | 2;
    if (payload_length <= 0x3f) {
      length_type = 0;
    } else if (payload_length <= 0x3fff) {
      length_type = 1;
    } else if (payload_length <= 0x3fffffff) {
      length_type = 2;
    } else {
      throw new Error('too big payload');
    }
    let length_extra_bytse = length_type === 0 ? 0 : length_type === 1 ? 1 : 3;
    const header_length = 3 + length_extra_bytse;
    const result = new Uint8Array(header_length + payload_length);
    let index = 0;
    result[index++] = module & 0x7f;
    result[index++] = func;
    result[index++] =
      (length_type << 6) | (payload_length >> (length_extra_bytse * 8));
    while (length_extra_bytse > 0) {
      length_extra_bytse--;
      result[index++] = payload_length >> (length_extra_bytse * 8);
    }
    if (payload_length === 0 || !payload) {
      return result;
    } else {
      result.set(payload, header_length);
      return result;
    }
  }

  /**
   * Dequeue a next wscommands from binary array.
   *
   * @param buf binary array received from obniz cloud.
   * @returns chunk
   */
  public dequeueOne(buf: Uint8Array): PayloadChunk | null {
    if (!buf || buf.byteLength === 0) {
      return null;
    }
    if (buf.byteLength < 3) {
      throw new Error('something wrong. buf less than 3');
    }
    if (buf[0] & 0x80) {
      throw new Error('reserved bit 1');
    }
    const module = 0x7f & buf[0];
    const func = buf[1];
    const length_type = (buf[2] >> 6) & 0x3;
    const length_extra_bytse =
      length_type === 0 ? 0 : length_type === 1 ? 1 : 3;
    if (length_type === 4) {
      throw new Error('invalid length');
    }
    let length = (buf[2] & 0x3f) << (length_extra_bytse * 8);
    let index = 3;
    let shift = length_extra_bytse;
    while (shift > 0) {
      shift--;
      length += buf[index] << (shift * 8);
      index++;
    }

    return {
      module,
      func,
      payload: buf.slice(
        3 + length_extra_bytse,
        3 + length_extra_bytse + length
      ),
      next: buf.slice(3 + length_extra_bytse + length),
    };
  }

  /**
   * json to binary
   *
   * @param json
   */
  public compress(json: any): Uint8Array | null {
    let ret: Uint8Array | null = null;

    const append = (
      module: number,
      func: number,
      payload: Uint8Array | null
    ) => {
      const frame = this.framed(module, func, payload);
      if (ret) {
        const combined = new Uint8Array(ret.length + frame.length);
        combined.set(ret, 0);
        combined.set(frame, ret.length);
        ret = combined;
      } else {
        ret = frame;
      }
    };

    for (const [name, wscommand] of Object.entries(this.commands)) {
      wscommand.parsed = append;
      wscommand.parseFromJson(json);
    }
    return ret;
  }

  public binary2Json(data: Uint8Array) {
    const json = [];
    while (data !== null) {
      const frame = this.dequeueOne(data);
      if (!frame) {
        break;
      }
      const obj = {};
      for (const [, command] of Object.entries(this.commands)) {
        if (command.module === frame.module) {
          command.notifyFromBinary(obj, frame.func, frame.payload);
          break;
        }
      }
      json.push(obj);
      data = frame.next;
    }
    return json;
  }

  setHw(obj: HW) {
    for (const [, command] of Object.entries(this.commands)) {
      command.setHw(obj);
    }
  }
}
