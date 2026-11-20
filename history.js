
import { getData } from "./storage.js";

export function renderHistory(container) {
  const data = getData();
  const campaign = data.campaign || {};
  const prospects = data.prospects || [];
  const missions = data.missions || [];
  const activities = data.activities || [];

  const startDate = campaign.startDate || "2026-11-20";
  const endDate = campaign.endDate || "2026-11-26";

  const targets = campaign.dailyTargets || [3, 7, 7, 8, 8, 8, 9];

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);

  const activatedStatuses = ["activated", "joined", "approved"];

  const parseDate = value => {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const dates = [];
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  for (
    let date = new Date(start), index = 0;
    date <= end && index < 60;
    date.setDate(date.getDate() + 1), index++
  ) {
    dates.push({
      date: [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
      ].join("-"),
      target: Number(targets[index] || 0)
    });
  }

  const totalActivated = prospects.filter(p =>
    activatedStatuses.includes(
      String(p.status || "").toLowerCase()
    )
  ).length;

  const dailyRecords = dates.map((day, index) => {
    const dayProspects = prospects.filter(p => {
      const joinedDate = p.activatedAt || p.joinedAt ||
        p.activationDate || p.firstContactDate;
      return joinedDate === day.date &&
        activatedStatuses.includes(String(p.status || "").toLowerCase());
    });

    const dayMission = missions.find(m => m.date === day.date);

    const missionCount = dayMission
      ? (dayMission.tasks || []).reduce(
          (sum, task) => sum + Number(task.completed || 0), 0
        )
      : 0;

    const dayActivities = activities.filter(a => a.date === day.date);

    const activityCount = dayActivities.reduce(
      (sum, activity) => sum + Number(activity.quantity || 0), 0
    );

    return {
      ...day,
      label: `Day ${index + 1}`,
      activated: dayProspects.length,
      missions: missionCount,
      activities: activityCount
    };
  });

  const campaignResults = dailyRecords.reduce(
    (sum, day) => sum + day.activated, 0
  );

  const completedDays = dailyRecords.filter(
    day => day.activated >= day.target && day.target > 0
  ).length;

  container.innerHTML = `
    <div class="page-heading">
      <div>
        <h2>Campaign History</h2>
        <p>Review your actual campaign records from start to finish.</p>
      </div>
      <button class="secondary-button" id="refresh-history">
        <i class="fa-solid fa-rotate"></i> Refresh
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Campaign activations</span>
        <strong>${totalActivated}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Target</span>
        <strong>${Number(campaign.totalTarget || 50)}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Days meeting target</span>
        <strong>${completedDays}/${dailyRecords.length}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Recorded daily results</span>
        <strong>${campaignResults}</strong>
      </div>
    </div>

    <div class="card">
      <h3>Daily campaign timeline</h3>
      <p class="text-secondary">
        Activations are counted using recorded activation dates.
        Prospects without an activation date are not assigned to a day.
      </p>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Campaign day</th>
              <th>Date</th>
              <th>Target</th>
              <th>Activated</th>
              <th>Activities</th>
              <th>Mission actions</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            ${dailyRecords.map(day => `
              <tr>
                <td>${day.label}</td>
                <td>${escapeHTML(day.date)}</td>
                <td>${day.target}</td>
                <td>${day.activated}</td>
                <td>${day.activities}</td>
                <td>${day.missions}</td>
                <td>
                  <span class="status-badge ${
                    day.activated >= day.target && day.target > 0
                      ? "status-success"
                      : "status-warning"
                  }">
                    ${
                      day.activated >= day.target && day.target > 0
                        ? "Target met"
                        : "Below target"
                    }
                  </span>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h3>Campaign review</h3>
      <p>
        Your overall activation record is
        <strong>${totalActivated}</strong> out of
        <strong>${Number(campaign.totalTarget || 50)}</strong>.
      </p>
      <p class="text-secondary">
        Keep genuine recruitment results separate from posts, messages,
        registrations and other activity counts.
      </p>
    </div>

    <div class="card">
      <h3>Campaign dates</h3>
      <p>Start: <strong>${escapeHTML(startDate)}</strong></p>
      <p>End: <strong>${escapeHTML(endDate)}</strong></p>
    </div>
  `;

  container.querySelector("#refresh-history")
    ?.addEventListener("click", () => renderHistory(container));
                    }
