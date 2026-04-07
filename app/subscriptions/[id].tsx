import {View, Text} from 'react-native'
import React from 'react'
import {Link, useLocalSearchParams} from "expo-router";

const SubscriptionDetails = () => {
    const { id } = useLocalSearchParams< {id: string} >()
    return (
        <View>
            <Text>Subscription Details: {id}</Text>
            <Link href='/'>Back to Home</Link>
        </View>
    )
}
    export default SubscriptionDetails
