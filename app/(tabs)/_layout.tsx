import {Tabs, Redirect} from "expo-router";
import {tabs} from "@/constants/data";
import {View} from "react-native";
import  { colors, components } from "@/constants/theme";
import clsx from "clsx";
import {Image} from "react-native";
import  { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from '@clerk/expo';


const tabBar = components.tabBar;



const TabLayout = () => {
        const insets = useSafeAreaInsets();
        const { isSignedIn, isLoaded } = useAuth();

        // Wait for auth to load
        if (!isLoaded) {
            return null;
        }

        // If user is not signed in, redirect to sign-in
        if (!isSignedIn) {
            return <Redirect href="/(auth)/sign-in" />;
        }

        const TabIcon =({focused, icon}: TabIconProps) => {
                return (
                    <View className='tabs-icon'>
                            <View className={clsx('tabs-pill', focused && 'tabs-active')}>
                                    <Image source={icon} resizeMode='contain'  className="tabs-glyph" />
                            </View>
                    </View>
                )
        }

    return (
            <Tabs
                screenOptions={{
                        headerShown: false,
                        tabBarShowLabel: false,
                        tabBarStyle: {
                                position: 'absolute',
                                bottom: Math.max( insets.bottom, tabBar.horizontalInset),
                                height: tabBar.height,
                                marginHorizontal: tabBar.horizontalInset,
                                borderRadius: tabBar.radius,
                                backgroundColor: colors.primary,
                                borderTopWidth: 0,
                                elevation: 0,
                        },
                        tabBarItemStyle: {
                                paddingVertical: tabBar.height / 2 - tabBar.iconFrame / 1.6,
                        },
                        tabBarIconStyle: {
                                width: tabBar.iconFrame,
                                height: tabBar.iconFrame,
                                alignItems: 'center',
                        }
            }}
            >
                    {tabs.map((tab) => (
                        <Tabs.Screen
                            key={tab.name}
                            name={tab.name}
                            options={{
                                    title: tab.title,
                                    tabBarIcon: ({focused}) => (
                                        <TabIcon focused={focused} icon={tab.icon} />
                                    )
                            }}/>
                    ))}
            </Tabs>
        )
}

export default TabLayout