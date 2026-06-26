import HistoryView from '../history/HistoryView';
import AnalyticsDashboard from '../analytics/AnalyticsDashboard';

/**
 * Merged Progress tab: motivational calendar + monthly stats at top,
 * then strength/volume/muscle charts below. Stat cards are rendered
 * once (by HistoryView); AnalyticsDashboard renders in minimal mode
 * (charts only, no duplicate stat cards).
 */
export default function ProgressView() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <HistoryView />
      <div className="border-t border-line-sub pt-2">
        <AnalyticsDashboard minimal />
      </div>
    </div>
  );
}
