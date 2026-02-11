import { useState, useRef, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, Pressable, Alert, Animated, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { colors } from '../theme/tokens';

interface TerminalInputProps {
  onSubmit: (text: string) => void;
  onTranscribe?: (uri: string) => Promise<string | null>;
  onFileSelected?: (uri: string, name: string) => void;
}

export default function TerminalInput({ onSubmit, onTranscribe, onFileSelected }: TerminalInputProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const animTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
    };
  }, []);

  const animateText = useCallback((fullText: string) => {
    let i = 0;
    setText('');
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    animTimerRef.current = setInterval(() => {
      i++;
      setText(fullText.slice(0, i));
      if (i >= fullText.length) {
        if (animTimerRef.current) clearInterval(animTimerRef.current);
        animTimerRef.current = null;
      }
    }, 20);
  }, []);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (animTimerRef.current) {
      clearInterval(animTimerRef.current);
      animTimerRef.current = null;
    }
    onSubmit(trimmed);
    setText('');
  }

  async function handleAttach() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onFileSelected?.(asset.uri, asset.name);
      }
    } catch {
      // user cancelled
    }
  }

  async function handleVoicePress() {
    if (isRecording) {
      setIsRecording(false);
      try {
        const recording = recordingRef.current;
        if (!recording) return;
        recordingRef.current = null;

        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        if (!uri) {
          Alert.alert('Recording error', 'No audio was captured.');
          return;
        }

        if (onTranscribe) {
          setIsTranscribing(true);
          try {
            const transcribed = await onTranscribe(uri);
            if (transcribed) {
              animateText(transcribed);
              inputRef.current?.focus();
            }
          } catch (err: any) {
            Alert.alert('Transcription error', err?.message ?? 'Failed to transcribe.');
          } finally {
            setIsTranscribing(false);
          }
        }
      } catch (err: any) {
        Alert.alert('Recording error', err?.message ?? 'Failed to stop recording.');
      }
      return;
    }

    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission needed', 'Microphone access is required for voice input.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err: any) {
      Alert.alert('Recording error', err?.message ?? 'Could not start recording.');
    }
  }

  const showSendButton = !!text.trim();

  return (
    <View style={styles.container}>
      <Pressable onPress={handleAttach} style={styles.btn}>
        <Feather name="paperclip" size={20} color={colors.textMuted} />
      </Pressable>

      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={(t) => {
            if (animTimerRef.current) {
              clearInterval(animTimerRef.current);
              animTimerRef.current = null;
            }
            setText(t);
          }}
          placeholder={
            isRecording ? 'Recording... tap to stop' :
            isTranscribing ? 'Transcribing...' :
            'Type a command...'
          }
          placeholderTextColor={isRecording ? colors.error : isTranscribing ? colors.accent : colors.textMuted}
          maxLength={5000}
          editable={!isRecording}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
        />
      </View>

      {showSendButton ? (
        <Pressable onPress={handleSend} style={styles.btn}>
          <Feather name="send" size={20} color={colors.accent} />
        </Pressable>
      ) : (
        <Pressable onPress={handleVoicePress} style={styles.voiceBtn} disabled={isTranscribing}>
          {isRecording ? (
            <Animated.View style={[styles.recordingCircle, { opacity: pulseAnim }]}>
              <View style={styles.recordingDot} />
            </Animated.View>
          ) : isTranscribing ? (
            <View style={[styles.voiceCircle, { backgroundColor: colors.textMuted }]}>
              <Feather name="loader" size={18} color="white" />
            </View>
          ) : (
            <View style={styles.voiceCircle}>
              <Feather name="mic" size={18} color="white" />
            </View>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'flex-end',
    gap: 4,
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 18,
    maxHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  btn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: 'white',
  },
});
