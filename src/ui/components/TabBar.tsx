export type AppTab = 'today' | 'indoor' | 'move' | 'impact' | 'community';

interface TabBarProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  isLowCostMode?: boolean;
}

export function TabBar({ currentTab, onTabChange, isLowCostMode }: TabBarProps) {
  const tabs: Array<{ id: AppTab; label: string; icon: string }> = [
    { id: 'today', label: 'Today', icon: '📅' },
    { id: 'indoor', label: 'Indoor', icon: '🏠' },
    { id: 'move', label: 'Move', icon: '🚗' },
    { id: 'impact', label: 'Impact', icon: '📊' },
    { id: 'community', label: 'Community', icon: '👥' },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-4)',
      }}
    >
      {isLowCostMode && (
        <div
          role="status"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '4px 10px',
            backgroundColor: '#e6f4ea',
            color: '#137333',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: 600,
            width: 'fit-content',
          }}
        >
          <span>🌱</span>
          <span>Low-Cost Protection Mode Active</span>
        </div>
      )}

      <div
        role="tablist"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          backgroundColor: 'var(--color-bg-secondary)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          gap: '2px',
        }}
      >
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                padding: '4px 2px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.75rem',
                backgroundColor: isActive ? 'var(--color-bg-surface)' : 'transparent',
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                minHeight: '44px',
                transition: 'background-color var(--transition-fast)',
              }}
            >
              <span aria-hidden="true" style={{ fontSize: '1rem' }}>{tab.icon}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
