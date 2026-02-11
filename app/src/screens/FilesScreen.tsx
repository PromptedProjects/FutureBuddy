import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import { listFiles, readFile, writeFile, mkdir, deleteFilePath, moveFile } from '../services/api';
import { colors } from '../theme/tokens';
import type { FileEntry } from '../types/api';

// No default — let the server return its home directory on first load
const DEFAULT_PATH = '';

function formatSize(bytes: number): string {
  if (bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

export default function FilesScreen() {
  const [currentPath, setCurrentPath] = useState(DEFAULT_PATH);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewPath, setPreviewPath] = useState<string | null>(null);

  const fetchDir = useCallback(async (dirPath: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const res = await listFiles(dirPath);
    if (res.ok) {
      setEntries(res.data.entries);
      setCurrentPath(res.data.path);
    } else {
      setError(res.error);
      setEntries([]);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDir(currentPath);
    }, []) // only on first focus
  );

  function navigateTo(dirPath: string) {
    setPreviewContent(null);
    setPreviewPath(null);
    fetchDir(dirPath);
  }

  function goUp() {
    const parent = currentPath.replace(/\\[^\\]+$/, '');
    // Don't go above drive root
    if (parent.length >= 2) {
      navigateTo(parent.endsWith('\\') ? parent : parent + '\\');
    }
  }

  async function copyPath(p: string) {
    await Clipboard.setStringAsync(p);
    Alert.alert('Copied', p);
  }

  async function handlePreview(entry: FileEntry) {
    setLoading(true);
    const res = await readFile(entry.path);
    setLoading(false);
    if (res.ok) {
      setPreviewContent(res.data.content);
      setPreviewPath(entry.path);
    } else {
      Alert.alert('Error', res.error);
    }
  }

  async function handleNewFile() {
    Alert.prompt?.('New File', 'Enter file name:', async (name) => {
      if (!name) return;
      const filePath = currentPath + '\\' + name;
      const res = await writeFile(filePath, '');
      if (res.ok) fetchDir(currentPath);
      else Alert.alert('Error', res.error);
    });
    // Fallback for Android (no Alert.prompt)
    if (!Alert.prompt) {
      const name = 'new-file.txt';
      const filePath = currentPath + '\\' + name;
      const res = await writeFile(filePath, '');
      if (res.ok) fetchDir(currentPath);
      else Alert.alert('Error', res.error);
    }
  }

  async function handleNewFolder() {
    Alert.prompt?.('New Folder', 'Enter folder name:', async (name) => {
      if (!name) return;
      const dirPath = currentPath + '\\' + name;
      const res = await mkdir(dirPath);
      if (res.ok) fetchDir(currentPath);
      else Alert.alert('Error', res.error);
    });
    if (!Alert.prompt) {
      const name = 'new-folder';
      const dirPath = currentPath + '\\' + name;
      const res = await mkdir(dirPath);
      if (res.ok) fetchDir(currentPath);
      else Alert.alert('Error', res.error);
    }
  }

  function handleDeleteEntry(entry: FileEntry) {
    Alert.alert(
      'Delete',
      `Delete "${entry.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await deleteFilePath(entry.path, entry.type);
            if (res.ok) fetchDir(currentPath);
            else Alert.alert('Error', res.error);
          },
        },
      ]
    );
  }

  function handleRenameEntry(entry: FileEntry) {
    Alert.prompt?.('Rename', `Rename "${entry.name}" to:`, async (newName) => {
      if (!newName) return;
      const parent = entry.path.replace(/\\[^\\]+$/, '');
      const dest = parent + '\\' + newName;
      const res = await moveFile(entry.path, dest);
      if (res.ok) fetchDir(currentPath);
      else Alert.alert('Error', res.error);
    }, 'plain-text', entry.name);
  }

  function handleTapEntry(entry: FileEntry) {
    if (entry.type === 'directory') {
      navigateTo(entry.path);
      return;
    }
    // File: show action sheet
    Alert.alert(entry.name, undefined, [
      { text: 'Copy Path', onPress: () => copyPath(entry.path) },
      { text: 'Preview', onPress: () => handlePreview(entry) },
      { text: 'Rename', onPress: () => handleRenameEntry(entry) },
      { text: 'Delete', onPress: () => handleDeleteEntry(entry), style: 'destructive' },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  // Breadcrumb segments from current path
  const segments = currentPath.split('\\').filter(Boolean);

  // Build path for segment index
  function pathForSegment(idx: number): string {
    const parts = segments.slice(0, idx + 1);
    // First part is drive letter like "C:", add trailing backslash for root
    if (parts.length === 1) return parts[0] + '\\';
    return parts.join('\\');
  }

  // Preview mode
  if (previewContent !== null && previewPath) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable onPress={() => { setPreviewContent(null); setPreviewPath(null); }} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color={colors.text} />
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>Preview</Text>
            <Pressable onPress={() => copyPath(previewPath)} style={styles.copyBtn}>
              <Feather name="copy" size={18} color={colors.accent} />
            </Pressable>
          </View>
          <Pressable onPress={() => copyPath(previewPath)} style={styles.pathBar}>
            <Text style={styles.pathText} numberOfLines={1}>{previewPath}</Text>
          </Pressable>
          <FlatList
            data={previewContent.split('\n')}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item, index }) => (
              <View style={styles.codeLine}>
                <Text style={styles.lineNum}>{index + 1}</Text>
                <Text style={styles.lineText}>{item}</Text>
              </View>
            )}
            contentContainerStyle={styles.previewScroll}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={goUp} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Files</Text>
          <View style={styles.headerActions}>
            <Pressable onPress={handleNewFile} style={styles.headerBtn}>
              <Feather name="file-plus" size={18} color={colors.accent} />
            </Pressable>
            <Pressable onPress={handleNewFolder} style={styles.headerBtn}>
              <Feather name="folder-plus" size={18} color={colors.accent} />
            </Pressable>
          </View>
        </View>

        {/* Path bar + breadcrumbs */}
        <Pressable onPress={() => copyPath(currentPath)} style={styles.pathBar}>
          <Text style={styles.pathText} numberOfLines={1}>{currentPath}</Text>
          <Feather name="copy" size={14} color={colors.textMuted} />
        </Pressable>

        <View style={styles.breadcrumbs}>
          {segments.map((seg, idx) => (
            <Pressable key={idx} onPress={() => navigateTo(pathForSegment(idx))}>
              <View style={styles.breadcrumbChip}>
                <Text style={[
                  styles.breadcrumbText,
                  idx === segments.length - 1 && { color: colors.accent },
                ]}>
                  {seg}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Feather name="alert-circle" size={32} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => fetchDir(currentPath)} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.path}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchDir(currentPath, true)}
                tintColor={colors.accent}
              />
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleTapEntry(item)}
                onLongPress={() => {
                  Alert.alert(item.name, undefined, [
                    { text: 'Copy Path', onPress: () => copyPath(item.path) },
                    { text: 'Rename', onPress: () => handleRenameEntry(item) },
                    { text: 'Delete', onPress: () => handleDeleteEntry(item), style: 'destructive' },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <Feather
                  name={item.type === 'directory' ? 'folder' : 'file-text'}
                  size={20}
                  color={item.type === 'directory' ? colors.accent : colors.textSecondary}
                />
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.rowMeta}>
                    {item.type === 'directory' ? 'Folder' : formatSize(item.size)}
                    {item.modified ? `  ${formatDate(item.modified)}` : ''}
                  </Text>
                </View>
                <Feather
                  name={item.type === 'directory' ? 'chevron-right' : 'more-vertical'}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Feather name="folder" size={32} color={colors.textMuted} />
                <Text style={styles.emptyText}>Empty directory</Text>
              </View>
            }
            contentContainerStyle={entries.length === 0 ? styles.emptyContainer : undefined}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 36, alignItems: 'flex-start' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { padding: 4 },
  copyBtn: { width: 36, alignItems: 'flex-end' },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  pathBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  pathText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  breadcrumbs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  breadcrumbChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.bgElevated,
    borderRadius: 6,
  },
  breadcrumbText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.bgElevated,
    borderRadius: 8,
  },
  retryText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.bgHover,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    color: colors.text,
    fontSize: 15,
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  // Preview styles
  previewScroll: {
    padding: 12,
  },
  codeLine: {
    flexDirection: 'row',
    gap: 12,
  },
  lineNum: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'monospace',
    width: 36,
    textAlign: 'right',
  },
  lineText: {
    color: colors.text,
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
  },
});
