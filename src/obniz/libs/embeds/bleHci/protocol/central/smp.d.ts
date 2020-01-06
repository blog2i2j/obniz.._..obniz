// Type definitions for bleHciProtocolCentralSmp
// Project: [LIBRARY_URL_HERE]
// Definitions by: [YOUR_NAME_HERE] <[YOUR_URL_HERE]>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/**
 *
 */
export declare var SMP_CID: number;

/**
 *
 */
export declare var SMP_PAIRING_REQUEST: number;

/**
 *
 */
export declare var SMP_PAIRING_RESPONSE: number;

/**
 *
 */
export declare var SMP_PAIRING_CONFIRM: number;

/**
 *
 */
export declare var SMP_PAIRING_RANDOM: number;

/**
 *
 */
export declare var SMP_PAIRING_FAILED: number;

/**
 *
 */
export declare var SMP_ENCRYPT_INFO: number;

/**
 *
 */
export declare var SMP_MASTER_IDENT: number;

/**
 *
 */
declare interface Smp {

  /**
   *
   * @param aclStream
   * @param localAddressType
   * @param localAddress
   * @param remoteAddressType
   * @param remoteAddress
   */
  new(aclStream: any, localAddressType: any, localAddress: any, remoteAddressType: any, remoteAddress: any): Smp;

  /**
   *
   */
  sendPairingRequest(): void;

  /**
   *
   * @param cid
   * @param data
   */
  onAclStreamData(cid: any, data: any): void;

  /**
   *
   */
  onAclStreamEnd(): void;

  /**
   *
   * @param data
   */
  handlePairingResponse(data: any): void;

  /**
   *
   * @param data
   */
  handlePairingConfirm(data: any): void;

  /**
   *
   * @param data
   */
  handlePairingRandom(data: any): void;

  /**
   *
   * @param data
   */
  handlePairingFailed(data: any): void;

  /**
   *
   * @param data
   */
  handleEncryptInfo(data: any): void;

  /**
   *
   * @param data
   */
  handleMasterIdent(data: any): void;

  /**
   *
   * @param data
   */
  write(data: any): void;
}

declare module "bleHciProtocolCentralSmp" {

  export default bleHciProtocolCentralSmp;    // es6 style module export
}
