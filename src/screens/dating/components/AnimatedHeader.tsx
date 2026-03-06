import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { DATING_COLORS } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating/strings';

interface AnimatedHeaderProps {
    animatedStyle: any;
    textColor: string;
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({ animatedStyle, textColor }) => {
    return (
        <Animated.View style={[styles.textContainer, animatedStyle]}>
            <Text style={[styles.title, { color: textColor }]}>
                {DATING_STRINGS.titleStart}
                <Text style={styles.titleHighlight}>{DATING_STRINGS.titleHighlight}</Text>
            </Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    textContainer: {
        alignItems: 'center',
        maxWidth: 320,
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: -1.5,
    },
    titleHighlight: {
        color: DATING_COLORS.primary,
    },
});
