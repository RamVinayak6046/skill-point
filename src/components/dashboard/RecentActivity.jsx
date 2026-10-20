function RecentActivity({ activities }) {
  const hasActivities = Array.isArray(activities) && activities.length > 0;

  return (
    <div className="dashboard-panel activity-panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">ACTIVITY</span>
          <h2>Recent Activity</h2>
        </div>
      </div>

      <div className="activity-list">
        {!hasActivities ? (
          <div style={{ padding: "28px 16px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
            No recent activity recorded yet. Take an assessment or complete an assignment to log progress.
          </div>
        ) : (
          activities.map((activity, index) => (
            <div className="activity-item" key={index}>
              <div className="activity-icon">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="3 8 7 12 13 4" />
                </svg>
              </div>

              <div className="activity-content">
                <strong>{activity.title}</strong>
                <span>{activity.time}</span>
              </div>

              <div className="activity-result">{activity.result}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RecentActivity;
