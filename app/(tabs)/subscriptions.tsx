import { Text, TextInput, FlatList, View, KeyboardAvoidingView, Platform} from 'react-native'
import React, {useState} from 'react'
import { styled } from "nativewind";
import {SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import SubscriptionCard from "@/components/SubscriptionCard";
import { useSubscriptions } from "@/lib/SubscriptionsContext";

const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const { subscriptions } = useSubscriptions();

    const filteredSubscriptions = subscriptions.filter(sub =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.plan?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView className='flex-1 bg-background' edges={['top']}>
            <KeyboardAvoidingView 
                className='flex-1'
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <View className='p-5'>
                    <Text className='text-2xl font-bold text-black mb-4'>Subscriptions</Text>
                    
                    <TextInput
                        className='bg-card p-4 rounded-lg mb-4 text-black'
                        placeholder='Search subscriptions...'
                        placeholderTextColor='#999'
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <FlatList
                    data={filteredSubscriptions}
                    keyExtractor={(item) => item.id}
                    renderItem={({item}) => (
                        <View className='mb-3 px-5'>
                            <SubscriptionCard
                                {...item}
                                expanded={expandedId === item.id}
                                onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
                            />
                        </View>
                    )}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
export default Subscriptions
