
import {
  getData,
  checkStorage
} from "./storage.js";

import { renderProspects } from "./prospects.js";
import { renderMissions } from "./missions.js";
import { renderActivities } from "./activities.js";
import { renderReminders } from "./reminders.js";
import { renderSocial } from "./social.js";
import { renderAnalytics } from "./analytics.js";
import { renderCoach } from "./coach.js";
import { renderChallenges } from "./challenges.js";
import { renderHistory } from "./history.js";
import { renderSettings } from "./settings.js";

const pageContainer = document.getElementById("page-container");
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");

const pageDetails = {
  dashboard: ["Dashboard", "Your First 50 campaign overview"],
  prospects: ["Prospects & Follow-ups", "Manage your recruitment pipeline"],
  missions: ["Daily Missions", "Complete your daily campaign activities"],
  activities: ["Activity Recorder", "Record your actual campaign work"],
  reminders: ["Reminders & Tasks", "Keep track of important follow-ups"],
  social: ["Social Media Tracker", "Monitor your social media performance"],
  analytics: ["Graphs & Statistics", "Measure your campaign performance"],
  coach: ["Campaign Coach", "Get practical campaign recommendations"],
  challenges: ["Problems & Challenges", "Identify obstacles and solutions"],
  history: ["Campaign History", "Review your daily campaign records"],
  settings: ["Settings & Backup", "Manage your campaign data"]
};

let currentPage = "dashboard";

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function getActivatedProspects(prospects) {
  return prospects.filter(p =>
    ["activated", "joined", "approved"].includes(
      String(p.status || "").toLowerCase()
    )
  );
}

function getDashboard() {
  const data = getData();
  const prospects = data.prospects || [];
  const activities = data.activities || [];
  const reminders = data.reminders || [];
  const missions = data.missions || [];
  const campaign = data.campaign || {};

  const today = new Date().toISOString().slice(0, 10);

  const activated = getActivatedProspects(prospects).length;
  const target = Number(campaign.totalTarget || 50);
  const progress = Math.min(100, (activated / target) * 100);

  const overdue = prospects.filter(p =>
    p.nextFollowUp &&
    p.nextFollowUp < today &&
    !["activated", "joined", "approved", "not interested"]
      .includes(String(p.status || "").toLowerCase())
  );

  const pendingReminders = reminders.filter(r =>
    r.date <= today && !r.completed
  );

  const todayActivities = activities.filter(a => a.date === today);

  const activityTotal = todayActivities.reduce(
    (sum, item) => sum + Number(item.quantity || 0), 0
  );

  const todayMission = missions.find(m => m.date === today);
  const missionTotal = todayMission
    ? (todayMission.tasks || []).reduce(
        (sum, task) => sum + Number(task.completed || 0), 0
      )
    : 0;

  const recentProspects = [...prospects]
    .sort((a, b) =>
      String(b.createdAt || b.firstContactDate || "")
        .localeCompare(String(a.createdAt || a.firstContactDate || ""))
    )
    .slice(0, 5);

  const recentActivities = [...activities]
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, 5);

  const storage = checkStorage();

  pageContainer.innerHTML = `
    <div class="page-heading">
      <div>
        <h2>Welcome to your campaign</h2>
        <p>Build genuine connections and work towards your first 50 activations.</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Total prospects</span>
        <strong>${prospects.length}</strong>
        <span class="text-secondary">People recorded</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Activated members</span>
        <strong>${activated}</strong>
        <span class="text-secondary">Confirmed activations</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Follow-ups overdue</span>
        <strong>${overdue.length}</strong>
        <span class="text-secondary">Need your attention</span>
      </div>

      <div class="stat-card">
        <span class="stat-label">Today's activities</span>
        <strong>${activityTotal}</strong>
        <span class="text-secondary">Recorded actions</span>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <h3>First 50 campaign progress</h3>
          <p class="text-secondary">Your genuine activation target</p>
        </div>
        <strong>${activated}/${target}</strong>
      </div>

      <div class="progress-track">
        <div class="progress-fill" style="width:${progress}%"></div>
      </div>

      <p class="text-secondary">
        ${Math.max(0, target - activated)} more confirmed activations needed.
      </p>
    </div>

    <div class="content-grid">
      <div class="card">
        <h3>Today's priorities</h3>

        <div class="alert ${
          overdue.length ? "alert-danger" : "alert-success"
        }">
          ${overdue.length
            ? `${overdue.length} prospect follow-up(s) overdue.`
            : "No overdue prospect follow-ups recorded."}
        </div>

        <div class="alert ${
          pendingReminders.length ? "alert-danger" : "alert-info"
        }">
          ${pendingReminders.length
            ? `${pendingReminders.length} reminder task(s) due or overdue.`
            : "No pending reminders due today."}
        </div>

        <p>Mission actions recorded today: <strong>${missionTotal}</strong></p>

        <button class="primary-button" data-go="missions">
          Open daily missions
        </button>
      </div>

      <div class="card">
        <h3>Quick actions</h3>
        <div class="quick-actions">
          <button class="primary-button" data-go="prospects">
            <i class="fa-solid fa-user-plus"></i> Add prospect
          </button>

          <button class="secondary-button" data-go="activities">
            <i class="fa-solid fa-clipboard-list"></i> Record activity
          </button>

          <button class="secondary-button" data-go="reminders">
            <i class="fa-solid fa-bell"></i> Add reminder
          </button>

          <button class="secondary-button" data-go="coach">
            <i class="fa-solid fa-brain"></i> Ask campaign coach
          </button>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="card">
        <div class="card-header">
          <h3>Recent prospects</h3>
          <button class="secondary-button" data-go="prospects">View all</button>
        </div>

        ${recentProspects.length
          ? recentProspects.map(p => `
            <div class="list-row">
              <div>
                <strong>${escapeHTML(p.name)}</strong>
                <p class="text-secondary">${escapeHTML(p.source || "Other")}</p>
              </div>
              <span class="status-badge status-info">
                ${escapeHTML(p.status || "New")}
              </span>
            </div>
          `).join("")
          : `<p class="text-secondary">No prospects recorded yet.</p>`
        }
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Recent activities</h3>
          <button class="secondary-button" data-go="activities">View all</button>
        </div>

        ${recentActivities.length
          ? recentActivities.map(a => `
            <div class="list-row">
              <div>
                <strong>${escapeHTML(a.type || "Activity")}</strong>
                <p class="text-secondary">${escapeHTML(a.date || "")}</p>
              </div>
              <strong>${Number(a.quantity || 0)}</strong>
            </div>
          `).join("")
          : `<p class="text-secondary">No activities recorded yet.</p>`
        }
      </div>
    </div>

    <div class="card">
      <h3>Data protection</h3>
      <p class="text-secondary">
        ${storage.available
          ? "Local browser storage is available. Remember to download regular backups."
          : "Browser storage may be unavailable. Your records may not save correctly."}
      </p>
      <button class="secondary-button" data-go="settings">
        Open settings and backup
      </button>
    </div>
  `;
}

