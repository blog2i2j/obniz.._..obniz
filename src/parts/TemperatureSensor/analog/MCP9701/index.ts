import ObnizPartsInterface, {ObnizPartsInfo} from "../../../../obniz/ObnizPartsInterface";
import AnalogTemperatureSensor, {AnalogTemperatureSensorOptions} from "../AnalogTemperatureSensor";

/**
 * @category Parts
 */
export interface  MCP9701Options extends AnalogTemperatureSensorOptions {
}

/**
 * @category Parts
 */
export default class MCP9701 extends AnalogTemperatureSensor implements ObnizPartsInterface {
  public static info(): ObnizPartsInfo {
    return {
      name: "MCP9701",
    };
  }

  public calc(voltage: any) {
    return (voltage - 0.4) / 0.0195; // Temp(Celsius) = ([AD Voltage]-[Voltage at 0 deg])/[Temp coefficient]
  }
}
