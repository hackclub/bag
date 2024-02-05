// package: bag
// file: bag.proto

/* tslint:disable */
/* eslint-disable */

import * as jspb from "google-protobuf";

export class App extends jspb.Message { 

    hasId(): boolean;
    clearId(): void;
    getId(): number | undefined;
    setId(value: number): App;

    hasName(): boolean;
    clearName(): void;
    getName(): string | undefined;
    setName(value: string): App;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): App;

    hasPermissions(): boolean;
    clearPermissions(): void;
    getPermissions(): string | undefined;
    setPermissions(value: string): App;

    hasPublic(): boolean;
    clearPublic(): void;
    getPublic(): boolean | undefined;
    setPublic(value: boolean): App;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): string | undefined;
    setMetadata(value: string): App;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): App.AsObject;
    static toObject(includeInstance: boolean, msg: App): App.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: App, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): App;
    static deserializeBinaryFromReader(message: App, reader: jspb.BinaryReader): App;
}

export namespace App {
    export type AsObject = {
        id?: number,
        name?: string,
        description?: string,
        permissions?: string,
        pb_public?: boolean,
        metadata?: string,
    }
}

export class Item extends jspb.Message { 

    hasName(): boolean;
    clearName(): void;
    getName(): string | undefined;
    setName(value: string): Item;

    hasImage(): boolean;
    clearImage(): void;
    getImage(): string | undefined;
    setImage(value: string): Item;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): Item;

    hasReaction(): boolean;
    clearReaction(): void;
    getReaction(): string | undefined;
    setReaction(value: string): Item;

    hasCommodity(): boolean;
    clearCommodity(): void;
    getCommodity(): boolean | undefined;
    setCommodity(value: boolean): Item;

    hasTradable(): boolean;
    clearTradable(): void;
    getTradable(): boolean | undefined;
    setTradable(value: boolean): Item;

    hasPublic(): boolean;
    clearPublic(): void;
    getPublic(): boolean | undefined;
    setPublic(value: boolean): Item;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): string | undefined;
    setMetadata(value: string): Item;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Item.AsObject;
    static toObject(includeInstance: boolean, msg: Item): Item.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Item, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Item;
    static deserializeBinaryFromReader(message: Item, reader: jspb.BinaryReader): Item;
}

export namespace Item {
    export type AsObject = {
        name?: string,
        image?: string,
        description?: string,
        reaction?: string,
        commodity?: boolean,
        tradable?: boolean,
        pb_public?: boolean,
        metadata?: string,
    }
}

export class Skill extends jspb.Message { 

    hasName(): boolean;
    clearName(): void;
    getName(): string | undefined;
    setName(value: string): Skill;

    hasMaxlevel(): boolean;
    clearMaxlevel(): void;
    getMaxlevel(): number | undefined;
    setMaxlevel(value: number): Skill;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): Skill;

    hasReaction(): boolean;
    clearReaction(): void;
    getReaction(): string | undefined;
    setReaction(value: string): Skill;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): string | undefined;
    setMetadata(value: string): Skill;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Skill.AsObject;
    static toObject(includeInstance: boolean, msg: Skill): Skill.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Skill, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Skill;
    static deserializeBinaryFromReader(message: Skill, reader: jspb.BinaryReader): Skill;
}

export namespace Skill {
    export type AsObject = {
        name?: string,
        maxlevel?: number,
        description?: string,
        reaction?: string,
        metadata?: string,
    }
}

export class Identity extends jspb.Message { 

    hasSlack(): boolean;
    clearSlack(): void;
    getSlack(): string | undefined;
    setSlack(value: string): Identity;
    clearInventoryList(): void;
    getInventoryList(): Array<Instance>;
    setInventoryList(value: Array<Instance>): Identity;
    addInventory(value?: Instance, index?: number): Instance;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): string | undefined;
    setMetadata(value: string): Identity;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Identity.AsObject;
    static toObject(includeInstance: boolean, msg: Identity): Identity.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Identity, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Identity;
    static deserializeBinaryFromReader(message: Identity, reader: jspb.BinaryReader): Identity;
}

export namespace Identity {
    export type AsObject = {
        slack?: string,
        inventoryList: Array<Instance.AsObject>,
        metadata?: string,
    }
}

export class Instance extends jspb.Message { 

    hasId(): boolean;
    clearId(): void;
    getId(): number | undefined;
    setId(value: number): Instance;

    hasItemid(): boolean;
    clearItemid(): void;
    getItemid(): string | undefined;
    setItemid(value: string): Instance;

    hasIdentityid(): boolean;
    clearIdentityid(): void;
    getIdentityid(): string | undefined;
    setIdentityid(value: string): Instance;

    hasQuantity(): boolean;
    clearQuantity(): void;
    getQuantity(): number | undefined;
    setQuantity(value: number): Instance;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): string | undefined;
    setMetadata(value: string): Instance;

    hasItem(): boolean;
    clearItem(): void;
    getItem(): Item | undefined;
    setItem(value?: Item): Instance;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Instance.AsObject;
    static toObject(includeInstance: boolean, msg: Instance): Instance.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Instance, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Instance;
    static deserializeBinaryFromReader(message: Instance, reader: jspb.BinaryReader): Instance;
}

export namespace Instance {
    export type AsObject = {
        id?: number,
        itemid?: string,
        identityid?: string,
        quantity?: number,
        metadata?: string,
        item?: Item.AsObject,
    }
}

