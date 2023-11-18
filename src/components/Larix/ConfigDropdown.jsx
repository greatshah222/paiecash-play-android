import React from 'react'
import { Text } from 'react-native'
import DropDownPicker from 'react-native-dropdown-picker'

class ConfigDropDown extends React.Component {
    //Properties should contain value if should be updated dynamically, otherwise config[field] will be used
    
    constructor(props) {
        super(props)
        let config = props.config
        this.state = {
            items: props.items,
            value: config[props.field],
            config: props.config,
            open: false,
        }
    }

    onChange = (field, newValue) => {
        let upd = {}
        Object.assign(upd, this.state.config)
        upd[field] = newValue
        this.setState({config: upd, value: newValue})
        let val = this.state.config[field]
        console.log(`OnChange ${field} ${val}`)
        this.props.onChange(field, upd)
    }

    render() {
        if (this.state.items.length <= 1) {
            return (<></>)
        }
        return (
        <>
        <Text>{this.props.label}</Text>
        <DropDownPicker key={this.props.field} value={this.props.value ??  this.state.value} 
           items = {this.props.items}
           setItems={(v) => this.setState({items: v})}
           open={this.state.open}
           setOpen={(v) => this.setState({open: v})}
           listMode="MODAL"
           onSelectItem={item => this.onChange(this.props.field, item.value)}   />  
        </>

        )
    }
}

export default ConfigDropDown
