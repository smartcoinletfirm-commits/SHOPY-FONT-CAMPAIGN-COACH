
import {
  getData,
  saveData,
  checkStorage
} from "./storage.js";

const app = document.getElementById("app");
const pageContainer = document.getElementById("page-container");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");
const sidebarProgressBar = document.getElementById("sidebar-progress-bar");
const sidebarProgressText = document.getElementById("sidebar-progress-text");
const followupCount = document.getElementById("followup-count");

const pageDetails = {
  dashboard: ["Dashboard", "Your campaign at a glance"],
  prospects: ["Prospects & Follow-ups", "Manage people interested in joining"],
  missions: ["Daily Missions", "Complete your daily recruitment missions"],
  activities: ["Activity Recorder", "Record your campaign activities"],
  reminders: ["Reminders & Tasks", "Keep track of important follow-ups"],
  social: ["Social Media Tracker", "Track your social media performance"],
  analytics: ["Graphs & Statistics", "Understand your campaign results"],
  coach: ["Campaign Coach", "Get practical guidance for your next move"],
  challenges: ["Problems & Challenges", "Identify obstacles and take action"],
  history: ["Campaign History", "Review your campaign progress"],
  settings: ["Settings & Backup", "Manage your campaign data"]
};

let currentPage = "dashboard";

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function getCampaignStats() {
  const data = getData();
  const prospects = data.prospects || [];

  const activated = prospects.filter(person =>
    ["activated", "joined", "approved"].includes(
      String(person.status || "").toLowerCase()
    )
  ).length;

  const target = Number(data.campaign.target || 50);
  const percentage = target > 0
    ? Math.min(100, Math.round((activated / target) * 100))
    : 0;

  const today = new Date().toISOString().slice(0, 10);

  const overdue = prospects.filter(person => {
    if (!person.nextFollowUpDate) return false;

    const status = String(person.status || "").toLowerCase();
    const finished = ["activated", "joined", "approved", "rejected"].includes(status);

    return !finished && person.nextFollowUpDate < today;
  }).length;

  const interested = prospects.filter(person =>
    ["interested", "very interested", "hot"].includes(
      String(person.interest || person.interestLevel || "").toLowerCase()
    )
  ).length;

  return {
    prospects: prospects.length,
    activated,
    target,
    percentage,
    overdue,
    interested,
    remaining: Math.max(0, target - activated)
  };
}