export class SkillInstance extends jspb.Message { 

    hasId(): boolean;
    clearId(): void;
    getId(): number | undefined;
    setId(value: number): SkillInstance;

    hasSkillid(): boolean;
    clearSkillid(): void;
    getSkillid(): string | undefined;
    setSkillid(value: string): SkillInstance;

    hasIdentityid(): boolean;
    clearIdentityid(): void;
    getIdentityid(): string | undefined;
    setIdentityid(value: string): SkillInstance;

    hasLevel(): boolean;
    clearLevel(): void;
    getLevel(): number | undefined;
    setLevel(value: number): SkillInstance;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): string | undefined;
    setMetadata(value: string): SkillInstance;

    hasSkill(): boolean;
    clearSkill(): void;
    getSkill(): Skill | undefined;
    setSkill(value?: Skill): SkillInstance;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): SkillInstance.AsObject;
    static toObject(includeInstance: boolean, msg: SkillInstance): SkillInstance.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: SkillInstance, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): SkillInstance;
    static deserializeBinaryFromReader(message: SkillInstance, reader: jspb.BinaryReader): SkillInstance;
}

export namespace SkillInstance {
    export type AsObject = {
        id?: number,
        skillid?: string,
        identityid?: string,
        level?: number,
        metadata?: string,
        skill?: Skill.AsObject,
    }
}

export class Trade extends jspb.Message { 

    hasId(): boolean;
    clearId(): void;
    getId(): number | undefined;
    setId(value: number): Trade;

    hasInitiatoridentityid(): boolean;
    clearInitiatoridentityid(): void;
    getInitiatoridentityid(): string | undefined;
    setInitiatoridentityid(value: string): Trade;

    hasReceiveridentityid(): boolean;
    clearReceiveridentityid(): void;
    getReceiveridentityid(): string | undefined;
    setReceiveridentityid(value: string): Trade;
    clearInitiatortradesList(): void;
    getInitiatortradesList(): Array<Instance>;
    setInitiatortradesList(value: Array<Instance>): Trade;
    addInitiatortrades(value?: Instance, index?: number): Instance;
    clearReceivertradesList(): void;
    getReceivertradesList(): Array<Instance>;
    setReceivertradesList(value: Array<Instance>): Trade;
    addReceivertrades(value?: Instance, index?: number): Instance;

    hasPublic(): boolean;
    clearPublic(): void;
    getPublic(): boolean | undefined;
    setPublic(value: boolean): Trade;

    hasClosed(): boolean;
    clearClosed(): void;
    getClosed(): boolean | undefined;
    setClosed(value: boolean): Trade;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Trade.AsObject;
    static toObject(includeInstance: boolean, msg: Trade): Trade.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Trade, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Trade;
    static deserializeBinaryFromReader(message: Trade, reader: jspb.BinaryReader): Trade;
}

export namespace Trade {
    export type AsObject = {
        id?: number,
        initiatoridentityid?: string,
        receiveridentityid?: string,
        initiatortradesList: Array<Instance.AsObject>,
        receivertradesList: Array<Instance.AsObject>,
        pb_public?: boolean,
        closed?: boolean,
    }
}

export class Recipe extends jspb.Message { 
    getId(): number;
    setId(value: number): Recipe;
    clearInputidsList(): void;
    getInputidsList(): Array<string>;
    setInputidsList(value: Array<string>): Recipe;
    addInputids(value: string, index?: number): string;
    clearOutputidsList(): void;
    getOutputidsList(): Array<string>;
    setOutputidsList(value: Array<string>): Recipe;
    addOutputids(value: string, index?: number): string;
    clearSkillidsList(): void;
    getSkillidsList(): Array<string>;
    setSkillidsList(value: Array<string>): Recipe;
    addSkillids(value: string, index?: number): string;
    clearToolidsList(): void;
    getToolidsList(): Array<string>;
    setToolidsList(value: Array<string>): Recipe;
    addToolids(value: string, index?: number): string;
    clearInputsList(): void;
    getInputsList(): Array<Item>;
    setInputsList(value: Array<Item>): Recipe;
    addInputs(value?: Item, index?: number): Item;
    clearOutputsList(): void;
    getOutputsList(): Array<Item>;
    setOutputsList(value: Array<Item>): Recipe;
    addOutputs(value?: Item, index?: number): Item;
    clearSkillsList(): void;
    getSkillsList(): Array<Skill>;
    setSkillsList(value: Array<Skill>): Recipe;
    addSkills(value?: Skill, index?: number): Skill;
    clearToolsList(): void;
    getToolsList(): Array<Item>;
    setToolsList(value: Array<Item>): Recipe;
    addTools(value?: Item, index?: number): Item;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Recipe.AsObject;
    static toObject(includeInstance: boolean, msg: Recipe): Recipe.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Recipe, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Recipe;
    static deserializeBinaryFromReader(message: Recipe, reader: jspb.BinaryReader): Recipe;
}

export namespace Recipe {
    export type AsObject = {
        id: number,
        inputidsList: Array<string>,
        outputidsList: Array<string>,
        skillidsList: Array<string>,
        toolidsList: Array<string>,
        inputsList: Array<Item.AsObject>,
        outputsList: Array<Item.AsObject>,
        skillsList: Array<Skill.AsObject>,
        toolsList: Array<Item.AsObject>,
    }
}

