import {StyleSheet, Text, View} from 'react-native';
import React from 'react';

import RBSheet from 'react-native-raw-bottom-sheet';
import Icon from './Icon';
import CustomPressable from './CustomPressable';
import colors from '../../assets/themes/colors';

import ImagePickerCropper from 'react-native-image-crop-picker';

// this is how you forward ref from parent to child

const ImagePicker = React.forwardRef(({onFileSelected}, ref) => {
  const options = [
    {
      name: 'Take from camera',
      icon: <Icon name="camera" color={colors.grey} size={21} />,
      onPress: () => {
        ImagePickerCropper?.openCamera({
          width: 300,
          height: 300,
          cropping: true,
          freeStyleCropEnabled: true,
        })
          .then(images => {
            onFileSelected(images);
          })
          .catch(error => {
            console.log(error);
          });
      },
    },
    {
      name: 'Choose from gallery',
      icon: <Icon name="image" color={colors.grey} size={21} />,
      onPress: () => {
        ImagePickerCropper?.openPicker({
          width: 300,
          height: 300,
          cropping: true,
          freeStyleCropEnabled: true,
        })
          .then(images => {
            onFileSelected(images);
          })
          .catch(error => {
            console.log(error);
          });
      },
    },
  ];
  return (
    <RBSheet
      ref={ref}
      height={300}
      openDuration={250}
      closeOnDragDown
      customStyles={{
        container: {
          borderTopRightRadius: 20,
          borderTopLeftRadius: 20,
        },
      }}>
      <View style={styles.container}>
        {options.map(({name, icon, onPress}) => (
          <CustomPressable
            key={name}
            onPress={onPress}
            style={styles.pickerOptions}>
            {icon}
            <Text style={styles.text}>{name}</Text>
          </CustomPressable>
        ))}
      </View>
    </RBSheet>
  );
});

export default ImagePicker;

const styles = StyleSheet.create({
  pickerOptions: {
    flexDirection: 'row',
    paddingTop: 20,
    alignItems: 'center',
    marginVertical: 5,
    // justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 20,
  },

  text: {
    fontSize: 17,
    paddingLeft: 17,
  },
});
