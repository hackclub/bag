// package: bag
// file: bag.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import * as bag_pb from "./bag_pb";

interface IBagServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    createApp: IBagServiceService_ICreateApp;
    createInstances: IBagServiceService_ICreateInstances;
    createInstance: IBagServiceService_ICreateInstance;
    createItem: IBagServiceService_ICreateItem;
    createRecipe: IBagServiceService_ICreateRecipe;
    createTrade: IBagServiceService_ICreateTrade;
    readIdentity: IBagServiceService_IReadIdentity;
    readInventory: IBagServiceService_IReadInventory;
    readItem: IBagServiceService_IReadItem;
    readInstance: IBagServiceService_IReadInstance;
    readApp: IBagServiceService_IReadApp;
    readTrade: IBagServiceService_IReadTrade;
    readRecipe: IBagServiceService_IReadRecipe;
    updateIdentityMetadata: IBagServiceService_IUpdateIdentityMetadata;
    updateInstance: IBagServiceService_IUpdateInstance;
    updateItem: IBagServiceService_IUpdateItem;
    updateApp: IBagServiceService_IUpdateApp;
    updateTrade: IBagServiceService_IUpdateTrade;
    updateRecipe: IBagServiceService_IUpdateRecipe;
    deleteApp: IBagServiceService_IDeleteApp;
    deleteInstance: IBagServiceService_IDeleteInstance;
    closeTrade: IBagServiceService_ICloseTrade;
    verifyKey: IBagServiceService_IVerifyKey;
}