export class CreateInstancesRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): CreateInstancesRequest;
    getKey(): string;
    setKey(value: string): CreateInstancesRequest;
    clearInstancesList(): void;
    getInstancesList(): Array<Instance>;
    setInstancesList(value: Array<Instance>): CreateInstancesRequest;
    addInstances(value?: Instance, index?: number): Instance;
    getIdentityid(): string;
    setIdentityid(value: string): CreateInstancesRequest;

    hasShow(): boolean;
    clearShow(): void;
    getShow(): boolean | undefined;
    setShow(value: boolean): CreateInstancesRequest;

    hasNote(): boolean;
    clearNote(): void;
    getNote(): string | undefined;
    setNote(value: string): CreateInstancesRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateInstancesRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateInstancesRequest): CreateInstancesRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateInstancesRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateInstancesRequest;
    static deserializeBinaryFromReader(message: CreateInstancesRequest, reader: jspb.BinaryReader): CreateInstancesRequest;
}

export namespace CreateInstancesRequest {
    export type AsObject = {
        appid: number,
        key: string,
        instancesList: Array<Instance.AsObject>,
        identityid: string,
        show?: boolean,
        note?: string,
    }
}

export class CreateInstancesResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): CreateInstancesResponse;
    clearInstancesList(): void;
    getInstancesList(): Array<Instance>;
    setInstancesList(value: Array<Instance>): CreateInstancesResponse;
    addInstances(value?: Instance, index?: number): Instance;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateInstancesResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateInstancesResponse): CreateInstancesResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateInstancesResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateInstancesResponse;
    static deserializeBinaryFromReader(message: CreateInstancesResponse, reader: jspb.BinaryReader): CreateInstancesResponse;
}

export namespace CreateInstancesResponse {
    export type AsObject = {
        response?: string,
        instancesList: Array<Instance.AsObject>,
    }
}

export class CreateInstanceRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): CreateInstanceRequest;
    getKey(): string;
    setKey(value: string): CreateInstanceRequest;
    getItemid(): string;
    setItemid(value: string): CreateInstanceRequest;
    getIdentityid(): string;
    setIdentityid(value: string): CreateInstanceRequest;
    getQuantity(): number;
    setQuantity(value: number): CreateInstanceRequest;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): string | undefined;
    setMetadata(value: string): CreateInstanceRequest;

    hasPublic(): boolean;
    clearPublic(): void;
    getPublic(): boolean | undefined;
    setPublic(value: boolean): CreateInstanceRequest;

    hasShow(): boolean;
    clearShow(): void;
    getShow(): boolean | undefined;
    setShow(value: boolean): CreateInstanceRequest;

    hasNote(): boolean;
    clearNote(): void;
    getNote(): string | undefined;
    setNote(value: string): CreateInstanceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateInstanceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateInstanceRequest): CreateInstanceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateInstanceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateInstanceRequest;
    static deserializeBinaryFromReader(message: CreateInstanceRequest, reader: jspb.BinaryReader): CreateInstanceRequest;
}

export namespace CreateInstanceRequest {
    export type AsObject = {
        appid: number,
        key: string,
        itemid: string,
        identityid: string,
        quantity: number,
        metadata?: string,
        pb_public?: boolean,
        show?: boolean,
        note?: string,
    }
}

export class CreateInstanceResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): CreateInstanceResponse;

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): Instance | undefined;
    setInstance(value?: Instance): CreateInstanceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateInstanceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateInstanceResponse): CreateInstanceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateInstanceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateInstanceResponse;
    static deserializeBinaryFromReader(message: CreateInstanceResponse, reader: jspb.BinaryReader): CreateInstanceResponse;
}

export namespace CreateInstanceResponse {
    export type AsObject = {
        response?: string,
        instance?: Instance.AsObject,
    }
}

export class CreateAppRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): CreateAppRequest;
    getKey(): string;
    setKey(value: string): CreateAppRequest;
    getName(): string;
    setName(value: string): CreateAppRequest;

    hasDescription(): boolean;
    clearDescription(): void;
    getDescription(): string | undefined;
    setDescription(value: string): CreateAppRequest;

    hasPermissions(): boolean;
    clearPermissions(): void;
    getPermissions(): number | undefined;
    setPermissions(value: number): CreateAppRequest;

    hasPublic(): boolean;
    clearPublic(): void;
    getPublic(): boolean | undefined;
    setPublic(value: boolean): CreateAppRequest;

    hasMetadata(): boolean;
    clearMetadata(): void;
    getMetadata(): string | undefined;
    setMetadata(value: string): CreateAppRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateAppRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateAppRequest): CreateAppRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateAppRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateAppRequest;
    static deserializeBinaryFromReader(message: CreateAppRequest, reader: jspb.BinaryReader): CreateAppRequest;
}

export namespace CreateAppRequest {
    export type AsObject = {
        appid: number,
        key: string,
        name: string,
        description?: string,
        permissions?: number,
        pb_public?: boolean,
        metadata?: string,
    }
}

export class CreateAppResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): CreateAppResponse;

    hasApp(): boolean;
    clearApp(): void;
    getApp(): App | undefined;
    setApp(value?: App): CreateAppResponse;

    hasKey(): boolean;
    clearKey(): void;
    getKey(): string | undefined;
    setKey(value: string): CreateAppResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateAppResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateAppResponse): CreateAppResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateAppResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateAppResponse;
    static deserializeBinaryFromReader(message: CreateAppResponse, reader: jspb.BinaryReader): CreateAppResponse;
}

