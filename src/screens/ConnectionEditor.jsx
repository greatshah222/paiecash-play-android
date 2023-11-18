import React from 'react';
import { StyleSheet, View, Text, Button, Alert, TextInput } from 'react-native';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';

import { connections } from '../components/Larix/Connections';
import ConfigDropDown from '../components/Larix/ConfigDropdown';
import { LarixUtils } from '../components/Larix/LarixUtils';

class ConditionalView extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const val = this.props.url ?? '';
    const proto = LarixUtils.getProtocol(val);
    console.log(`Connection url ${val} with protocol ${proto}`);
    const show = this.props.showWhen ?? [];
    if (!show.includes(proto)) {
      return null;
    }
    return <View>{this.props.children}</View>;
  }
}

let defaultConfig = {
  name: '',
  url: '',
  mode: 'av',
  user: '',
  pass: '',
  target: '',
  connectMode: 'c',
  pbkeylen: '16',
  passphrase: '',
  latency: '1000',
  maxbw: '0',
  streamId: '',
  ristProfile: 'm',
};

class ConnectioEditorScreen extends React.Component {
  constructor(props) {
    super(props);
    console.log('props', props);
    const params = props?.route?.params ?? [];
    let connId = params.id;
    var config = {};
    this.navigation = props.navigation;
    let connection = {};
    if (connId != null) {
      config = connections.get(connId);
      Object.assign(connection, defaultConfig, config);
    } else {
      Object.assign(connection, defaultConfig);
    }
    this.connId = connId;

    this.modes = [
      { label: 'Audio/Video', value: 'av' },
      { label: 'Video only', value: 'v' },
      { label: 'Audio only', value: 'a' },
    ];

    this.authTypes = [
      { label: 'Default (no auth)', value: '' },
      { label: 'Adobe auth', value: 'rtmp' },
      { label: 'Akamia/Dacast', value: 'akamai' },
      { label: 'Limelight', value: 'lime' },
      { label: 'Periscope', value: 'peri' },
    ];

    this.srtModes = [
      { label: 'Caller', value: 'c' },
      { label: 'Listener', value: 'l' },
      { label: 'Rendezvous', value: 'r' },
    ];

    this.keylenItems = [
      { label: '16', value: '16' },
      { label: '24', value: '24' },
      { label: '32', value: '32' },
    ];
    this.connName = connection.name;
    this.state = {
      connection: connection,
      newConnection: params.id == null,
    };
    this.discard = false;
    this.navigation.addListener('beforeRemove', (ev) => {
      this.beforeRemove(ev);
    });
  }

  beforeRemove = (ev) => {
    if (this.discard) {
      console.log('already checked');
      return;
    }
    let values = this.state.connection;

    let url = values.url;
    const error = LarixUtils.validateUrl(url);
    if (error == null) {
      let newRecord = this.connId == null;
      let shouldUpdate = true;
      if (!newRecord) {
        let oldRecord = connections.get(this.connId);
        shouldUpdate =
          JSON.stringify(oldRecord) != JSON.stringify(this.state.connection);
      }
      if (!shouldUpdate) {
        console.log('Did not change');
        return;
      }
      let text = newRecord
        ? `Added connection ${this.state.connection.name}`
        : `Updated connection ${this.state.connection.name}`;
      this.updRecord(values);
      Toast.show({
        type: 'info',
        text1: text,
      });

      return;
    }
    Toast.show({
      type: 'error',
      text1: 'Connection did not saved',
      text2: error,
    });
  };

  validateConnection = (values) => {
    console.log(values);

    let url = values.url;
    const error = LarixUtils.validateUrl(url);
    if (error != null) {
      Alert.alert('Wrong settings', error, [{ text: 'OK' }]);
      return false;
    }
    return true;
  };

  cancel = () => {
    this.discard = true;
    this.navigation.goBack();
  };

  handleDelete = () => {
    let id = this.state.connection.id;
    if (id != null) {
      this.discard = true;
      connections.delete(id).then(() => this.navigation.goBack());
    }
  };

  onChangeText = (field, value) => {
    let upd = {};
    upd[field] = value;
    let config = this.state.connection;
    let newConnection = {};
    Object.assign(newConnection, config, upd);
    console.log('newConnection', newConnection);
    this.setState({ connection: newConnection });
  };

  onChange = (field, newConfig) => {
    console.log(newConfig);
    console.log(this.state.connection);
    let upd = {};
    upd[field] = newConfig[field];
    let config = this.state.connection;
    let newConnection = {};
    Object.assign(newConnection, config, upd);
    this.setState({ connection: newConnection });
  };

  saveConnection = () => {
    let values = this.state.connection;
    console.log('values', values);
    if (this.validateConnection(values) !== true) {
      return;
    }
    this.discard = true;
    this.updRecord(values).then(() => this.navigation.goBack());
  };

