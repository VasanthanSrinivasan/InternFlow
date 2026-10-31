import { Loader2, ServerCrash } from "lucide-react";

// Loading -> shimmering skeleton (inline) or spinner (full page). Error -> friendly message.
// Pages render their content only when both are false.
export default function PageState({ loading, error, fullPage = false, onRetry }) {
  if (!loading && !error) return null;

  if (loading && !fullPage) {
    return (
      <div className="page-skeleton" role="status" aria-live="polite">
        <span className="sr-only">Loading...</span>
        <div className="skeleton-cards" aria-hidden="true">
          <i /><i /><i />
        </div>
        <div className="skeleton-table" aria-hidden="true">
          <b /><b /><b /><b />
        </div>
      </div>
    );
  }

  return (
    <div className={`page-state ${fullPage ? "page-state-full" : ""}`}>
      {loading ? (
        <>
          <div className="loader-orb" aria-hidden="true">
            <Loader2 className="spinner" size={30} />
          </div>
          <p>Loading...</p>
        </>
      ) : (
        <>
          <ServerCrash size={36} />
          <h3>Something went wrong</h3>
          <p>{error}</p>
          {onRetry && (
            <button className="primary-button" onClick={onRetry}>
              Try again
            </button>
          )}
        </>
      )}
    </div>
  );
}