export namespace CreateAppResponse {
    export type AsObject = {
        response?: string,
        app?: App.AsObject,
        key?: string,
    }
}

export class CreateItemRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): CreateItemRequest;
    getKey(): string;
    setKey(value: string): CreateItemRequest;

    hasItem(): boolean;
    clearItem(): void;
    getItem(): Item | undefined;
    setItem(value?: Item): CreateItemRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateItemRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateItemRequest): CreateItemRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateItemRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateItemRequest;
    static deserializeBinaryFromReader(message: CreateItemRequest, reader: jspb.BinaryReader): CreateItemRequest;
}

export namespace CreateItemRequest {
    export type AsObject = {
        appid: number,
        key: string,
        item?: Item.AsObject,
    }
}

export class CreateItemResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): CreateItemResponse;

    hasItem(): boolean;
    clearItem(): void;
    getItem(): Item | undefined;
    setItem(value?: Item): CreateItemResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateItemResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateItemResponse): CreateItemResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateItemResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateItemResponse;
    static deserializeBinaryFromReader(message: CreateItemResponse, reader: jspb.BinaryReader): CreateItemResponse;
}

export namespace CreateItemResponse {
    export type AsObject = {
        response?: string,
        item?: Item.AsObject,
    }
}

export class CreateRecipeRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): CreateRecipeRequest;
    getKey(): string;
    setKey(value: string): CreateRecipeRequest;

    hasRecipe(): boolean;
    clearRecipe(): void;
    getRecipe(): Recipe | undefined;
    setRecipe(value?: Recipe): CreateRecipeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateRecipeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateRecipeRequest): CreateRecipeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateRecipeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateRecipeRequest;
    static deserializeBinaryFromReader(message: CreateRecipeRequest, reader: jspb.BinaryReader): CreateRecipeRequest;
}

export namespace CreateRecipeRequest {
    export type AsObject = {
        appid: number,
        key: string,
        recipe?: Recipe.AsObject,
    }
}

export class CreateRecipeResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): CreateRecipeResponse;

    hasRecipe(): boolean;
    clearRecipe(): void;
    getRecipe(): Recipe | undefined;
    setRecipe(value?: Recipe): CreateRecipeResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateRecipeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateRecipeResponse): CreateRecipeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateRecipeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateRecipeResponse;
    static deserializeBinaryFromReader(message: CreateRecipeResponse, reader: jspb.BinaryReader): CreateRecipeResponse;
}

export namespace CreateRecipeResponse {
    export type AsObject = {
        response?: string,
        recipe?: Recipe.AsObject,
    }
}

export class CreateTradeRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): CreateTradeRequest;
    getKey(): string;
    setKey(value: string): CreateTradeRequest;
    getInitiator(): string;
    setInitiator(value: string): CreateTradeRequest;
    getReceiver(): string;
    setReceiver(value: string): CreateTradeRequest;

    hasPublic(): boolean;
    clearPublic(): void;
    getPublic(): boolean | undefined;
    setPublic(value: boolean): CreateTradeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateTradeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CreateTradeRequest): CreateTradeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateTradeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateTradeRequest;
    static deserializeBinaryFromReader(message: CreateTradeRequest, reader: jspb.BinaryReader): CreateTradeRequest;
}

export namespace CreateTradeRequest {
    export type AsObject = {
        appid: number,
        key: string,
        initiator: string,
        receiver: string,
        pb_public?: boolean,
    }
}

export class CreateTradeResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): CreateTradeResponse;

    hasTrade(): boolean;
    clearTrade(): void;
    getTrade(): Trade | undefined;
    setTrade(value?: Trade): CreateTradeResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CreateTradeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CreateTradeResponse): CreateTradeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CreateTradeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CreateTradeResponse;
    static deserializeBinaryFromReader(message: CreateTradeResponse, reader: jspb.BinaryReader): CreateTradeResponse;
}

export namespace CreateTradeResponse {
    export type AsObject = {
        response?: string,
        trade?: Trade.AsObject,
    }
}

export class ReadIdentityRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): ReadIdentityRequest;
    getKey(): string;
    setKey(value: string): ReadIdentityRequest;
    getIdentityid(): string;
    setIdentityid(value: string): ReadIdentityRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReadIdentityRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ReadIdentityRequest): ReadIdentityRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReadIdentityRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReadIdentityRequest;
    static deserializeBinaryFromReader(message: ReadIdentityRequest, reader: jspb.BinaryReader): ReadIdentityRequest;
}

export namespace ReadIdentityRequest {
    export type AsObject = {
        appid: number,
        key: string,
        identityid: string,
    }
}

export class ReadIdentityResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): ReadIdentityResponse;

    hasIdentity(): boolean;
    clearIdentity(): void;
    getIdentity(): Identity | undefined;
    setIdentity(value?: Identity): ReadIdentityResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReadIdentityResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ReadIdentityResponse): ReadIdentityResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReadIdentityResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReadIdentityResponse;
    static deserializeBinaryFromReader(message: ReadIdentityResponse, reader: jspb.BinaryReader): ReadIdentityResponse;
}

export namespace ReadIdentityResponse {
    export type AsObject = {
        response?: string,
        identity?: Identity.AsObject,
    }
}

