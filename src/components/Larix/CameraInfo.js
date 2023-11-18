import { Platform } from 'react-native';

class CameraInfo {
  static instance = null;

  constructor(info) {
    this.info = info;
    this.backCams = info.filter((cam) => cam.lensFacing == 'back');
    this.frontCams = info.filter((cam) => cam.lensFacing == 'front');
    let cameraMap = {};
    info.forEach((elem) => {
      const id = elem.cameraId;
      cameraMap[id] = elem;
    });
    this.cameraMap = cameraMap;
    CameraInfo.instance = this;
  }

  static getInstance = () => {
    return this.instance;
  };

  static iosPreferredCamera = ['triple', 'dual', 'wide'];
  static iosFpsValues = ['24', '25', '30', '50', '60'];
  static maxWidth = 3840;
  static maxHeight = 2160;

  getBackCameraList = () => {
    return this.backCams.map(this.getListElem);
  };

  getFrontCameraList = () => {
    return this.frontCams.map((elem) => this.getListElem(elem));
  };

  getDefaultBackCamera = () => {
    if (this.backCams == null || this.backCams.length == 0) {
      return null;
    }
    const firstCam = this.backCams[0];
    return firstCam.cameraId;
  };

  getDefaultFrontCamera = () => {
    if (this.frontCams == null || this.frontCams.length == 0) {
      return null;
    }
    const firstCam = this.frontCams[0];
    return firstCam.cameraId;
  };

  getResolutions = (camId) => {
    const camInfo = this.cameraMap[camId];
    let sizes = camInfo?.recordSizes ?? [];
    return sizes.filter((resStr) => {
      let [w, h] = resStr.split('x', 2);
      return (
        parseInt(w) <= CameraInfo.maxWidth &&
        parseInt(h) <= CameraInfo.maxHeight
      );
    });
  };

  isTorchSupported = (camId) => {
    const camInfo = this.cameraMap[camId];
    return camInfo?.isTorchSupported ?? false;
  };

  getFps = (camId) => {
    const camInfo = this.cameraMap[camId];
    let ranges = camInfo?.fpsRanges ?? [];
    if (Platform.OS == 'ios') {
      return this.getFpsIos(ranges);
    } else {
      return ranges;
    }
  };

  getFpsIos = (ranges) => {
    let maxFps = 0;
    //Return standard FPS values that don't exceed upper range
    ranges.forEach((r) => {
      let vals = r.split('-', 2);
      let upperLimit = parseInt('0' + vals[vals.length - 1]);
      if (upperLimit > maxFps) maxFps = upperLimit;
    });
    const fps = CameraInfo.iosFpsValues.filter((v) => parseInt(v) <= maxFps);
    console.log(fps);
    return fps;
  };

  getListElem = (cam) => {
    let name = '';
    if (cam.deviceType == null) {
      name = `Camera ${cam.cameraId}`;
    } else {
      let devType = cam.deviceType;
      name = devType.charAt(0).toUpperCase() + devType.slice(1);
    }
    return { label: name, value: cam.cameraId };
  };
}

export { CameraInfo };
