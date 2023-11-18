import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withTranslation } from 'react-i18next';

import ConfigDropDown from '../components/Larix/ConfigDropdown';
import { settings } from '../components/Larix/Settings';

class AudioSettingsScreen extends React.Component {
  constructor(props) {
    super(props);

    this.audioConfig = settings.getAudioConfig();
    this.channels = [
      { label: this.props.t('setupAudio.mono'), value: 1 },
      { label: this.props.t('setupAudio.stereo'), value: 2 },
    ];

    this.bitrates = [
      { label: this.props.t('setupAudio.matchInput'), value: 0 },
      { label: '96 Kbps', value: 96 },
      { label: '128 Kbps', value: 128 },
      { label: '160 Kbps', value: 160 },
      { label: '256 Kbps', value: 256 },
      { label: '320 Kbps', value: 320 },
    ];

    this.sampleRates = [
      { label: this.props.t('setupAudio.matchInput'), value: 0 },
      { label: '48 kHz', value: 48000 },
      { label: '44.18 kHz', value: 44100 },
      { label: '32 kHz', value: 32000 },
      { label: '24 kHz', value: 24000 },
      { label: '22.05 kHz', value: 22500 },
    ];
  }

  onChange = (field, newConfig) => {
    settings.saveAudioConfig(newConfig);
  };

  render() {
    return (
      <SafeAreaView style={{ marginHorizontal: 10 }} edges={['top', 'left']}>
        <ScrollView>
          <ConfigDropDown
            config={this.audioConfig}
            onChange={this.onChange}
            label={this.props.t('setupAudio.audioChannels')}
            items={this.channels}
            field='channels'
          />
          <ConfigDropDown
            config={this.audioConfig}
            onChange={this.onChange}
            label={this.props.t('setupAudio.bitrate')}
            items={this.bitrates}
            field='bitrate'
          />
          {/* <ConfigDropDown
            config={this.audioConfig}
            onChange={this.onChange}
            label='Sample rate'
            items={this.sampleRates}
            field='samples'
          /> */}
        </ScrollView>
      </SafeAreaView>
    );
  }
}

export default withTranslation()(AudioSettingsScreen);