interface IBagServiceService_ICreateApp extends grpc.MethodDefinition<bag_pb.CreateAppRequest, bag_pb.CreateAppResponse> {
    path: "/bag.BagService/CreateApp";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.CreateAppRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.CreateAppRequest>;
    responseSerialize: grpc.serialize<bag_pb.CreateAppResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.CreateAppResponse>;
}
interface IBagServiceService_ICreateInstances extends grpc.MethodDefinition<bag_pb.CreateInstancesRequest, bag_pb.CreateInstancesResponse> {
    path: "/bag.BagService/CreateInstances";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.CreateInstancesRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.CreateInstancesRequest>;
    responseSerialize: grpc.serialize<bag_pb.CreateInstancesResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.CreateInstancesResponse>;
}
interface IBagServiceService_ICreateInstance extends grpc.MethodDefinition<bag_pb.CreateInstanceRequest, bag_pb.CreateInstanceResponse> {
    path: "/bag.BagService/CreateInstance";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.CreateInstanceRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.CreateInstanceRequest>;
    responseSerialize: grpc.serialize<bag_pb.CreateInstanceResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.CreateInstanceResponse>;
}
interface IBagServiceService_ICreateItem extends grpc.MethodDefinition<bag_pb.CreateItemRequest, bag_pb.CreateItemResponse> {
    path: "/bag.BagService/CreateItem";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.CreateItemRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.CreateItemRequest>;
    responseSerialize: grpc.serialize<bag_pb.CreateItemResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.CreateItemResponse>;
}
interface IBagServiceService_ICreateRecipe extends grpc.MethodDefinition<bag_pb.CreateRecipeRequest, bag_pb.CreateRecipeResponse> {
    path: "/bag.BagService/CreateRecipe";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.CreateRecipeRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.CreateRecipeRequest>;
    responseSerialize: grpc.serialize<bag_pb.CreateRecipeResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.CreateRecipeResponse>;
}
interface IBagServiceService_ICreateTrade extends grpc.MethodDefinition<bag_pb.CreateTradeRequest, bag_pb.CreateTradeResponse> {
    path: "/bag.BagService/CreateTrade";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.CreateTradeRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.CreateTradeRequest>;
    responseSerialize: grpc.serialize<bag_pb.CreateTradeResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.CreateTradeResponse>;
}
interface IBagServiceService_IReadIdentity extends grpc.MethodDefinition<bag_pb.ReadIdentityRequest, bag_pb.ReadIdentityResponse> {
    path: "/bag.BagService/ReadIdentity";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.ReadIdentityRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.ReadIdentityRequest>;
    responseSerialize: grpc.serialize<bag_pb.ReadIdentityResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.ReadIdentityResponse>;
}
interface IBagServiceService_IReadInventory extends grpc.MethodDefinition<bag_pb.ReadInventoryRequest, bag_pb.ReadInventoryResponse> {
    path: "/bag.BagService/ReadInventory";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.ReadInventoryRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.ReadInventoryRequest>;
    responseSerialize: grpc.serialize<bag_pb.ReadInventoryResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.ReadInventoryResponse>;
}
interface IBagServiceService_IReadItem extends grpc.MethodDefinition<bag_pb.ReadItemRequest, bag_pb.ReadItemResponse> {
    path: "/bag.BagService/ReadItem";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.ReadItemRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.ReadItemRequest>;
    responseSerialize: grpc.serialize<bag_pb.ReadItemResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.ReadItemResponse>;
}
interface IBagServiceService_IReadInstance extends grpc.MethodDefinition<bag_pb.ReadInstanceRequest, bag_pb.ReadInstanceResponse> {
    path: "/bag.BagService/ReadInstance";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.ReadInstanceRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.ReadInstanceRequest>;
    responseSerialize: grpc.serialize<bag_pb.ReadInstanceResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.ReadInstanceResponse>;
}
interface IBagServiceService_IReadApp extends grpc.MethodDefinition<bag_pb.ReadAppRequest, bag_pb.ReadAppResponse> {
    path: "/bag.BagService/ReadApp";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.ReadAppRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.ReadAppRequest>;
    responseSerialize: grpc.serialize<bag_pb.ReadAppResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.ReadAppResponse>;
}
interface IBagServiceService_IReadTrade extends grpc.MethodDefinition<bag_pb.ReadTradeRequest, bag_pb.ReadTradeResponse> {
    path: "/bag.BagService/ReadTrade";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.ReadTradeRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.ReadTradeRequest>;
    responseSerialize: grpc.serialize<bag_pb.ReadTradeResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.ReadTradeResponse>;
}
interface IBagServiceService_IReadRecipe extends grpc.MethodDefinition<bag_pb.ReadRecipeRequest, bag_pb.ReadRecipeResponse> {
    path: "/bag.BagService/ReadRecipe";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.ReadRecipeRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.ReadRecipeRequest>;
    responseSerialize: grpc.serialize<bag_pb.ReadRecipeResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.ReadRecipeResponse>;
}
interface IBagServiceService_IUpdateIdentityMetadata extends grpc.MethodDefinition<bag_pb.UpdateIdentityMetadataRequest, bag_pb.UpdateIdentityMetadataResponse> {
    path: "/bag.BagService/UpdateIdentityMetadata";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.UpdateIdentityMetadataRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.UpdateIdentityMetadataRequest>;
    responseSerialize: grpc.serialize<bag_pb.UpdateIdentityMetadataResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.UpdateIdentityMetadataResponse>;
}
interface IBagServiceService_IUpdateInstance extends grpc.MethodDefinition<bag_pb.UpdateInstanceRequest, bag_pb.UpdateInstanceResponse> {
    path: "/bag.BagService/UpdateInstance";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.UpdateInstanceRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.UpdateInstanceRequest>;
    responseSerialize: grpc.serialize<bag_pb.UpdateInstanceResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.UpdateInstanceResponse>;
}
interface IBagServiceService_IUpdateItem extends grpc.MethodDefinition<bag_pb.UpdateItemRequest, bag_pb.UpdateItemResponse> {
    path: "/bag.BagService/UpdateItem";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.UpdateItemRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.UpdateItemRequest>;
    responseSerialize: grpc.serialize<bag_pb.UpdateItemResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.UpdateItemResponse>;
}
interface IBagServiceService_IUpdateApp extends grpc.MethodDefinition<bag_pb.UpdateAppRequest, bag_pb.UpdateAppResponse> {
    path: "/bag.BagService/UpdateApp";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.UpdateAppRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.UpdateAppRequest>;
    responseSerialize: grpc.serialize<bag_pb.UpdateAppResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.UpdateAppResponse>;
}
interface IBagServiceService_IUpdateTrade extends grpc.MethodDefinition<bag_pb.UpdateTradeRequest, bag_pb.UpdateTradeResponse> {
    path: "/bag.BagService/UpdateTrade";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.UpdateTradeRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.UpdateTradeRequest>;
    responseSerialize: grpc.serialize<bag_pb.UpdateTradeResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.UpdateTradeResponse>;
}
interface IBagServiceService_IUpdateRecipe extends grpc.MethodDefinition<bag_pb.UpdateRecipeRequest, bag_pb.UpdateRecipeResponse> {
    path: "/bag.BagService/UpdateRecipe";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.UpdateRecipeRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.UpdateRecipeRequest>;
    responseSerialize: grpc.serialize<bag_pb.UpdateRecipeResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.UpdateRecipeResponse>;
}
interface IBagServiceService_IDeleteApp extends grpc.MethodDefinition<bag_pb.DeleteAppRequest, bag_pb.DeleteAppResponse> {
    path: "/bag.BagService/DeleteApp";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.DeleteAppRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.DeleteAppRequest>;
    responseSerialize: grpc.serialize<bag_pb.DeleteAppResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.DeleteAppResponse>;
}
interface IBagServiceService_IDeleteInstance extends grpc.MethodDefinition<bag_pb.DeleteInstanceRequest, bag_pb.DeleteInstanceResponse> {
    path: "/bag.BagService/DeleteInstance";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.DeleteInstanceRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.DeleteInstanceRequest>;
    responseSerialize: grpc.serialize<bag_pb.DeleteInstanceResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.DeleteInstanceResponse>;
}
interface IBagServiceService_ICloseTrade extends grpc.MethodDefinition<bag_pb.CloseTradeRequest, bag_pb.CloseTradeResponse> {
    path: "/bag.BagService/CloseTrade";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.CloseTradeRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.CloseTradeRequest>;
    responseSerialize: grpc.serialize<bag_pb.CloseTradeResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.CloseTradeResponse>;
}
interface IBagServiceService_IVerifyKey extends grpc.MethodDefinition<bag_pb.VerifyKeyRequest, bag_pb.VerifyKeyResponse> {
    path: "/bag.BagService/VerifyKey";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<bag_pb.VerifyKeyRequest>;
    requestDeserialize: grpc.deserialize<bag_pb.VerifyKeyRequest>;
    responseSerialize: grpc.serialize<bag_pb.VerifyKeyResponse>;
    responseDeserialize: grpc.deserialize<bag_pb.VerifyKeyResponse>;
}

