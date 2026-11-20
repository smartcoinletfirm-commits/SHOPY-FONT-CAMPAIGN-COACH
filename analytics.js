
import { getData } from "./storage.js";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function format(value) {
  return Number(value || 0).toLocaleString();
}

function percentage(value, total) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function activated(person) {
  return ["activated", "joined", "approved"].includes(
    String(person.status || "").toLowerCase()
  );
}

function calculateAnalytics() {
  const data = getData();
  const prospects = data.prospects || [];
  const activities = data.activities || [];
  const social = data.socialRecords || [];
  const missions = data.missions || [];

  const totalProspects = prospects.length;
  const totalActivated = prospects.filter(activated).length;
  const target = Number(data.campaign.target || 50);

  const sourceGroups = {};

  prospects.forEach(person => {
    const source = person.source || "Unknown";
    if (!sourceGroups[source]) {
      sourceGroups[source] = { prospects: 0, activated: 0 };
    }

    sourceGroups[source].prospects++;

    if (activated(person)) {
      sourceGroups[source].activated++;
    }
  });

  const dailyGroups = {};

  activities.forEach(activity => {
    const date = activity.date || "Unknown";
    dailyGroups[date] = (dailyGroups[date] || 0) +
      Number(activity.quantity || 0);
  });

  const start = new Date(`${data.campaign.startDate}T00:00:00`);
  const end = new Date(`${data.campaign.endDate}T00:00:00`);

  const campaignDays = [];

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const key = date.toISOString().slice(0, 10);
    campaignDays.push({
      date: key,
      activityCount: dailyGroups[key] || 0
    });
  }

  const totalPosts = social.reduce(
    (sum, item) => sum + Number(item.posts || 0), 0
  );

  const totalViews = social.reduce(
    (sum, item) => sum + Number(item.views || 0), 0
  );

  const totalConversations = social.reduce(
    (sum, item) => sum + Number(item.conversations || 0), 0
  );

  const completedMissions = missions.reduce((sum, item) => {
    return sum + Object.values(item.completed || {})
      .reduce((a, value) => a + Number(value || 0), 0);
  }, 0);

  return {
    prospects,
    activities,
    social,
    missions,
    totalProspects,
    totalActivated,
    target,
    remaining: Math.max(0, target - totalActivated),
    progress: percentage(totalActivated, target),
    activationRate: percentage(totalActivated, totalProspects),
    sourceGroups,
    campaignDays,
    totalPosts,
    totalViews,
    totalConversations,
    completedMissions
  };
}

function renderSourceTable(groups) {
  const entries = Object.entries(groups)
    .sort((a, b) => b[1].prospects - a[1].prospects);

  if (!entries.length) {
    return `<p class="muted">No prospect source data recorded yet.</p>`;
  }

  return `
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Source</th>
            <th>Prospects</th>
            <th>Activated</th>
            <th>Conversion</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map(([source, values]) => `
            <tr>
              <td><strong>${esc(source)}</strong></td>
              <td>${values.prospects}</td>
              <td>${values.activated}</td>
              <td>${percentage(values.activated, values.prospects)}%</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderDailyProgress(days) {
  if (!days.length) return `<p class="muted">No campaign dates available.</p>`;

  const maximum = Math.max(1, ...days.map(day => day.activityCount));

  return `
    <div style="display:grid;gap:14px;">
      ${days.map(day => `
        <div>
          <div style="display:flex;justify-content:space-between;gap:10px;font-size:13px;margin-bottom:5px;">
            <strong>${esc(day.date)}</strong>
            <span>${day.activityCount} actions</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill"
              style="width:${Math.min(100, day.activityCount / maximum * 100)}%;">
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

export function renderAnalytics(container) {
  if (!container) return;

  const stats = calculateAnalytics();

  container.innerHTML = `
    <section>

      <div class="card" style="margin-bottom:22px;">
        <div class="card-header">
          <div>
            <h2>Campaign performance</h2>
            <p class="muted">Your recruitment results and activity statistics.</p>
          </div>
          <span class="status-badge status-success">First 50</span>
        </div>

        <div style="display:flex;align-items:center;gap:25px;flex-wrap:wrap;margin-top:20px;">
          <div style="font-size:48px;font-weight:800;color:#059669;">
            ${stats.progress}%
          </div>
          <div style="flex:1;min-width:180px;">
            <div style="font-size:18px;font-weight:700;">
              ${stats.totalActivated} of ${stats.target} activated
            </div>
            <p class="muted">${stats.remaining} more genuine activations needed.</p>
            <div class="progress-track" style="height:12px;">
              <div class="progress-fill" style="width:${stats.progress}%;"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="stats-grid" style="margin-bottom:22px;">
        <div class="stat-card">
          <div class="stat-value">${format(stats.totalProspects)}</div>
          <div class="stat-label">Total prospects</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${format(stats.totalActivated)}</div>
          <div class="stat-label">Activated members</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${stats.activationRate}%</div>
          <div class="stat-label">Prospect activation rate</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${format(stats.completedMissions)}</div>
          <div class="stat-label">Mission actions completed</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${format(stats.totalPosts)}</div>
          <div class="stat-label">Social posts recorded</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${format(stats.totalViews)}</div>
          <div class="stat-label">Social views recorded</div>
        </div>
      </div>

      <div class="content-grid" style="margin-bottom:22px;">
        <div class="card">
          <h3>Recruitment by source</h3>
          <p class="muted">See which channels are generating genuine prospects.</p>
          ${renderSourceTable(stats.sourceGroups)}
        </div>

        <div class="card">
          <h3>Social media results</h3>
          <div style="display:grid;gap:18px;margin-top:18px;">
            <div>
              <div class="muted">Posts recorded</div>
              <strong style="font-size:25px;">${format(stats.totalPosts)}</strong>
            </div>
            <div>
              <div class="muted">Views recorded</div>
              <strong style="font-size:25px;">${format(stats.totalViews)}</strong>
            </div>
            <div>
              <div class="muted">Conversations generated</div>
              <strong style="font-size:25px;">${format(stats.totalConversations)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Daily activity performance</h3>
        <p class="muted">Recorded actions for each campaign date.</p>
        <div style="margin-top:20px;">
          ${renderDailyProgress(stats.campaignDays)}
        </div>
      </div>

      <div class="card" style="margin-top:22px;">
        <h3>Understanding your statistics</h3>
        <ul style="line-height:2;padding-left:20px;">
          <li>Prospects are people recorded in your prospect list.</li>
          <li>Activated members are prospects marked activated, joined or approved.</li>
          <li>Activation rate is activated members divided by total prospects.</li>
          <li>Social views are recorded figures, not independently verified platform analytics.</li>
          <li>Mission completion measures work done, not recruitment success.</li>
        </ul>
      </div>

      <button class="secondary-button" id="refresh-analytics"
        style="margin-top:15px;">
        Refresh statistics
      </button>

    </section>
  `;

  container.querySelector("#refresh-analytics")
    .addEventListener("click", () => renderAnalytics(container));
      }
