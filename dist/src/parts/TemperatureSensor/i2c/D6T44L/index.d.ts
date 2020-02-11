import Obniz from "../../../../obniz";
import PeripheralI2C from "../../../../obniz/libs/io_peripherals/i2c";
import ObnizPartsInterface, { ObnizPartsInfo } from "../../../../obniz/ObnizPartsInterface";
import { I2cPartsAbstructOptions } from "../../../i2cParts";
/**
 * @category Parts
 */
export interface D6T44LOptions extends I2cPartsAbstructOptions {
}
/**
 * @category Parts
 */
declare class D6T44L implements ObnizPartsInterface {
    static info(): ObnizPartsInfo;
    requiredKeys: string[];
    keys: string[];
    params: any;
    address: any;
    ioKeys: string[];
    commands: any;
    protected obniz: Obniz;
    protected i2c: PeripheralI2C;
    constructor();
    wired(obniz: Obniz): void;
    getOnePixWait(pixcel: number): Promise<number>;
    getAllPixWait(): Promise<number[]>;
}
export default D6T44L;
