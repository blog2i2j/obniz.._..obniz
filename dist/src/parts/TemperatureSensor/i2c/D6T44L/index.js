"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @category Parts
 */
class D6T44L {
    constructor() {
        this.requiredKeys = [];
        this.keys = ["vcc", "gnd", "sda", "scl", "clock"];
        this.address = 0x0a;
        this.ioKeys = ["vcc", "gnd", "sda", "scl"];
        this.commands = {};
        this.commands.read_data = [0x4c];
    }
    static info() {
        return {
            name: "D6T44L",
        };
    }
    wired(obniz) {
        this.obniz = obniz;
        this.obniz.setVccGnd(this.params.vcc, this.params.gnd, "5v");
        this.params.clock = this.params.clock || 100 * 1000; // for i2c
        this.params.mode = this.params.mode || "master"; // for i2c
        this.params.pull = this.params.pull || null; // for i2c
        this.i2c = obniz.getI2CWithConfig(this.params);
        this.obniz.wait(50);
    }
    getOnePixWait(pixcel) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getAllPixWait();
            return data[pixcel];
        });
    }
    getAllPixWait() {
        return __awaiter(this, void 0, void 0, function* () {
            this.i2c.write(this.address, [0x4c]);
            // await obniz.wait(160);
            const raw = yield this.i2c.readWait(this.address, 35);
            const data = [];
            for (let i = 0; i < 16; i++) {
                data[i] = parseFloat(((raw[i * 2 + 2] + (raw[i * 2 + 3] << 8)) * 0.1).toFixed(1));
            }
            return data;
        });
    }
}
exports.default = D6T44L;

//# sourceMappingURL=index.js.map
