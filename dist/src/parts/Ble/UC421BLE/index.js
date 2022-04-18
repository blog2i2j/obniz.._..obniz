"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UC421BLE {
    constructor(peripheral) {
        if (!peripheral || !UC421BLE.isDevice(peripheral)) {
            throw new Error('peripheral is not UC421BLE');
        }
        this._peripheral = peripheral;
    }
    static info() {
        return {
            name: 'UC421BLE',
        };
    }
    static isDevice(peripheral) {
        return (peripheral.localName && peripheral.localName.startsWith('UC-421BLE_'));
    }
    async pairingWait() {
        if (!this._peripheral) {
            throw new Error('UC421BLE not found');
        }
        this._peripheral.ondisconnect = (reason) => {
            if (typeof this.ondisconnect === 'function') {
                this.ondisconnect(reason);
            }
        };
        let key = null;
        await this._peripheral.connectWait({
            pairingOption: {
                onPairedCallback: (pairingKey) => {
                    key = pairingKey;
                },
            },
        });
        return key;
    }
    async aquireNewUserNoWait(cc) {
        const ccArr = this._toCcArr(cc);
        let no = null;
        const opcodeRegister = 0x01;
        const opcodeResponse = 0x20;
        const responseValueSuccess = 0x01;
        const responseValueErrorInvalidParameter = 0x03;
        const responseValueErrorOperationFailed = 0x04;
        const _analyzeData = (data) => {
            const opcode = data[0];
            const requestedOpcode = data[1];
            const responseValue = data[2];
            if (opcode === opcodeResponse && requestedOpcode === opcodeRegister) {
                if (responseValue === responseValueSuccess) {
                    const responseParameter = data[3];
                    no = responseParameter;
                }
                else {
                    switch (responseValue) {
                        case responseValueErrorInvalidParameter:
                            throw new Error('cc is too long or payload too big.');
                        case responseValueErrorOperationFailed:
                            throw new Error('All user no are already used.');
                        default:
                            throw new Error('Unkonw response value.');
                    }
                }
            }
        };
        const userControlPointChar = await this._getUserControlPointCharWait();
        await userControlPointChar.registerNotifyWait(_analyzeData);
        await userControlPointChar.writeWait([opcodeRegister, ...ccArr]);
        if (!no)
            throw new Error('Failed to register new user.');
        return no;
    }
    async authorizeUserWait(userNo, cc) {
        let authorized = false;
        const ccArr = this._toCcArr(cc);
        const opcodeAuthorize = 0x02;
        const opcodeResponse = 0x20;
        const responseValueSuccess = 0x01;
        const responseValueErrorPayloadTooLong = 0x03;
        const responseValueErrorFailedThreeTimes = 0x04;
        const responseValueErrorCcMismatch = 0x05;
        const _analyzeData = (data) => {
            const opcode = data[0];
            const requestedOpcode = data[1];
            const responseValue = data[2];
            if (opcode === opcodeResponse && requestedOpcode === opcodeAuthorize) {
                if (responseValue === responseValueSuccess) {
                    authorized = true;
                }
                else {
                    switch (responseValue) {
                        case responseValueErrorPayloadTooLong:
                            throw new Error('Requested data is too long.');
                        case responseValueErrorFailedThreeTimes:
                            throw new Error('Failed authorization three times in a row.');
                        case responseValueErrorCcMismatch:
                            throw new Error('Given cc mismatches to one of given user no.');
                        default:
                            throw new Error('Unknown response value.');
                    }
                }
            }
        };
        const userControlPointChar = await this._getUserControlPointCharWait();
        await userControlPointChar.registerNotifyWait(_analyzeData);
        await userControlPointChar.writeWait([opcodeAuthorize, userNo, ...ccArr]);
        if (!authorized)
            throw new Error('Authorization failed.');
    }
    async updateUserInfoDataWait(userInfo) {
        const updateFunctions = [];
        // update check inputs
        if (userInfo.firstName) {
            const buf = Buffer.from(userInfo.firstName, 'utf-8');
            const arr = Array.from(buf);
            // validation, max 20 bytes
            if (arr.length > 20)
                throw new Error('The length of first name should be within 20 bytes.');
            const updateFirstName = async () => {
                const firstNameChar = await this._getFirstNameCharWait();
                await firstNameChar.writeWait(arr);
            };
            updateFunctions.push(updateFirstName);
        }
        if (userInfo.lastName) {
            const buf = Buffer.from(userInfo.lastName, 'utf-8');
            // validation, max 20 bytes
            if (buf.length > 20)
                throw new Error('The length of last name should be within 20 bytes.');
            const updateLastName = async () => {
                const lastNameChar = await this._getLastNameCharWait();
                await lastNameChar.writeWait(buf);
            };
            updateFunctions.push(updateLastName);
        }
        if (userInfo.email) {
            const buf = Buffer.from(userInfo.email, 'utf-8');
            // validation, max 20 bytes
            if (buf.length > 16)
                throw new Error('The length of email should be within 16 bytes.');
            const updateEmail = async () => {
                const emailChar = await this._getEmailCharWait();
                await emailChar.writeWait(buf);
            };
            updateFunctions.push(updateEmail);
        }
        if (userInfo.birth) {
            const { year, month, day } = userInfo.birth;
            // TODO: validate the values
            // 1977, 1, 2 -> [0xB9, 0x07, 0x01, 0x02]
            const buf = Buffer.alloc(4);
            buf.writeUInt16LE(year, 0);
            buf.writeUInt8(month, 2);
            buf.writeUInt8(day, 3);
            const arr = Array.from(buf);
            const updateBirth = async () => {
                const birthChar = await this._getBirthCharWait();
                await birthChar.writeWait(arr);
            };
            updateFunctions.push(updateBirth);
        }
        if (userInfo.gender) {
            const arr = new Array(1);
            switch (userInfo.gender) {
                case 'male':
                    arr[0] = 0x00;
                    break;
                case 'female':
                    arr[0] = 0x01;
                    break;
                case 'unspecified':
                    // NOTE: The peripheral won't mesure the body composition data in this case.
                    arr[0] = 0x02;
                    break;
                default:
                    throw new Error('Unknown gender.');
            }
            const updateGender = async () => {
                const genderChar = await this._getGenderCharWait();
                await genderChar.writeWait(arr);
            };
            updateFunctions.push(updateGender);
        }
        if (userInfo.height) {
            // Acceptable value ranges from 90 to 220.
            const buf = Buffer.alloc(2);
            buf.writeUInt16LE(userInfo.height, 0);
            const arr = Array.from(buf);
            const updateHeight = async () => {
                const heightChar = await this._getHeightCharWait();
                await heightChar.writeWait(arr);
            };
            updateFunctions.push(updateHeight);
        }
        // update the info
        for (const updateFunc of updateFunctions) {
            await updateFunc();
        }
    }
    async getUserInfoDataWait() {
        const firstNameChar = await this._getFirstNameCharWait();
        const lastNameChar = await this._getLastNameCharWait();
        const emailChar = await this._getEmailCharWait();
        const birthChar = await this._getBirthCharWait();
        const heightChar = await this._getHeightCharWait();
        const genderChar = await this._getGenderCharWait();
        const firstNameBytes = await firstNameChar.readWait();
        const lastNameBytes = await lastNameChar.readWait();
        const emailBytes = await emailChar.readWait();
        const birthBytes = await birthChar.readWait();
        const heightBytes = await heightChar.readWait();
        const genderBytes = await genderChar.readWait();
        const firstName = String.fromCharCode(...firstNameBytes);
        const lastName = String.fromCharCode(...lastNameBytes);
        const email = String.fromCharCode(...emailBytes);
        const bufBirth = Buffer.from(birthBytes);
        const birth = {
            year: bufBirth.readUInt16LE(0),
            month: bufBirth.readUInt8(2),
            day: bufBirth.readUInt8(3),
        };
        const bHeight = Buffer.from(heightBytes);
        const height = bHeight.readInt16LE(0);
        let gender = 'unspecified';
        switch (genderBytes[0]) {
            case 0x00:
                gender = 'male';
                break;
            case 0x01:
                gender = 'female';
                break;
        }
        const userInfo = {
            firstName,
            lastName,
            email,
            birth,
            height,
            gender,
        };
        return userInfo;
    }
    async getWeightDataWait() {
        const enableCccd = 0x01;
        const results = [];
        const waitDisconnect = new Promise((resolve, reject) => {
            if (!this._peripheral)
                return;
            this._peripheral.ondisconnect = (reason) => resolve(results);
        });
        const _analyzeData = (data) => {
            const result = {};
            const buf = Buffer.from(data);
            let offset = 0;
            // flags
            const flags = buf.readUInt8(offset);
            const bit0 = 0b00000001;
            const bit1 = 0b00000010;
            const bit2 = 0b00000100;
            const bit3 = 0b00001000;
            const measurementUnit = flags & bit0 ? 'lb' : 'kg';
            const timeStampPresent = flags & bit1 ? true : false;
            const userIdPresent = flags & bit2 ? true : false;
            const bmiAndHeightPresent = flags & bit3 ? true : false;
            const byteLenFlags = 1;
            offset += byteLenFlags;
            // get weight
            const resolutionWeight = 0.005; // TODO: Get resolution.
            const weightMass = buf.readUInt16LE(offset); // TODO: Error handling.
            const weight = weightMass * resolutionWeight;
            const byteLenWeight = 2;
            offset += byteLenWeight;
            result.weight = { unit: measurementUnit, value: weight };
            // get ts
            if (timeStampPresent) {
                const year = buf.readUInt16LE(offset);
                const byteLenYear = 2;
                offset += byteLenYear;
                const month = buf.readUInt8(offset);
                const byteLenMonth = 1;
                offset += byteLenMonth;
                const day = buf.readUInt8(offset);
                const byteLenDay = 1;
                offset += byteLenDay;
                const hour = buf.readUInt8(offset);
                const byteLenHour = 1;
                offset += byteLenHour;
                const minute = buf.readUInt8(offset);
                const byteLenMinute = 1;
                offset += byteLenMinute;
                const second = buf.readUInt8(offset);
                const byteLenSecond = 1;
                offset += byteLenSecond;
                // TODO: Handle timestamp.
                result.timestamp = {
                    year,
                    month,
                    day,
                    hour,
                    minute,
                    second,
                };
            }
            if (userIdPresent) {
                // Do nothing about user id.
                const byteLenUserId = 1;
                offset += byteLenUserId;
            }
            // get bmi
            if (bmiAndHeightPresent) {
                const resolutionBmi = 0.1; // TODO: Get resolution.
                const bmiMass = buf.readUInt16LE(offset);
                const bmi = bmiMass * resolutionBmi;
                const byteLenBmi = 2;
                offset += byteLenBmi;
                const resolutionHeight = 0.1; // TODO: Get resolution.
                const heightMass = buf.readUInt16LE(offset);
                const height = heightMass * resolutionHeight;
                const byteLenHeight = 2;
                offset += byteLenHeight;
                result.bmi = bmi;
                result.height = height;
            }
            return result;
        };
        // weight
        const weightScaleChar = await this._getWeightScaleMeasurementCharWait();
        await weightScaleChar.registerNotifyWait((data) => {
            results.push(_analyzeData(data));
        });
        // enable cccd
        const weightScaleCccd = weightScaleChar.getDescriptor('2902');
        if (!weightScaleCccd)
            throw new Error('Failed to get cccd of weight scale charactaristic.');
        // The data is notified as soon as cccd is enabled.
        weightScaleCccd.writeWait([enableCccd]);
        // NOTE: This is recommended in official doc, though don't know the necessity...
        await new Promise((resolve, reject) => setTimeout(resolve, 500));
        return await waitDisconnect;
    }
    /*
      PRIVSTE METHODS
    */
    _toCcArr(cc) {
        if (cc < 0 || cc > 9999) {
            throw new Error('cc must be within the range from 0000 to 9999.');
        }
        const buf = Buffer.alloc(2);
        buf.writeUInt16LE(cc, 0);
        const ccArr = Array.from(buf);
        return ccArr;
    }
    async _getUserDataServiceWait() {
        const userDataService = this._peripheral.getService('181C');
        if (!userDataService)
            throw new Error('Failed to get UserDataService.');
        return userDataService;
    }
    async _getWeightScaleServiceWait() {
        const weightScaleService = this._peripheral.getService('181D');
        if (!weightScaleService)
            throw new Error('Failed to get WeightScaleService.');
        return weightScaleService;
    }
    async _getBodyCompositionServiceWait() {
        const bodyCompositionService = this._peripheral.getService('181B');
        if (!bodyCompositionService)
            throw new Error('Failed to get BodyCompositionService.');
        return bodyCompositionService;
    }
    async _getUserControlPointCharWait() {
        const userDataService = await this._getUserDataServiceWait();
        const userControlPointChar = userDataService.getCharacteristic('2A9F');
        if (!userControlPointChar)
            throw new Error('Failed to get UserControlPoint charactaristic.');
        return userControlPointChar;
    }
    async _getFirstNameCharWait() {
        const userDataService = await this._getUserDataServiceWait();
        const fistNameChar = userDataService.getCharacteristic('2A8A');
        if (!fistNameChar)
            throw new Error('Failed to get FirstName charactaristic.');
        return fistNameChar;
    }
    async _getLastNameCharWait() {
        const userDataService = await this._getUserDataServiceWait();
        const lastNameChar = userDataService.getCharacteristic('2A90');
        if (!lastNameChar)
            throw new Error('Failed to get LastName charactaristic.');
        return lastNameChar;
    }
    async _getEmailCharWait() {
        const userDataService = await this._getUserDataServiceWait();
        const emailChar = userDataService.getCharacteristic('2A87');
        if (!emailChar)
            throw new Error('Failed to get Email charactaristic.');
        return emailChar;
    }
    async _getBirthCharWait() {
        const userDataService = await this._getUserDataServiceWait();
        const birthChar = userDataService.getCharacteristic('2A85');
        if (!birthChar)
            throw new Error('Failed to get Birth charactaristic.');
        return birthChar;
    }
    async _getGenderCharWait() {
        const userDataService = await this._getUserDataServiceWait();
        const genderChar = userDataService.getCharacteristic('2A8C');
        if (!genderChar)
            throw new Error('Failed to get Gender charactaristic.');
        return genderChar;
    }
    async _getHeightCharWait() {
        const userDataService = await this._getUserDataServiceWait();
        const heightChar = userDataService.getCharacteristic('2A8E');
        if (!heightChar)
            throw new Error('Failed to get Height charactaristic.');
        return heightChar;
    }
    async _getWeightScaleMeasurementCharWait() {
        const weightScaleService = await this._getWeightScaleServiceWait();
        const weightScaleMeasurementChar = weightScaleService.getCharacteristic('2A9D');
        if (!weightScaleMeasurementChar)
            throw new Error('Failed to get Weight Measurement charactaristic.');
        return weightScaleMeasurementChar;
    }
    async _getBodyCompositionMeasurementCharWait() {
        const bodyCompositionService = await this._getBodyCompositionServiceWait();
        const bodyCompositionMeasurementChar = bodyCompositionService.getCharacteristic('2A9C');
        if (!bodyCompositionMeasurementChar)
            throw new Error('Failed to get Body Composition Measurement charactaristic.');
        return bodyCompositionMeasurementChar;
    }
}
exports.default = UC421BLE;
