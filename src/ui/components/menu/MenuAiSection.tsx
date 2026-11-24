interface MenuAiSectionProps {
  aiEnabled: boolean;
  isLlmAvailable: boolean;
  onUpdateAi: (enabled: boolean) => void;
}

export function MenuAiSection({
  aiEnabled,
  isLlmAvailable,
  onUpdateAi,
}: MenuAiSectionProps) {
  return (
    <section className="aw-menu-section" aria-label="AI Personalization">
      <h3 className="aw-menu-section-title">AI Assistance</h3>
      <div className="aw-toggle-row">
        <label
          htmlFor="ai-toggle"
          className={`aw-toggle-label ${isLlmAvailable ? 'cursor-pointer' : 'cursor-disabled'}`}
        >
          Personalise plan with AI
        </label>
        <input
          id="ai-toggle"
          type="checkbox"
          checked={aiEnabled && isLlmAvailable}
          disabled={!isLlmAvailable}
          onChange={(e) => onUpdateAi(e.target.checked)}
          className="checkbox-input"
        />
      </div>
      <p className="text-muted text-xs mt-1">
        Reorders approved actions to match routine windows. No location coordinates or health specifics
        are ever shared.
      </p>
      {!isLlmAvailable && (
        <span className="text-muted text-xs italic block mt-1">
          (AI service is currently not connected on this deployment)
        </span>
      )}
    </section>
  );
}
