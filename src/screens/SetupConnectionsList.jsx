import React from 'react';
import {
  NativeModules,
  StyleSheet,
  View,
  Text,
  Switch,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { connections } from '../components/Larix/Connections';
import Icon from '../components/common/Icon';
import { CONNECTIONS_EDITOR } from '../constants/routeNames';

const SetupConnectionsList = ({ navigation }) => {
  const [isUpdating, setUpdating] = React.useState(false);
  const [connList, updateList] = React.useState(connections.getList());

  React.useEffect(() => {
    navigation.addListener('focus', (ev) => {
      console.log('Entering connectionList');
      console.log('connections', connections.getList());

      updateList(connections.getList());
      setUpdating(false);
    });

    navigation.addListener('blur', (ev) => {
      console.log('Leaving connectionList');
      setUpdating(true);
    });
  }, [navigation]);

  const toggleActive = (item, newValue) => {
    var newList = connList.map((conn) => {
      if (conn.id == item.id) {
        conn.active = newValue;
      }
      return conn;
    });
    updateList(newList);
    connections.toggleActive(item, newValue);
  };

  const renderItem = ({ item }) => (
    <View style={styles.selectRow}>
      <View style={styles.connectionDetails}>
        <TouchableOpacity
          style={styles.item}
          onPress={() => {
            navigation.navigate(CONNECTIONS_EDITOR, { id: item.id });
          }}
        >
          <View>
            <Text style={styles.title}>{item.name}</Text>
          </View>
          <View>
            <Text style={styles.subtitle}>{item.url}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.editRow}
        onPress={() => {
          navigation.navigate(CONNECTIONS_EDITOR, { id: item.id });
        }}
      >
        <Icon name='edit' type={'FAIcon'} size={30} color={'black'} />
      </TouchableOpacity>
    </View>
  );
  return (
    <SafeAreaView edges={['top', 'left']}>
      <FlatList
        data={connList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        // refreshing={this.isUpdating}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  selectRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    alignContent: 'flex-start',
    backgroundColor: '#DDDDDD',
    padding: 10,
  },
  connectionDetails: {
    flexBasis: 100,
    flexGrow: 10,
  },

  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
  },
  editRow: {
    // backgroundColor: 'red',
    flex: 2,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SetupConnectionsList;
