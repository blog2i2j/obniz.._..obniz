import MQGas, { MQGasSensorOptions } from "../MQGas";
/**
 * @category Parts
 */
export interface MQ3Options extends MQGasSensorOptions {
}
/**
 * @category Parts
 */
export default class MQ3 extends MQGas {
    static info(): {
        name: string;
    };
    constructor();
}
