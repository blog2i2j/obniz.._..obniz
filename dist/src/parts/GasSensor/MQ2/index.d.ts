import MQGas, { MQGasSensorOptions } from "../MQGas";
/**
 * @category Parts
 */
export interface MQ2Options extends MQGasSensorOptions {
}
/**
 * @category Parts
 */
export default class MQ2 extends MQGas {
    static info(): {
        name: string;
    };
    constructor();
}
