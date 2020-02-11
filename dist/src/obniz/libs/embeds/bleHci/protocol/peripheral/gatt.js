"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// var debug = require('debug')('gatt');
const debug = () => {
};
const events_1 = __importDefault(require("events"));
/* eslint-disable no-unused-vars */
/**
 * @ignore
 */
var ATT;
(function (ATT) {
    ATT.OP_ERROR = 0x01;
    ATT.OP_MTU_REQ = 0x02;
    ATT.OP_MTU_RESP = 0x03;
    ATT.OP_FIND_INFO_REQ = 0x04;
    ATT.OP_FIND_INFO_RESP = 0x05;
    ATT.OP_FIND_BY_TYPE_REQ = 0x06;
    ATT.OP_FIND_BY_TYPE_RESP = 0x07;
    ATT.OP_READ_BY_TYPE_REQ = 0x08;
    ATT.OP_READ_BY_TYPE_RESP = 0x09;
    ATT.OP_READ_REQ = 0x0a;
    ATT.OP_READ_RESP = 0x0b;
    ATT.OP_READ_BLOB_REQ = 0x0c;
    ATT.OP_READ_BLOB_RESP = 0x0d;
    ATT.OP_READ_MULTI_REQ = 0x0e;
    ATT.OP_READ_MULTI_RESP = 0x0f;
    ATT.OP_READ_BY_GROUP_REQ = 0x10;
    ATT.OP_READ_BY_GROUP_RESP = 0x11;
    ATT.OP_WRITE_REQ = 0x12;
    ATT.OP_WRITE_RESP = 0x13;
    ATT.OP_WRITE_CMD = 0x52;
    ATT.OP_PREP_WRITE_REQ = 0x16;
    ATT.OP_PREP_WRITE_RESP = 0x17;
    ATT.OP_EXEC_WRITE_REQ = 0x18;
    ATT.OP_EXEC_WRITE_RESP = 0x19;
    ATT.OP_HANDLE_NOTIFY = 0x1b;
    ATT.OP_HANDLE_IND = 0x1d;
    ATT.OP_HANDLE_CNF = 0x1e;
    ATT.OP_SIGNED_WRITE_CMD = 0xd2;
    ATT.ECODE_SUCCESS = 0x00;
    ATT.ECODE_INVALID_HANDLE = 0x01;
    ATT.ECODE_READ_NOT_PERM = 0x02;
    ATT.ECODE_WRITE_NOT_PERM = 0x03;
    ATT.ECODE_INVALID_PDU = 0x04;
    ATT.ECODE_AUTHENTICATION = 0x05;
    ATT.ECODE_REQ_NOT_SUPP = 0x06;
    ATT.ECODE_INVALID_OFFSET = 0x07;
    ATT.ECODE_AUTHORIZATION = 0x08;
    ATT.ECODE_PREP_QUEUE_FULL = 0x09;
    ATT.ECODE_ATTR_NOT_FOUND = 0x0a;
    ATT.ECODE_ATTR_NOT_LONG = 0x0b;
    ATT.ECODE_INSUFF_ENCR_KEY_SIZE = 0x0c;
    ATT.ECODE_INVAL_ATTR_VALUE_LEN = 0x0d;
    ATT.ECODE_UNLIKELY = 0x0e;
    ATT.ECODE_INSUFF_ENC = 0x0f;
    ATT.ECODE_UNSUPP_GRP_TYPE = 0x10;
    ATT.ECODE_INSUFF_RESOURCES = 0x11;
    ATT.CID = 0x0004;
})(ATT || (ATT = {}));
/**
 * @ignore
 */
var GATT;
(function (GATT) {
    GATT.PRIM_SVC_UUID = 0x2800;
    GATT.INCLUDE_UUID = 0x2802;
    GATT.CHARAC_UUID = 0x2803;
    GATT.CLIENT_CHARAC_CFG_UUID = 0x2902;
    GATT.SERVER_CHARAC_CFG_UUID = 0x2903;
})(GATT || (GATT = {}));
/* eslint-enable no-unused-vars */
/**
 * @ignore
 */
