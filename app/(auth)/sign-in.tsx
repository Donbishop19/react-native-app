import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { Link, useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSignIn } from '@clerk/expo';

const SignIn = () => {
    const { signIn, errors, fetchStatus } = useSignIn();
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

    const handleBlurEmail = () => {
        if (emailAddress && !validateEmail(emailAddress)) {
            setLocalErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
        } else {
            setLocalErrors(prev => ({ ...prev, email: undefined }));
        }
    };

    const handleSubmit = async () => {
        // Clear previous errors
        setLocalErrors({});

        // Validate email
        if (!validateEmail(emailAddress)) {
            setLocalErrors({ email: 'Please enter a valid email address' });
            return;
        }

        if (!password) {
            setLocalErrors({ password: 'Password is required' });
            return;
        }

        const { error } = await signIn.password({
            emailAddress,
            password,
        });

        if (error) {
            console.error(JSON.stringify(error, null, 2));
            return;
        }

        if (signIn.status === 'complete') {
            await signIn.finalize({
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
        } else if (signIn.status === 'needs_second_factor') {
            // Handle MFA if needed
            console.log('MFA required');
        } else if (signIn.status === 'needs_client_trust') {
            const emailCodeFactor = signIn.supportedSecondFactors.find(
                (factor) => factor.strategy === 'email_code',
            );

            if (emailCodeFactor) {
                await signIn.mfa.sendEmailCode();
            }
        } else {
            console.error('Sign-in attempt not complete:', signIn);
        }
    };

    const handleVerify = async () => {
        await signIn.mfa.verifyEmailCode({ code });

        if (signIn.status === 'complete') {
            await signIn.finalize({
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
            console.error('Sign-in attempt not complete:', signIn);
        }
    };

    // Check if form is valid
    const isFormValid = emailAddress.length > 0 && password.length > 0 && !localErrors.email;
    const isLoading = fetchStatus === 'fetching';

    // Verification screen (for client trust / MFA)
    if (signIn.status === 'needs_client_trust') {
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
                                <Text className="auth-title">Verify your device</Text>
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
                                            <Text className="auth-button-text">Verify Device</Text>
                                        )}
                                    </Pressable>

                                    {/* Resend Button */}
                                    <Pressable
                                        className="auth-secondary-button"
                                        onPress={() => signIn.mfa.sendEmailCode()}
                                    >
                                        <Text className="auth-secondary-button-text">Send New Code</Text>
                                    </Pressable>

                                    {/* Start Over Button */}
                                    <Pressable
                                        className="auth-secondary-button"
                                        onPress={() => signIn.reset()}
                                    >
                                        <Text className="auth-secondary-button-text">Start Over</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    // Sign-in form
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
                            <Text className="auth-title">Welcome back</Text>
                            <Text className="auth-subtitle">
                                Sign in to your account to continue
                            </Text>
                        </View>

                        {/* Card with Form */}
                        <View className="auth-card">
                            <View className="auth-form">
                                {/* Email Field */}
                                <View className="auth-field">
                                    <Text className="auth-label">Email Address</Text>
                                    <TextInput
                                        className={`auth-input ${(localErrors.email || errors.fields.identifier) ? 'auth-input-error' : ''}`}
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
                                    {(localErrors.email || errors.fields.identifier) && (
                                        <Text className="auth-error">
                                            {localErrors.email || errors.fields.identifier?.message}
                                        </Text>
                                    )}
                                </View>

                                {/* Password Field */}
                                <View className="auth-field">
                                    <Text className="auth-label">Password</Text>
                                    <TextInput
                                        className={`auth-input ${(localErrors.password || errors.fields.password) ? 'auth-input-error' : ''}`}
                                        value={password}
                                        placeholder="Enter your password"
                                        placeholderTextColor="rgba(0, 0, 0, 0.3)"
                                        secureTextEntry={true}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            if (localErrors.password) {
                                                setLocalErrors(prev => ({ ...prev, password: undefined }));
                                            }
                                        }}
                                        autoComplete="password"
                                    />
                                    {(localErrors.password || errors.fields.password) && (
                                        <Text className="auth-error">
                                            {localErrors.password || errors.fields.password?.message}
                                        </Text>
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
                                        <Text className="auth-button-text">Sign In</Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>

                        {/* Sign-up Link */}
                        <View className="auth-link-row">
                            <Text className="auth-link-copy">Don't have an account?</Text>
                            <Link href="/(auth)/sign-up">
                                <Text className="auth-link">Create account</Text>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignIn;
