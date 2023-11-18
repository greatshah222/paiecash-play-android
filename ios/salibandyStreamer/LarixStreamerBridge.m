
#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <React/RCTViewManager.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTUIManager.h>

@interface RCT_EXTERN_MODULE(LarixStreamer, RCTEventEmitter)
RCT_EXTERN_METHOD(requestPermissions:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getCameraInfo:(nonnull NSNumber*) androidApi callback: (RCTResponseSenderBlock) callback)
RCT_EXTERN_METHOD(startCapture)
RCT_EXTERN_METHOD(stopCapture)
RCT_EXTERN_METHOD(connectTo: (NSString*) url callback: (RCTResponseSenderBlock) callback)
RCT_EXTERN_METHOD(connect: (NSArray*) params callback: (RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(disconnect: (NSNumber*) connId)
RCT_EXTERN_METHOD(disconnectAll)
RCT_EXTERN_METHOD(takeSnapshot: (nullable NSString*) name)
RCT_EXTERN_METHOD(startRecord: (nullable NSString*) name)
RCT_EXTERN_METHOD(stopRecord)
@end
