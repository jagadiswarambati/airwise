import { Icon } from '../../icons';

export function ImpactOverviewBanner() {
  return (
    <section className="card card-callout-primary mb-4" aria-labelledby="dual-axis-title">
      <h2 id="dual-axis-title" className="screen-section-title">
        <Icon name="chart" size={22} aria-hidden="true" />
        <span>Dual-Axis Impact</span>
      </h2>
      <p className="dual-axis-desc mb-3">
        AirWise tracks <strong>Exposure</strong> and <strong>Emissions</strong> on separate axes.
        Protecting yourself from dirty air does not clean the outdoors, and lowering vehicle
        emissions does not instantly lower ambient pollution outside your window.
      </p>

      <div className="dual-axis-overview-grid">
        <div className="box-highlight-exposure">
          <strong className="text-exposure block mb-1">
            <Icon name="protect" size={16} aria-hidden="true" /> Exposure Axis
          </strong>
          <span className="text-main text-xs">
            What you and your family inhale. Focuses on filtration, scheduling, and indoor
            sanctuaries.
          </span>
        </div>

        <div className="box-highlight-emissions">
          <strong className="text-emissions block mb-1">
            <Icon name="emissions" size={16} aria-hidden="true" /> Emissions Axis
          </strong>
          <span className="text-main text-xs">
            What your household emits. Focuses on vehicle trips avoided, carpooling, and
            anti-idling.
          </span>
        </div>
      </div>
    </section>
  );
}
