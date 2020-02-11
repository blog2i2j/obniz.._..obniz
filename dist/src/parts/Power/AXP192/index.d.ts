import Obniz from "../../../obniz";
import ObnizPartsInterface, { ObnizPartsInfo } from "../../../obniz/ObnizPartsInterface";
import { I2cPartsAbstructOptions } from "../../../parts/i2cParts";
/**
 * @category Parts
 */
export interface AXP192Options extends I2cPartsAbstructOptions {
}
/**
 * @category Parts
 */
export default class AXP192 implements ObnizPartsInterface {
    static info(): ObnizPartsInfo;
    requiredKeys: string[];
    keys: string[];
    params: any;
    protected i2c: any;
    constructor();
    wired(obniz: Obniz): void;
    set(address: number, data: number): void;
    getWait(address: number): Promise<any>;
    setLDO2Voltage(voltage: number): Promise<void>;
    setLDO3Voltage(voltage: number): Promise<void>;
    set3VLDO2_3(): void;
    enableLDO2_3(): void;
    toggleLDO2(val: number): Promise<void>;
    toggleLDO3(val: number): Promise<void>;
    initM5StickC(): void;
    getVbat(): Promise<any>;
}
