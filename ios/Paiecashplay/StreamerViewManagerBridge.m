#import <Foundation/Foundation.h>
#import <React/RCTViewManager.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(StreamerViewManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(autoStart, BOOL)

RCT_EXPORT_VIEW_PROPERTY(torch, BOOL)
RCT_EXPORT_VIEW_PROPERTY(mute, BOOL)
RCT_EXPORT_VIEW_PROPERTY(zoom, NSNumber*)

RCT_EXPORT_VIEW_PROPERTY(statsUpdateInterval, NSNumber*)

RCT_EXPORT_VIEW_PROPERTY(cameraId, NSString*)
RCT_EXPORT_VIEW_PROPERTY(videoConfig, NSDictionary*)
RCT_EXPORT_VIEW_PROPERTY(audioConfig, NSDictionary*)
RCT_EXPORT_VIEW_PROPERTY(previewScale, NSString*)


@end
