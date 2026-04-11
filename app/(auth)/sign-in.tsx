import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Linking } from 'react-native';
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
    const [mfaCode, setMfaCode] = useState('');
    const [mfaFactorType, setMfaFactorType] = useState<'phone_code' | 'totp' | 'backup_code' | null>(null);
    const [isResendingCode, setIsResendingCode] = useState(false);
    const [isResendingEmailCode, setIsResendingEmailCode] = useState(false);
    const [localErrors, setLocalErrors] = useState<{
        email?: string;
        password?: string;
    }>({});

    // Platform-safe navigation helper
    const navigateToUrl = (url: string) => {
        if (url.startsWith('http')) {
            if (Platform.OS === 'web') {
                window.location.href = url;
            } else {
                Linking.openURL(url);
            }
        } else {
            router.push(url as Href);
        }
    };

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
                    navigateToUrl(url);
                },
            });
        } else if (signIn.status === 'needs_second_factor') {
            // Handle MFA - determine which factor to use
            const phoneCodeFactor = signIn.supportedSecondFactors.find(
                (factor) => factor.strategy === 'phone_code',
            );
            const totpFactor = signIn.supportedSecondFactors.find(
                (factor) => factor.strategy === 'totp',
            );
            const backupCodeFactor = signIn.supportedSecondFactors.find(
                (factor) => factor.strategy === 'backup_code',
            );

            // Prioritize: SMS > TOTP > Backup codes
            if (phoneCodeFactor) {
                setMfaFactorType('phone_code');
                // Send SMS code
                await signIn.mfa.sendPhoneCode({ phoneNumberId: phoneCodeFactor.phoneNumberId });
            } else if (totpFactor) {
                setMfaFactorType('totp');
            } else if (backupCodeFactor) {
                setMfaFactorType('backup_code');
            } else {
                console.error('No supported second factor found');
            }
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
                    navigateToUrl(url);
                },
            });
        } else {
            console.error('Sign-in attempt not complete:', signIn);
        }
    };

    const handleVerifyMfa = async () => {
        try {
            if (mfaFactorType === 'phone_code') {
                await signIn.mfa.verifyPhoneCode({ code: mfaCode });
            } else if (mfaFactorType === 'totp') {
                await signIn.mfa.verifyTOTP({ code: mfaCode });
            } else if (mfaFactorType === 'backup_code') {
                await signIn.mfa.verifyBackupCode({ code: mfaCode });
            }

            if (signIn.status === 'complete') {
                await signIn.finalize({
                    navigate: ({ session, decorateUrl }) => {
                        if (session?.currentTask) {
                            console.log(session?.currentTask);
                            return;
                        }

                        const url = decorateUrl('/');
                        navigateToUrl(url);
                    },
                });
            } else {
                console.error('MFA verification not complete:', signIn);
            }
        } catch (error) {
            console.error('MFA verification failed:', error);
        }
    };

    const handleResendMfaCode = async () => {
        setIsResendingCode(true);
        try {
            const phoneCodeFactor = signIn.supportedSecondFactors.find(
                (factor) => factor.strategy === 'phone_code',
            );
            if (phoneCodeFactor) {
                await signIn.mfa.sendPhoneCode({ phoneNumberId: phoneCodeFactor.phoneNumberId });
            }
        } catch (error) {
            console.error('Failed to resend MFA code:', error);
        } finally {
            setIsResendingCode(false);
        }
    };

    const handleResendEmailCode = async () => {
        setIsResendingEmailCode(true);
        try {
            await signIn.mfa.sendEmailCode();
        } catch (error) {
            console.error('Failed to resend email code:', error);
        } finally {
            setIsResendingEmailCode(false);
        }
    };

    // Check if form is valid
    const isFormValid = emailAddress.length > 0 && password.length > 0 && !localErrors.email;
    const isLoading = fetchStatus === 'fetching';

    // MFA verification screen
    if (signIn.status === 'needs_second_factor' && mfaFactorType) {
        const getMfaTitle = () => {
            if (mfaFactorType === 'phone_code') return 'Enter SMS Code';
            if (mfaFactorType === 'totp') return 'Enter Authenticator Code';
            if (mfaFactorType === 'backup_code') return 'Enter Backup Code';
            return 'Two-Factor Authentication';
        };

        const getMfaSubtitle = () => {
            if (mfaFactorType === 'phone_code') return 'We sent a verification code to your phone';
            if (mfaFactorType === 'totp') return 'Enter the code from your authenticator app';
            if (mfaFactorType === 'backup_code') return 'Enter one of your backup codes';
            return 'Please verify your identity';
        };

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
                                <Text className="auth-title">{getMfaTitle()}</Text>
                                <Text className="auth-subtitle">{getMfaSubtitle()}</Text>
                            </View>

                            {/* Card with Form */}
                            <View className="auth-card">
                                <View className="auth-form">
                                    {/* MFA Code Field */}
                                    <View className="auth-field">
                                        <Text className="auth-label">
                                            {mfaFactorType === 'totp' || mfaFactorType === 'phone_code'
                                                ? 'Verification Code'
                                                : 'Backup Code'}
                                        </Text>
                                        <TextInput
                                            className="auth-input"
                                            value={mfaCode}
                                            placeholder={mfaFactorType === 'backup_code' ? 'Enter backup code' : 'Enter 6-digit code'}
                                            placeholderTextColor="rgba(0, 0, 0, 0.3)"
                                            onChangeText={setMfaCode}
                                            keyboardType={mfaFactorType === 'backup_code' ? 'default' : 'number-pad'}
                                            maxLength={mfaFactorType === 'backup_code' ? 20 : 6}
                                            autoFocus
                                        />
                                    </View>

                                    {/* Verify Button */}
                                    <Pressable
                                        className={`auth-button ${isLoading ? 'auth-button-disabled' : ''}`}
                                        onPress={handleVerifyMfa}
                                        disabled={isLoading || mfaCode.length < (mfaFactorType === 'backup_code' ? 1 : 6)}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#081126" />
                                        ) : (
                                            <Text className="auth-button-text">Verify</Text>
                                        )}
                                    </Pressable>

                                    {/* Resend Button (only for SMS) */}
                                    {mfaFactorType === 'phone_code' && (
                                        <Pressable
                                            className="auth-secondary-button"
                                            onPress={handleResendMfaCode}
                                            disabled={isResendingCode}
                                        >
                                            {isResendingCode ? (
                                                <ActivityIndicator color="#081126" size="small" />
                                            ) : (
                                                <Text className="auth-secondary-button-text">Send New Code</Text>
                                            )}
                                        </Pressable>
                                    )}

                                    {/* Use Backup Code option (if TOTP is active) */}
                                    {mfaFactorType === 'totp' && signIn.supportedSecondFactors.find(f => f.strategy === 'backup_code') && (
                                        <Pressable
                                            className="auth-secondary-button"
                                            onPress={() => setMfaFactorType('backup_code')}
                                        >
                                            <Text className="auth-secondary-button-text">Use Backup Code</Text>
                                        </Pressable>
                                    )}

                                    {/* Start Over Button */}
                                    <Pressable
                                        className="auth-secondary-button"
                                        onPress={() => {
                                            signIn.reset();
                                            setMfaFactorType(null);
                                            setMfaCode('');
                                        }}
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
                                        onPress={handleResendEmailCode}
                                        disabled={isResendingEmailCode}
                                    >
                                        {isResendingEmailCode ? (
                                            <ActivityIndicator color="#081126" size="small" />
                                        ) : (
                                            <Text className="auth-secondary-button-text">Send New Code</Text>
                                        )}
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
