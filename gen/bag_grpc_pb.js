// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var bag_pb = require('./bag_pb.js');

function serialize_bag_CloseTradeRequest(arg) {
  if (!(arg instanceof bag_pb.CloseTradeRequest)) {
    throw new Error('Expected argument of type bag.CloseTradeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_CloseTradeRequest(buffer_arg) {
  return bag_pb.CloseTradeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_CloseTradeResponse(arg) {
  if (!(arg instanceof bag_pb.CloseTradeResponse)) {
    throw new Error('Expected argument of type bag.CloseTradeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_CloseTradeResponse(buffer_arg) {
  return bag_pb.CloseTradeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_CreateAppRequest(arg) {
  if (!(arg instanceof bag_pb.CreateAppRequest)) {
    throw new Error('Expected argument of type bag.CreateAppRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_CreateAppRequest(buffer_arg) {
  return bag_pb.CreateAppRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_CreateAppResponse(arg) {
  if (!(arg instanceof bag_pb.CreateAppResponse)) {
    throw new Error('Expected argument of type bag.CreateAppResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_CreateAppResponse(buffer_arg) {
  return bag_pb.CreateAppResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_CreateInstanceRequest(arg) {
  if (!(arg instanceof bag_pb.CreateInstanceRequest)) {
    throw new Error('Expected argument of type bag.CreateInstanceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_CreateInstanceRequest(buffer_arg) {
  return bag_pb.CreateInstanceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_CreateInstanceResponse(arg) {
  if (!(arg instanceof bag_pb.CreateInstanceResponse)) {
    throw new Error('Expected argument of type bag.CreateInstanceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_CreateInstanceResponse(buffer_arg) {
  return bag_pb.CreateInstanceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_CreateInstancesRequest(arg) {
  if (!(arg instanceof bag_pb.CreateInstancesRequest)) {
    throw new Error('Expected argument of type bag.CreateInstancesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_CreateInstancesRequest(buffer_arg) {
  return bag_pb.CreateInstancesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_CreateInstancesResponse(arg) {
  if (!(arg instanceof bag_pb.CreateInstancesResponse)) {
    throw new Error('Expected argument of type bag.CreateInstancesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_CreateInstancesResponse(buffer_arg) {
  return bag_pb.CreateInstancesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_CreateItemRequest(arg) {
  if (!(arg instanceof bag_pb.CreateItemRequest)) {
    throw new Error('Expected argument of type bag.CreateItemRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_CreateItemRequest(buffer_arg) {
  return bag_pb.CreateItemRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_CreateItemResponse(arg) {
  if (!(arg instanceof bag_pb.CreateItemResponse)) {
    throw new Error('Expected argument of type bag.CreateItemResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_CreateItemResponse(buffer_arg) {
  return bag_pb.CreateItemResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_CreateRecipeRequest(arg) {
  if (!(arg instanceof bag_pb.CreateRecipeRequest)) {
    throw new Error('Expected argument of type bag.CreateRecipeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_CreateRecipeRequest(buffer_arg) {
  return bag_pb.CreateRecipeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_CreateRecipeResponse(arg) {
  if (!(arg instanceof bag_pb.CreateRecipeResponse)) {
    throw new Error('Expected argument of type bag.CreateRecipeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_CreateRecipeResponse(buffer_arg) {
  return bag_pb.CreateRecipeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_CreateTradeRequest(arg) {
  if (!(arg instanceof bag_pb.CreateTradeRequest)) {
    throw new Error('Expected argument of type bag.CreateTradeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_CreateTradeRequest(buffer_arg) {
  return bag_pb.CreateTradeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_CreateTradeResponse(arg) {
  if (!(arg instanceof bag_pb.CreateTradeResponse)) {
    throw new Error('Expected argument of type bag.CreateTradeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_CreateTradeResponse(buffer_arg) {
  return bag_pb.CreateTradeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_DeleteAppRequest(arg) {
  if (!(arg instanceof bag_pb.DeleteAppRequest)) {
    throw new Error('Expected argument of type bag.DeleteAppRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_DeleteAppRequest(buffer_arg) {
  return bag_pb.DeleteAppRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_DeleteAppResponse(arg) {
  if (!(arg instanceof bag_pb.DeleteAppResponse)) {
    throw new Error('Expected argument of type bag.DeleteAppResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_DeleteAppResponse(buffer_arg) {
  return bag_pb.DeleteAppResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_DeleteInstanceRequest(arg) {
  if (!(arg instanceof bag_pb.DeleteInstanceRequest)) {
    throw new Error('Expected argument of type bag.DeleteInstanceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_DeleteInstanceRequest(buffer_arg) {
  return bag_pb.DeleteInstanceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_DeleteInstanceResponse(arg) {
  if (!(arg instanceof bag_pb.DeleteInstanceResponse)) {
    throw new Error('Expected argument of type bag.DeleteInstanceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_DeleteInstanceResponse(buffer_arg) {
  return bag_pb.DeleteInstanceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_ReadAppRequest(arg) {
  if (!(arg instanceof bag_pb.ReadAppRequest)) {
    throw new Error('Expected argument of type bag.ReadAppRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_ReadAppRequest(buffer_arg) {
  return bag_pb.ReadAppRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_ReadAppResponse(arg) {
  if (!(arg instanceof bag_pb.ReadAppResponse)) {
    throw new Error('Expected argument of type bag.ReadAppResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_ReadAppResponse(buffer_arg) {
  return bag_pb.ReadAppResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_ReadIdentityRequest(arg) {
  if (!(arg instanceof bag_pb.ReadIdentityRequest)) {
    throw new Error('Expected argument of type bag.ReadIdentityRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_ReadIdentityRequest(buffer_arg) {
  return bag_pb.ReadIdentityRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_ReadIdentityResponse(arg) {
  if (!(arg instanceof bag_pb.ReadIdentityResponse)) {
    throw new Error('Expected argument of type bag.ReadIdentityResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_ReadIdentityResponse(buffer_arg) {
  return bag_pb.ReadIdentityResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_ReadInstanceRequest(arg) {
  if (!(arg instanceof bag_pb.ReadInstanceRequest)) {
    throw new Error('Expected argument of type bag.ReadInstanceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_ReadInstanceRequest(buffer_arg) {
  return bag_pb.ReadInstanceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_ReadInstanceResponse(arg) {
  if (!(arg instanceof bag_pb.ReadInstanceResponse)) {
    throw new Error('Expected argument of type bag.ReadInstanceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_ReadInstanceResponse(buffer_arg) {
  return bag_pb.ReadInstanceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_ReadInventoryRequest(arg) {
  if (!(arg instanceof bag_pb.ReadInventoryRequest)) {
    throw new Error('Expected argument of type bag.ReadInventoryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_ReadInventoryRequest(buffer_arg) {
  return bag_pb.ReadInventoryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_ReadInventoryResponse(arg) {
  if (!(arg instanceof bag_pb.ReadInventoryResponse)) {
    throw new Error('Expected argument of type bag.ReadInventoryResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_ReadInventoryResponse(buffer_arg) {
  return bag_pb.ReadInventoryResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_ReadItemRequest(arg) {
  if (!(arg instanceof bag_pb.ReadItemRequest)) {
    throw new Error('Expected argument of type bag.ReadItemRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_ReadItemRequest(buffer_arg) {
  return bag_pb.ReadItemRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_ReadItemResponse(arg) {
  if (!(arg instanceof bag_pb.ReadItemResponse)) {
    throw new Error('Expected argument of type bag.ReadItemResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_ReadItemResponse(buffer_arg) {
  return bag_pb.ReadItemResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_ReadRecipeRequest(arg) {
  if (!(arg instanceof bag_pb.ReadRecipeRequest)) {
    throw new Error('Expected argument of type bag.ReadRecipeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_ReadRecipeRequest(buffer_arg) {
  return bag_pb.ReadRecipeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_ReadRecipeResponse(arg) {
  if (!(arg instanceof bag_pb.ReadRecipeResponse)) {
    throw new Error('Expected argument of type bag.ReadRecipeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_ReadRecipeResponse(buffer_arg) {
  return bag_pb.ReadRecipeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_ReadTradeRequest(arg) {
  if (!(arg instanceof bag_pb.ReadTradeRequest)) {
    throw new Error('Expected argument of type bag.ReadTradeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_ReadTradeRequest(buffer_arg) {
  return bag_pb.ReadTradeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_ReadTradeResponse(arg) {
  if (!(arg instanceof bag_pb.ReadTradeResponse)) {
    throw new Error('Expected argument of type bag.ReadTradeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_ReadTradeResponse(buffer_arg) {
  return bag_pb.ReadTradeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_UpdateAppRequest(arg) {
  if (!(arg instanceof bag_pb.UpdateAppRequest)) {
    throw new Error('Expected argument of type bag.UpdateAppRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_UpdateAppRequest(buffer_arg) {
  return bag_pb.UpdateAppRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_UpdateAppResponse(arg) {
  if (!(arg instanceof bag_pb.UpdateAppResponse)) {
    throw new Error('Expected argument of type bag.UpdateAppResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_UpdateAppResponse(buffer_arg) {
  return bag_pb.UpdateAppResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_UpdateIdentityMetadataRequest(arg) {
  if (!(arg instanceof bag_pb.UpdateIdentityMetadataRequest)) {
    throw new Error('Expected argument of type bag.UpdateIdentityMetadataRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_UpdateIdentityMetadataRequest(buffer_arg) {
  return bag_pb.UpdateIdentityMetadataRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_UpdateIdentityMetadataResponse(arg) {
  if (!(arg instanceof bag_pb.UpdateIdentityMetadataResponse)) {
    throw new Error('Expected argument of type bag.UpdateIdentityMetadataResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_UpdateIdentityMetadataResponse(buffer_arg) {
  return bag_pb.UpdateIdentityMetadataResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_UpdateInstanceRequest(arg) {
  if (!(arg instanceof bag_pb.UpdateInstanceRequest)) {
    throw new Error('Expected argument of type bag.UpdateInstanceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_UpdateInstanceRequest(buffer_arg) {
  return bag_pb.UpdateInstanceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_UpdateInstanceResponse(arg) {
  if (!(arg instanceof bag_pb.UpdateInstanceResponse)) {
    throw new Error('Expected argument of type bag.UpdateInstanceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_UpdateInstanceResponse(buffer_arg) {
  return bag_pb.UpdateInstanceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_UpdateItemRequest(arg) {
  if (!(arg instanceof bag_pb.UpdateItemRequest)) {
    throw new Error('Expected argument of type bag.UpdateItemRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_UpdateItemRequest(buffer_arg) {
  return bag_pb.UpdateItemRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_UpdateItemResponse(arg) {
  if (!(arg instanceof bag_pb.UpdateItemResponse)) {
    throw new Error('Expected argument of type bag.UpdateItemResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_UpdateItemResponse(buffer_arg) {
  return bag_pb.UpdateItemResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_UpdateRecipeRequest(arg) {
  if (!(arg instanceof bag_pb.UpdateRecipeRequest)) {
    throw new Error('Expected argument of type bag.UpdateRecipeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_UpdateRecipeRequest(buffer_arg) {
  return bag_pb.UpdateRecipeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_UpdateRecipeResponse(arg) {
  if (!(arg instanceof bag_pb.UpdateRecipeResponse)) {
    throw new Error('Expected argument of type bag.UpdateRecipeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_UpdateRecipeResponse(buffer_arg) {
  return bag_pb.UpdateRecipeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_UpdateTradeRequest(arg) {
  if (!(arg instanceof bag_pb.UpdateTradeRequest)) {
    throw new Error('Expected argument of type bag.UpdateTradeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_UpdateTradeRequest(buffer_arg) {
  return bag_pb.UpdateTradeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_UpdateTradeResponse(arg) {
  if (!(arg instanceof bag_pb.UpdateTradeResponse)) {
    throw new Error('Expected argument of type bag.UpdateTradeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_UpdateTradeResponse(buffer_arg) {
  return bag_pb.UpdateTradeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_VerifyKeyRequest(arg) {
  if (!(arg instanceof bag_pb.VerifyKeyRequest)) {
    throw new Error('Expected argument of type bag.VerifyKeyRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_VerifyKeyRequest(buffer_arg) {
  return bag_pb.VerifyKeyRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_bag_VerifyKeyResponse(arg) {
  if (!(arg instanceof bag_pb.VerifyKeyResponse)) {
    throw new Error('Expected argument of type bag.VerifyKeyResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_bag_VerifyKeyResponse(buffer_arg) {
  return bag_pb.VerifyKeyResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var BagServiceService = exports.BagServiceService = {
  createApp: {
    path: '/bag.BagService/CreateApp',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.CreateAppRequest,
    responseType: bag_pb.CreateAppResponse,
    requestSerialize: serialize_bag_CreateAppRequest,
    requestDeserialize: deserialize_bag_CreateAppRequest,
    responseSerialize: serialize_bag_CreateAppResponse,
    responseDeserialize: deserialize_bag_CreateAppResponse,
  },
  createInstances: {
    path: '/bag.BagService/CreateInstances',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.CreateInstancesRequest,
    responseType: bag_pb.CreateInstancesResponse,
    requestSerialize: serialize_bag_CreateInstancesRequest,
    requestDeserialize: deserialize_bag_CreateInstancesRequest,
    responseSerialize: serialize_bag_CreateInstancesResponse,
    responseDeserialize: deserialize_bag_CreateInstancesResponse,
  },
  createInstance: {
    path: '/bag.BagService/CreateInstance',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.CreateInstanceRequest,
    responseType: bag_pb.CreateInstanceResponse,
    requestSerialize: serialize_bag_CreateInstanceRequest,
    requestDeserialize: deserialize_bag_CreateInstanceRequest,
    responseSerialize: serialize_bag_CreateInstanceResponse,
    responseDeserialize: deserialize_bag_CreateInstanceResponse,
  },
  createItem: {
    path: '/bag.BagService/CreateItem',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.CreateItemRequest,
    responseType: bag_pb.CreateItemResponse,
    requestSerialize: serialize_bag_CreateItemRequest,
    requestDeserialize: deserialize_bag_CreateItemRequest,
    responseSerialize: serialize_bag_CreateItemResponse,
    responseDeserialize: deserialize_bag_CreateItemResponse,
  },
  createRecipe: {
    path: '/bag.BagService/CreateRecipe',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.CreateRecipeRequest,
    responseType: bag_pb.CreateRecipeResponse,
    requestSerialize: serialize_bag_CreateRecipeRequest,
    requestDeserialize: deserialize_bag_CreateRecipeRequest,
    responseSerialize: serialize_bag_CreateRecipeResponse,
    responseDeserialize: deserialize_bag_CreateRecipeResponse,
  },
  createTrade: {
    path: '/bag.BagService/CreateTrade',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.CreateTradeRequest,
    responseType: bag_pb.CreateTradeResponse,
    requestSerialize: serialize_bag_CreateTradeRequest,
    requestDeserialize: deserialize_bag_CreateTradeRequest,
    responseSerialize: serialize_bag_CreateTradeResponse,
    responseDeserialize: deserialize_bag_CreateTradeResponse,
  },
  readIdentity: {
    path: '/bag.BagService/ReadIdentity',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.ReadIdentityRequest,
    responseType: bag_pb.ReadIdentityResponse,
    requestSerialize: serialize_bag_ReadIdentityRequest,
    requestDeserialize: deserialize_bag_ReadIdentityRequest,
    responseSerialize: serialize_bag_ReadIdentityResponse,
    responseDeserialize: deserialize_bag_ReadIdentityResponse,
  },
  readInventory: {
    path: '/bag.BagService/ReadInventory',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.ReadInventoryRequest,
    responseType: bag_pb.ReadInventoryResponse,
    requestSerialize: serialize_bag_ReadInventoryRequest,
    requestDeserialize: deserialize_bag_ReadInventoryRequest,
    responseSerialize: serialize_bag_ReadInventoryResponse,
    responseDeserialize: deserialize_bag_ReadInventoryResponse,
  },
  readItem: {
    path: '/bag.BagService/ReadItem',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.ReadItemRequest,
    responseType: bag_pb.ReadItemResponse,
    requestSerialize: serialize_bag_ReadItemRequest,
    requestDeserialize: deserialize_bag_ReadItemRequest,
    responseSerialize: serialize_bag_ReadItemResponse,
    responseDeserialize: deserialize_bag_ReadItemResponse,
  },
  readInstance: {
    path: '/bag.BagService/ReadInstance',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.ReadInstanceRequest,
    responseType: bag_pb.ReadInstanceResponse,
    requestSerialize: serialize_bag_ReadInstanceRequest,
    requestDeserialize: deserialize_bag_ReadInstanceRequest,
    responseSerialize: serialize_bag_ReadInstanceResponse,
    responseDeserialize: deserialize_bag_ReadInstanceResponse,
  },
  readApp: {
    path: '/bag.BagService/ReadApp',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.ReadAppRequest,
    responseType: bag_pb.ReadAppResponse,
    requestSerialize: serialize_bag_ReadAppRequest,
    requestDeserialize: deserialize_bag_ReadAppRequest,
    responseSerialize: serialize_bag_ReadAppResponse,
    responseDeserialize: deserialize_bag_ReadAppResponse,
  },
  readTrade: {
    path: '/bag.BagService/ReadTrade',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.ReadTradeRequest,
    responseType: bag_pb.ReadTradeResponse,
    requestSerialize: serialize_bag_ReadTradeRequest,
    requestDeserialize: deserialize_bag_ReadTradeRequest,
    responseSerialize: serialize_bag_ReadTradeResponse,
    responseDeserialize: deserialize_bag_ReadTradeResponse,
  },
  readRecipe: {
    path: '/bag.BagService/ReadRecipe',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.ReadRecipeRequest,
    responseType: bag_pb.ReadRecipeResponse,
    requestSerialize: serialize_bag_ReadRecipeRequest,
    requestDeserialize: deserialize_bag_ReadRecipeRequest,
    responseSerialize: serialize_bag_ReadRecipeResponse,
    responseDeserialize: deserialize_bag_ReadRecipeResponse,
  },
  updateIdentityMetadata: {
    path: '/bag.BagService/UpdateIdentityMetadata',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.UpdateIdentityMetadataRequest,
    responseType: bag_pb.UpdateIdentityMetadataResponse,
    requestSerialize: serialize_bag_UpdateIdentityMetadataRequest,
    requestDeserialize: deserialize_bag_UpdateIdentityMetadataRequest,
    responseSerialize: serialize_bag_UpdateIdentityMetadataResponse,
    responseDeserialize: deserialize_bag_UpdateIdentityMetadataResponse,
  },
  updateInstance: {
    path: '/bag.BagService/UpdateInstance',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.UpdateInstanceRequest,
    responseType: bag_pb.UpdateInstanceResponse,
    requestSerialize: serialize_bag_UpdateInstanceRequest,
    requestDeserialize: deserialize_bag_UpdateInstanceRequest,
    responseSerialize: serialize_bag_UpdateInstanceResponse,
    responseDeserialize: deserialize_bag_UpdateInstanceResponse,
  },
  updateItem: {
    path: '/bag.BagService/UpdateItem',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.UpdateItemRequest,
    responseType: bag_pb.UpdateItemResponse,
    requestSerialize: serialize_bag_UpdateItemRequest,
    requestDeserialize: deserialize_bag_UpdateItemRequest,
    responseSerialize: serialize_bag_UpdateItemResponse,
    responseDeserialize: deserialize_bag_UpdateItemResponse,
  },
  updateApp: {
    path: '/bag.BagService/UpdateApp',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.UpdateAppRequest,
    responseType: bag_pb.UpdateAppResponse,
    requestSerialize: serialize_bag_UpdateAppRequest,
    requestDeserialize: deserialize_bag_UpdateAppRequest,
    responseSerialize: serialize_bag_UpdateAppResponse,
    responseDeserialize: deserialize_bag_UpdateAppResponse,
  },
  updateTrade: {
    path: '/bag.BagService/UpdateTrade',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.UpdateTradeRequest,
    responseType: bag_pb.UpdateTradeResponse,
    requestSerialize: serialize_bag_UpdateTradeRequest,
    requestDeserialize: deserialize_bag_UpdateTradeRequest,
    responseSerialize: serialize_bag_UpdateTradeResponse,
    responseDeserialize: deserialize_bag_UpdateTradeResponse,
  },
  updateRecipe: {
    path: '/bag.BagService/UpdateRecipe',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.UpdateRecipeRequest,
    responseType: bag_pb.UpdateRecipeResponse,
    requestSerialize: serialize_bag_UpdateRecipeRequest,
    requestDeserialize: deserialize_bag_UpdateRecipeRequest,
    responseSerialize: serialize_bag_UpdateRecipeResponse,
    responseDeserialize: deserialize_bag_UpdateRecipeResponse,
  },
  deleteApp: {
    path: '/bag.BagService/DeleteApp',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.DeleteAppRequest,
    responseType: bag_pb.DeleteAppResponse,
    requestSerialize: serialize_bag_DeleteAppRequest,
    requestDeserialize: deserialize_bag_DeleteAppRequest,
    responseSerialize: serialize_bag_DeleteAppResponse,
    responseDeserialize: deserialize_bag_DeleteAppResponse,
  },
  deleteInstance: {
    path: '/bag.BagService/DeleteInstance',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.DeleteInstanceRequest,
    responseType: bag_pb.DeleteInstanceResponse,
    requestSerialize: serialize_bag_DeleteInstanceRequest,
    requestDeserialize: deserialize_bag_DeleteInstanceRequest,
    responseSerialize: serialize_bag_DeleteInstanceResponse,
    responseDeserialize: deserialize_bag_DeleteInstanceResponse,
  },
  closeTrade: {
    path: '/bag.BagService/CloseTrade',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.CloseTradeRequest,
    responseType: bag_pb.CloseTradeResponse,
    requestSerialize: serialize_bag_CloseTradeRequest,
    requestDeserialize: deserialize_bag_CloseTradeRequest,
    responseSerialize: serialize_bag_CloseTradeResponse,
    responseDeserialize: deserialize_bag_CloseTradeResponse,
  },
  verifyKey: {
    path: '/bag.BagService/VerifyKey',
    requestStream: false,
    responseStream: false,
    requestType: bag_pb.VerifyKeyRequest,
    responseType: bag_pb.VerifyKeyResponse,
    requestSerialize: serialize_bag_VerifyKeyRequest,
    requestDeserialize: deserialize_bag_VerifyKeyRequest,
    responseSerialize: serialize_bag_VerifyKeyResponse,
    responseDeserialize: deserialize_bag_VerifyKeyResponse,
  },
};

exports.BagServiceClient = grpc.makeGenericClientConstructor(BagServiceService);
