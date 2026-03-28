import { useState, useRef, useCallback, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Alert,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated"
import { useAppTheme } from "@/theme/context"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"

type Props = AppStackScreenProps<"Crop">

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")
const DEFAULT_CIRCLE_SIZE = SCREEN_WIDTH * 0.6
const MIN_CIRCLE_SIZE = 100
const MAX_CIRCLE_SIZE = SCREEN_WIDTH * 0.9
const HANDLE_SIZE = 28

export function CropScreen({ navigation, route }: Props) {
  const { themed } = useAppTheme()
  const { imageUri, mode, images, currentIndex } = route.params

  // Image dimensions for display calculation
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0, x: 0, y: 0 })
  
  // Circle position and size (center of screen initially)
  const circleX = useSharedValue(SCREEN_WIDTH / 2)
  const circleY = useSharedValue(SCREEN_HEIGHT / 2)
  const circleSize = useSharedValue(DEFAULT_CIRCLE_SIZE)

  // Track if we've initialized position
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current && imageLayout.width > 0) {
      initialized.current = true
      // Initialize circle at center of image area
      circleX.value = imageLayout.x + imageLayout.width / 2
      circleY.value = imageLayout.y + imageLayout.height / 2
    }
  }, [imageLayout])

  // Pan gesture for moving the circle
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      circleX.value = event.absoluteX
      circleY.value = event.absoluteY
    })
    .onEnd(() => {
      // Clamp to screen bounds
      const halfSize = circleSize.value / 2
      const clampedX = Math.max(halfSize + 60, Math.min(SCREEN_WIDTH - halfSize - 60, circleX.value))
      const clampedY = Math.max(halfSize + 100, Math.min(SCREEN_HEIGHT - halfSize - 120, circleY.value))
      circleX.value = withSpring(clampedX)
      circleY.value = withSpring(clampedY)
    })

  // Pinch gesture for resizing
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newSize = DEFAULT_CIRCLE_SIZE * event.scale
      circleSize.value = Math.max(MIN_CIRCLE_SIZE, Math.min(MAX_CIRCLE_SIZE, newSize))
    })
    .onEnd(() => {
      circleSize.value = withSpring(circleSize.value)
    })

  // Combined gesture
  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture)

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: circleX.value - circleSize.value / 2 },
      { translateY: circleY.value - circleSize.value / 2 },
    ],
    width: circleSize.value,
    height: circleSize.value,
  }))

  const handleImageLayout = (event: { nativeEvent: { layout: { x: number; y: number; width: number; height: number } } }) => {
    const { x, y, width, height } = event.nativeEvent.layout
    setImageLayout({ x, y, width, height })
  }

  const handleDone = () => {
    if (mode === "single") {
      // Return single result
      // @ts-ignore - passing back to previous screen
      navigation.navigate("ItemEditor", { capturedImage: imageUri })
    } else if (mode === "multi" && images && currentIndex !== undefined) {
      // Store result and move to next
      const croppedResults = (route.params as any).croppedResults || []
      croppedResults.push(imageUri)
      
      const nextIndex = currentIndex + 1
      if (nextIndex < images.length) {
        navigation.replace("Crop", {
          imageUri: images[nextIndex],
          mode: "multi",
          images: images,
          currentIndex: nextIndex,
          croppedResults: croppedResults,
        })
      } else {
        // All done
        // @ts-ignore
        navigation.navigate("ItemEditor", { capturedImages: croppedResults })
      }
    }
  }

  const handleCancel = () => {
    navigation.goBack()
  }

  return (
    <View style={themed($container)}>
      <StatusBar hidden />
      
      {/* Header */}
      <View style={themed($header)}>
        <TouchableOpacity onPress={handleCancel} style={themed($headerButton)}>
          <Text style={themed($cancelText)}>Cancel</Text>
        </TouchableOpacity>
        
        <Text style={themed($headerTitle)}>
          {mode === "multi" && images && currentIndex !== undefined
            ? `Crop ${currentIndex + 1} of ${images.length}`
            : "Crop Image"}
        </Text>
        
        <TouchableOpacity onPress={handleDone} style={themed($headerButton)}>
          <Text style={themed($doneText)}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Image with overlay */}
      <View style={themed($imageContainer)} onLayout={handleImageLayout}>
        <Image
          source={{ uri: imageUri }}
          style={themed($image)}
          resizeMode="contain"
        />
        
        {/* Circle overlay */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[themed($circleOverlay), animatedCircleStyle]}>
            <View style={themed($circleBorder)}>
              {/* Corner handles */}
              <View style={[themed($handle), themed($handleNW)]} />
              <View style={[themed($handle), themed($handleNE)]} />
              <View style={[themed($handle), themed($handleSW)]} />
              <View style={[themed($handle), themed($handleSE)]} />
            </View>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Instructions */}
      <View style={themed($instructions)}>
        <Text style={themed($instructionsText)}>Drag to move • Pinch to resize</Text>
      </View>
    </View>
  )
}

const $container: ViewStyle = {
  flex: 1,
  backgroundColor: "black",
}

const $header: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: 48,
  paddingBottom: 12,
  paddingHorizontal: 16,
}

const $headerButton: ViewStyle = {
  padding: 8,
  minWidth: 60,
}

const $cancelText: TextStyle = {
  fontSize: 16,
  color: "white",
}

const $headerTitle: TextStyle = {
  fontSize: 18,
  fontWeight: "600",
  color: "white",
}

const $doneText: TextStyle = {
  fontSize: 16,
  color: "#007AFF",
  fontWeight: "600",
  textAlign: "right",
}

const $imageContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
}

const $image: ImageStyle = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT - 200,
}

const $circleOverlay: ViewStyle = {
  position: "absolute",
  borderRadius: 9999,
  backgroundColor: "transparent",
}

const $circleBorder: ViewStyle = {
  flex: 1,
  borderWidth: 2,
  borderColor: "white",
  borderRadius: 9999,
  position: "relative",
}

const $handle: ViewStyle = {
  position: "absolute",
  width: HANDLE_SIZE,
  height: HANDLE_SIZE,
  backgroundColor: "white",
  borderRadius: HANDLE_SIZE / 2,
  borderWidth: 2,
  borderColor: "#333",
}

const $handleNW: ViewStyle = {
  top: -HANDLE_SIZE / 2,
  left: -HANDLE_SIZE / 2,
}

const $handleNE: ViewStyle = {
  top: -HANDLE_SIZE / 2,
  right: -HANDLE_SIZE / 2,
}

const $handleSW: ViewStyle = {
  bottom: -HANDLE_SIZE / 2,
  left: -HANDLE_SIZE / 2,
}

const $handleSE: ViewStyle = {
  bottom: -HANDLE_SIZE / 2,
  right: -HANDLE_SIZE / 2,
}

const $instructions: ViewStyle = {
  position: "absolute",
  bottom: 40,
  left: 0,
  right: 0,
  alignItems: "center",
}

const $instructionsText: TextStyle = {
  fontSize: 14,
  color: "white",
  opacity: 0.8,
}