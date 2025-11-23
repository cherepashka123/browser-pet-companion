import React from 'react';
import { NestArchiveItem, TabCategoryId } from '../../types';
import { removeFromNestArchive } from '../../utils/storage';
import { TAB_NESTS } from '../../utils/tabNests';

interface NestArchiveProps {
  items: NestArchiveItem[];
  onArchiveUpdate: () => Promise<void>;
}

export function NestArchive({ items, onArchiveUpdate }: NestArchiveProps) {
  async function handleWakeTab(item: NestArchiveItem) {
    try {
      await chrome.tabs.create({ url: item.url });
      await removeFromNestArchive(item.id);
      await onArchiveUpdate();
    } catch (error) {
      console.error('Error waking tab:', error);
      alert('Failed to open tab. Please try again.');
    }
  }

  async function handleRemoveFromNest(itemId: string) {
    await removeFromNestArchive(itemId);
    await onArchiveUpdate();
  }

  function formatTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'just now';
  }

  function getItemIcon(itemType: string): string {
    // Return icon class names instead of emojis
    return itemType;
  }

  if (items.length === 0) {
    return (
      <div className="nest-archive empty">
        <div className="empty-nest">
          <div className="empty-nest-icon"></div>
          <h2>Your Nest is Empty</h2>
          <p>Closed tabs will appear here, cozy and safe!</p>
        </div>
      </div>
    );
  }

  // Group items by category
  const groupedItems = new Map<TabCategoryId, NestArchiveItem[]>();
  TAB_NESTS.forEach(nest => groupedItems.set(nest.id, []));
  items.forEach(item => {
    const categoryId = item.categoryId || 'unsorted';
    const group = groupedItems.get(categoryId) || [];
    group.push(item);
    groupedItems.set(categoryId, group);
  });

  return (
    <div className="nest-archive">
      <div className="nest-header">
        <h2>Nest Archive</h2>
        <p className="nest-count">{items.length} {items.length === 1 ? 'item' : 'items'} resting</p>
      </div>
      
      {TAB_NESTS.map(nest => {
        const nestItems = groupedItems.get(nest.id) || [];
        if (nestItems.length === 0) return null;
        
        return (
          <div key={nest.id} className="archive-category-section">
            <div className="archive-category-header" style={{ borderLeftColor: nest.color }}>
              <div className="archive-category-icon" style={{ backgroundColor: `${nest.color}20`, color: nest.color }}>
                {nest.icon.charAt(0).toUpperCase()}
              </div>
              <h3>{nest.name}</h3>
              <span className="archive-category-count">{nestItems.length}</span>
            </div>
            <div className="nest-items">
              {nestItems.sort((a, b) => b.closedAt - a.closedAt).map((item) => (
                <div key={item.id} className="nest-item">
                  <div className="nest-item-icon"></div>
                  <div className="nest-item-content">
                    <div className="nest-item-title">{item.title || 'Untitled'}</div>
                    <div className="nest-item-domain">{item.domain}</div>
                    <div className="nest-item-time">Resting since {formatTimeAgo(item.closedAt)}</div>
                  </div>
                  <div className="nest-item-actions">
                    <button className="wake-button" onClick={() => handleWakeTab(item)} title="Wake tab">Wake</button>
                    <button className="remove-button" onClick={() => handleRemoveFromNest(item.id)} title="Remove from nest">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

