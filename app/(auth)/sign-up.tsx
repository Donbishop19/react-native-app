import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { Link, useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignUp } from '@clerk/expo';

const SignUp = () => {
    const { signUp, errors, fetchStatus } = useSignUp();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [localErrors, setLocalErrors] = useState<{
        email?: string;
        password?: string;
    }>({});

    // Validation helpers
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (pass: string): boolean => {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        return pass.length >= 8;
    };

    const handleBlurEmail = () => {
        if (emailAddress && !validateEmail(emailAddress)) {
            setLocalErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
        } else {
            setLocalErrors(prev => ({ ...prev, email: undefined }));
        }
    };

    const handleBlurPassword = () => {
        if (password && !validatePassword(password)) {
            setLocalErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
        } else {
            setLocalErrors(prev => ({ ...prev, password: undefined }));
        }
    };

    const handleSubmit = async () => {
        // Clear previous errors
        setLocalErrors({});

        // Validate fields
        const emailValid = validateEmail(emailAddress);
        const passwordValid = validatePassword(password);

        if (!emailValid || !passwordValid) {
            setLocalErrors({
                email: !emailValid ? 'Please enter a valid email address' : undefined,
                password: !passwordValid ? 'Password must be at least 8 characters' : undefined,
            });
            return;
        }

        const { error } = await signUp.password({
            emailAddress,
            password,
        });

        if (error) {
            console.error(JSON.stringify(error, null, 2));
            return;
        }

        if (!error) await signUp.verifications.sendEmailCode();
    };

    const handleVerify = async () => {
        await signUp.verifications.verifyEmailCode({
            code,
        });

        if (signUp.status === 'complete') {
            await signUp.finalize({
                navigate: ({ session, decorateUrl }) => {
                    if (session?.currentTask) {
                        console.log(session?.currentTask);
                        return;
                    }

                    const url = decorateUrl('/');
                    if (url.startsWith('http')) {
                        window.location.href = url;
                    } else {
                        router.push(url as Href);
                    }
                },
            });
        } else {
            console.error('Sign-up attempt not complete:', signUp);
        }
    };

    // Check if form is valid
    const isFormValid = emailAddress.length > 0 && password.length > 0 && !localErrors.email && !localErrors.password;
    const isLoading = fetchStatus === 'fetching';

    // Verification code screen
    if (
        signUp.status === 'missing_requirements' &&
        signUp.unverifiedFields.includes('email_address') &&
        signUp.missingFields.length === 0
    ) {
        return (
            <SafeAreaView className="auth-safe-area">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="auth-screen"
                >
                    <ScrollView
                        className="auth-scroll"
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="auth-content">
                            {/* Brand Block */}
                            <View className="auth-brand-block">
                                <View className="auth-logo-wrap">
                                    <View className="auth-logo-mark">
                                        <Text className="auth-logo-mark-text">S</Text>
                                    </View>
                                    <View>
                                        <Text className="auth-wordmark">Subtrack</Text>
                                        <Text className="auth-wordmark-sub">Subscriptions</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Title */}
                            <View className="items-center mt-6 mb-3">
                                <Text className="auth-title">Check your email</Text>
                                <Text className="auth-subtitle">
                                    We sent a verification code to{'\n'}
                                    {emailAddress}
                                </Text>
                            </View>

                            {/* Card with Form */}
                            <View className="auth-card">
                                <View className="auth-form">
                                    {/* Code Field */}
                                    <View className="auth-field">
                                        <Text className="auth-label">Verification Code</Text>
                                        <TextInput
                                            className="auth-input"
                                            value={code}
                                            placeholder="Enter 6-digit code"
                                            placeholderTextColor="rgba(0, 0, 0, 0.3)"
                                            onChangeText={setCode}
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            autoFocus
                                        />
                                        {errors.fields.code && (
                                            <Text className="auth-error">{errors.fields.code.message}</Text>
                                        )}
                                    </View>

                                    {/* Verify Button */}
                                    <Pressable
                                        className={`auth-button ${isLoading ? 'auth-button-disabled' : ''}`}
                                        onPress={handleVerify}
                                        disabled={isLoading || code.length < 6}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#081126" />
                                        ) : (
                                            <Text className="auth-button-text">Verify Email</Text>
                                        )}
                                    </Pressable>

                                    {/* Resend Button */}
                                    <Pressable
                                        className="auth-secondary-button"
                                        onPress={() => signUp.verifications.sendEmailCode()}
                                    >
                                        <Text className="auth-secondary-button-text">Send New Code</Text>
                                    </Pressable>
                                </View>
                            </View>

                            <View className="auth-link-row">
                                <Text className="auth-link-copy">Wrong email?</Text>
                                <Pressable onPress={() => signUp.reset()}>
                                    <Text className="auth-link">Start over</Text>
                                </Pressable>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    // Sign-up form
    return (
        <SafeAreaView className="auth-safe-area">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="auth-screen"
            >
                <ScrollView
                    className="auth-scroll"
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="auth-content">
                        {/* Brand Block */}
                        <View className="auth-brand-block">
                            <View className="auth-logo-wrap">
                                <View className="auth-logo-mark">
                                    <Text className="auth-logo-mark-text">S</Text>
                                </View>
                                <View>
                                    <Text className="auth-wordmark">Subtrack</Text>
                                    <Text className="auth-wordmark-sub">Subscriptions</Text>
                                </View>
                            </View>
                        </View>

                        {/* Title */}
                        <View className="items-center mt-6 mb-3">
                            <Text className="auth-title">Create your account</Text>
                            <Text className="auth-subtitle">
                                Track all your subscriptions in one place
                            </Text>
                        </View>

                        {/* Card with Form */}
                        <View className="auth-card">
                            <View className="auth-form">
                                {/* Email Field */}
                                <View className="auth-field">
                                    <Text className="auth-label">Email Address</Text>
                                    <TextInput
                                        className={`auth-input ${(localErrors.email || errors.fields.emailAddress) ? 'auth-input-error' : ''}`}
                                        autoCapitalize="none"
                                        value={emailAddress}
                                        placeholder="you@example.com"
                                        placeholderTextColor="rgba(0, 0, 0, 0.3)"
                                        onChangeText={(text) => {
                                            setEmailAddress(text);
                                            if (localErrors.email) {
                                                setLocalErrors(prev => ({ ...prev, email: undefined }));
                                            }
                                        }}
                                        onBlur={handleBlurEmail}
                                        keyboardType="email-address"
                                        autoComplete="email"
                                    />
                                    {(localErrors.email || errors.fields.emailAddress) && (
                                        <Text className="auth-error">
                                            {localErrors.email || errors.fields.emailAddress?.message}
                                        </Text>
                                    )}
                                </View>

                                {/* Password Field */}
                                <View className="auth-field">
                                    <Text className="auth-label">Password</Text>
                                    <TextInput
                                        className={`auth-input ${(localErrors.password || errors.fields.password) ? 'auth-input-error' : ''}`}
                                        value={password}
                                        placeholder="Create a secure password"
                                        placeholderTextColor="rgba(0, 0, 0, 0.3)"
                                        secureTextEntry={true}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            if (localErrors.password) {
                                                setLocalErrors(prev => ({ ...prev, password: undefined }));
                                            }
                                        }}
                                        onBlur={handleBlurPassword}
                                        autoComplete="password-new"
                                    />
                                    {(localErrors.password || errors.fields.password) && (
                                        <Text className="auth-error">
                                            {localErrors.password || errors.fields.password?.message}
                                        </Text>
                                    )}
                                    {!localErrors.password && !errors.fields.password && password.length === 0 && (
                                        <Text className="auth-helper">Minimum 8 characters</Text>
                                    )}
                                </View>

                                {/* Submit Button */}
                                <Pressable
                                    className={`auth-button ${(!isFormValid || isLoading) ? 'auth-button-disabled' : ''}`}
                                    onPress={handleSubmit}
                                    disabled={!isFormValid || isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#081126" />
                                    ) : (
                                        <Text className="auth-button-text">Create Account</Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>

                        {/* Sign-in Link */}
                        <View className="auth-link-row">
                            <Text className="auth-link-copy">Already have an account?</Text>
                            <Link href="/(auth)/sign-in">
                                <Text className="auth-link">Sign in</Text>
                            </Link>
                        </View>

                        {/* Required for Clerk's bot protection */}
                        <View nativeID="clerk-captcha" />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignUp;