function renderDashboard() {
  const data = getData();
  const stats = getCampaignStats();
  const campaign = data.campaign;

  const recentProspects = [...(data.prospects || [])]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  const recentActivities = [...(data.activities || [])]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5);

  return `
    <section class="dashboard-page">

      <div class="card" style="margin-bottom:22px;">
        <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:center;">
          <div>
            <span class="status-badge status-success">7-DAY CAMPAIGN</span>
            <h2 style="margin:12px 0 5px;">Your First 50 Journey</h2>
            <p class="muted">Build genuine connections. Follow up. Help people activate.</p>
            <p class="muted" style="margin-top:8px;">
              ${escapeHTML(campaign.startDate)} to ${escapeHTML(campaign.endDate)}
            </p>
          </div>
          <div style="text-align:center;min-width:110px;">
            <div style="font-size:38px;font-weight:800;color:#059669;">
              ${stats.percentage}%
            </div>
            <div class="muted">Campaign progress</div>
          </div>
        </div>

        <div class="progress-track" style="margin-top:20px;height:12px;">
          <div class="progress-fill" style="width:${stats.percentage}%;"></div>
        </div>

        <div style="display:flex;justify-content:space-between;gap:10px;margin-top:10px;font-size:13px;">
          <span><strong>${stats.activated}</strong> activated</span>
          <span>Target: <strong>${stats.target}</strong></span>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="color:#059669;">✓</div>
          <div class="stat-value">${formatNumber(stats.activated)}</div>
          <div class="stat-label">Activated members</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="color:#2563EB;">◎</div>
          <div class="stat-value">${formatNumber(stats.prospects)}</div>
          <div class="stat-label">Total prospects</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="color:#8B5CF6;">★</div>
          <div class="stat-value">${formatNumber(stats.interested)}</div>
          <div class="stat-label">Interested prospects</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="color:#DC2626;">!</div>
          <div class="stat-value">${formatNumber(stats.overdue)}</div>
          <div class="stat-label">Overdue follow-ups</div>
        </div>
      </div>

      <div class="content-grid" style="margin-top:22px;">
        <div class="card">
          <div class="card-header">
            <h3>Campaign target</h3>
            <span class="status-badge status-info">${stats.remaining} remaining</span>
          </div>
          <p class="muted">Your target is 50 genuinely activated members.</p>
          <div style="font-size:30px;font-weight:800;margin:18px 0;color:#059669;">
            ${stats.activated} / ${stats.target}
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${stats.percentage}%;"></div>
          </div>
          <button class="primary-button" data-go="prospects" style="margin-top:18px;">
            Manage prospects
          </button>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Today's focus</h3>
            <span class="status-badge status-purple">Daily action</span>
          </div>
          <ul style="padding-left:20px;line-height:2.1;margin:12px 0;">
            <li>Publish 3 WhatsApp statuses</li>
            <li>Make 1 Facebook post</li>
            <li>Publish 1 TikTok video</li>
            <li>Publish 1 Facebook Reel</li>
            <li>Contact 10 potential members</li>
            <li>Follow up with at least 3 people</li>
          </ul>
          <button class="secondary-button" data-go="missions">
            Open daily missions
          </button>
        </div>
      </div>

      <div class="content-grid" style="margin-top:22px;">
        <div class="card">
          <div class="card-header">
            <h3>Recent prospects</h3>
            <button class="secondary-button" data-go="prospects">View all</button>
          </div>

          ${recentProspects.length ? `
            <div class="table-responsive">
              <table>
                <thead>
                  <tr><th>Name</th><th>Interest</th><th>Status</th></tr>
                </thead>
                <tbody>
                  ${recentProspects.map(person => `
                    <tr>
                      <td>${escapeHTML(person.name || "Unnamed prospect")}</td>
                      <td>${escapeHTML(person.interest || person.interestLevel || "Not set")}</td>
                      <td>${escapeHTML(person.status || "New")}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="empty-state">
              <p>No prospects recorded yet.</p>
              <button class="primary-button" data-go="prospects">Add your first prospect</button>
            </div>
          `}
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Recent activities</h3>
            <button class="secondary-button" data-go="activities">View all</button>
          </div>

          ${recentActivities.length ? `
            <div style="display:grid;gap:12px;">
              ${recentActivities.map(activity => `
                <div style="padding:12px;border-bottom:1px solid #E2E8F0;">
                  <strong>${escapeHTML(activity.title || activity.type || "Activity")}</strong>
                  <div class="muted" style="font-size:12px;margin-top:5px;">
                    ${escapeHTML(activity.createdAt ? new Date(activity.createdAt).toLocaleString() : "")}
                  </div>
                </div>
              `).join("")}
            </div>
          ` : `
            <div class="empty-state">
              <p>Your recorded activities will appear here.</p>
              <button class="primary-button" data-go="activities">Record activity</button>
            </div>
          `}
        </div>
      </div>

      <div class="card" style="margin-top:22px;">
        <h3>Campaign Coach</h3>
        <p class="muted">Your next step is simple: build your prospect list, contact people genuinely, and follow up consistently.</p>
        <button class="purple-button" data-go="coach">Open Campaign Coach</button>
      </div>

    </section>
  `;
}

function renderPlaceholder(page) {
  const details = pageDetails[page] || ["Page", "Campaign workspace"];
  return `
    <div class="card">
      <h2>${escapeHTML(details[0])}</h2>
      <p class="muted">${escapeHTML(details[1])}</p>
      <div class="empty-state" style="padding:35px 10px;">
        <p>This section is being connected to your campaign workspace.</p>
        <p class="muted">Your saved campaign data remains stored in this browser.</p>
      </div>
    </div>
  `;
}

function updateProgress() {
  const stats = getCampaignStats();

  if (sidebarProgressBar) {
    sidebarProgressBar.style.width = `${stats.percentage}%`;
  }

  if (sidebarProgressText) {
    sidebarProgressText.textContent =
      `${stats.activated} of ${stats.target} activated`;
  }

  if (followupCount) {
    followupCount.textContent = String(stats.overdue);
    followupCount.style.display = stats.overdue ? "inline-flex" : "none";
  }
}

function navigateTo(page) {
  if (!pageDetails[page]) {
    page = "dashboard";
  }

  currentPage = page;

  const details = pageDetails[page];

  if (pageTitle) pageTitle.textContent = details[0];
  if (pageSubtitle) pageSubtitle.textContent = details[1];

  if (pageContainer) {
    pageContainer.innerHTML = page === "dashboard"
      ? renderDashboard()
      : renderPlaceholder(page);
  }

  document.querySelectorAll("[data-page]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  document.querySelector(".sidebar")?.classList.remove("open");

  updateProgress();
}

document.addEventListener("click", event => {
  const navigationButton = event.target.closest("[data-page]");
  const quickNavigation = event.target.closest("[data-go]");

  if (navigationButton) {
    navigateTo(navigationButton.dataset.page);
  }

  if (quickNavigation) {
    navigateTo(quickNavigation.dataset.go);
  }
});

document.getElementById("mobile-menu-btn")?.addEventListener("click", () => {
  document.querySelector(".sidebar")?.classList.toggle("open");
});

document.getElementById("quick-record-btn")?.addEventListener("click", () => {
  navigateTo("activities");
});

document.getElementById("lock-app-btn")?.addEventListener("click", () => {
  const confirmed = window.confirm(
    "Lock this campaign workspace on this device?"
  );

  if (confirmed) {
    const lockScreen = document.getElementById("lock-screen");
    const mainScreen = document.getElementById("main-screen");

    if (lockScreen) lockScreen.style.display = "flex";
    if (mainScreen) mainScreen.style.display = "none";

    const container = document.getElementById("lock-form-container");

    if (container) {
      container.innerHTML = `
        <div class="card">
          <h2>Workspace locked</h2>
          <p class="muted">This is a basic local convenience lock, not account security.</p>
          <button class="primary-button" id="unlock-workspace-btn">Unlock workspace</button>
        </div>
      `;

      document.getElementById("unlock-workspace-btn")?.addEventListener("click", () => {
        if (lockScreen) lockScreen.style.display = "none";
        if (mainScreen) mainScreen.style.display = "block";
        navigateTo(currentPage);
      });
    }
  }
});

const storageStatus = checkStorage();

if (!storageStatus.available) {
  console.warn(storageStatus.message);
}

if (app && pageContainer) {
  navigateTo("dashboard");
}

window.addEventListener("storage", () => {
  navigateTo(currentPage);
});
