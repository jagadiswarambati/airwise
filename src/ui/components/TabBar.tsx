import { Icon, IconName } from '../icons';

export type AppTab = 'today' | 'indoor' | 'move' | 'impact' | 'community';

interface TabBarProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  isLowCostMode?: boolean;
}

export function TabBar({ currentTab, onTabChange, isLowCostMode }: TabBarProps) {
  const tabs: Array<{ id: AppTab; label: string; icon: IconName }> = [
    { id: 'today', label: 'Today', icon: 'clear' },
    { id: 'indoor', label: 'Indoor', icon: 'home' },
    { id: 'move', label: 'Move', icon: 'car' },
    { id: 'impact', label: 'Impact', icon: 'chart' },
    { id: 'community', label: 'Community', icon: 'people' },
  ];

  return (
    <nav aria-label="Main Navigation" className="tab-bar-nav">
      {isLowCostMode && (
        <div role="status" className="tab-bar-status">
          <Icon name="emissions" size={16} aria-hidden="true" />
          <span>Low-Cost Protection Mode Active</span>
        </div>
      )}

      <div role="tablist" className="tab-bar-list">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              className={`tab-bar-button ${isActive ? 'tab-bar-button-active' : 'tab-bar-button-inactive'}`}
            >
              <Icon name={tab.icon} size={18} aria-hidden="true" />
              <span className="tab-bar-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