  updRecord = async (values) => {
    if (this.connId != null) {
      if (values.url != '') {
        console.log('Update connection');
        let connection = {};
        Object.assign(connection, values);
        //Object.assign(this.connection, values)
        await connections.update(connection);
      }
    } else {
      let connection = {};
      Object.assign(connection, values);
      console.log('connections add', connection);
      console.log('Add connection');
      await connections.add(connection);
    }
  };

  DeleteButton = (props) => {
    if (this.state.newConnection) {
      return null;
    }
    return (
      <View style={[styles.button, styles.deleteButton]}>
        <Button color='#ff5555' onPress={this.handleDelete} title='Delete' />
      </View>
    );
  };

  render() {
    return (
      <SafeAreaView edges={['top', 'left']}>
        <KeyboardAwareScrollView
          enableOnAndroid={true}
          enableResetScrollToCoords={true}
          extraHeight={30}
        >
          <Text>Name</Text>
          <TextInput
            style={styles.textEdit}
            onChangeText={(val) => this.onChangeText('name', val)}
            placeholder='Name'
            value={this.state.connection.name}
          />
          <Text style={styles.smallText}> ** Name of event by default</Text>
          <Text>URL</Text>
          <TextInput
            style={styles.textEdit}
            onChangeText={(val) => this.onChangeText('url', val)}
            placeholder='URL'
            value={this.state.connection.url}
            keyboardType={'url'}
            autoCapitalize={'none'}
            autoCorrect={false}
            autoComplete={'off'}
          />
          <Text style={styles.smallText}>
            ** Streaming Url-fomat url/streamName
          </Text>

          <ConfigDropDown
            config={this.state.connection}
            onChange={this.onChange}
            label='Mode'
            items={this.modes}
            field='mode'
          />
          <ConditionalView
            url={this.state.connection.url}
            showWhen={['rtmp', 'rtmps']}
          >
            <ConfigDropDown
              config={this.state.connection}
              onChange={this.onChange}
              label='Target type'
              items={this.authTypes}
              field='target'
            />
          </ConditionalView>
          <ConditionalView
            url={this.state.connection.url}
            showWhen={['rtmp', 'rtsp', 'rtmps', 'rtsps']}
          >
            <Text>Login</Text>
            <TextInput
              style={styles.textEdit}
              onChangeText={(val) => this.onChangeText('user', val)}
              placeholder='Login'
              value={this.state.connection.user}
              autoCapitalize='none'
              autoCorrect={false}
            />
            <Text>Password</Text>
            <TextInput
              style={styles.textEdit}
              onChangeText={(val) => this.onChangeText('pass', val)}
              value={this.state.connection.pass}
              secureTextEntry={true}
            />
          </ConditionalView>
          <ConditionalView url={this.state.connection.url} showWhen={['srt']}>
            <ConfigDropDown
              config={this.state.connection}
              onChange={this.onChange}
              label='SRT sender mode'
              items={this.srtModes}
              field='connectMode'
            />
            <Text>Latency (ms)</Text>
            <TextInput
              style={styles.textEdit}
              onChangeText={(val) => this.onChangeText('latency', val)}
              placeholder='0'
              keyboardType={'number-pad'}
              value={this.state.connection.latency}
            />
            <Text>Passphrase</Text>
            <TextInput
              style={styles.textEdit}
              onChangeText={(val) => this.onChangeText('passphrase', val)}
              secureTextEntry={true}
              value={this.state.connection.passphrase}
            />
            <ConfigDropDown
              config={this.state.connection}
              onChange={this.onChange}
              label='pbkeyken'
              items={this.keylenItems}
              field='pbkeylen'
            />
            <Text>streamid</Text>
            <TextInput
              style={styles.textEdit}
              onChangeText={(val) => this.onChangeText('passphrase', val)}
              placeholder='streamId'
              value={this.state.connection.streamid}
            />
            <Text>maxbw</Text>
            <TextInput
              style={styles.textEdit}
              onChangeText={(val) => this.onChangeText('maxbw', val)}
              placeholder='maxbw'
              keyboardType={'number-pad'}
              value={this.state.connection.maxbw}
            />
          </ConditionalView>
          <View style={styles.buttonRow}>
            <View style={styles.button}>
              <Button onPress={this.saveConnection} title='Save' />
            </View>
            <View style={styles.button}>
              <Button onPress={this.cancel} title='Cancel' />
            </View>
          </View>
          <this.DeleteButton />
          <View style={styles.emptySpace} />
        </KeyboardAwareScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    //justifyContent: 'space-between'
  },
  deleteButton: {
    alignSelf: 'center',
  },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginHorizontal: '1%',
    marginBottom: 6,
    minWidth: '45%',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 8,
    // textAlign: 'center',
    marginHorizontal: 6,
    marginVertical: 2,
  },

  textEdit: {
    margin: 4,
    marginBottom: 10,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 4,
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: 'white',
    fontSize: 18,
  },
  emptySpace: {
    paddingTop: 50,
    paddingBottom: 50,
  },
});

export default ConnectioEditorScreen;