class Gatt extends events_1.default.EventEmitter {
    constructor() {
        super();
        this.maxMtu = 256;
        this._mtu = 23;
        this._preparedWriteRequest = null;
        this.setServices([]);
        this.onAclStreamDataBinded = this.onAclStreamData.bind(this);
        this.onAclStreamEndBinded = this.onAclStreamEnd.bind(this);
    }
    setServices(services) {
        // var deviceName = process.env.BLENO_DEVICE_NAME || os.hostname();
        // base services and characteristics
        const allServices = [
        // {
        //   uuid: '1800',
        //   characteristics: [
        //     {
        //       uuid: '2a00',
        //       properties: ['read'],
        //       secure: [],
        //       value: Buffer.from(deviceName),
        //       descriptors: []
        //     },
        //     {
        //       uuid: '2a01',
        //       properties: ['read'],
        //       secure: [],
        //       value: Buffer.from([0x80, 0x00]),
        //       descriptors: []
        //     }
        //   ]
        // },
        // {
        //   uuid: '1801',
        //   characteristics: [
        //     {
        //       uuid: '2a05',
        //       properties: ['indicate'],
        //       secure: [],
        //       value: Buffer.from([0x00, 0x00, 0x00, 0x00]),
        //       descriptors: []
        //     }
        //   ]
        // }
        ].concat(services);
        this._handles = [];
        let handle = 0;
        let i;
        let j;
        for (i = 0; i < allServices.length; i++) {
            const service = allServices[i];
            handle++;
            const serviceHandle = handle;
            this._handles[serviceHandle] = {
                type: "service",
                uuid: service.uuid,
                attribute: service,
                startHandle: serviceHandle,
            };
            for (j = 0; j < service.characteristics.length; j++) {
                const characteristic = service.characteristics[j];
                let properties = 0;
                let secure = 0;
                if (characteristic.properties.indexOf("read") !== -1) {
                    properties |= 0x02;
                    if (characteristic.secure.indexOf("read") !== -1) {
                        secure |= 0x02;
                    }
                }
                if (characteristic.properties.indexOf("writeWithoutResponse") !== -1) {
                    properties |= 0x04;
                    if (characteristic.secure.indexOf("writeWithoutResponse") !== -1) {
                        secure |= 0x04;
                    }
                }
                if (characteristic.properties.indexOf("write") !== -1) {
                    properties |= 0x08;
                    if (characteristic.secure.indexOf("write") !== -1) {
                        secure |= 0x08;
                    }
                }
                if (characteristic.properties.indexOf("notify") !== -1) {
                    properties |= 0x10;
                    if (characteristic.secure.indexOf("notify") !== -1) {
                        secure |= 0x10;
                    }
                }
                if (characteristic.properties.indexOf("indicate") !== -1) {
                    properties |= 0x20;
                    if (characteristic.secure.indexOf("indicate") !== -1) {
                        secure |= 0x20;
                    }
                }
                handle++;
                const characteristicHandle = handle;
                handle++;
                const characteristicValueHandle = handle;
                this._handles[characteristicHandle] = {
                    type: "characteristic",
                    uuid: characteristic.uuid,
                    properties,
                    secure,
                    attribute: characteristic,
                    startHandle: characteristicHandle,
                    valueHandle: characteristicValueHandle,
                };
                this._handles[characteristicValueHandle] = {
                    type: "characteristicValue",
                    handle: characteristicValueHandle,
                    value: characteristic.value,
                };
                const hasCCCD = characteristic.descriptors.find((e) => e.uuid === "2902");
                if (hasCCCD || properties & 0x30) {
                    // notify or indicate
                    // add client characteristic configuration descriptor
                    handle++;
                    const clientCharacteristicConfigurationDescriptorHandle = handle;
                    this._handles[clientCharacteristicConfigurationDescriptorHandle] = {
                        type: "descriptor",
                        handle: clientCharacteristicConfigurationDescriptorHandle,
                        uuid: "2902",
                        attribute: characteristic,
                        properties: 0x02 | 0x04 | 0x08,
                        secure: secure & 0x10 ? 0x02 | 0x04 | 0x08 : 0,
                        value: Buffer.from([0x00, 0x00]),
                    };
                }
                for (let k = 0; k < characteristic.descriptors.length; k++) {
                    const descriptor = characteristic.descriptors[k];
                    if (descriptor.uuid === "2902") {
                        continue;
                    }
                    handle++;
                    const descriptorHandle = handle;
                    this._handles[descriptorHandle] = {
                        type: "descriptor",
                        handle: descriptorHandle,
                        uuid: descriptor.uuid,
                        attribute: descriptor,
                        properties: 0x02,
                        secure: 0x00,
                        value: descriptor.value,
                    };
                }
            }
            this._handles[serviceHandle].endHandle = handle;
        }
        const debugHandles = [];
        for (i = 0; i < this._handles.length; i++) {
            handle = this._handles[i];
            debugHandles[i] = {};
            for (j in handle) {
                if (Buffer.isBuffer(handle[j])) {
                    debugHandles[i][j] = handle[j]
                        ? "Buffer('" + handle[j].toString("hex") + "', 'hex')"
                        : null;
                }
                else if (j !== "attribute") {
                    debugHandles[i][j] = handle[j];
                }
            }
        }
        debug("handles = " + JSON.stringify(debugHandles, null, 2));
    }
    setAclStream(aclStream) {
        this._mtu = 23;
        this._preparedWriteRequest = null;
        this._aclStream = aclStream;
        this._aclStream.on("data", this.onAclStreamDataBinded);
        this._aclStream.on("end", this.onAclStreamEndBinded);
    }
    onAclStreamData(cid, data) {
        if (cid !== ATT.CID) {
            return;
        }
        this.handleRequest(data);
    }
    onAclStreamEnd() {
        this._aclStream.removeListener("data", this.onAclStreamDataBinded);
        this._aclStream.removeListener("end", this.onAclStreamEndBinded);
        for (let i = 0; i < this._handles.length; i++) {
            if (this._handles[i] &&
                this._handles[i].type === "descriptor" &&
                this._handles[i].uuid === "2902" &&
                this._handles[i].value.readUInt16LE(0) !== 0) {
                this._handles[i].value = Buffer.from([0x00, 0x00]);
                if (this._handles[i].attribute && this._handles[i].attribute.emit) {
                    this._handles[i].attribute.emit("unsubscribe");
                }
            }
        }
    }
    send(data) {
        debug("send: " + data.toString("hex"));
        this._aclStream.write(ATT.CID, data);
    }
    errorResponse(opcode, handle, status) {
        const buf = Buffer.alloc(5);
        buf.writeUInt8(ATT.OP_ERROR, 0);
        buf.writeUInt8(opcode, 1);
        buf.writeUInt16LE(handle, 2);
        buf.writeUInt8(status, 4);
        return buf;
    }
    handleRequest(request) {
        debug("handing request: " + request.toString("hex"));
        const requestType = request[0];
        let response = null;
        switch (requestType) {
            case ATT.OP_MTU_REQ:
                response = this.handleMtuRequest(request);
                break;
            case ATT.OP_FIND_INFO_REQ:
                response = this.handleFindInfoRequest(request);
                break;
            case ATT.OP_FIND_BY_TYPE_REQ:
                response = this.handleFindByTypeRequest(request);
                break;
            case ATT.OP_READ_BY_TYPE_REQ:
                response = this.handleReadByTypeRequest(request);
                break;
            case ATT.OP_READ_REQ:
            case ATT.OP_READ_BLOB_REQ:
                response = this.handleReadOrReadBlobRequest(request);
                break;
            case ATT.OP_READ_BY_GROUP_REQ:
                response = this.handleReadByGroupRequest(request);
                break;
            case ATT.OP_WRITE_REQ:
            case ATT.OP_WRITE_CMD:
                response = this.handleWriteRequestOrCommand(request);
                break;
            case ATT.OP_PREP_WRITE_REQ:
                response = this.handlePrepareWriteRequest(request);
                break;
            case ATT.OP_EXEC_WRITE_REQ:
                response = this.handleExecuteWriteRequest(request);
                break;
            case ATT.OP_HANDLE_CNF:
                response = this.handleConfirmation(request);
                break;
            default:
            case ATT.OP_READ_MULTI_REQ:
            case ATT.OP_SIGNED_WRITE_CMD:
                response = this.errorResponse(requestType, 0x0000, ATT.ECODE_REQ_NOT_SUPP);
                break;
        }
        if (response) {
            debug("response: " + response.toString("hex"));
            this.send(response);
        }
    }
    handleMtuRequest(request) {
        let mtu = request.readUInt16LE(1);
        if (mtu < 23) {
            mtu = 23;
        }
        else if (mtu > this.maxMtu) {
            mtu = this.maxMtu;
        }
        this._mtu = mtu;
        this.emit("mtuChange", this._mtu);
        const response = Buffer.alloc(3);
        response.writeUInt8(ATT.OP_MTU_RESP, 0);
        response.writeUInt16LE(mtu, 1);
        return response;
    }
    handleFindInfoRequest(request) {
        let response = null;
        const startHandle = request.readUInt16LE(1);
        const endHandle = request.readUInt16LE(3);
        const infos = [];
        let uuid = null;
        let i;
        for (i = startHandle; i <= endHandle; i++) {
            const handle = this._handles[i];
            if (!handle) {
                break;
            }
            uuid = null;
            if ("service" === handle.type) {
                uuid = "2800";
            }
            else if ("includedService" === handle.type) {
                uuid = "2802";
            }
            else if ("characteristic" === handle.type) {
                uuid = "2803";
            }
            else if ("characteristicValue" === handle.type) {
                uuid = this._handles[i - 1].uuid;
            }
            else if ("descriptor" === handle.type) {
                uuid = handle.uuid;
            }
            if (uuid) {
                infos.push({
                    handle: i,
                    uuid,
                });
            }
        }
        if (infos.length) {
            const uuidSize = infos[0].uuid.length / 2;
            let numInfo = 1;
            for (i = 1; i < infos.length; i++) {
                if (infos[0].uuid.length !== infos[i].uuid.length) {
                    break;
                }
                numInfo++;
            }
            const lengthPerInfo = uuidSize === 2 ? 4 : 18;
            const maxInfo = Math.floor((this._mtu - 2) / lengthPerInfo);
            numInfo = Math.min(numInfo, maxInfo);
            response = Buffer.alloc(2 + numInfo * lengthPerInfo);
            response[0] = ATT.OP_FIND_INFO_RESP;
            response[1] = uuidSize === 2 ? 0x01 : 0x2;
            for (i = 0; i < numInfo; i++) {
                const info = infos[i];
                response.writeUInt16LE(info.handle, 2 + i * lengthPerInfo);
                uuid = Buffer.from(info.uuid
                    .match(/.{1,2}/g)
                    .reverse()
                    .join(""), "hex");
                for (let j = 0; j < uuid.length; j++) {
                    response[2 + i * lengthPerInfo + 2 + j] = uuid[j];
                }
            }
        }
        else {
            response = this.errorResponse(ATT.OP_FIND_INFO_REQ, startHandle, ATT.ECODE_ATTR_NOT_FOUND);
        }
        return response;
    }
    handleFindByTypeRequest(request) {
        let response = null;
        const startHandle = request.readUInt16LE(1);
        const endHandle = request.readUInt16LE(3);
        const uuid = request
            .slice(5, 7)
            .toString("hex")
            .match(/.{1,2}/g)
            .reverse()
            .join("");
        const value = request
            .slice(7)
            .toString("hex")
            .match(/.{1,2}/g)
            .reverse()
            .join("");
        const handles = [];
        let handle;
        for (let i = startHandle; i <= endHandle; i++) {
            handle = this._handles[i];
            if (!handle) {
                break;
            }
            if ("2800" === uuid &&
                handle.type === "service" &&
                handle.uuid === value) {
                handles.push({
                    start: handle.startHandle,
                    end: handle.endHandle,
                });
            }
        }
        if (handles.length) {
            const lengthPerHandle = 4;
            let numHandles = handles.length;
            const maxHandles = Math.floor((this._mtu - 1) / lengthPerHandle);
            numHandles = Math.min(numHandles, maxHandles);
            response = Buffer.alloc(1 + numHandles * lengthPerHandle);
            response[0] = ATT.OP_FIND_BY_TYPE_RESP;
            for (let i = 0; i < numHandles; i++) {
                handle = handles[i];
                response.writeUInt16LE(handle.start, 1 + i * lengthPerHandle);
                response.writeUInt16LE(handle.end, 1 + i * lengthPerHandle + 2);
            }
        }
        else {
            response = this.errorResponse(ATT.OP_FIND_BY_TYPE_REQ, startHandle, ATT.ECODE_ATTR_NOT_FOUND);
        }
        return response;
    }
    handleReadByGroupRequest(request) {
        let response = null;
        const startHandle = request.readUInt16LE(1);
        const endHandle = request.readUInt16LE(3);
        const uuid = request
            .slice(5)
            .toString("hex")
            .match(/.{1,2}/g)
            .reverse()
            .join("");
        debug("read by group: startHandle = 0x" +
            startHandle.toString(16) +
            ", endHandle = 0x" +
            endHandle.toString(16) +
            ", uuid = 0x" +
            uuid.toString(16));
        if ("2800" === uuid || "2802" === uuid) {
            const services = [];
            const type = "2800" === uuid ? "service" : "includedService";
            let i;
            for (i = startHandle; i <= endHandle; i++) {
                const handle = this._handles[i];
                if (!handle) {
                    break;
                }
                if (handle.type === type) {
                    services.push(handle);
                }
            }
            if (services.length) {
                const uuidSize = services[0].uuid.length / 2;
                let numServices = 1;
                for (i = 1; i < services.length; i++) {
                    if (services[0].uuid.length !== services[i].uuid.length) {
                        break;
                    }
                    numServices++;
                }
                const lengthPerService = uuidSize === 2 ? 6 : 20;
                const maxServices = Math.floor((this._mtu - 2) / lengthPerService);
                numServices = Math.min(numServices, maxServices);
                response = Buffer.alloc(2 + numServices * lengthPerService);
                response[0] = ATT.OP_READ_BY_GROUP_RESP;
                response[1] = lengthPerService;
                for (i = 0; i < numServices; i++) {
                    const service = services[i];
                    response.writeUInt16LE(service.startHandle, 2 + i * lengthPerService);
                    response.writeUInt16LE(service.endHandle, 2 + i * lengthPerService + 2);
                    const serviceUuid = Buffer.from(service.uuid
                        .match(/.{1,2}/g)
                        .reverse()
                        .join(""), "hex");
                    for (let j = 0; j < serviceUuid.length; j++) {
                        response[2 + i * lengthPerService + 4 + j] = serviceUuid[j];
                    }
                }
            }
            else {
                response = this.errorResponse(ATT.OP_READ_BY_GROUP_REQ, startHandle, ATT.ECODE_ATTR_NOT_FOUND);
            }
        }
        else {
            response = this.errorResponse(ATT.OP_READ_BY_GROUP_REQ, startHandle, ATT.ECODE_UNSUPP_GRP_TYPE);
        }
        return response;
    }
    handleReadByTypeRequest(request) {
        let response = null;
        const requestType = request[0];
        const startHandle = request.readUInt16LE(1);
        const endHandle = request.readUInt16LE(3);
        const uuid = request
            .slice(5)
            .toString("hex")
            .match(/.{1,2}/g)
            .reverse()
            .join("");
        let i;
        let handle;
        debug("read by type: startHandle = 0x" +
            startHandle.toString(16) +
            ", endHandle = 0x" +
            endHandle.toString(16) +
            ", uuid = 0x" +
            uuid.toString(16));
        if ("2803" === uuid) {
            const characteristics = [];
            for (i = startHandle; i <= endHandle; i++) {
                handle = this._handles[i];
                if (!handle) {
                    break;
                }
                if (handle.type === "characteristic") {
                    characteristics.push(handle);
                }
            }
            if (characteristics.length) {
                const uuidSize = characteristics[0].uuid.length / 2;
                let numCharacteristics = 1;
                for (i = 1; i < characteristics.length; i++) {
                    if (characteristics[0].uuid.length !== characteristics[i].uuid.length) {
                        break;
                    }
                    numCharacteristics++;
                }
                const lengthPerCharacteristic = uuidSize === 2 ? 7 : 21;
                const maxCharacteristics = Math.floor((this._mtu - 2) / lengthPerCharacteristic);
                numCharacteristics = Math.min(numCharacteristics, maxCharacteristics);
                response = Buffer.alloc(2 + numCharacteristics * lengthPerCharacteristic);
                response[0] = ATT.OP_READ_BY_TYPE_RESP;
                response[1] = lengthPerCharacteristic;
                for (i = 0; i < numCharacteristics; i++) {
                    const characteristic = characteristics[i];
                    response.writeUInt16LE(characteristic.startHandle, 2 + i * lengthPerCharacteristic);
                    response.writeUInt8(characteristic.properties, 2 + i * lengthPerCharacteristic + 2);
                    response.writeUInt16LE(characteristic.valueHandle, 2 + i * lengthPerCharacteristic + 3);
                    const characteristicUuid = Buffer.from(characteristic.uuid
                        .match(/.{1,2}/g)
                        .reverse()
                        .join(""), "hex");
                    for (let j = 0; j < characteristicUuid.length; j++) {
                        response[2 + i * lengthPerCharacteristic + 5 + j] =
                            characteristicUuid[j];
                    }
                }
            }
            else {
                response = this.errorResponse(ATT.OP_READ_BY_TYPE_REQ, startHandle, ATT.ECODE_ATTR_NOT_FOUND);
            }
        }
        else {
            let handleAttribute = null;
            let valueHandle = null;
            let secure = false;
            for (i = startHandle; i <= endHandle; i++) {
                handle = this._handles[i];
                if (!handle) {
                    break;
                }
                if (handle.type === "characteristic" && handle.uuid === uuid) {
                    handleAttribute = handle.attribute;
                    valueHandle = handle.valueHandle;
                    secure = handle.secure & 0x02;
                    break;
                }
                else if (handle.type === "descriptor" && handle.uuid === uuid) {
                    valueHandle = i;
                    secure = handle.secure & 0x02;
                    break;
                }
            }
            if (secure && !this._aclStream.encrypted) {
                response = this.errorResponse(ATT.OP_READ_BY_TYPE_REQ, startHandle, ATT.ECODE_AUTHENTICATION);
            }
            else if (valueHandle) {
                const callback = ((_valueHandle) => {
                    return (result, _data) => {
                        let callbackResponse = null;
                        if (ATT.ECODE_SUCCESS === result) {
                            const dataLength = Math.min(_data.length, this._mtu - 4);
                            callbackResponse = Buffer.alloc(4 + dataLength);
                            callbackResponse[0] = ATT.OP_READ_BY_TYPE_RESP;
                            callbackResponse[1] = dataLength + 2;
                            callbackResponse.writeUInt16LE(_valueHandle, 2);
                            for (i = 0; i < dataLength; i++) {
                                callbackResponse[4 + i] = _data[i];
                            }
                        }
                        else {
                            callbackResponse = this.errorResponse(requestType, _valueHandle, result);
                        }
                        debug("read by type response: " + callbackResponse.toString("hex"));
                        this.send(callbackResponse);
                    };
                })(valueHandle);
                const data = this._handles[valueHandle].value;
                if (data) {
                    callback(ATT.ECODE_SUCCESS, data);
                }
                else if (handleAttribute) {
                    handleAttribute.emit("readRequest", 0, callback);
                }
                else {
                    callback(ATT.ECODE_UNLIKELY);
                }
            }
            else {
                response = this.errorResponse(ATT.OP_READ_BY_TYPE_REQ, startHandle, ATT.ECODE_ATTR_NOT_FOUND);
            }
        }
        return response;
    }
    handleReadOrReadBlobRequest(request) {
        let response = null;
        const requestType = request[0];
        const valueHandle = request.readUInt16LE(1);
        const offset = requestType === ATT.OP_READ_BLOB_REQ ? request.readUInt16LE(3) : 0;
        const handle = this._handles[valueHandle];
        let i;
        if (handle) {
            let result = null;
            let data = null;
            const handleType = handle.type;
            const callback = ((_requestType, _valueHandle) => {
                return (_result, _data) => {
                    let callbackResponse = null;
                    if (ATT.ECODE_SUCCESS === _result) {
                        const dataLength = Math.min(_data.length, this._mtu - 1);
                        callbackResponse = Buffer.alloc(1 + dataLength);
                        callbackResponse[0] =
                            _requestType === ATT.OP_READ_BLOB_REQ
                                ? ATT.OP_READ_BLOB_RESP
                                : ATT.OP_READ_RESP;
                        for (i = 0; i < dataLength; i++) {
                            callbackResponse[1 + i] = _data[i];
                        }
                    }
                    else {
                        callbackResponse = this.errorResponse(_requestType, _valueHandle, _result);
                    }
                    debug("read response: " + callbackResponse.toString("hex"));
                    this.send(callbackResponse);
                };
            })(requestType, valueHandle);
            if (handleType === "service" || handleType === "includedService") {
                result = ATT.ECODE_SUCCESS;
                data = Buffer.from(handle.uuid
                    .match(/.{1,2}/g)
                    .reverse()
                    .join(""), "hex");
            }
            else if (handleType === "characteristic") {
                const uuid = Buffer.from(handle.uuid
                    .match(/.{1,2}/g)
                    .reverse()
                    .join(""), "hex");
                result = ATT.ECODE_SUCCESS;
                data = Buffer.alloc(3 + uuid.length);
                data.writeUInt8(handle.properties, 0);
                data.writeUInt16LE(handle.valueHandle, 1);
                for (i = 0; i < uuid.length; i++) {
                    data[i + 3] = uuid[i];
                }
            }
            else if (handleType === "characteristicValue" ||
                handleType === "descriptor") {
                let handleProperties = handle.properties;
                let handleSecure = handle.secure;
                let handleAttribute = handle.attribute;
                if (handleType === "characteristicValue") {
                    handleProperties = this._handles[valueHandle - 1].properties;
                    handleSecure = this._handles[valueHandle - 1].secure;
                    handleAttribute = this._handles[valueHandle - 1].attribute;
                }
                if (handleProperties & 0x02) {
                    if (handleSecure & 0x02 && !this._aclStream.encrypted) {
                        result = ATT.ECODE_AUTHENTICATION;
                    }
                    else {
                        data = handle.value;
                        if (data) {
                            result = ATT.ECODE_SUCCESS;
                        }
                        else {
                            handleAttribute.emit("readRequest", offset, callback);
                        }
                    }
                }
                else {
                    result = ATT.ECODE_READ_NOT_PERM; // non-readable
                }
            }
            if (data && typeof data === "string") {
                data = Buffer.from(data);
            }
            if (result === ATT.ECODE_SUCCESS && data && offset) {
                if (data.length < offset) {
                    result = ATT.ECODE_INVALID_OFFSET;
                    data = null;
                }
                else {
                    data = data.slice(offset);
                }
            }
            if (result !== null) {
                callback(result, data);
            }
        }
        else {
            response = this.errorResponse(requestType, valueHandle, ATT.ECODE_INVALID_HANDLE);
        }
        return response;
    }
    handleWriteRequestOrCommand(request) {
        let response = null;
        const requestType = request[0];
        const withoutResponse = requestType === ATT.OP_WRITE_CMD;
        const valueHandle = request.readUInt16LE(1);
        const data = request.slice(3);
        const offset = 0;
        let handle = this._handles[valueHandle];
        if (handle) {
            if (handle.type === "characteristicValue") {
                handle = this._handles[valueHandle - 1];
            }
            const handleProperties = handle.properties;
            const handleSecure = handle.secure;
            if (handleProperties &&
                (withoutResponse ? handleProperties & 0x04 : handleProperties & 0x08)) {
                const callback = ((_requestType, _valueHandle, _withoutResponse) => {
                    return (result) => {
                        if (!_withoutResponse) {
                            let callbackResponse = null;
                            if (ATT.ECODE_SUCCESS === result) {
                                callbackResponse = Buffer.from([ATT.OP_WRITE_RESP]);
                            }
                            else {
                                callbackResponse = this.errorResponse(_requestType, _valueHandle, result);
                            }
                            debug("write response: " + callbackResponse.toString("hex"));
                            this.send(callbackResponse);
                        }
                    };
                })(requestType, valueHandle, withoutResponse);
                if (handleSecure & (withoutResponse ? 0x04 : 0x08) &&
                    !this._aclStream.encrypted) {
                    response = this.errorResponse(requestType, valueHandle, ATT.ECODE_AUTHENTICATION);
                }
                else if (handle.type === "descriptor" || handle.uuid === "2902") {
                    let result = null;
                    if (data.length !== 2) {
                        result = ATT.ECODE_INVAL_ATTR_VALUE_LEN;
                    }
                    else {
                        const value = data.readUInt16LE(0);
                        const handleAttribute = handle.attribute;
                        handle.value = data;
                        if (value & 0x0003) {
                            const updateValueCallback = ((_valueHandle, _attribute) => {
                                return (_data) => {
                                    const dataLength = Math.min(_data.length, this._mtu - 3);
                                    const useNotify = _attribute.properties.indexOf("notify") !== -1;
                                    const useIndicate = _attribute.properties.indexOf("indicate") !== -1;
                                    let i;
                                    if (useNotify) {
                                        const notifyMessage = Buffer.alloc(3 + dataLength);
                                        notifyMessage.writeUInt8(ATT.OP_HANDLE_NOTIFY, 0);
                                        notifyMessage.writeUInt16LE(_valueHandle, 1);
                                        for (i = 0; i < dataLength; i++) {
                                            notifyMessage[3 + i] = _data[i];
                                        }
                                        debug("notify message: " + notifyMessage.toString("hex"));
                                        this.send(notifyMessage);
                                        _attribute.emit("notify");
                                    }
                                    else if (useIndicate) {
                                        const indicateMessage = Buffer.alloc(3 + dataLength);
                                        indicateMessage.writeUInt8(ATT.OP_HANDLE_IND, 0);
                                        indicateMessage.writeUInt16LE(_valueHandle, 1);
                                        for (i = 0; i < dataLength; i++) {
                                            indicateMessage[3 + i] = _data[i];
                                        }
                                        this._lastIndicatedAttribute = _attribute;
                                        debug("indicate message: " + indicateMessage.toString("hex"));
                                        this.send(indicateMessage);
                                    }
                                };
                            })(valueHandle - 1, handleAttribute);
                            if (handleAttribute.emit) {
                                handleAttribute.emit("subscribe", this._mtu - 3, updateValueCallback);
                            }
                        }
                        else {
                            handleAttribute.emit("unsubscribe");
                        }
                        result = ATT.ECODE_SUCCESS;
                    }
                    callback(result);
                }
                else {
                    handle.attribute.emit("writeRequest", data, offset, withoutResponse, callback);
                }
            }
            else {
                response = this.errorResponse(requestType, valueHandle, ATT.ECODE_WRITE_NOT_PERM);
            }
        }
        else {
            response = this.errorResponse(requestType, valueHandle, ATT.ECODE_INVALID_HANDLE);
        }
        return response;
    }
    handlePrepareWriteRequest(request) {
        let response = null;
        const requestType = request[0];
        const valueHandle = request.readUInt16LE(1);
        const offset = request.readUInt16LE(3);
        const data = request.slice(5);
        let handle = this._handles[valueHandle];
        if (handle) {
            if (handle.type === "characteristicValue") {
                handle = this._handles[valueHandle - 1];
                const handleProperties = handle.properties;
                const handleSecure = handle.secure;
                if (handleProperties && handleProperties & 0x08) {
                    if (handleSecure & 0x08 && !this._aclStream.encrypted) {
                        response = this.errorResponse(requestType, valueHandle, ATT.ECODE_AUTHENTICATION);
                    }
                    else if (this._preparedWriteRequest) {
                        if (this._preparedWriteRequest.handle !== handle) {
                            response = this.errorResponse(requestType, valueHandle, ATT.ECODE_UNLIKELY);
                        }
                        else if (offset ===
                            this._preparedWriteRequest.offset +
                                this._preparedWriteRequest.data.length) {
                            this._preparedWriteRequest.data = Buffer.concat([
                                this._preparedWriteRequest.data,
                                data,
                            ]);
                            response = Buffer.alloc(request.length);
                            request.copy(response);
                            response[0] = ATT.OP_PREP_WRITE_RESP;
                        }
                        else {
                            response = this.errorResponse(requestType, valueHandle, ATT.ECODE_INVALID_OFFSET);
                        }
                    }
                    else {
                        this._preparedWriteRequest = {
                            handle,
                            valueHandle,
                            offset,
                            data,
                        };
                        response = Buffer.alloc(request.length);
                        request.copy(response);
                        response[0] = ATT.OP_PREP_WRITE_RESP;
                    }
                }
                else {
                    response = this.errorResponse(requestType, valueHandle, ATT.ECODE_WRITE_NOT_PERM);
                }
            }
            else {
                response = this.errorResponse(requestType, valueHandle, ATT.ECODE_ATTR_NOT_LONG);
            }
        }
        else {
            response = this.errorResponse(requestType, valueHandle, ATT.ECODE_INVALID_HANDLE);
        }
        return response;
    }
    handleExecuteWriteRequest(request) {
        let response = null;
        const requestType = request[0];
        const flag = request[1];
        if (this._preparedWriteRequest) {
            if (flag === 0x00) {
                response = Buffer.from([ATT.OP_EXEC_WRITE_RESP]);
            }
            else if (flag === 0x01) {
                const callback = ((_requestType, _valueHandle) => {
                    return (result) => {
                        let callbackResponse = null;
                        if (ATT.ECODE_SUCCESS === result) {
                            callbackResponse = Buffer.from([ATT.OP_EXEC_WRITE_RESP]);
                        }
                        else {
                            callbackResponse = this.errorResponse(_requestType, _valueHandle, result);
                        }
                        debug("execute write response: " + callbackResponse.toString("hex"));
                        this.send(callbackResponse);
                    };
                })(requestType, this._preparedWriteRequest.valueHandle);
                this._preparedWriteRequest.handle.attribute.emit("writeRequest", this._preparedWriteRequest.data, this._preparedWriteRequest.offset, false, callback);
            }
            else {
                response = this.errorResponse(requestType, 0x0000, ATT.ECODE_UNLIKELY);
            }
            this._preparedWriteRequest = null;
        }
        else {
            response = this.errorResponse(requestType, 0x0000, ATT.ECODE_UNLIKELY);
        }
        return response;
    }
    handleConfirmation(request) {
        if (this._lastIndicatedAttribute) {
            if (this._lastIndicatedAttribute.emit) {
                this._lastIndicatedAttribute.emit("indicate");
            }
            this._lastIndicatedAttribute = null;
        }
    }
}
exports.default = Gatt;

//# sourceMappingURL=gatt.js.map
