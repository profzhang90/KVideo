import { useState, useCallback } from 'react';
import { useHistoryStore, usePremiumHistoryStore } from '@/lib/store/history-store';
import { useFavoritesStore, usePremiumFavoritesStore } from '@/lib/store/favorites-store';
import { settingsStore } from '@/lib/store/settings-store';
import { getProfileId } from '@/lib/store/auth-store';

export function useCloudSync(isPremium = false) {
  const [isSyncing, setIsSyncing] = useState(false);

  const historyStore = isPremium ? usePremiumHistoryStore : useHistoryStore;
  const favoritesStore = isPremium ? usePremiumFavoritesStore : useFavoritesStore;

  const pullFromCloud = useCallback(async () => {
    const profileId = getProfileId();
    if (!profileId) return;

    setIsSyncing(true);
    try {
      const response = await fetch('/api/user/sync', {
        headers: { 'x-profile-id': profileId }
      });
      const result = await response.json();

      if (result.success && result.data) {
        // 同步设置（视频源 / 订阅 / 弹幕API / 播放与界面偏好）
        if (result.data.settings && typeof result.data.settings === 'object') {
          settingsStore.saveSettings(result.data.settings);
        }
        if (result.data.history?.length > 0) {
          historyStore.getState().importHistory(result.data.history);
        }
        if (result.data.favorites?.length > 0) {
          favoritesStore.getState().importFavorites(result.data.favorites);
        }
      }
    } catch (error) {
      console.error('Failed to pull from cloud:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [historyStore, favoritesStore]);

  const pushToCloud = useCallback(async () => {
    const profileId = getProfileId();
    if (!profileId) return;

    setIsSyncing(true);
    try {
      const currentHistory = historyStore.getState().viewingHistory;
      const currentFavorites = favoritesStore.getState().favorites;
      const currentSettings = settingsStore.getSettings();

      await fetch('/api/user/sync', {
        method: 'POST',
        headers: { 
          'x-profile-id': profileId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          history: currentHistory,
          favorites: currentFavorites,
          settings: currentSettings
        })
      });
    } catch (error) {
      console.error('Failed to push to cloud:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [historyStore, favoritesStore]);

  return { pushToCloud, pullFromCloud, isSyncing };
}
