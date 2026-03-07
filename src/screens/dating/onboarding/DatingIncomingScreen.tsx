import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DATING_COLORS } from '../../../constants/dating/theme';

const DatingIncomingScreen: React.FC = () => (
  <View style={styles.wrapper}>
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.center}>
        <Text style={styles.title}>Incoming</Text>
      </View>
    </SafeAreaView>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: DATING_COLORS.profileSetup.background,
  },
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: DATING_COLORS.primary,
    letterSpacing: -0.5,
  },
});

export default DatingIncomingScreen;