export class ReadInventoryRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): ReadInventoryRequest;
    getKey(): string;
    setKey(value: string): ReadInventoryRequest;
    getIdentityid(): string;
    setIdentityid(value: string): ReadInventoryRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReadInventoryRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ReadInventoryRequest): ReadInventoryRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReadInventoryRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReadInventoryRequest;
    static deserializeBinaryFromReader(message: ReadInventoryRequest, reader: jspb.BinaryReader): ReadInventoryRequest;
}

export namespace ReadInventoryRequest {
    export type AsObject = {
        appid: number,
        key: string,
        identityid: string,
    }
}

export class ReadInventoryResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): ReadInventoryResponse;
    clearInventoryList(): void;
    getInventoryList(): Array<Instance>;
    setInventoryList(value: Array<Instance>): ReadInventoryResponse;
    addInventory(value?: Instance, index?: number): Instance;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReadInventoryResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ReadInventoryResponse): ReadInventoryResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReadInventoryResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReadInventoryResponse;
    static deserializeBinaryFromReader(message: ReadInventoryResponse, reader: jspb.BinaryReader): ReadInventoryResponse;
}

export namespace ReadInventoryResponse {
    export type AsObject = {
        response?: string,
        inventoryList: Array<Instance.AsObject>,
    }
}

export class ReadItemRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): ReadItemRequest;
    getKey(): string;
    setKey(value: string): ReadItemRequest;
    getQuery(): string;
    setQuery(value: string): ReadItemRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReadItemRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ReadItemRequest): ReadItemRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReadItemRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReadItemRequest;
    static deserializeBinaryFromReader(message: ReadItemRequest, reader: jspb.BinaryReader): ReadItemRequest;
}

export namespace ReadItemRequest {
    export type AsObject = {
        appid: number,
        key: string,
        query: string,
    }
}

export class ReadItemResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): ReadItemResponse;
    clearItemsList(): void;
    getItemsList(): Array<Item>;
    setItemsList(value: Array<Item>): ReadItemResponse;
    addItems(value?: Item, index?: number): Item;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReadItemResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ReadItemResponse): ReadItemResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReadItemResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReadItemResponse;
    static deserializeBinaryFromReader(message: ReadItemResponse, reader: jspb.BinaryReader): ReadItemResponse;
}

export namespace ReadItemResponse {
    export type AsObject = {
        response?: string,
        itemsList: Array<Item.AsObject>,
    }
}

export class ReadInstanceRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): ReadInstanceRequest;
    getKey(): string;
    setKey(value: string): ReadInstanceRequest;
    getInstanceid(): number;
    setInstanceid(value: number): ReadInstanceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReadInstanceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ReadInstanceRequest): ReadInstanceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReadInstanceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReadInstanceRequest;
    static deserializeBinaryFromReader(message: ReadInstanceRequest, reader: jspb.BinaryReader): ReadInstanceRequest;
}

export namespace ReadInstanceRequest {
    export type AsObject = {
        appid: number,
        key: string,
        instanceid: number,
    }
}

export class ReadInstanceResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): ReadInstanceResponse;

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): Instance | undefined;
    setInstance(value?: Instance): ReadInstanceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReadInstanceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ReadInstanceResponse): ReadInstanceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReadInstanceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReadInstanceResponse;
    static deserializeBinaryFromReader(message: ReadInstanceResponse, reader: jspb.BinaryReader): ReadInstanceResponse;
}

export namespace ReadInstanceResponse {
    export type AsObject = {
        response?: string,
        instance?: Instance.AsObject,
    }
}

export class ReadAppRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): ReadAppRequest;
    getKey(): string;
    setKey(value: string): ReadAppRequest;
    getOptappid(): number;
    setOptappid(value: number): ReadAppRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReadAppRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ReadAppRequest): ReadAppRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReadAppRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReadAppRequest;
    static deserializeBinaryFromReader(message: ReadAppRequest, reader: jspb.BinaryReader): ReadAppRequest;
}

export namespace ReadAppRequest {
    export type AsObject = {
        appid: number,
        key: string,
        optappid: number,
    }
}

export class ReadAppResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): ReadAppResponse;

    hasApp(): boolean;
    clearApp(): void;
    getApp(): App | undefined;
    setApp(value?: App): ReadAppResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReadAppResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ReadAppResponse): ReadAppResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReadAppResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReadAppResponse;
    static deserializeBinaryFromReader(message: ReadAppResponse, reader: jspb.BinaryReader): ReadAppResponse;
}

export namespace ReadAppResponse {
    export type AsObject = {
        response?: string,
        app?: App.AsObject,
    }
}

export class ReadTradeRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): ReadTradeRequest;
    getKey(): string;
    setKey(value: string): ReadTradeRequest;
    getTradeid(): number;
    setTradeid(value: number): ReadTradeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReadTradeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ReadTradeRequest): ReadTradeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReadTradeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReadTradeRequest;
    static deserializeBinaryFromReader(message: ReadTradeRequest, reader: jspb.BinaryReader): ReadTradeRequest;
}

export namespace ReadTradeRequest {
    export type AsObject = {
        appid: number,
        key: string,
        tradeid: number,
    }
}

export class ReadTradeResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): ReadTradeResponse;

    hasTrade(): boolean;
    clearTrade(): void;
    getTrade(): Trade | undefined;
    setTrade(value?: Trade): ReadTradeResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReadTradeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ReadTradeResponse): ReadTradeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReadTradeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReadTradeResponse;
    static deserializeBinaryFromReader(message: ReadTradeResponse, reader: jspb.BinaryReader): ReadTradeResponse;
}

