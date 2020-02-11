/// <reference types="node" />
import events from "events";
/**
 * @ignore
 */
declare class Gatt extends events.EventEmitter {
    _address: any;
    _aclStream: any;
    _services: any;
    _characteristics: any;
    _descriptors: any;
    _currentCommand: any;
    _commandQueue: any;
    _mtu: any;
    _security: any;
    onAclStreamDataBinded: any;
    onAclStreamEncryptBinded: any;
    onAclStreamEncryptFailBinded: any;
    onAclStreamEndBinded: any;
    constructor(address: any, aclStream: any);
    onAclStreamData(cid: any, data?: any): void;
    onAclStreamEncrypt(encrypt: any): void;
    onAclStreamEncryptFail(): void;
    onAclStreamEnd(): void;
    writeAtt(data: any): void;
    errorResponse(opcode: any, handle: any, status: any): any;
    _queueCommand(buffer: any, callback: any, writeCallback?: any): void;
    mtuRequest(mtu: any): any;
    readByGroupRequest(startHandle: any, endHandle: any, groupUuid: any): any;
    readByTypeRequest(startHandle: any, endHandle: any, groupUuid: any): any;
    readRequest(handle: any): any;
    readBlobRequest(handle: any, offset: any): any;
    findInfoRequest(startHandle: any, endHandle: any): any;
    writeRequest(handle: any, data: any, withoutResponse: any): any;
    prepareWriteRequest(handle: any, offset: any, data: any): any;
    executeWriteRequest(handle: any, cancelPreparedWrites?: any): any;
    handleConfirmation(): any;
    exchangeMtu(mtu: any): void;
    discoverServices(uuids: any): void;
    discoverIncludedServices(serviceUuid: any, uuids: any): void;
    discoverCharacteristics(serviceUuid: any, characteristicUuids: any): void;
    read(serviceUuid: any, characteristicUuid: any): void;
    write(serviceUuid: any, characteristicUuid: any, data: any, withoutResponse: any): void;
    longWrite(serviceUuid: any, characteristicUuid: any, data: any, withoutResponse: any): void;
    broadcast(serviceUuid: any, characteristicUuid: any, broadcast: any): void;
    notify(serviceUuid: any, characteristicUuid: any, notify: any): void;
    discoverDescriptors(serviceUuid: any, characteristicUuid: any): void;
    readValue(serviceUuid: any, characteristicUuid: any, descriptorUuid: any): void;
    writeValue(serviceUuid: any, characteristicUuid: any, descriptorUuid: any, data: any): void;
    readHandle(handle: any): void;
    writeHandle(handle: any, data: any, withoutResponse: any): void;
}
export default Gatt;
