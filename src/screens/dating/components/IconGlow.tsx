import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';

interface IconGlowProps {
    glowColor: string;
    size?: number;
}

export const IconGlow: React.FC<IconGlowProps> = ({ glowColor, size = 240 }) => {
    // Pulse animation for the glow to make it feel more "alive"
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.8);

    useEffect(() => {
        scale.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.8, { duration: 1500, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const animatedGlowStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
        };
    });

    return (
        <View style={styles.glowWrapper}>
            {/* The base static glow */}
            <View
                style={[
                    styles.glowBase,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: glowColor,
                    },
                ]}
            />
            {/* The animated pulsing outer glow */}
            <Animated.View
                style={[
                    styles.glowPulse,
                    animatedGlowStyle,
                    {
                        width: size * 1.2,
                        height: size * 1.2,
                        borderRadius: (size * 1.2) / 2,
                        backgroundColor: glowColor,
                    },
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    glowWrapper: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 0,
    },
    glowBase: {
        position: 'absolute',
    },
    glowPulse: {
        position: 'absolute',
    },
});