export namespace ReadTradeResponse {
    export type AsObject = {
        response?: string,
        trade?: Trade.AsObject,
    }
}

export class ReadRecipeRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): ReadRecipeRequest;
    getKey(): string;
    setKey(value: string): ReadRecipeRequest;
    getRecipeid(): number;
    setRecipeid(value: number): ReadRecipeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReadRecipeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: ReadRecipeRequest): ReadRecipeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReadRecipeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReadRecipeRequest;
    static deserializeBinaryFromReader(message: ReadRecipeRequest, reader: jspb.BinaryReader): ReadRecipeRequest;
}

export namespace ReadRecipeRequest {
    export type AsObject = {
        appid: number,
        key: string,
        recipeid: number,
    }
}

export class ReadRecipeResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): ReadRecipeResponse;

    hasRecipe(): boolean;
    clearRecipe(): void;
    getRecipe(): Recipe | undefined;
    setRecipe(value?: Recipe): ReadRecipeResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): ReadRecipeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: ReadRecipeResponse): ReadRecipeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: ReadRecipeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): ReadRecipeResponse;
    static deserializeBinaryFromReader(message: ReadRecipeResponse, reader: jspb.BinaryReader): ReadRecipeResponse;
}

export namespace ReadRecipeResponse {
    export type AsObject = {
        response?: string,
        recipe?: Recipe.AsObject,
    }
}

export class UpdateIdentityMetadataRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): UpdateIdentityMetadataRequest;
    getKey(): string;
    setKey(value: string): UpdateIdentityMetadataRequest;
    getIdentityid(): string;
    setIdentityid(value: string): UpdateIdentityMetadataRequest;
    getMetadata(): string;
    setMetadata(value: string): UpdateIdentityMetadataRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateIdentityMetadataRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateIdentityMetadataRequest): UpdateIdentityMetadataRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateIdentityMetadataRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateIdentityMetadataRequest;
    static deserializeBinaryFromReader(message: UpdateIdentityMetadataRequest, reader: jspb.BinaryReader): UpdateIdentityMetadataRequest;
}

export namespace UpdateIdentityMetadataRequest {
    export type AsObject = {
        appid: number,
        key: string,
        identityid: string,
        metadata: string,
    }
}

export class UpdateIdentityMetadataResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): UpdateIdentityMetadataResponse;

    hasIdentity(): boolean;
    clearIdentity(): void;
    getIdentity(): Identity | undefined;
    setIdentity(value?: Identity): UpdateIdentityMetadataResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateIdentityMetadataResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateIdentityMetadataResponse): UpdateIdentityMetadataResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateIdentityMetadataResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateIdentityMetadataResponse;
    static deserializeBinaryFromReader(message: UpdateIdentityMetadataResponse, reader: jspb.BinaryReader): UpdateIdentityMetadataResponse;
}

export namespace UpdateIdentityMetadataResponse {
    export type AsObject = {
        response?: string,
        identity?: Identity.AsObject,
    }
}

export class UpdateInstanceRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): UpdateInstanceRequest;
    getKey(): string;
    setKey(value: string): UpdateInstanceRequest;
    getInstanceid(): number;
    setInstanceid(value: number): UpdateInstanceRequest;

    hasNew(): boolean;
    clearNew(): void;
    getNew(): Instance | undefined;
    setNew(value?: Instance): UpdateInstanceRequest;

    hasShow(): boolean;
    clearShow(): void;
    getShow(): boolean | undefined;
    setShow(value: boolean): UpdateInstanceRequest;

    hasNote(): boolean;
    clearNote(): void;
    getNote(): string | undefined;
    setNote(value: string): UpdateInstanceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateInstanceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateInstanceRequest): UpdateInstanceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateInstanceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateInstanceRequest;
    static deserializeBinaryFromReader(message: UpdateInstanceRequest, reader: jspb.BinaryReader): UpdateInstanceRequest;
}

export namespace UpdateInstanceRequest {
    export type AsObject = {
        appid: number,
        key: string,
        instanceid: number,
        pb_new?: Instance.AsObject,
        show?: boolean,
        note?: string,
    }
}

export class UpdateInstanceResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): UpdateInstanceResponse;

    hasInstance(): boolean;
    clearInstance(): void;
    getInstance(): Instance | undefined;
    setInstance(value?: Instance): UpdateInstanceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateInstanceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateInstanceResponse): UpdateInstanceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateInstanceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateInstanceResponse;
    static deserializeBinaryFromReader(message: UpdateInstanceResponse, reader: jspb.BinaryReader): UpdateInstanceResponse;
}

export namespace UpdateInstanceResponse {
    export type AsObject = {
        response?: string,
        instance?: Instance.AsObject,
    }
}

export class UpdateItemRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): UpdateItemRequest;
    getKey(): string;
    setKey(value: string): UpdateItemRequest;
    getItemid(): string;
    setItemid(value: string): UpdateItemRequest;

    hasNew(): boolean;
    clearNew(): void;
    getNew(): Item | undefined;
    setNew(value?: Item): UpdateItemRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateItemRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateItemRequest): UpdateItemRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateItemRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateItemRequest;
    static deserializeBinaryFromReader(message: UpdateItemRequest, reader: jspb.BinaryReader): UpdateItemRequest;
}

