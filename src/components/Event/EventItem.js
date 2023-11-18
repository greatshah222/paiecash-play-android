import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import React from 'react';

import colors from '../../assets/themes/colors';

import moment from 'moment';
import 'moment/locale/fi';
import Icon from '../common/Icon';
import CustomButton from '../common/CustomButton';
import { convertDuration } from '../../utils/utils';
import getSingleEventAction from '../../context/actions/getSingleEventAction';
import { GlobalContext } from '../../context/reducers/Provider';
import axiosInstance from '../../helpers/axiosInterceptor';
import { useTranslation } from 'react-i18next';

const SHOW__BEFORE_ACTUAL_TIME = 20;

const NUMBER_TO_CONVERT_TO_MS = 60000;

const EventItem = ({ item, onPress, title }) => {
  const { t } = useTranslation();

  const [singleEvent, setSingleEvent] = React.useState(null);
  const { user } = React.useContext(GlobalContext);

  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSingleItem = async () => {
      let url = `/api/game?organizationId=${user?.userOrganizationId}&gameId=${item?.gameId}`;
      console.log('url', url);
      await axiosInstance
        .get(url)
        .then((res1) => {
          setSingleEvent(res1?.data?.game);
        })
        .catch((err) => {
          console.log(err, 'err1');
        });

      setLoading(false);
    };

    if (item?.gameId) {
      fetchSingleItem();
    }
  }, [item?.gameId]);

  return loading ? (
    <ActivityIndicator color={colors.primary} />
  ) : (
    singleEvent && singleEvent?.name && (
      <View style={styles.card}>
        <View style={[styles.item]}>
          <Text style={styles.title}>
            {singleEvent?.name[singleEvent?.defaultLanguage]}
          </Text>
        </View>
        <View style={styles.container}>
          <View style={styles.dateTimeContainer}>
            <Icon type={'ionicon'} name='time' size={22} />

            <Text style={styles.dateTimeContainer_text}>
              {moment(singleEvent?.startTime).locale('fi').format('H:mm')}
            </Text>
          </View>
          <View style={styles.dateTimeContainer}>
            <Icon type={'fontisto'} name='date' size={22} />

            <Text style={styles.dateTimeContainer_text}>
              {moment(singleEvent?.startTime).locale('fi').format('l')}
            </Text>
          </View>
          {title?.includes(t('eventScreen.liveGames')) ||
          (!title?.includes(t('eventScreen.liveGames')) &&
            singleEvent?.startTime - Date.now() <=
              NUMBER_TO_CONVERT_TO_MS * SHOW__BEFORE_ACTUAL_TIME) ? (
            <CustomButton
              title={t('eventScreen.stream')}
              primary
              onPress={() => onPress(singleEvent)}
              icon={{
                iconName: 'stream',
                iconType: 'material',
                iconColor: 'white',
                iconSize: 22,
              }}
            />
          ) : (
            <View style={styles.dateTimeContainer}>
              <Icon type={'entypo'} name='hour-glass' size={22} />

              <Text style={styles.dateTimeContainer_text}>
                {convertDuration(singleEvent?.duration)}
              </Text>
            </View>
          )}
        </View>
      </View>
    )
  );
};

export default EventItem;

const styles = StyleSheet.create({
  card: {
    borderRadius: 6,
    elevation: 5,
    backgroundColor: 'white',
    shadowOffset: {
      width: 1,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    marginVertical: 5,
    flex: 1,
    width: '100%',
    minHeight: 120,
  },
  container: { flexDirection: 'row', justifyContent: 'space-around' },
  item: { padding: 20 },

  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  dateTimeContainer_text: {
    marginLeft: 10,
    fontSize: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.accent,
  },
});
