import { PromiseClient } from '@connectrpc/connect';
import { Message, PartialMessage, proto3, FieldList, BinaryReadOptions, JsonValue, JsonReadOptions, PlainMessage, MethodKind } from '@bufbuild/protobuf';

/**
 * ! All requests should come with an appId and a key
 *
 * @generated from message connectrpc.eliza.v1.App
 */
declare class App$1 extends Message<App$1> {
    /**
     * @generated from field: int32 id = 1;
     */
    id: number;
    /**
     * @generated from field: string name = 2;
     */
    name: string;
    /**
     * @generated from field: string description = 3;
     */
    description: string;
    /**
     * @generated from field: string permissions = 4;
     */
    permissions: string;
    /**
     * @generated from field: bool public = 5;
     */
    public: boolean;
    /**
     * @generated from field: string metadata = 6;
     */
    metadata: string;
    constructor(data?: PartialMessage<App$1>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.App";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): App$1;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): App$1;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): App$1;
    static equals(a: App$1 | PlainMessage<App$1> | undefined, b: App$1 | PlainMessage<App$1> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.Identity
 */
declare class Identity extends Message<Identity> {
    /**
     * @generated from field: string slack = 1;
     */
    slack: string;
    /**
     * @generated from field: repeated connectrpc.eliza.v1.Instance inventory = 2;
     */
    inventory: Instance[];
    /**
     * @generated from field: string metadata = 3;
     */
    metadata: string;
    constructor(data?: PartialMessage<Identity>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.Identity";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Identity;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Identity;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Identity;
    static equals(a: Identity | PlainMessage<Identity> | undefined, b: Identity | PlainMessage<Identity> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.Item
 */
declare class Item extends Message<Item> {
    /**
     * @generated from field: string name = 1;
     */
    name: string;
    /**
     * @generated from field: string image = 2;
     */
    image: string;
    /**
     * @generated from field: string description = 3;
     */
    description: string;
    /**
     * @generated from field: string reaction = 4;
     */
    reaction: string;
    /**
     * @generated from field: bool commodity = 5;
     */
    commodity: boolean;
    /**
     * @generated from field: bool tradable = 6;
     */
    tradable: boolean;
    /**
     * @generated from field: bool public = 7;
     */
    public: boolean;
    /**
     * @generated from field: string metadata = 8;
     */
    metadata: string;
    constructor(data?: PartialMessage<Item>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.Item";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Item;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Item;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Item;
    static equals(a: Item | PlainMessage<Item> | undefined, b: Item | PlainMessage<Item> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.Instance
 */
declare class Instance extends Message<Instance> {
    /**
     * @generated from field: int32 id = 1;
     */
    id: number;
    /**
     * @generated from field: string itemId = 2;
     */
    itemId: string;
    /**
     * @generated from field: string identityId = 3;
     */
    identityId: string;
    /**
     * @generated from field: connectrpc.eliza.v1.Item item = 4;
     */
    item?: Item;
    constructor(data?: PartialMessage<Instance>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.Instance";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): Instance;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): Instance;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): Instance;
    static equals(a: Instance | PlainMessage<Instance> | undefined, b: Instance | PlainMessage<Instance> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.CreateInstanceRequest
 */
declare class CreateInstanceRequest extends Message<CreateInstanceRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    /**
     * @generated from field: string itemId = 3;
     */
    itemId: string;
    /**
     * @generated from field: string identityId = 4;
     */
    identityId: string;
    /**
     * @generated from field: int32 quantity = 5;
     */
    quantity: number;
    /**
     * @generated from field: string metadata = 6;
     */
    metadata: string;
    /**
     * @generated from field: string note = 7;
     */
    note: string;
    constructor(data?: PartialMessage<CreateInstanceRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.CreateInstanceRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CreateInstanceRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CreateInstanceRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CreateInstanceRequest;
    static equals(a: CreateInstanceRequest | PlainMessage<CreateInstanceRequest> | undefined, b: CreateInstanceRequest | PlainMessage<CreateInstanceRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.CreateInstanceResponse
 */
declare class CreateInstanceResponse extends Message<CreateInstanceResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    /**
     * @generated from field: connectrpc.eliza.v1.Instance instance = 2;
     */
    instance?: Instance;
    constructor(data?: PartialMessage<CreateInstanceResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.CreateInstanceResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CreateInstanceResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CreateInstanceResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CreateInstanceResponse;
    static equals(a: CreateInstanceResponse | PlainMessage<CreateInstanceResponse> | undefined, b: CreateInstanceResponse | PlainMessage<CreateInstanceResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.CreateAppRequest
 */
declare class CreateAppRequest extends Message<CreateAppRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    /**
     * @generated from field: string name = 3;
     */
    name: string;
    /**
     * @generated from field: string description = 4;
     */
    description: string;
    /**
     * @generated from field: int32 permissions = 5;
     */
    permissions: number;
    /**
     * @generated from field: bool public = 6;
     */
    public: boolean;
    /**
     * @generated from field: string metadata = 7;
     */
    metadata: string;
    constructor(data?: PartialMessage<CreateAppRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.CreateAppRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CreateAppRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CreateAppRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CreateAppRequest;
    static equals(a: CreateAppRequest | PlainMessage<CreateAppRequest> | undefined, b: CreateAppRequest | PlainMessage<CreateAppRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.CreateAppResponse
 */
declare class CreateAppResponse extends Message<CreateAppResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    /**
     * @generated from field: connectrpc.eliza.v1.App app = 2;
     */
    app?: App$1;
    constructor(data?: PartialMessage<CreateAppResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.CreateAppResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CreateAppResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CreateAppResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CreateAppResponse;
    static equals(a: CreateAppResponse | PlainMessage<CreateAppResponse> | undefined, b: CreateAppResponse | PlainMessage<CreateAppResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.CreateItemRequest
 */
declare class CreateItemRequest extends Message<CreateItemRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    /**
     * @generated from field: connectrpc.eliza.v1.Item item = 3;
     */
    item?: Item;
    constructor(data?: PartialMessage<CreateItemRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.CreateItemRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CreateItemRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CreateItemRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CreateItemRequest;
    static equals(a: CreateItemRequest | PlainMessage<CreateItemRequest> | undefined, b: CreateItemRequest | PlainMessage<CreateItemRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.CreateItemResponse
 */
declare class CreateItemResponse extends Message<CreateItemResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    /**
     * @generated from field: connectrpc.eliza.v1.Item item = 2;
     */
    item?: Item;
    constructor(data?: PartialMessage<CreateItemResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.CreateItemResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CreateItemResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CreateItemResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CreateItemResponse;
    static equals(a: CreateItemResponse | PlainMessage<CreateItemResponse> | undefined, b: CreateItemResponse | PlainMessage<CreateItemResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.CreateRecipeRequest
 */
declare class CreateRecipeRequest extends Message<CreateRecipeRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    constructor(data?: PartialMessage<CreateRecipeRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.CreateRecipeRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CreateRecipeRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CreateRecipeRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CreateRecipeRequest;
    static equals(a: CreateRecipeRequest | PlainMessage<CreateRecipeRequest> | undefined, b: CreateRecipeRequest | PlainMessage<CreateRecipeRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.CreateRecipeResponse
 */
declare class CreateRecipeResponse extends Message<CreateRecipeResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    constructor(data?: PartialMessage<CreateRecipeResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.CreateRecipeResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CreateRecipeResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CreateRecipeResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CreateRecipeResponse;
    static equals(a: CreateRecipeResponse | PlainMessage<CreateRecipeResponse> | undefined, b: CreateRecipeResponse | PlainMessage<CreateRecipeResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.CreateTradeRequest
 */
declare class CreateTradeRequest extends Message<CreateTradeRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    constructor(data?: PartialMessage<CreateTradeRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.CreateTradeRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CreateTradeRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CreateTradeRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CreateTradeRequest;
    static equals(a: CreateTradeRequest | PlainMessage<CreateTradeRequest> | undefined, b: CreateTradeRequest | PlainMessage<CreateTradeRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.CreateTradeResponse
 */
declare class CreateTradeResponse extends Message<CreateTradeResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    constructor(data?: PartialMessage<CreateTradeResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.CreateTradeResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CreateTradeResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CreateTradeResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CreateTradeResponse;
    static equals(a: CreateTradeResponse | PlainMessage<CreateTradeResponse> | undefined, b: CreateTradeResponse | PlainMessage<CreateTradeResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.ReadIdentityRequest
 */
declare class ReadIdentityRequest extends Message<ReadIdentityRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    /**
     * @generated from field: string identityId = 3;
     */
    identityId: string;
    constructor(data?: PartialMessage<ReadIdentityRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.ReadIdentityRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadIdentityRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadIdentityRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadIdentityRequest;
    static equals(a: ReadIdentityRequest | PlainMessage<ReadIdentityRequest> | undefined, b: ReadIdentityRequest | PlainMessage<ReadIdentityRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.ReadIdentityResponse
 */
declare class ReadIdentityResponse extends Message<ReadIdentityResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    /**
     * @generated from field: connectrpc.eliza.v1.Identity identity = 2;
     */
    identity?: Identity;
    constructor(data?: PartialMessage<ReadIdentityResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.ReadIdentityResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadIdentityResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadIdentityResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadIdentityResponse;
    static equals(a: ReadIdentityResponse | PlainMessage<ReadIdentityResponse> | undefined, b: ReadIdentityResponse | PlainMessage<ReadIdentityResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.ReadInventoryRequest
 */
declare class ReadInventoryRequest extends Message<ReadInventoryRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    /**
     * @generated from field: string identityId = 3;
     */
    identityId: string;
    constructor(data?: PartialMessage<ReadInventoryRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.ReadInventoryRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadInventoryRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadInventoryRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadInventoryRequest;
    static equals(a: ReadInventoryRequest | PlainMessage<ReadInventoryRequest> | undefined, b: ReadInventoryRequest | PlainMessage<ReadInventoryRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.ReadInventoryResponse
 */
declare class ReadInventoryResponse extends Message<ReadInventoryResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    /**
     * @generated from field: repeated connectrpc.eliza.v1.Instance inventory = 2;
     */
    inventory: Instance[];
    constructor(data?: PartialMessage<ReadInventoryResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.ReadInventoryResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadInventoryResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadInventoryResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadInventoryResponse;
    static equals(a: ReadInventoryResponse | PlainMessage<ReadInventoryResponse> | undefined, b: ReadInventoryResponse | PlainMessage<ReadInventoryResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.ReadItemRequest
 */
declare class ReadItemRequest extends Message<ReadItemRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    /**
     * @generated from field: string query = 3;
     */
    query: string;
    constructor(data?: PartialMessage<ReadItemRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.ReadItemRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadItemRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadItemRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadItemRequest;
    static equals(a: ReadItemRequest | PlainMessage<ReadItemRequest> | undefined, b: ReadItemRequest | PlainMessage<ReadItemRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.ReadItemResponse
 */
declare class ReadItemResponse extends Message<ReadItemResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    /**
     * @generated from field: repeated connectrpc.eliza.v1.Item items = 2;
     */
    items: Item[];
    constructor(data?: PartialMessage<ReadItemResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.ReadItemResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadItemResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadItemResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadItemResponse;
    static equals(a: ReadItemResponse | PlainMessage<ReadItemResponse> | undefined, b: ReadItemResponse | PlainMessage<ReadItemResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.ReadInstanceRequest
 */
declare class ReadInstanceRequest extends Message<ReadInstanceRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    /**
     * @generated from field: int32 instanceId = 3;
     */
    instanceId: number;
    constructor(data?: PartialMessage<ReadInstanceRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.ReadInstanceRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadInstanceRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadInstanceRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadInstanceRequest;
    static equals(a: ReadInstanceRequest | PlainMessage<ReadInstanceRequest> | undefined, b: ReadInstanceRequest | PlainMessage<ReadInstanceRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.ReadInstanceResponse
 */
declare class ReadInstanceResponse extends Message<ReadInstanceResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    /**
     * @generated from field: connectrpc.eliza.v1.Instance instance = 2;
     */
    instance?: Instance;
    constructor(data?: PartialMessage<ReadInstanceResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.ReadInstanceResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadInstanceResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadInstanceResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadInstanceResponse;
    static equals(a: ReadInstanceResponse | PlainMessage<ReadInstanceResponse> | undefined, b: ReadInstanceResponse | PlainMessage<ReadInstanceResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.ReadAppRequest
 */
declare class ReadAppRequest extends Message<ReadAppRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    /**
     * @generated from field: int32 optAppId = 3;
     */
    optAppId: number;
    constructor(data?: PartialMessage<ReadAppRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.ReadAppRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadAppRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadAppRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadAppRequest;
    static equals(a: ReadAppRequest | PlainMessage<ReadAppRequest> | undefined, b: ReadAppRequest | PlainMessage<ReadAppRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.ReadAppResponse
 */
declare class ReadAppResponse extends Message<ReadAppResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    /**
     * @generated from field: connectrpc.eliza.v1.App app = 2;
     */
    app?: App$1;
    constructor(data?: PartialMessage<ReadAppResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.ReadAppResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadAppResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadAppResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadAppResponse;
    static equals(a: ReadAppResponse | PlainMessage<ReadAppResponse> | undefined, b: ReadAppResponse | PlainMessage<ReadAppResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.ReadTradeRequest
 */
declare class ReadTradeRequest extends Message<ReadTradeRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    constructor(data?: PartialMessage<ReadTradeRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.ReadTradeRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadTradeRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadTradeRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadTradeRequest;
    static equals(a: ReadTradeRequest | PlainMessage<ReadTradeRequest> | undefined, b: ReadTradeRequest | PlainMessage<ReadTradeRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.ReadTradeResponse
 */
declare class ReadTradeResponse extends Message<ReadTradeResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    constructor(data?: PartialMessage<ReadTradeResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.ReadTradeResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadTradeResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadTradeResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadTradeResponse;
    static equals(a: ReadTradeResponse | PlainMessage<ReadTradeResponse> | undefined, b: ReadTradeResponse | PlainMessage<ReadTradeResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.ReadRecipeRequest
 */
declare class ReadRecipeRequest extends Message<ReadRecipeRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    constructor(data?: PartialMessage<ReadRecipeRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.ReadRecipeRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadRecipeRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadRecipeRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadRecipeRequest;
    static equals(a: ReadRecipeRequest | PlainMessage<ReadRecipeRequest> | undefined, b: ReadRecipeRequest | PlainMessage<ReadRecipeRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.ReadRecipeResponse
 */
declare class ReadRecipeResponse extends Message<ReadRecipeResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    constructor(data?: PartialMessage<ReadRecipeResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.ReadRecipeResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ReadRecipeResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ReadRecipeResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ReadRecipeResponse;
    static equals(a: ReadRecipeResponse | PlainMessage<ReadRecipeResponse> | undefined, b: ReadRecipeResponse | PlainMessage<ReadRecipeResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.UpdateIdentityMetadataRequest
 */
declare class UpdateIdentityMetadataRequest extends Message<UpdateIdentityMetadataRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    constructor(data?: PartialMessage<UpdateIdentityMetadataRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.UpdateIdentityMetadataRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateIdentityMetadataRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateIdentityMetadataRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateIdentityMetadataRequest;
    static equals(a: UpdateIdentityMetadataRequest | PlainMessage<UpdateIdentityMetadataRequest> | undefined, b: UpdateIdentityMetadataRequest | PlainMessage<UpdateIdentityMetadataRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.UpdateIdentityMetadataResponse
 */
declare class UpdateIdentityMetadataResponse extends Message<UpdateIdentityMetadataResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    constructor(data?: PartialMessage<UpdateIdentityMetadataResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.UpdateIdentityMetadataResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateIdentityMetadataResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateIdentityMetadataResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateIdentityMetadataResponse;
    static equals(a: UpdateIdentityMetadataResponse | PlainMessage<UpdateIdentityMetadataResponse> | undefined, b: UpdateIdentityMetadataResponse | PlainMessage<UpdateIdentityMetadataResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.UpdateInstanceRequest
 */
declare class UpdateInstanceRequest extends Message<UpdateInstanceRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    constructor(data?: PartialMessage<UpdateInstanceRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.UpdateInstanceRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateInstanceRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateInstanceRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateInstanceRequest;
    static equals(a: UpdateInstanceRequest | PlainMessage<UpdateInstanceRequest> | undefined, b: UpdateInstanceRequest | PlainMessage<UpdateInstanceRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.UpdateInstanceResponse
 */
declare class UpdateInstanceResponse extends Message<UpdateInstanceResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    constructor(data?: PartialMessage<UpdateInstanceResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.UpdateInstanceResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateInstanceResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateInstanceResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateInstanceResponse;
    static equals(a: UpdateInstanceResponse | PlainMessage<UpdateInstanceResponse> | undefined, b: UpdateInstanceResponse | PlainMessage<UpdateInstanceResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.UpdateItemRequest
 */
declare class UpdateItemRequest extends Message<UpdateItemRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    /**
     * @generated from field: string itemId = 3;
     */
    itemId: string;
    /**
     * @generated from field: connectrpc.eliza.v1.Item new = 4;
     */
    new?: Item;
    constructor(data?: PartialMessage<UpdateItemRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.UpdateItemRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateItemRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateItemRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateItemRequest;
    static equals(a: UpdateItemRequest | PlainMessage<UpdateItemRequest> | undefined, b: UpdateItemRequest | PlainMessage<UpdateItemRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.UpdateItemResponse
 */
declare class UpdateItemResponse extends Message<UpdateItemResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    /**
     * @generated from field: connectrpc.eliza.v1.Item item = 2;
     */
    item?: Item;
    constructor(data?: PartialMessage<UpdateItemResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.UpdateItemResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateItemResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateItemResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateItemResponse;
    static equals(a: UpdateItemResponse | PlainMessage<UpdateItemResponse> | undefined, b: UpdateItemResponse | PlainMessage<UpdateItemResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.UpdateAppRequest
 */
declare class UpdateAppRequest extends Message<UpdateAppRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    /**
     * @generated from field: int32 optAppId = 3;
     */
    optAppId: number;
    /**
     * @generated from field: connectrpc.eliza.v1.App new = 4;
     */
    new?: App$1;
    constructor(data?: PartialMessage<UpdateAppRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.UpdateAppRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateAppRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateAppRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateAppRequest;
    static equals(a: UpdateAppRequest | PlainMessage<UpdateAppRequest> | undefined, b: UpdateAppRequest | PlainMessage<UpdateAppRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.UpdateAppResponse
 */
declare class UpdateAppResponse extends Message<UpdateAppResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    /**
     * @generated from field: connectrpc.eliza.v1.App app = 2;
     */
    app?: App$1;
    constructor(data?: PartialMessage<UpdateAppResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.UpdateAppResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateAppResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateAppResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateAppResponse;
    static equals(a: UpdateAppResponse | PlainMessage<UpdateAppResponse> | undefined, b: UpdateAppResponse | PlainMessage<UpdateAppResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.UpdateTradeRequest
 */
declare class UpdateTradeRequest extends Message<UpdateTradeRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    constructor(data?: PartialMessage<UpdateTradeRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.UpdateTradeRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateTradeRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateTradeRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateTradeRequest;
    static equals(a: UpdateTradeRequest | PlainMessage<UpdateTradeRequest> | undefined, b: UpdateTradeRequest | PlainMessage<UpdateTradeRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.UpdateTradeResponse
 */
declare class UpdateTradeResponse extends Message<UpdateTradeResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    constructor(data?: PartialMessage<UpdateTradeResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.UpdateTradeResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateTradeResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateTradeResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateTradeResponse;
    static equals(a: UpdateTradeResponse | PlainMessage<UpdateTradeResponse> | undefined, b: UpdateTradeResponse | PlainMessage<UpdateTradeResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.UpdateRecipeRequest
 */
declare class UpdateRecipeRequest extends Message<UpdateRecipeRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    constructor(data?: PartialMessage<UpdateRecipeRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.UpdateRecipeRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateRecipeRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateRecipeRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateRecipeRequest;
    static equals(a: UpdateRecipeRequest | PlainMessage<UpdateRecipeRequest> | undefined, b: UpdateRecipeRequest | PlainMessage<UpdateRecipeRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.UpdateRecipeResponse
 */
declare class UpdateRecipeResponse extends Message<UpdateRecipeResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    constructor(data?: PartialMessage<UpdateRecipeResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.UpdateRecipeResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateRecipeResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateRecipeResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateRecipeResponse;
    static equals(a: UpdateRecipeResponse | PlainMessage<UpdateRecipeResponse> | undefined, b: UpdateRecipeResponse | PlainMessage<UpdateRecipeResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.DeleteAppRequest
 */
declare class DeleteAppRequest extends Message<DeleteAppRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    /**
     * @generated from field: int32 deleteAppId = 3;
     */
    deleteAppId: number;
    constructor(data?: PartialMessage<DeleteAppRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.DeleteAppRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DeleteAppRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DeleteAppRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DeleteAppRequest;
    static equals(a: DeleteAppRequest | PlainMessage<DeleteAppRequest> | undefined, b: DeleteAppRequest | PlainMessage<DeleteAppRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.DeleteAppResponse
 */
declare class DeleteAppResponse extends Message<DeleteAppResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    constructor(data?: PartialMessage<DeleteAppResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.DeleteAppResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DeleteAppResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DeleteAppResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DeleteAppResponse;
    static equals(a: DeleteAppResponse | PlainMessage<DeleteAppResponse> | undefined, b: DeleteAppResponse | PlainMessage<DeleteAppResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.DeleteInstanceRequest
 */
declare class DeleteInstanceRequest extends Message<DeleteInstanceRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    /**
     * @generated from field: int32 instanceId = 3;
     */
    instanceId: number;
    constructor(data?: PartialMessage<DeleteInstanceRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.DeleteInstanceRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DeleteInstanceRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DeleteInstanceRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DeleteInstanceRequest;
    static equals(a: DeleteInstanceRequest | PlainMessage<DeleteInstanceRequest> | undefined, b: DeleteInstanceRequest | PlainMessage<DeleteInstanceRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.DeleteInstanceResponse
 */
declare class DeleteInstanceResponse extends Message<DeleteInstanceResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    /**
     * @generated from field: connectrpc.eliza.v1.Instance deletedInstance = 2;
     */
    deletedInstance?: Instance;
    constructor(data?: PartialMessage<DeleteInstanceResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.DeleteInstanceResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): DeleteInstanceResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): DeleteInstanceResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): DeleteInstanceResponse;
    static equals(a: DeleteInstanceResponse | PlainMessage<DeleteInstanceResponse> | undefined, b: DeleteInstanceResponse | PlainMessage<DeleteInstanceResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.CloseTradeRequest
 */
declare class CloseTradeRequest extends Message<CloseTradeRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    constructor(data?: PartialMessage<CloseTradeRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.CloseTradeRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CloseTradeRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CloseTradeRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CloseTradeRequest;
    static equals(a: CloseTradeRequest | PlainMessage<CloseTradeRequest> | undefined, b: CloseTradeRequest | PlainMessage<CloseTradeRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.CloseTradeResponse
 */
declare class CloseTradeResponse extends Message<CloseTradeResponse> {
    /**
     * @generated from field: string response = 1;
     */
    response: string;
    constructor(data?: PartialMessage<CloseTradeResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.CloseTradeResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): CloseTradeResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): CloseTradeResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): CloseTradeResponse;
    static equals(a: CloseTradeResponse | PlainMessage<CloseTradeResponse> | undefined, b: CloseTradeResponse | PlainMessage<CloseTradeResponse> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.VerifyKeyRequest
 */
declare class VerifyKeyRequest extends Message<VerifyKeyRequest> {
    /**
     * @generated from field: int32 appId = 1;
     */
    appId: number;
    /**
     * @generated from field: string key = 2;
     */
    key: string;
    constructor(data?: PartialMessage<VerifyKeyRequest>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.VerifyKeyRequest";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): VerifyKeyRequest;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): VerifyKeyRequest;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): VerifyKeyRequest;
    static equals(a: VerifyKeyRequest | PlainMessage<VerifyKeyRequest> | undefined, b: VerifyKeyRequest | PlainMessage<VerifyKeyRequest> | undefined): boolean;
}
/**
 * @generated from message connectrpc.eliza.v1.VerifyKeyResponse
 */
declare class VerifyKeyResponse extends Message<VerifyKeyResponse> {
    /**
     * @generated from field: bool valid = 1;
     */
    valid: boolean;
    constructor(data?: PartialMessage<VerifyKeyResponse>);
    static readonly runtime: typeof proto3;
    static readonly typeName = "connectrpc.eliza.v1.VerifyKeyResponse";
    static readonly fields: FieldList;
    static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): VerifyKeyResponse;
    static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): VerifyKeyResponse;
    static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): VerifyKeyResponse;
    static equals(a: VerifyKeyResponse | PlainMessage<VerifyKeyResponse> | undefined, b: VerifyKeyResponse | PlainMessage<VerifyKeyResponse> | undefined): boolean;
}

/**
 * @generated from service connectrpc.eliza.v1.ElizaService
 */
declare const ElizaService: {
    readonly typeName: "connectrpc.eliza.v1.ElizaService";
    readonly methods: {
        /**
         * Response to request
         *
         * @generated from rpc connectrpc.eliza.v1.ElizaService.CreateApp
         */
        readonly createApp: {
            readonly name: "CreateApp";
            readonly I: typeof CreateAppRequest;
            readonly O: typeof CreateAppResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.CreateInstance
         */
        readonly createInstance: {
            readonly name: "CreateInstance";
            readonly I: typeof CreateInstanceRequest;
            readonly O: typeof CreateInstanceResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.CreateItem
         */
        readonly createItem: {
            readonly name: "CreateItem";
            readonly I: typeof CreateItemRequest;
            readonly O: typeof CreateItemResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.CreateRecipe
         */
        readonly createRecipe: {
            readonly name: "CreateRecipe";
            readonly I: typeof CreateRecipeRequest;
            readonly O: typeof CreateRecipeResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.CreateTrade
         */
        readonly createTrade: {
            readonly name: "CreateTrade";
            readonly I: typeof CreateTradeRequest;
            readonly O: typeof CreateTradeResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.ReadIdentity
         */
        readonly readIdentity: {
            readonly name: "ReadIdentity";
            readonly I: typeof ReadIdentityRequest;
            readonly O: typeof ReadIdentityResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.ReadInventory
         */
        readonly readInventory: {
            readonly name: "ReadInventory";
            readonly I: typeof ReadInventoryRequest;
            readonly O: typeof ReadInventoryResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.ReadItem
         */
        readonly readItem: {
            readonly name: "ReadItem";
            readonly I: typeof ReadItemRequest;
            readonly O: typeof ReadItemResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.ReadInstance
         */
        readonly readInstance: {
            readonly name: "ReadInstance";
            readonly I: typeof ReadInstanceRequest;
            readonly O: typeof ReadInstanceResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.ReadApp
         */
        readonly readApp: {
            readonly name: "ReadApp";
            readonly I: typeof ReadAppRequest;
            readonly O: typeof ReadAppResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.ReadTrade
         */
        readonly readTrade: {
            readonly name: "ReadTrade";
            readonly I: typeof ReadTradeRequest;
            readonly O: typeof ReadTradeResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.ReadRecipe
         */
        readonly readRecipe: {
            readonly name: "ReadRecipe";
            readonly I: typeof ReadRecipeRequest;
            readonly O: typeof ReadRecipeResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.UpdateIdentityMetadata
         */
        readonly updateIdentityMetadata: {
            readonly name: "UpdateIdentityMetadata";
            readonly I: typeof UpdateIdentityMetadataRequest;
            readonly O: typeof UpdateIdentityMetadataResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.UpdateInstance
         */
        readonly updateInstance: {
            readonly name: "UpdateInstance";
            readonly I: typeof UpdateInstanceRequest;
            readonly O: typeof UpdateInstanceResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.UpdateItem
         */
        readonly updateItem: {
            readonly name: "UpdateItem";
            readonly I: typeof UpdateItemRequest;
            readonly O: typeof UpdateItemResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.UpdateApp
         */
        readonly updateApp: {
            readonly name: "UpdateApp";
            readonly I: typeof UpdateAppRequest;
            readonly O: typeof UpdateAppResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.UpdateTrade
         */
        readonly updateTrade: {
            readonly name: "UpdateTrade";
            readonly I: typeof UpdateTradeRequest;
            readonly O: typeof UpdateTradeResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.UpdateRecipe
         */
        readonly updateRecipe: {
            readonly name: "UpdateRecipe";
            readonly I: typeof UpdateRecipeRequest;
            readonly O: typeof UpdateRecipeResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.DeleteApp
         */
        readonly deleteApp: {
            readonly name: "DeleteApp";
            readonly I: typeof DeleteAppRequest;
            readonly O: typeof DeleteAppResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.DeleteInstance
         */
        readonly deleteInstance: {
            readonly name: "DeleteInstance";
            readonly I: typeof DeleteInstanceRequest;
            readonly O: typeof DeleteInstanceResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.CloseTrade
         */
        readonly closeTrade: {
            readonly name: "CloseTrade";
            readonly I: typeof CloseTradeRequest;
            readonly O: typeof CloseTradeResponse;
            readonly kind: MethodKind.Unary;
        };
        /**
         * @generated from rpc connectrpc.eliza.v1.ElizaService.VerifyKey
         */
        readonly verifyKey: {
            readonly name: "VerifyKey";
            readonly I: typeof VerifyKeyRequest;
            readonly O: typeof VerifyKeyResponse;
            readonly kind: MethodKind.Unary;
        };
    };
};

type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};
declare class App {
    private client;
    private request;
    constructor(client: PromiseClient<typeof ElizaService>, appId: number, key: string);
    static connect(options: {
        appId: number;
        key: string;
        baseUrl?: string;
    }): Promise<App>;
    createApp(request: RecursivePartial<CreateAppRequest>): Promise<CreateAppResponse>;
    createInstance(request: RecursivePartial<CreateInstanceRequest>): Promise<CreateInstanceResponse>;
    createItem(request: RecursivePartial<CreateItemRequest>): Promise<CreateItemResponse>;
    createRecipe(request: RecursivePartial<CreateRecipeRequest>): Promise<CreateRecipeResponse>;
    createTrade(request: RecursivePartial<CreateTradeRequest>): Promise<CreateTradeResponse>;
    readIdentity(request: RecursivePartial<ReadIdentityRequest>): Promise<ReadIdentityResponse>;
    readItem(request: RecursivePartial<ReadItemRequest>): Promise<ReadItemResponse>;
    readInstance(request: RecursivePartial<ReadInstanceRequest>): Promise<ReadInstanceResponse>;
    readApp(request?: RecursivePartial<ReadAppRequest>): Promise<ReadAppResponse>;
    readTrade(request: RecursivePartial<ReadTradeRequest>): Promise<ReadTradeResponse>;
    readRecipe(request: RecursivePartial<ReadRecipeRequest>): Promise<ReadRecipeResponse>;
    updateIdentityMetadata(request: RecursivePartial<UpdateIdentityMetadataRequest>): Promise<UpdateIdentityMetadataResponse>;
    updateInstance(request: RecursivePartial<UpdateInstanceRequest>): Promise<UpdateInstanceResponse>;
    updateItem(request: RecursivePartial<UpdateItemRequest>): Promise<UpdateItemResponse>;
    updateApp(request: RecursivePartial<UpdateAppRequest>): Promise<UpdateAppResponse>;
    updateTrade(request: RecursivePartial<UpdateTradeRequest>): Promise<UpdateTradeResponse>;
    updateRecipe(request: RecursivePartial<UpdateRecipeRequest>): Promise<UpdateRecipeResponse>;
    deleteApp(request: RecursivePartial<DeleteAppRequest>): Promise<DeleteAppResponse>;
    deleteInstance(request: RecursivePartial<DeleteInstanceRequest>): Promise<DeleteInstanceResponse>;
    closeTrade(request: RecursivePartial<CloseTradeRequest>): Promise<CloseTradeResponse>;
}

export { App };