const renderers = {
  dashboard: getDashboard,
  prospects: renderProspects,
  missions: renderMissions,
  activities: renderActivities,
  reminders: renderReminders,
  social: renderSocial,
  analytics: renderAnalytics,
  coach: renderCoach,
  challenges: renderChallenges,
  history: renderHistory,
  settings: renderSettings
};

function navigateTo(page) {
  if (!renderers[page] || !pageContainer) return;

  currentPage = page;

  const details = pageDetails[page];

  if (pageTitle) pageTitle.textContent = details[0];
  if (pageSubtitle) pageSubtitle.textContent = details[1];

  renderers[page](pageContainer);

  document.querySelectorAll("[data-page]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  document.getElementById("sidebar")?.classList.remove("open");

  const followUpCount = document.getElementById("followup-count");

  if (followUpCount) {
    const today = new Date().toISOString().slice(0, 10);
    const count = (getData().prospects || []).filter(p =>
      p.nextFollowUp &&
      p.nextFollowUp <= today &&
      !["activated", "joined", "approved", "not interested"]
        .includes(String(p.status || "").toLowerCase())
    ).length;

    followUpCount.textContent = count;
    followUpCount.style.display = count ? "" : "none";
  }
}

document.addEventListener("click", event => {
  const navButton = event.target.closest("[data-page]");
  const goButton = event.target.closest("[data-go]");

  if (navButton) {
    navigateTo(navButton.dataset.page);
  } else if (goButton) {
    navigateTo(goButton.dataset.go);
  }
});

document.getElementById("mobile-menu-btn")
  ?.addEventListener("click", () => {
    document.getElementById("sidebar")?.classList.toggle("open");
  });

document.getElementById("quick-record-btn")
  ?.addEventListener("click", () => navigateTo("activities"));

document.getElementById("notification-btn")
  ?.addEventListener("click", () => navigateTo("reminders"));

document.getElementById("lock-app-btn")
  ?.addEventListener("click", () => {
    alert(
      "This is a convenience lock placeholder, not secure account authentication."
    );
  });

navigateTo("dashboard");
