interface MenuPresetsSectionProps {
  onLoadPriya: () => void;
  onClose: () => void;
}

export function MenuPresetsSection({ onLoadPriya, onClose }: MenuPresetsSectionProps) {
  return (
    <section className="aw-menu-section" aria-label="Testing Presets">
      <h3 className="aw-menu-section-title">Evaluation Presets</h3>
      <p className="text-muted text-xs mb-2">
        Load standard testing household (3-member multi-generational family: asthmatic child, elder,
        low budget, no purifier).
      </p>
      <button
        type="button"
        className="aw-btn aw-btn-secondary w-full"
        onClick={() => {
          onLoadPriya();
          onClose();
        }}
        aria-label="Load demo household preset: 3-member family"
      >
        Load demo household preset
      </button>
    </section>
  );
}