export const BagServiceService: IBagServiceService;

export interface IBagServiceServer extends grpc.UntypedServiceImplementation {
    createApp: grpc.handleUnaryCall<bag_pb.CreateAppRequest, bag_pb.CreateAppResponse>;
    createInstances: grpc.handleUnaryCall<bag_pb.CreateInstancesRequest, bag_pb.CreateInstancesResponse>;
    createInstance: grpc.handleUnaryCall<bag_pb.CreateInstanceRequest, bag_pb.CreateInstanceResponse>;
    createItem: grpc.handleUnaryCall<bag_pb.CreateItemRequest, bag_pb.CreateItemResponse>;
    createRecipe: grpc.handleUnaryCall<bag_pb.CreateRecipeRequest, bag_pb.CreateRecipeResponse>;
    createTrade: grpc.handleUnaryCall<bag_pb.CreateTradeRequest, bag_pb.CreateTradeResponse>;
    readIdentity: grpc.handleUnaryCall<bag_pb.ReadIdentityRequest, bag_pb.ReadIdentityResponse>;
    readInventory: grpc.handleUnaryCall<bag_pb.ReadInventoryRequest, bag_pb.ReadInventoryResponse>;
    readItem: grpc.handleUnaryCall<bag_pb.ReadItemRequest, bag_pb.ReadItemResponse>;
    readInstance: grpc.handleUnaryCall<bag_pb.ReadInstanceRequest, bag_pb.ReadInstanceResponse>;
    readApp: grpc.handleUnaryCall<bag_pb.ReadAppRequest, bag_pb.ReadAppResponse>;
    readTrade: grpc.handleUnaryCall<bag_pb.ReadTradeRequest, bag_pb.ReadTradeResponse>;
    readRecipe: grpc.handleUnaryCall<bag_pb.ReadRecipeRequest, bag_pb.ReadRecipeResponse>;
    updateIdentityMetadata: grpc.handleUnaryCall<bag_pb.UpdateIdentityMetadataRequest, bag_pb.UpdateIdentityMetadataResponse>;
    updateInstance: grpc.handleUnaryCall<bag_pb.UpdateInstanceRequest, bag_pb.UpdateInstanceResponse>;
    updateItem: grpc.handleUnaryCall<bag_pb.UpdateItemRequest, bag_pb.UpdateItemResponse>;
    updateApp: grpc.handleUnaryCall<bag_pb.UpdateAppRequest, bag_pb.UpdateAppResponse>;
    updateTrade: grpc.handleUnaryCall<bag_pb.UpdateTradeRequest, bag_pb.UpdateTradeResponse>;
    updateRecipe: grpc.handleUnaryCall<bag_pb.UpdateRecipeRequest, bag_pb.UpdateRecipeResponse>;
    deleteApp: grpc.handleUnaryCall<bag_pb.DeleteAppRequest, bag_pb.DeleteAppResponse>;
    deleteInstance: grpc.handleUnaryCall<bag_pb.DeleteInstanceRequest, bag_pb.DeleteInstanceResponse>;
    closeTrade: grpc.handleUnaryCall<bag_pb.CloseTradeRequest, bag_pb.CloseTradeResponse>;
    verifyKey: grpc.handleUnaryCall<bag_pb.VerifyKeyRequest, bag_pb.VerifyKeyResponse>;
}

