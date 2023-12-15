// @generated by protoc-gen-es v1.5.0 with parameter "target=ts"
// @generated from file eliza.proto (package connectrpc.eliza.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck

import type { BinaryReadOptions, FieldList, JsonReadOptions, JsonValue, PartialMessage, PlainMessage } from "@bufbuild/protobuf";
import { Message, proto3 } from "@bufbuild/protobuf";

/**
 * ! All requests should come with an appId and a key
 *
 * @generated from message connectrpc.eliza.v1.Instance
 */
export class Instance extends Message<Instance> {
  /**
   * @generated from field: int32 id = 1;
   */
  id = 0;

  /**
   * @generated from field: string itemId = 2;
   */
  itemId = "";

  /**
   * @generated from field: string identityId = 3;
   */
  identityId = "";

  constructor(data?: PartialMessage<Instance>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "connectrpc.eliza.v1.Instance";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "id", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
    { no: 2, name: "itemId", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "identityId", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Instance {
    return new Instance().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Instance {
    return new Instance().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Instance {
    return new Instance().fromJsonString(jsonString, options);
  }

  static equals(a: Instance | PlainMessage<Instance> | undefined, b: Instance | PlainMessage<Instance> | undefined): boolean {
    return proto3.util.equals(Instance, a, b);
  }
}

/**
 * @generated from message connectrpc.eliza.v1.InstanceWithUserRequest
 */
export class InstanceWithUserRequest extends Message<InstanceWithUserRequest> {
  /**
   * @generated from field: int32 appId = 1;
   */
  appId = 0;

  /**
   * @generated from field: string key = 2;
   */
  key = "";

  /**
   * @generated from field: string itemId = 3;
   */
  itemId = "";

  /**
   * @generated from field: string identityId = 4;
   */
  identityId = "";

  constructor(data?: PartialMessage<InstanceWithUserRequest>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "connectrpc.eliza.v1.InstanceWithUserRequest";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "appId", kind: "scalar", T: 5 /* ScalarType.INT32 */ },
    { no: 2, name: "key", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 3, name: "itemId", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 4, name: "identityId", kind: "scalar", T: 9 /* ScalarType.STRING */ },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): InstanceWithUserRequest {
    return new InstanceWithUserRequest().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): InstanceWithUserRequest {
    return new InstanceWithUserRequest().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): InstanceWithUserRequest {
    return new InstanceWithUserRequest().fromJsonString(jsonString, options);
  }

  static equals(a: InstanceWithUserRequest | PlainMessage<InstanceWithUserRequest> | undefined, b: InstanceWithUserRequest | PlainMessage<InstanceWithUserRequest> | undefined): boolean {
    return proto3.util.equals(InstanceWithUserRequest, a, b);
  }
}

/**
 * @generated from message connectrpc.eliza.v1.InstanceWithUserResponse
 */
export class InstanceWithUserResponse extends Message<InstanceWithUserResponse> {
  /**
   * @generated from field: string response = 1;
   */
  response = "";

  /**
   * @generated from field: connectrpc.eliza.v1.Instance instance = 2;
   */
  instance?: Instance;

  constructor(data?: PartialMessage<InstanceWithUserResponse>) {
    super();
    proto3.util.initPartial(data, this);
  }

  static readonly runtime: typeof proto3 = proto3;
  static readonly typeName = "connectrpc.eliza.v1.InstanceWithUserResponse";
  static readonly fields: FieldList = proto3.util.newFieldList(() => [
    { no: 1, name: "response", kind: "scalar", T: 9 /* ScalarType.STRING */ },
    { no: 2, name: "instance", kind: "message", T: Instance },
  ]);

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): InstanceWithUserResponse {
    return new InstanceWithUserResponse().fromBinary(bytes, options);
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): InstanceWithUserResponse {
    return new InstanceWithUserResponse().fromJson(jsonValue, options);
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): InstanceWithUserResponse {
    return new InstanceWithUserResponse().fromJsonString(jsonString, options);
  }

  static equals(a: InstanceWithUserResponse | PlainMessage<InstanceWithUserResponse> | undefined, b: InstanceWithUserResponse | PlainMessage<InstanceWithUserResponse> | undefined): boolean {
    return proto3.util.equals(InstanceWithUserResponse, a, b);
  }
}

