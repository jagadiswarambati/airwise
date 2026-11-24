import { Disclosure } from '../../primitives/Disclosure';

export function PrivacyDisclosure() {
  return (
    <Disclosure title="Privacy & data protection" className="mb-4">
      <div className="text-xs text-muted">
        <p className="mb-2">
          <strong>Stays on this device: </strong>
          Your household profile is stored strictly in your browser's local storage.
          AirWise has no accounts, no cloud database, and no tracking scripts.
        </p>
        <p className="mb-2">
          <strong>What is sent: </strong>
          Coarse coordinates (~1 km resolution) are sent to Open-Meteo to retrieve hourly
          air quality forecasts. City search queries are sent to <code>/api/geocode</code>.
        </p>
        <p className="mb-2">
          <strong>AI advice generation: </strong>
          Optional AI plan personalization only sends non-identifying household
          attributes (such as age bands and heating fuel); no personal names or exact
          dates are ever sent.
        </p>
        <p className="mb-2">
          <strong>How to delete: </strong>
          You can permanently remove all stored profile data at any time from Settings or
          by clearing your browser site data.
        </p>
        <div className="flex-row-center flex-wrap gap-4 mt-2 font-semibold">
          <a href="#/privacy" className="aw-inline-link">
            Privacy Policy
          </a>
          <a href="#/terms" className="aw-inline-link">
            Terms of Use
          </a>
          <a href="#/about" className="aw-inline-link">
            About AirWise
          </a>
        </div>
      </div>
    </Disclosure>
  );
}
