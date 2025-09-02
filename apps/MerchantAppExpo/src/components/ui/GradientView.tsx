import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@theme/config';

// TODO: Re-enable LinearGradient once native module is properly configured
// import LinearGradient from 'react-native-linear-gradient';

interface GradientViewProps {
  children: React.ReactNode;
  colors?: string[];
  style?: ViewStyle;
  variant?: 'primary' | 'dark' | 'surface';
}

export const GradientView: React.FC<GradientViewProps> = ({ 
  children, 
  colors,
  style,
  variant = 'primary'
}) => {
  // Fallback to solid colors until LinearGradient is properly configured
  let backgroundColor = Colors.PRIMARY;
  
  if (!colors) {
    switch (variant) {
      case 'primary':
        backgroundColor = Colors.PRIMARY;
        break;
      case 'dark':
        backgroundColor = Colors.BACKGROUND;
        break;
      case 'surface':
        backgroundColor = Colors.SURFACE;
        break;
      default:
        backgroundColor = Colors.PRIMARY;
    }
  } else {
    // Use the first color if colors array is provided
    backgroundColor = colors[0] || Colors.PRIMARY;
  }

  return (
    <View 
      style={[styles.container, { backgroundColor }, style]}
    >
      {children}
    </View>
  );

  // TODO: Re-enable once LinearGradient native module is configured
  // return (
  //   <LinearGradient 
  //     colors={gradientColors || [Colors.PRIMARY, Colors.PRIMARY_END]}
  //     start={start}
  //     end={end}
  //     style={[styles.container, style]}
  //   >
  //     {children}
  //   </LinearGradient>
  // );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});