export interface IBagServiceClient {
    createApp(request: bag_pb.CreateAppRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateAppResponse) => void): grpc.ClientUnaryCall;
    createApp(request: bag_pb.CreateAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateAppResponse) => void): grpc.ClientUnaryCall;
    createApp(request: bag_pb.CreateAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateAppResponse) => void): grpc.ClientUnaryCall;
    createInstances(request: bag_pb.CreateInstancesRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateInstancesResponse) => void): grpc.ClientUnaryCall;
    createInstances(request: bag_pb.CreateInstancesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateInstancesResponse) => void): grpc.ClientUnaryCall;
    createInstances(request: bag_pb.CreateInstancesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateInstancesResponse) => void): grpc.ClientUnaryCall;
    createInstance(request: bag_pb.CreateInstanceRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateInstanceResponse) => void): grpc.ClientUnaryCall;
    createInstance(request: bag_pb.CreateInstanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateInstanceResponse) => void): grpc.ClientUnaryCall;
    createInstance(request: bag_pb.CreateInstanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateInstanceResponse) => void): grpc.ClientUnaryCall;
    createItem(request: bag_pb.CreateItemRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateItemResponse) => void): grpc.ClientUnaryCall;
    createItem(request: bag_pb.CreateItemRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateItemResponse) => void): grpc.ClientUnaryCall;
    createItem(request: bag_pb.CreateItemRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateItemResponse) => void): grpc.ClientUnaryCall;
    createRecipe(request: bag_pb.CreateRecipeRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateRecipeResponse) => void): grpc.ClientUnaryCall;
    createRecipe(request: bag_pb.CreateRecipeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateRecipeResponse) => void): grpc.ClientUnaryCall;
    createRecipe(request: bag_pb.CreateRecipeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateRecipeResponse) => void): grpc.ClientUnaryCall;
    createTrade(request: bag_pb.CreateTradeRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateTradeResponse) => void): grpc.ClientUnaryCall;
    createTrade(request: bag_pb.CreateTradeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateTradeResponse) => void): grpc.ClientUnaryCall;
    createTrade(request: bag_pb.CreateTradeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateTradeResponse) => void): grpc.ClientUnaryCall;
    readIdentity(request: bag_pb.ReadIdentityRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadIdentityResponse) => void): grpc.ClientUnaryCall;
    readIdentity(request: bag_pb.ReadIdentityRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadIdentityResponse) => void): grpc.ClientUnaryCall;
    readIdentity(request: bag_pb.ReadIdentityRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadIdentityResponse) => void): grpc.ClientUnaryCall;
    readInventory(request: bag_pb.ReadInventoryRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadInventoryResponse) => void): grpc.ClientUnaryCall;
    readInventory(request: bag_pb.ReadInventoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadInventoryResponse) => void): grpc.ClientUnaryCall;
    readInventory(request: bag_pb.ReadInventoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadInventoryResponse) => void): grpc.ClientUnaryCall;
    readItem(request: bag_pb.ReadItemRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadItemResponse) => void): grpc.ClientUnaryCall;
    readItem(request: bag_pb.ReadItemRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadItemResponse) => void): grpc.ClientUnaryCall;
    readItem(request: bag_pb.ReadItemRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadItemResponse) => void): grpc.ClientUnaryCall;
    readInstance(request: bag_pb.ReadInstanceRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadInstanceResponse) => void): grpc.ClientUnaryCall;
    readInstance(request: bag_pb.ReadInstanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadInstanceResponse) => void): grpc.ClientUnaryCall;
    readInstance(request: bag_pb.ReadInstanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadInstanceResponse) => void): grpc.ClientUnaryCall;
    readApp(request: bag_pb.ReadAppRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadAppResponse) => void): grpc.ClientUnaryCall;
    readApp(request: bag_pb.ReadAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadAppResponse) => void): grpc.ClientUnaryCall;
    readApp(request: bag_pb.ReadAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadAppResponse) => void): grpc.ClientUnaryCall;
    readTrade(request: bag_pb.ReadTradeRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadTradeResponse) => void): grpc.ClientUnaryCall;
    readTrade(request: bag_pb.ReadTradeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadTradeResponse) => void): grpc.ClientUnaryCall;
    readTrade(request: bag_pb.ReadTradeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadTradeResponse) => void): grpc.ClientUnaryCall;
    readRecipe(request: bag_pb.ReadRecipeRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadRecipeResponse) => void): grpc.ClientUnaryCall;
    readRecipe(request: bag_pb.ReadRecipeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadRecipeResponse) => void): grpc.ClientUnaryCall;
    readRecipe(request: bag_pb.ReadRecipeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadRecipeResponse) => void): grpc.ClientUnaryCall;
    updateIdentityMetadata(request: bag_pb.UpdateIdentityMetadataRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateIdentityMetadataResponse) => void): grpc.ClientUnaryCall;
    updateIdentityMetadata(request: bag_pb.UpdateIdentityMetadataRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateIdentityMetadataResponse) => void): grpc.ClientUnaryCall;
    updateIdentityMetadata(request: bag_pb.UpdateIdentityMetadataRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateIdentityMetadataResponse) => void): grpc.ClientUnaryCall;
    updateInstance(request: bag_pb.UpdateInstanceRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateInstanceResponse) => void): grpc.ClientUnaryCall;
    updateInstance(request: bag_pb.UpdateInstanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateInstanceResponse) => void): grpc.ClientUnaryCall;
    updateInstance(request: bag_pb.UpdateInstanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateInstanceResponse) => void): grpc.ClientUnaryCall;
    updateItem(request: bag_pb.UpdateItemRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateItemResponse) => void): grpc.ClientUnaryCall;
    updateItem(request: bag_pb.UpdateItemRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateItemResponse) => void): grpc.ClientUnaryCall;
    updateItem(request: bag_pb.UpdateItemRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateItemResponse) => void): grpc.ClientUnaryCall;
    updateApp(request: bag_pb.UpdateAppRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateAppResponse) => void): grpc.ClientUnaryCall;
    updateApp(request: bag_pb.UpdateAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateAppResponse) => void): grpc.ClientUnaryCall;
    updateApp(request: bag_pb.UpdateAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateAppResponse) => void): grpc.ClientUnaryCall;
    updateTrade(request: bag_pb.UpdateTradeRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateTradeResponse) => void): grpc.ClientUnaryCall;
    updateTrade(request: bag_pb.UpdateTradeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateTradeResponse) => void): grpc.ClientUnaryCall;
    updateTrade(request: bag_pb.UpdateTradeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateTradeResponse) => void): grpc.ClientUnaryCall;
    updateRecipe(request: bag_pb.UpdateRecipeRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateRecipeResponse) => void): grpc.ClientUnaryCall;
    updateRecipe(request: bag_pb.UpdateRecipeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateRecipeResponse) => void): grpc.ClientUnaryCall;
    updateRecipe(request: bag_pb.UpdateRecipeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateRecipeResponse) => void): grpc.ClientUnaryCall;
    deleteApp(request: bag_pb.DeleteAppRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.DeleteAppResponse) => void): grpc.ClientUnaryCall;
    deleteApp(request: bag_pb.DeleteAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.DeleteAppResponse) => void): grpc.ClientUnaryCall;
    deleteApp(request: bag_pb.DeleteAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.DeleteAppResponse) => void): grpc.ClientUnaryCall;
    deleteInstance(request: bag_pb.DeleteInstanceRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.DeleteInstanceResponse) => void): grpc.ClientUnaryCall;
    deleteInstance(request: bag_pb.DeleteInstanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.DeleteInstanceResponse) => void): grpc.ClientUnaryCall;
    deleteInstance(request: bag_pb.DeleteInstanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.DeleteInstanceResponse) => void): grpc.ClientUnaryCall;
    closeTrade(request: bag_pb.CloseTradeRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.CloseTradeResponse) => void): grpc.ClientUnaryCall;
    closeTrade(request: bag_pb.CloseTradeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.CloseTradeResponse) => void): grpc.ClientUnaryCall;
    closeTrade(request: bag_pb.CloseTradeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.CloseTradeResponse) => void): grpc.ClientUnaryCall;
    verifyKey(request: bag_pb.VerifyKeyRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.VerifyKeyResponse) => void): grpc.ClientUnaryCall;
    verifyKey(request: bag_pb.VerifyKeyRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.VerifyKeyResponse) => void): grpc.ClientUnaryCall;
    verifyKey(request: bag_pb.VerifyKeyRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.VerifyKeyResponse) => void): grpc.ClientUnaryCall;
}

