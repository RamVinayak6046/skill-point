import { useNavigate } from "react-router-dom";

function DevelopmentPlan({ plans }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-panel development-panel">

      <div className="panel-header">

        <div>
          <span className="eyebrow">
            PERSONALIZED PLAN
          </span>

          <h2>
            Development Plan
          </h2>
        </div>

        <button
          className="text-button"
          onClick={() => navigate("/learning")}
        >
          View full plan →
        </button>

      </div>

      <div className="plan-list">

        {plans.map((plan) => (

          <div
            className="plan-item"
            key={plan.id}
          >

            <div className="plan-number">
              {String(plan.id).padStart(2, "0")}
            </div>

            <div className="plan-main">

              <div className="plan-title-row">

                <div>
                  <strong>
                    {plan.title}
                  </strong>

                  <span>
                    {plan.category}
                  </span>
                </div>

                <span
                  className={`plan-status ${
                    plan.status === "Upcoming"
                      ? "upcoming"
                      : ""
                  }`}
                >
                  {plan.status}
                </span>

              </div>

              <div className="plan-progress">

                <div className="plan-track">

                  <div
                    className="plan-fill"
                    style={{
                      width: `${plan.progress}%`,
                    }}
                  />

                </div>

                <span>
                  {plan.progress}%
                </span>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}

export default DevelopmentPlan;