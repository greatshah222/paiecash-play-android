import React from 'react'
import { StyleSheet, View, ScrollView, Switch, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import {settings} from './Settings'
import ConfigDropDown from './ConfigDropdown'


class RecordSettingsScreen extends React.Component {
    constructor(props) {
        super(props)

        this.recordConfig = settings.getRecordConfig()

        this.durationList = [
            { label:'Unlimited',        value: 0 },
            { label:'15 minutes',       value: 15 * 60 },
            { label:'30 minutes',       value: 30 * 60 },
            { label:'1 hour',           value: 60 * 60 },
            { label:'2 hours',          value: 120 * 60 },
        ]



        this.state = {
            config: this.recordConfig

        }
    }

    updateField = (item, value) => {
        let config = this.state.recordConfig
        let update = {}
        update[item] = value
        let newConfig = {}
        Object.assign(newConfig, config, update)
        this.setState({config: newConfig})
        settings.saveRecordConfig(newConfig)
    }

    onChange = (field, newConfig) => {
        settings.saveRecordConfig(newConfig)
    }

    render() {
        return (
        <SafeAreaView edges={['top', 'left', 'bottom']}>
        <ScrollView>
            <View style={styles.rowView}>
                <Text style={styles.switchTitle}>Record stream</Text>
                <Switch style={styles.switch} value={this.state.config.active} onValueChange={(val) => this.updateField('active', val)} />
            </View>
            <ConfigDropDown config={this.state.config} onChange={this.onChange} label='Split duration' items={this.durationList} field='segmentDuration' />


        </ScrollView>
        </SafeAreaView>
        )
    }
}

const styles = {
    main: {
        marginLeft: 10,
        marginRight: 10
    },
    switchTitle: {
        marginLeft: 10,
        flexBasis: 100,
        flexGrow: 1,
        fontSize: 16
    },
    switch: {
        marginLeft: 10,
        marginRight: 10
    },
    rowView: {
        flexDirection: 'row'
    },

}

export default RecordSettingsScreen