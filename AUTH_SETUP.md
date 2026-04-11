# Clerk Authentication Setup

This document provides instructions for setting up and using Clerk authentication in this Expo app.

## Prerequisites

Before you begin, ensure you have:

1. A Clerk account (sign up at [clerk.com](https://clerk.com))
2. A Clerk application created in your dashboard
3. Your Clerk Publishable Key (already configured in `.env`)

## Installation

Run the following command to install the Clerk Expo SDK:

```bash
npx expo install @clerk/expo
```

Note: `expo-secure-store` is already installed and configured.

## Configuration

### 1. Environment Variables

The `.env` file already contains your Clerk Publishable Key:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

### 2. App Configuration

The `app.json` file has been updated to include the required plugins:

- `expo-secure-store`
- `@clerk/expo`

### 3. Clerk Dashboard Setup

In your [Clerk Dashboard](https://dashboard.clerk.com):

1. **Enable Native API**: Navigate to **Native applications** page and ensure Native API is enabled
2. **Configure Email/Password**: Navigate to **User & Authentication** → **Email, Phone, Username** and enable:
   - Email address
   - Password authentication

## Features Implemented

### ✅ Production-Grade Sign Up Flow

- **Email validation** with real-time feedback
- **Password validation** (minimum 8 characters)
- **Email verification** with 6-digit code
- **Loading states** with activity indicators
- **Error handling** for Clerk API errors and local validation
- **Keyboard handling** with KeyboardAvoidingView
- **Brand-native UI** matching the app's design system

Location: `app/(auth)/sign-up.tsx`

### ✅ Production-Grade Sign In Flow

- **Email validation** with real-time feedback
- **Password validation**
- **Device verification** for new devices (MFA/Client Trust)
- **Loading states** with activity indicators
- **Error handling** for authentication errors
- **Keyboard handling** with KeyboardAvoidingView
- **Brand-native UI** matching the app's design system

Location: `app/(auth)/sign-in.tsx`

### ✅ Route Protection

- **Auth Layout**: Redirects authenticated users away from sign-in/sign-up pages
- **Tabs Layout**: Redirects unauthenticated users to sign-in
- **Loading States**: Prevents layout flashing during auth state checks

### ✅ Design System Integration

All authentication screens use the existing NativeWind classes from `global.css`:

- `auth-safe-area` - Safe area container
- `auth-screen` - Screen wrapper
- `auth-content` - Content container
- `auth-brand-block` - Logo/branding section
- `auth-logo-mark` - App logo with "S" initial
- `auth-wordmark` - "Subtrack" text
- `auth-card` - Form card container
- `auth-form` - Form layout
- `auth-field` - Input field group
- `auth-label` - Input labels
- `auth-input` - Text input styling
- `auth-input-error` - Error state for inputs
- `auth-error` - Error message text
- `auth-helper` - Helper text (e.g., "Minimum 8 characters")
- `auth-button` - Primary action button
- `auth-button-disabled` - Disabled button state
- `auth-button-text` - Button text
- `auth-secondary-button` - Secondary action button
- `auth-link-row` - Footer link container
- `auth-link` - Link text styling

## User Flow

### New User Sign Up

1. User navigates to sign-up screen
2. Enters email and password
3. Validates input on blur and submit
4. Submits form → Clerk sends verification email
5. User enters 6-digit code from email
6. On successful verification → Redirected to home (tabs)

### Returning User Sign In

1. User navigates to sign-in screen
2. Enters email and password
3. Validates input on blur
4. Submits form:
   - **If device is trusted**: Immediate sign-in → Redirected to home
   - **If device is new**: Email verification required → Enter code → Redirected to home

### Session Management

- Sessions are automatically managed by Clerk
- Tokens are securely stored using `expo-secure-store`
- Users remain signed in across app restarts

## Running the App

1. Install dependencies (if not already done):
   ```bash
   cd reactNativ-app
   npx expo install @clerk/expo
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on your device:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go for physical device

## Testing Authentication

### Test Sign Up

1. Launch the app
2. You'll be redirected to sign-in screen
3. Tap "Create account" link
4. Enter a test email (e.g., `test@example.com`)
5. Enter a password (min 8 characters)
6. Check email for verification code
7. Enter the 6-digit code
8. You'll be signed in and redirected to home

### Test Sign In

1. After signing up, close and relaunch the app
2. You should see the home screen (session persisted)
3. To test sign-in flow:
   - Use Clerk Dashboard to sign out the user
   - Or implement a sign-out button (see below)
4. Enter your credentials
5. You'll be signed in and redirected to home

## Adding Sign Out (Optional)

To add a sign-out button to your app, use the `useClerk()` hook:

```tsx
import { useClerk } from '@clerk/expo';

function SettingsScreen() {
  const { signOut } = useClerk();

  return (
    <Pressable onPress={() => signOut()}>
      <Text>Sign Out</Text>
    </Pressable>
  );
}
```

## Customization

### Changing Password Requirements

Edit the `validatePassword` function in both sign-up and sign-in screens:

```tsx
const validatePassword = (pass: string): boolean => {
    // Current: minimum 8 characters
    return pass.length >= 8;

    // Example: Add complexity requirements
    // return pass.length >= 8 &&
    //        /[A-Z]/.test(pass) &&
    //        /[a-z]/.test(pass) &&
    //        /[0-9]/.test(pass);
};
```

### Customizing Branding

The logo and wordmark can be customized in the auth screens:

```tsx
<View className="auth-logo-mark">
    <Text className="auth-logo-mark-text">S</Text> {/* Change initial */}
</View>
<View>
    <Text className="auth-wordmark">Subtrack</Text> {/* Change name */}
    <Text className="auth-wordmark-sub">Subscriptions</Text> {/* Change tagline */}
</View>
```

### Adding Social Sign-In (Google, Apple, etc.)

Refer to the Clerk documentation for:
- [Sign in with Google](https://clerk.com/docs/expo/guides/configure/auth-strategies/sign-in-with-google)
- [Sign in with Apple](https://clerk.com/docs/expo/guides/configure/auth-strategies/sign-in-with-apple)

Note: Social sign-in requires native OAuth setup and additional dependencies.

## Troubleshooting

### Issue: "Add your Clerk Publishable Key to the .env file"

**Solution**: Ensure your `.env` file exists in the root directory with:
```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

### Issue: Auth screens don't appear

**Solution**:
1. Make sure you've installed `@clerk/expo`: `npx expo install @clerk/expo`
2. Clear Expo cache: `npx expo start -c`
3. Restart the development server

### Issue: Verification code not received

**Solution**:
1. Check spam/junk folder
2. Verify email settings in Clerk Dashboard
3. Try the "Send New Code" button

### Issue: TypeScript errors

**Solution**:
1. Ensure you have the latest type definitions
2. Add type declarations if needed for Clerk hooks

## Security Best Practices

✅ **Implemented**:
- Environment variables for API keys (not committed to git)
- Secure token storage with `expo-secure-store`
- Client-side input validation
- Server-side validation via Clerk
- Email verification for new accounts
- Device verification for new sign-ins

⚠️ **Recommendations**:
- Enable Multi-Factor Authentication (MFA) in Clerk Dashboard for sensitive apps
- Implement rate limiting in Clerk Dashboard to prevent brute force attacks
- Use strong password policies (configurable in Clerk Dashboard)
- Monitor authentication logs in Clerk Dashboard

## Support

- **Clerk Documentation**: https://clerk.com/docs/expo
- **Clerk Support**: https://clerk.com/support
- **Expo Documentation**: https://docs.expo.dev

## Summary

Your Expo app now has production-grade authentication with:
- ✅ Custom email/password sign-up and sign-in flows
- ✅ Email verification with 6-digit codes
- ✅ Device verification for security
- ✅ Real-time validation and error handling
- ✅ Loading states and activity indicators
- ✅ Protected routes with automatic redirects
- ✅ Brand-native UI matching your design system
- ✅ Secure session management with token caching
- ✅ Keyboard handling for mobile devices

The authentication is ready for production use with Expo Go (no dev build required)!
