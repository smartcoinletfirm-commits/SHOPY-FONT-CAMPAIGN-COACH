
import {
  getData,
  addRecord,
  updateRecord
} from "./storage.js";

const DAILY_MISSIONS = [
  {
    id: "whatsapp",
    title: "Publish WhatsApp statuses",
    description: "Publish useful campaign information and opportunities.",
    target: 3,
    unit: "statuses"
  },
  {
    id: "facebook",
    title: "Create a Facebook post",
    description: "Publish an informative and engaging post.",
    target: 1,
    unit: "post"
  },
  {
    id: "tiktok",
    title: "Publish a TikTok video",
    description: "Create a short video explaining the opportunity.",
    target: 1,
    unit: "video"
  },
  {
    id: "reels",
    title: "Publish a Facebook Reel",
    description: "Share a short video to reach new people.",
    target: 1,
    unit: "reel"
  },
  {
    id: "outreach",
    title: "Direct prospect outreach",
    description: "Start genuine conversations with potential members.",
    target: 10,
    unit: "people"
  },
  {
    id: "followups",
    title: "Follow up with prospects",
    description: "Reconnect with people you previously contacted.",
    target: 3,
    unit: "follow-ups"
  }
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function getTodayRecord() {
  return getData().missions.find(item => item.date === today()) || null;
}

function getCompletion(mission, record) {
  return Number(record?.completed?.[mission.id] || 0);
}

function getTotals(record) {
  let completed = 0;
  let target = 0;

  DAILY_MISSIONS.forEach(mission => {
    completed += Math.min(
      getCompletion(mission, record),
      mission.target
    );
    target += mission.target;
  });

  return {
    completed,
    target,
    percentage: target
      ? Math.round((completed / target) * 100)
      : 0
  };
}

function saveMissionProgress(values) {
  const existing = getTodayRecord();

  if (existing) {
    return updateRecord("missions", existing.id, {
      completed: values,
      updatedAt: new Date().toISOString()
    });
  }

  return addRecord("missions", {
    date: today(),
    completed: values,
    createdAt: new Date().toISOString()
  });
}

function renderMissionCards(record) {
  return DAILY_MISSIONS.map(mission => {
    const value = getCompletion(mission, record);
    const complete = value >= mission.target;

    return `
      <div class="card mission-card" style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
          <div style="flex:1;">
            <h3 style="margin:0 0 7px;">${escapeHTML(mission.title)}</h3>
            <p class="muted" style="margin:0;">${escapeHTML(mission.description)}</p>
          </div>

          <span class="status-badge ${complete ? "status-success" : "status-warning"}">
            ${complete ? "Completed" : "In progress"}
          </span>
        </div>

        <div style="display:flex;align-items:center;gap:12px;margin-top:18px;">
          <button class="secondary-button" data-decrease="${mission.id}"
            ${value <= 0 ? "disabled" : ""}>−</button>

          <div style="flex:1;text-align:center;">
            <strong style="font-size:21px;">${value} / ${mission.target}</strong>
            <div class="muted" style="font-size:12px;">${escapeHTML(mission.unit)}</div>
          </div>

          <button class="primary-button" data-increase="${mission.id}"
            ${value >= mission.target ? "disabled" : ""}>+</button>
        </div>

        <div class="progress-track" style="margin-top:14px;">
          <div class="progress-fill"
            style="width:${Math.min(100, value / mission.target * 100)}%;">
          </div>
        </div>
      </div>
    `;
  }).join("");
}

export function renderMissions(container) {
  if (!container) return;

  const record = getTodayRecord();
  const totals = getTotals(record);

  container.innerHTML = `
    <section>
      <div class="card" style="margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap;">
          <div>
            <span class="status-badge status-success">DAILY MISSION PLAN</span>
            <h2 style="margin:12px 0 5px;">Today's missions</h2>
            <p class="muted">Small consistent actions build recruitment results.</p>
          </div>

          <div style="text-align:center;">
            <div style="font-size:35px;font-weight:800;color:#059669;">
              ${totals.percentage}%
            </div>
            <div class="muted">Task completion</div>
          </div>
        </div>

        <div class="progress-track" style="margin-top:18px;height:12px;">
          <div class="progress-fill" style="width:${totals.percentage}%;"></div>
        </div>

        <p style="margin-top:12px;">
          <strong>${totals.completed}</strong> of
          <strong>${totals.target}</strong> daily actions completed.
        </p>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <h3>Today's mission date</h3>
        <p class="muted">${today()}</p>
        <p class="muted">
          Your task completion percentage is separate from the number
          of members who actually activate.
        </p>
      </div>

      <div id="mission-list">
        ${renderMissionCards(record)}
      </div>

      <div class="card" style="margin-top:20px;">
        <h3>End-of-day review</h3>
        <p class="muted">
          Review your progress honestly. Incomplete missions remain incomplete;
          you can continue working on them through Recovery Mode.
        </p>

        <button class="secondary-button" id="mission-review-btn">
          Review today's progress
        </button>
      </div>

      <div id="mission-review"></div>
    </section>
  `;

  container.addEventListener("click", event => {
    const increase = event.target.closest("[data-increase]");
    const decrease = event.target.closest("[data-decrease]");

    if (!increase && !decrease) return;

    const missionId = increase?.dataset.increase || decrease?.dataset.decrease;
    const mission = DAILY_MISSIONS.find(item => item.id === missionId);

    if (!mission) return;

    const currentRecord = getTodayRecord();
    const completed = {
      ...(currentRecord?.completed || {})
    };

    const current = Number(completed[missionId] || 0);

    if (increase) {
      completed[missionId] = Math.min(mission.target, current + 1);
    } else {
      completed[missionId] = Math.max(0, current - 1);
    }

    try {
      saveMissionProgress(completed);
      renderMissions(container);
    } catch (error) {
      alert(error.message || "Could not save mission progress.");
    }
  });

  container.addEventListener("click", event => {
    if (!event.target.closest("#mission-review-btn")) return;

    const current = getTodayRecord();
    const progress = getTotals(current);

    const review = container.querySelector("#mission-review");

    review.innerHTML = `
      <div class="card" style="margin-top:18px;">
        <h3>Today's mission review</h3>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${progress.completed}</div>
            <div class="stat-label">Actions completed</div>
          </div>

          <div class="stat-card">
            <div class="stat-value">${progress.target - progress.completed}</div>
            <div class="stat-label">Actions remaining</div>
          </div>
        </div>

        <p style="margin-top:15px;">
          ${progress.percentage === 100
            ? "Excellent! You completed all your daily mission targets."
            : "You still have unfinished missions. Continue working on them or plan how to recover tomorrow."}
        </p>
      </div>
    `;

    review.scrollIntoView({ behavior: "smooth", block: "start" });
  });
    }
