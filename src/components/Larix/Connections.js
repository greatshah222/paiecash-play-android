import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { LarixUtils } from './LarixUtils';

class Connections {
  data = [];

  load = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@connections');
      if (jsonValue !== null) {
        console.log('Got connections');
        var rec = JSON.parse(jsonValue);
        console.log('Total records: ' + rec.length);
        this.data = rec;
      } else {
        console.log('No connections');
      }
    } catch (e) {
      console.log('Failed to load connections');
      console.log(e);
    }
  };

  add = async (newRecord) => {
    if (newRecord.id == null) {
      newRecord.id = uuid.v4();
    }
    if (newRecord.active == null) {
      newRecord.active = this.data.length == 0;
    }
    this.data.push(newRecord);
    this.__save();
  };

  update = async (record) => {
    var id = record.id;
    if (id == null) {
      return;
    }
    if (record.active == null) {
      record.active = this.data.length == 0;
    }
    var pos = this.data.findIndex((rec) => rec.id == id);
    if (pos < 0) {
      console.log('ID not found');
      return;
    }
    this.data[pos] = record;
    this.__save();
  };

  delete = async (id) => {
    let newArray = this.data.filter((rec) => rec.id != id);
    this.data = newArray;
    await this.__save();
  };

  deleteAll = async () => {
    let newArray = [];
    this.data = newArray;
    await this.__save();
  };

  toggleActive = async (record, active) => {
    if (this.data == null) {
      console.log('no data!!!');
      return;
    }
    let id = record.id;
    let rec = this.data.find((rec) => rec.id == id);
    if (rec != null) {
      console.log('Rec active: ' + rec.active + '=>' + active);
      rec.active = active;
    }
    this.__save();
  };

  get = (recId) => {
    return this.data.find((rec) => rec.id == recId);
  };

  getList = () => {
    return this.data;
  };

  getActiveConfig = () => {
    let active = this.data.filter((rec) => rec.active);
    console.log('Active connections: ' + active.length);
    let connectionConfig = active.flatMap((conn) => {
      var elem = {
        name: conn.name,
        url: conn.url,
        mode: conn.mode ?? 'av',
      };
      let protocol = LarixUtils.getProtocol(conn.url);
      if (protocol == null || protocol == '') return [];
      if (
        LarixUtils.tcpProtocols.includes(protocol) &&
        conn.user != null &&
        conn.user != ''
      ) {
        elem.user = conn.user;
        elem.pass = conn.pass;
      }
      if (LarixUtils.rtmpProtocols.includes(protocol)) {
        elem.target = conn.target ?? '';
      }
      if (protocol == 'srt') {
        let srtConfig = {
          pbkeylen: parseInt(conn.pbkeylen ?? '16'),
          passphrase: conn.passphrase ?? '',
          latency: parseInt(conn.latency ?? '1000'),
          maxbw: parseInt(conn.maxbw ?? '0'),
          streamId: conn.streamId ?? '',
        };
        Object.assign(elem, srtConfig);
      }
      return [elem];
    });
    return connectionConfig;
  };

  __save = async () => {
    try {
      var jsonValue = JSON.stringify(this.data);
      await AsyncStorage.setItem('@connections', jsonValue);
      console.log('Saved connections');
    } catch (e) {
      console.log('Failed to save connections');
    }
  };
}

var connections = new Connections();
connections.load();

export { connections };
