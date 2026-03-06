import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withDelay,
} from 'react-native-reanimated';
import { DATING_COLORS } from '../../constants/dating/theme';
import { AnimatedLogo } from './components/AnimatedLogo';
import { AnimatedHeader } from './components/AnimatedHeader';
import { AnimatedFooter } from './components/AnimatedFooter';

export const DatingSplashScreen: React.FC = () => {
    // Force light theme mode per request
    const theme = DATING_COLORS.light;

    // Animation values
    const logoOpacity = useSharedValue(0);
    const logoTranslateY = useSharedValue(50);
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(30);
    const buttonOpacity = useSharedValue(0);
    const buttonTranslateY = useSharedValue(40);

    useEffect(() => {
        // Logo animation
        logoOpacity.value = withTiming(1, { duration: 800 });
        logoTranslateY.value = withSpring(0, { damping: 12, stiffness: 90 });

        // Text animation
        textOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
        textTranslateY.value = withDelay(300, withSpring(0, { damping: 12, stiffness: 90 }));

        // Button animation
        buttonOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
        buttonTranslateY.value = withDelay(600, withSpring(0, { damping: 12, stiffness: 90 }));
    }, []);

    const animatedLogoStyle = useAnimatedStyle(() => {
        return {
            opacity: logoOpacity.value,
            transform: [{ translateY: logoTranslateY.value }],
        };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
        return {
            opacity: textOpacity.value,
            transform: [{ translateY: textTranslateY.value }],
        };
    });

    const animatedButtonStyle = useAnimatedStyle(() => {
        return {
            opacity: buttonOpacity.value,
            transform: [{ translateY: buttonTranslateY.value }],
            width: '100%',
        };
    });

    const handleStartPress = () => {
        // Handle start logic here
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <View style={styles.container}>
                {/* Center Content Group */}
                <View style={styles.centerContent}>
                    <AnimatedLogo
                        animatedStyle={animatedLogoStyle}
                        surfaceColor={theme.surface}
                        glowColor={'rgba(250, 78, 87, 0.08)'}
                    />

                    <AnimatedHeader
                        animatedStyle={animatedTextStyle}
                        textColor={theme.textPrimary}
                    />
                </View>

                {/* Footer Group */}
                <AnimatedFooter
                    animatedStyle={animatedButtonStyle}
                    mutedTextColor={theme.textMuted}
                    onStartPress={handleStartPress}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 40,
        paddingHorizontal: 24,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 80, // Offset a bit upwards to balance the layout
    },
});