export class BagServiceClient extends grpc.Client implements IBagServiceClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public createApp(request: bag_pb.CreateAppRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateAppResponse) => void): grpc.ClientUnaryCall;
    public createApp(request: bag_pb.CreateAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateAppResponse) => void): grpc.ClientUnaryCall;
    public createApp(request: bag_pb.CreateAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateAppResponse) => void): grpc.ClientUnaryCall;
    public createInstances(request: bag_pb.CreateInstancesRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateInstancesResponse) => void): grpc.ClientUnaryCall;
    public createInstances(request: bag_pb.CreateInstancesRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateInstancesResponse) => void): grpc.ClientUnaryCall;
    public createInstances(request: bag_pb.CreateInstancesRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateInstancesResponse) => void): grpc.ClientUnaryCall;
    public createInstance(request: bag_pb.CreateInstanceRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateInstanceResponse) => void): grpc.ClientUnaryCall;
    public createInstance(request: bag_pb.CreateInstanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateInstanceResponse) => void): grpc.ClientUnaryCall;
    public createInstance(request: bag_pb.CreateInstanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateInstanceResponse) => void): grpc.ClientUnaryCall;
    public createItem(request: bag_pb.CreateItemRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateItemResponse) => void): grpc.ClientUnaryCall;
    public createItem(request: bag_pb.CreateItemRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateItemResponse) => void): grpc.ClientUnaryCall;
    public createItem(request: bag_pb.CreateItemRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateItemResponse) => void): grpc.ClientUnaryCall;
    public createRecipe(request: bag_pb.CreateRecipeRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateRecipeResponse) => void): grpc.ClientUnaryCall;
    public createRecipe(request: bag_pb.CreateRecipeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateRecipeResponse) => void): grpc.ClientUnaryCall;
    public createRecipe(request: bag_pb.CreateRecipeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateRecipeResponse) => void): grpc.ClientUnaryCall;
    public createTrade(request: bag_pb.CreateTradeRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateTradeResponse) => void): grpc.ClientUnaryCall;
    public createTrade(request: bag_pb.CreateTradeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateTradeResponse) => void): grpc.ClientUnaryCall;
    public createTrade(request: bag_pb.CreateTradeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.CreateTradeResponse) => void): grpc.ClientUnaryCall;
    public readIdentity(request: bag_pb.ReadIdentityRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadIdentityResponse) => void): grpc.ClientUnaryCall;
    public readIdentity(request: bag_pb.ReadIdentityRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadIdentityResponse) => void): grpc.ClientUnaryCall;
    public readIdentity(request: bag_pb.ReadIdentityRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadIdentityResponse) => void): grpc.ClientUnaryCall;
    public readInventory(request: bag_pb.ReadInventoryRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadInventoryResponse) => void): grpc.ClientUnaryCall;
    public readInventory(request: bag_pb.ReadInventoryRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadInventoryResponse) => void): grpc.ClientUnaryCall;
    public readInventory(request: bag_pb.ReadInventoryRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadInventoryResponse) => void): grpc.ClientUnaryCall;
    public readItem(request: bag_pb.ReadItemRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadItemResponse) => void): grpc.ClientUnaryCall;
    public readItem(request: bag_pb.ReadItemRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadItemResponse) => void): grpc.ClientUnaryCall;
    public readItem(request: bag_pb.ReadItemRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadItemResponse) => void): grpc.ClientUnaryCall;
    public readInstance(request: bag_pb.ReadInstanceRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadInstanceResponse) => void): grpc.ClientUnaryCall;
    public readInstance(request: bag_pb.ReadInstanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadInstanceResponse) => void): grpc.ClientUnaryCall;
    public readInstance(request: bag_pb.ReadInstanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadInstanceResponse) => void): grpc.ClientUnaryCall;
    public readApp(request: bag_pb.ReadAppRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadAppResponse) => void): grpc.ClientUnaryCall;
    public readApp(request: bag_pb.ReadAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadAppResponse) => void): grpc.ClientUnaryCall;
    public readApp(request: bag_pb.ReadAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadAppResponse) => void): grpc.ClientUnaryCall;
    public readTrade(request: bag_pb.ReadTradeRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadTradeResponse) => void): grpc.ClientUnaryCall;
    public readTrade(request: bag_pb.ReadTradeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadTradeResponse) => void): grpc.ClientUnaryCall;
    public readTrade(request: bag_pb.ReadTradeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadTradeResponse) => void): grpc.ClientUnaryCall;
    public readRecipe(request: bag_pb.ReadRecipeRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadRecipeResponse) => void): grpc.ClientUnaryCall;
    public readRecipe(request: bag_pb.ReadRecipeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadRecipeResponse) => void): grpc.ClientUnaryCall;
    public readRecipe(request: bag_pb.ReadRecipeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.ReadRecipeResponse) => void): grpc.ClientUnaryCall;
    public updateIdentityMetadata(request: bag_pb.UpdateIdentityMetadataRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateIdentityMetadataResponse) => void): grpc.ClientUnaryCall;
    public updateIdentityMetadata(request: bag_pb.UpdateIdentityMetadataRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateIdentityMetadataResponse) => void): grpc.ClientUnaryCall;
    public updateIdentityMetadata(request: bag_pb.UpdateIdentityMetadataRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateIdentityMetadataResponse) => void): grpc.ClientUnaryCall;
    public updateInstance(request: bag_pb.UpdateInstanceRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateInstanceResponse) => void): grpc.ClientUnaryCall;
    public updateInstance(request: bag_pb.UpdateInstanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateInstanceResponse) => void): grpc.ClientUnaryCall;
    public updateInstance(request: bag_pb.UpdateInstanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateInstanceResponse) => void): grpc.ClientUnaryCall;
    public updateItem(request: bag_pb.UpdateItemRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateItemResponse) => void): grpc.ClientUnaryCall;
    public updateItem(request: bag_pb.UpdateItemRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateItemResponse) => void): grpc.ClientUnaryCall;
    public updateItem(request: bag_pb.UpdateItemRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateItemResponse) => void): grpc.ClientUnaryCall;
    public updateApp(request: bag_pb.UpdateAppRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateAppResponse) => void): grpc.ClientUnaryCall;
    public updateApp(request: bag_pb.UpdateAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateAppResponse) => void): grpc.ClientUnaryCall;
    public updateApp(request: bag_pb.UpdateAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateAppResponse) => void): grpc.ClientUnaryCall;
    public updateTrade(request: bag_pb.UpdateTradeRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateTradeResponse) => void): grpc.ClientUnaryCall;
    public updateTrade(request: bag_pb.UpdateTradeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateTradeResponse) => void): grpc.ClientUnaryCall;
    public updateTrade(request: bag_pb.UpdateTradeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateTradeResponse) => void): grpc.ClientUnaryCall;
    public updateRecipe(request: bag_pb.UpdateRecipeRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateRecipeResponse) => void): grpc.ClientUnaryCall;
    public updateRecipe(request: bag_pb.UpdateRecipeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateRecipeResponse) => void): grpc.ClientUnaryCall;
    public updateRecipe(request: bag_pb.UpdateRecipeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.UpdateRecipeResponse) => void): grpc.ClientUnaryCall;
    public deleteApp(request: bag_pb.DeleteAppRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.DeleteAppResponse) => void): grpc.ClientUnaryCall;
    public deleteApp(request: bag_pb.DeleteAppRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.DeleteAppResponse) => void): grpc.ClientUnaryCall;
    public deleteApp(request: bag_pb.DeleteAppRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.DeleteAppResponse) => void): grpc.ClientUnaryCall;
    public deleteInstance(request: bag_pb.DeleteInstanceRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.DeleteInstanceResponse) => void): grpc.ClientUnaryCall;
    public deleteInstance(request: bag_pb.DeleteInstanceRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.DeleteInstanceResponse) => void): grpc.ClientUnaryCall;
    public deleteInstance(request: bag_pb.DeleteInstanceRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.DeleteInstanceResponse) => void): grpc.ClientUnaryCall;
    public closeTrade(request: bag_pb.CloseTradeRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.CloseTradeResponse) => void): grpc.ClientUnaryCall;
    public closeTrade(request: bag_pb.CloseTradeRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.CloseTradeResponse) => void): grpc.ClientUnaryCall;
    public closeTrade(request: bag_pb.CloseTradeRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.CloseTradeResponse) => void): grpc.ClientUnaryCall;
    public verifyKey(request: bag_pb.VerifyKeyRequest, callback: (error: grpc.ServiceError | null, response: bag_pb.VerifyKeyResponse) => void): grpc.ClientUnaryCall;
    public verifyKey(request: bag_pb.VerifyKeyRequest, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: bag_pb.VerifyKeyResponse) => void): grpc.ClientUnaryCall;
    public verifyKey(request: bag_pb.VerifyKeyRequest, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: bag_pb.VerifyKeyResponse) => void): grpc.ClientUnaryCall;
}