export namespace UpdateItemRequest {
    export type AsObject = {
        appid: number,
        key: string,
        itemid: string,
        pb_new?: Item.AsObject,
    }
}

export class UpdateItemResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): UpdateItemResponse;

    hasItem(): boolean;
    clearItem(): void;
    getItem(): Item | undefined;
    setItem(value?: Item): UpdateItemResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateItemResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateItemResponse): UpdateItemResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateItemResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateItemResponse;
    static deserializeBinaryFromReader(message: UpdateItemResponse, reader: jspb.BinaryReader): UpdateItemResponse;
}

export namespace UpdateItemResponse {
    export type AsObject = {
        response?: string,
        item?: Item.AsObject,
    }
}

export class UpdateAppRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): UpdateAppRequest;
    getKey(): string;
    setKey(value: string): UpdateAppRequest;

    hasOptappid(): boolean;
    clearOptappid(): void;
    getOptappid(): number | undefined;
    setOptappid(value: number): UpdateAppRequest;

    hasNew(): boolean;
    clearNew(): void;
    getNew(): App | undefined;
    setNew(value?: App): UpdateAppRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateAppRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateAppRequest): UpdateAppRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateAppRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateAppRequest;
    static deserializeBinaryFromReader(message: UpdateAppRequest, reader: jspb.BinaryReader): UpdateAppRequest;
}

export namespace UpdateAppRequest {
    export type AsObject = {
        appid: number,
        key: string,
        optappid?: number,
        pb_new?: App.AsObject,
    }
}

export class UpdateAppResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): UpdateAppResponse;

    hasApp(): boolean;
    clearApp(): void;
    getApp(): App | undefined;
    setApp(value?: App): UpdateAppResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateAppResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateAppResponse): UpdateAppResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateAppResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateAppResponse;
    static deserializeBinaryFromReader(message: UpdateAppResponse, reader: jspb.BinaryReader): UpdateAppResponse;
}

export namespace UpdateAppResponse {
    export type AsObject = {
        response?: string,
        app?: App.AsObject,
    }
}

export class UpdateTradeRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): UpdateTradeRequest;
    getKey(): string;
    setKey(value: string): UpdateTradeRequest;
    getTradeid(): number;
    setTradeid(value: number): UpdateTradeRequest;
    getIdentityid(): string;
    setIdentityid(value: string): UpdateTradeRequest;
    clearAddList(): void;
    getAddList(): Array<Instance>;
    setAddList(value: Array<Instance>): UpdateTradeRequest;
    addAdd(value?: Instance, index?: number): Instance;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateTradeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateTradeRequest): UpdateTradeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateTradeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateTradeRequest;
    static deserializeBinaryFromReader(message: UpdateTradeRequest, reader: jspb.BinaryReader): UpdateTradeRequest;
}

export namespace UpdateTradeRequest {
    export type AsObject = {
        appid: number,
        key: string,
        tradeid: number,
        identityid: string,
        addList: Array<Instance.AsObject>,
    }
}

export class UpdateTradeResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): UpdateTradeResponse;

    hasTrade(): boolean;
    clearTrade(): void;
    getTrade(): Trade | undefined;
    setTrade(value?: Trade): UpdateTradeResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateTradeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateTradeResponse): UpdateTradeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateTradeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateTradeResponse;
    static deserializeBinaryFromReader(message: UpdateTradeResponse, reader: jspb.BinaryReader): UpdateTradeResponse;
}

export namespace UpdateTradeResponse {
    export type AsObject = {
        response?: string,
        trade?: Trade.AsObject,
    }
}

export class UpdateRecipeRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): UpdateRecipeRequest;
    getKey(): string;
    setKey(value: string): UpdateRecipeRequest;
    getRecipeid(): string;
    setRecipeid(value: string): UpdateRecipeRequest;

    hasNew(): boolean;
    clearNew(): void;
    getNew(): Recipe | undefined;
    setNew(value?: Recipe): UpdateRecipeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateRecipeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateRecipeRequest): UpdateRecipeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateRecipeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateRecipeRequest;
    static deserializeBinaryFromReader(message: UpdateRecipeRequest, reader: jspb.BinaryReader): UpdateRecipeRequest;
}

export namespace UpdateRecipeRequest {
    export type AsObject = {
        appid: number,
        key: string,
        recipeid: string,
        pb_new?: Recipe.AsObject,
    }
}

export class UpdateRecipeResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): UpdateRecipeResponse;

    hasRecipe(): boolean;
    clearRecipe(): void;
    getRecipe(): Recipe | undefined;
    setRecipe(value?: Recipe): UpdateRecipeResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): UpdateRecipeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: UpdateRecipeResponse): UpdateRecipeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: UpdateRecipeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): UpdateRecipeResponse;
    static deserializeBinaryFromReader(message: UpdateRecipeResponse, reader: jspb.BinaryReader): UpdateRecipeResponse;
}

export namespace UpdateRecipeResponse {
    export type AsObject = {
        response?: string,
        recipe?: Recipe.AsObject,
    }
}

export class DeleteAppRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): DeleteAppRequest;
    getKey(): string;
    setKey(value: string): DeleteAppRequest;
    getDeleteappid(): number;
    setDeleteappid(value: number): DeleteAppRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteAppRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteAppRequest): DeleteAppRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteAppRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteAppRequest;
    static deserializeBinaryFromReader(message: DeleteAppRequest, reader: jspb.BinaryReader): DeleteAppRequest;
}

