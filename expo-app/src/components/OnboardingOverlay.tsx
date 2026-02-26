import React, { useState } from "react";
import {
    View,
    Text,
    Pressable,
    Dimensions,
    StyleSheet,
    SafeAreaView,
    Modal,
} from "react-native";
import Animated, {
    SlideInRight,
    SlideOutLeft,
} from "react-native-reanimated";
import { X, ChevronRight, Check } from "lucide-react-native";

const { width } = Dimensions.get("window");

export interface OnboardingStep {
    title: string;
    description: string;
    icon?: React.ReactNode;
}

interface OnboardingOverlayProps {
    steps: OnboardingStep[];
    onFinish: () => void;
    visible: boolean;
}

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({
    steps,
    onFinish,
    visible,
}) => {
    const [currentStep, setCurrentStep] = useState(0);

    if (!visible) return null;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            setCurrentStep(0); // Reset for next time
            onFinish();
        }
    };

    const handleSkip = () => {
        setCurrentStep(0);
        onFinish();
    };

    const step = steps[currentStep];
    const progress = (currentStep + 1) / steps.length;

    return (
        <Modal visible={visible} animationType="fade" transparent={false}>
            <View className="flex-1 bg-white dark:bg-slate-950 items-center">
                <SafeAreaView className="flex-1 w-full max-w-[500px]">
                    <View className="flex-1 px-8 py-10 justify-between">
                        {/* Header */}
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row flex-1">
                                {steps.map((_, i) => (
                                    <View
                                        key={i}
                                        className={`h-1 rounded-full mr-1 flex-1 ${i <= currentStep ? "bg-indigo-600" : "bg-slate-100 dark:bg-slate-800"
                                            }`}
                                    />
                                ))}
                            </View>
                            <Pressable onPress={handleSkip} hitSlop={20} className="ml-4">
                                <X size={24} color="#94a3b8" />
                            </Pressable>
                        </View>


                        {/* Content */}
                        <View className="flex-1 justify-center items-center">
                            <Animated.View
                                key={currentStep}
                                entering={SlideInRight.duration(400)}
                                exiting={SlideOutLeft.duration(400)}
                                className="items-center"
                            >
                                <View className="bg-indigo-50 dark:bg-indigo-900/30 w-32 h-32 rounded-full items-center justify-center mb-10 shadow-sm self-center">
                                    {step.icon || <ChevronRight size={64} color="#4f46e5" />}
                                </View>

                                <Text className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-4 leading-tight">
                                    {step.title}
                                </Text>

                                <Text className="text-lg text-slate-600 dark:text-slate-400 text-center leading-7 px-4">
                                    {step.description}
                                </Text>
                            </Animated.View>
                        </View>

                        {/* Footer */}
                        <View className="flex-row items-center justify-between mt-10">
                            <Pressable onPress={handleSkip}>
                                <Text className="text-slate-400 font-semibold text-base px-2">Skip</Text>
                            </Pressable>

                            <Pressable
                                onPress={handleNext}
                                className="bg-indigo-600 px-10 py-5 rounded-3xl flex-row items-center shadow-lg"
                                style={({ pressed }) => ({
                                    opacity: pressed ? 0.9 : 1,
                                    transform: [{ scale: pressed ? 0.98 : 1 }],
                                })}
                            >
                                <Text className="text-white font-bold text-lg mr-2">
                                    {currentStep === steps.length - 1 ? "Start Learning" : "Next"}
                                </Text>
                                {currentStep === steps.length - 1 ? (
                                    <Check size={20} color="#fff" strokeWidth={3} />
                                ) : (
                                    <ChevronRight size={20} color="#fff" strokeWidth={3} />
                                )}
                            </Pressable>
                        </View>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        zIndex: 1000,
    },
});
