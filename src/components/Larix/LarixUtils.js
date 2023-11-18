import { URL } from 'react-native-url-polyfill';

function twoDigits(n) {
  return (n < 10 ? '0' : '') + n;
}

class LarixUtils {
  static supportedProtocols = ['rtmp', 'rtmps', 'rtsp', 'rtsps', 'srt', 'rist'];
  static rtmpProtocols = ['rtmp', 'rtmps'];
  static tcpProtocols = ['rtmp', 'rtmps', 'rtsp', 'rtsps'];
  static udpProtocols = ['srt', 'rist'];

  static validateUrl = (urlStr) => {
    var url;
    try {
      url = new URL(urlStr);
    } catch (e) {
      console.log('Invalid URL');
      return 'URL is not valid';
    }
    console.log(url);
    var protocol = url.protocol;
    if (protocol != null && protocol != '') {
      protocol = protocol.substring(0, protocol.length - 1); //Remove trailing ':'
    } else {
      return 'No protocol';
    }
    if (!this.supportedProtocols.includes(protocol)) {
      return 'Unsupported protocol: ' + protocol;
    }
    if (
      this.udpProtocols.includes(protocol) &&
      (url.port == '' || url.port == '0')
    ) {
      return 'Must specify port for ' + protocol + ' connection';
    }

    return null;
  };

  static getProtocol = (urlStr) => {
    const pos = urlStr.indexOf('://');
    if (pos <= 0) {
      return '';
    }
    var protocol = urlStr.substring(0, pos);
    return protocol;
  };

  static trafficToString = (bytes) => {
    if (bytes == 0) return '0 Bytes';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  static bandwidthToString = (bandwidth) => {
    if (bandwidth == 0) return '0 bps';
    const sizes = ['bps', 'Kbps', 'Mpbs', 'Gbps', 'Tbps'];
    const k = 1000;
    const i = Math.floor(Math.log(bandwidth) / Math.log(k));
    return parseFloat((bandwidth / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  static timeMsToString = (time) => {
    let timeSec = Math.floor(time / 1000);
    let sec = timeSec % 60;
    let min = Math.floor((timeSec / 60) % 60);
    let hrs = Math.floor(timeSec / 3600);
    let secStr = twoDigits(sec);
    let minStr = twoDigits(min);
    let hrsStr = hrs;
    let str = `${hrsStr}:${minStr}:${secStr}`;
    return str;
  };

  static dateTimeToString = (date) => {
    let yyyy = date.getFullYear();
    let MM = twoDigits(date.getMonth() + 1);
    let dd = twoDigits(date.getDate());
    let hh = twoDigits(date.getHours());
    let nn = twoDigits(date.getMinutes());
    let ss = twoDigits(date.getSeconds());
    let formattedDate = `${yyyy}${MM}${dd}-${hh}${nn}${ss}`;

    return formattedDate;
  };
}

export { LarixUtils };
