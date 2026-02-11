import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Btn from './Btn';
import { colors } from '../theme/tokens';

interface ManualPairInputProps {
  onSubmit: (host: string, token: string) => void;
  loading: boolean;
}

export default function ManualPairInput({ onSubmit, loading }: ManualPairInputProps) {
  const [host, setHost] = useState('');
  const [token, setToken] = useState('');

  const canSubmit = host.trim().length > 0 && token.trim().length > 0 && !loading;

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Enter the FutureBox host and pairing token manually.
      </Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Host (IP or tunnel URL)</Text>
        <TextInput
          style={styles.input}
          placeholder="192.168.1.x:3737 or https://..."
          placeholderTextColor={colors.textMuted}
          value={host}
          onChangeText={setHost}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Pairing Token</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste pairing token"
          placeholderTextColor={colors.textMuted}
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <Btn
        backgroundColor={canSubmit ? colors.accent : colors.bgElevated}
        color={canSubmit ? 'white' : colors.textMuted}
        disabled={!canSubmit}
        onPress={() => onSubmit(host.trim(), token.trim())}
        opacity={loading ? 0.7 : 1}
      >
        {loading ? 'Pairing...' : 'Pair'}
      </Btn>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    padding: 24,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  input: {
    backgroundColor: colors.bgElevated,
    color: colors.text,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
});