export namespace DeleteAppRequest {
    export type AsObject = {
        appid: number,
        key: string,
        deleteappid: number,
    }
}

export class DeleteAppResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): DeleteAppResponse;

    hasDeletedapp(): boolean;
    clearDeletedapp(): void;
    getDeletedapp(): App | undefined;
    setDeletedapp(value?: App): DeleteAppResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteAppResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteAppResponse): DeleteAppResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteAppResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteAppResponse;
    static deserializeBinaryFromReader(message: DeleteAppResponse, reader: jspb.BinaryReader): DeleteAppResponse;
}

export namespace DeleteAppResponse {
    export type AsObject = {
        response?: string,
        deletedapp?: App.AsObject,
    }
}

export class DeleteInstanceRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): DeleteInstanceRequest;
    getKey(): string;
    setKey(value: string): DeleteInstanceRequest;
    getInstanceid(): number;
    setInstanceid(value: number): DeleteInstanceRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteInstanceRequest.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteInstanceRequest): DeleteInstanceRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteInstanceRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteInstanceRequest;
    static deserializeBinaryFromReader(message: DeleteInstanceRequest, reader: jspb.BinaryReader): DeleteInstanceRequest;
}

export namespace DeleteInstanceRequest {
    export type AsObject = {
        appid: number,
        key: string,
        instanceid: number,
    }
}

export class DeleteInstanceResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): DeleteInstanceResponse;

    hasDeletedinstance(): boolean;
    clearDeletedinstance(): void;
    getDeletedinstance(): Instance | undefined;
    setDeletedinstance(value?: Instance): DeleteInstanceResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): DeleteInstanceResponse.AsObject;
    static toObject(includeInstance: boolean, msg: DeleteInstanceResponse): DeleteInstanceResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: DeleteInstanceResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): DeleteInstanceResponse;
    static deserializeBinaryFromReader(message: DeleteInstanceResponse, reader: jspb.BinaryReader): DeleteInstanceResponse;
}

export namespace DeleteInstanceResponse {
    export type AsObject = {
        response?: string,
        deletedinstance?: Instance.AsObject,
    }
}

export class CloseTradeRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): CloseTradeRequest;
    getKey(): string;
    setKey(value: string): CloseTradeRequest;
    getTradeid(): number;
    setTradeid(value: number): CloseTradeRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CloseTradeRequest.AsObject;
    static toObject(includeInstance: boolean, msg: CloseTradeRequest): CloseTradeRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CloseTradeRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CloseTradeRequest;
    static deserializeBinaryFromReader(message: CloseTradeRequest, reader: jspb.BinaryReader): CloseTradeRequest;
}

export namespace CloseTradeRequest {
    export type AsObject = {
        appid: number,
        key: string,
        tradeid: number,
    }
}

export class CloseTradeResponse extends jspb.Message { 

    hasResponse(): boolean;
    clearResponse(): void;
    getResponse(): string | undefined;
    setResponse(value: string): CloseTradeResponse;

    hasTrade(): boolean;
    clearTrade(): void;
    getTrade(): Trade | undefined;
    setTrade(value?: Trade): CloseTradeResponse;

    hasInitiator(): boolean;
    clearInitiator(): void;
    getInitiator(): Identity | undefined;
    setInitiator(value?: Identity): CloseTradeResponse;

    hasReceiver(): boolean;
    clearReceiver(): void;
    getReceiver(): Identity | undefined;
    setReceiver(value?: Identity): CloseTradeResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): CloseTradeResponse.AsObject;
    static toObject(includeInstance: boolean, msg: CloseTradeResponse): CloseTradeResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: CloseTradeResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): CloseTradeResponse;
    static deserializeBinaryFromReader(message: CloseTradeResponse, reader: jspb.BinaryReader): CloseTradeResponse;
}

export namespace CloseTradeResponse {
    export type AsObject = {
        response?: string,
        trade?: Trade.AsObject,
        initiator?: Identity.AsObject,
        receiver?: Identity.AsObject,
    }
}

export class VerifyKeyRequest extends jspb.Message { 
    getAppid(): number;
    setAppid(value: number): VerifyKeyRequest;
    getKey(): string;
    setKey(value: string): VerifyKeyRequest;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): VerifyKeyRequest.AsObject;
    static toObject(includeInstance: boolean, msg: VerifyKeyRequest): VerifyKeyRequest.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: VerifyKeyRequest, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): VerifyKeyRequest;
    static deserializeBinaryFromReader(message: VerifyKeyRequest, reader: jspb.BinaryReader): VerifyKeyRequest;
}

export namespace VerifyKeyRequest {
    export type AsObject = {
        appid: number,
        key: string,
    }
}

export class VerifyKeyResponse extends jspb.Message { 
    getValid(): boolean;
    setValid(value: boolean): VerifyKeyResponse;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): VerifyKeyResponse.AsObject;
    static toObject(includeInstance: boolean, msg: VerifyKeyResponse): VerifyKeyResponse.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: VerifyKeyResponse, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): VerifyKeyResponse;
    static deserializeBinaryFromReader(message: VerifyKeyResponse, reader: jspb.BinaryReader): VerifyKeyResponse;
}

export namespace VerifyKeyResponse {
    export type AsObject = {
        valid: boolean,
    }
}
