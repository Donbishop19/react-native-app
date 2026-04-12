import { View, Text, TextInput, Pressable, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { icons } from '@/constants/icons';
import clsx from 'clsx';
import dayjs from 'dayjs';

const CATEGORIES = [
    'Entertainment',
    'AI Tools',
    'Developer Tools',
    'Design',
    'Productivity',
    'Cloud',
    'Music',
    'Other'
] as const;

const CATEGORY_COLORS: Record<string, string> = {
    'Entertainment': '#8fd1bd',
    'AI Tools': '#b8d4e3',
    'Developer Tools': '#e8def8',
    'Design': '#f5c542',
    'Productivity': '#ffd4a3',
    'Cloud': '#c7e9fb',
    'Music': '#ffb3d9',
    'Other': '#d4d4d8'
};

const CreateSubscriptionModal = ({ visible, onClose, onCreateSubscription }: CreateSubscriptionModalProps) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [frequency, setFrequency] = useState<'Monthly' | 'Yearly'>('Monthly');
    const [category, setCategory] = useState<string>('');

    const resetForm = () => {
        setName('');
        setPrice('');
        setFrequency('Monthly');
        setCategory('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const isValid = name.trim().length > 0 && parseFloat(price) > 0;

    const handleSubmit = () => {
        if (!isValid) return;

        const priceValue = parseFloat(price);
        const startDate = dayjs().toISOString();
        const renewalDate = frequency === 'Monthly'
            ? dayjs().add(1, 'month').toISOString()
            : dayjs().add(1, 'year').toISOString();

        const newSubscription: Subscription = {
            id: `sub-${Date.now()}`,
            name: name.trim(),
            price: priceValue,
            frequency,
            category: category || 'Other',
            status: 'active',
            startDate,
            renewalDate,
            icon: icons.plus,
            billing: frequency,
            currency: 'USD',
            color: CATEGORY_COLORS[category] || CATEGORY_COLORS['Other']
        };

        onCreateSubscription(newSubscription);
        handleClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <Pressable className="modal-overlay" onPress={handleClose} />

                <View className="modal-container">
                    <View className="modal-header">
                        <Text className="modal-title">New Subscription</Text>
                        <Pressable className="modal-close" onPress={handleClose}>
                            <Text className="modal-close-text">×</Text>
                        </Pressable>
                    </View>

                    <ScrollView className="modal-body" showsVerticalScrollIndicator={false}>
                        {/* Name Field */}
                        <View className="auth-field">
                            <Text className="auth-label">Name</Text>
                            <TextInput
                                className="auth-input"
                                value={name}
                                placeholder="Subscription name"
                                placeholderTextColor="rgba(0, 0, 0, 0.3)"
                                onChangeText={setName}
                            />
                        </View>

                        {/* Price Field */}
                        <View className="auth-field">
                            <Text className="auth-label">Price</Text>
                            <TextInput
                                className="auth-input"
                                value={price}
                                placeholder="0.00"
                                placeholderTextColor="rgba(0, 0, 0, 0.3)"
                                onChangeText={setPrice}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        {/* Frequency Field */}
                        <View className="auth-field">
                            <Text className="auth-label">Frequency</Text>
                            <View className="picker-row">
                                <Pressable
                                    className={clsx('picker-option', frequency === 'Monthly' && 'picker-option-active')}
                                    onPress={() => setFrequency('Monthly')}
                                >
                                    <Text className={clsx('picker-option-text', frequency === 'Monthly' && 'picker-option-text-active')}>
                                        Monthly
                                    </Text>
                                </Pressable>
                                <Pressable
                                    className={clsx('picker-option', frequency === 'Yearly' && 'picker-option-active')}
                                    onPress={() => setFrequency('Yearly')}
                                >
                                    <Text className={clsx('picker-option-text', frequency === 'Yearly' && 'picker-option-text-active')}>
                                        Yearly
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Category Field */}
                        <View className="auth-field">
                            <Text className="auth-label">Category</Text>
                            <View className="category-scroll">
                                {CATEGORIES.map((cat) => (
                                    <Pressable
                                        key={cat}
                                        className={clsx('category-chip', category === cat && 'category-chip-active')}
                                        onPress={() => setCategory(cat)}
                                    >
                                        <Text className={clsx('category-chip-text', category === cat && 'category-chip-text-active')}>
                                            {cat}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Submit Button */}
                        <Pressable
                            className={clsx('auth-button', !isValid && 'auth-button-disabled')}
                            onPress={handleSubmit}
                            disabled={!isValid}
                        >
                            <Text className="auth-button-text">Create Subscription</Text>
                        </Pressable>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default CreateSubscriptionModal;
