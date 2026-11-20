
import { getData } from "./storage.js";

export function renderCoach(container) {
  const data = getData();
  const today = new Date().toISOString().slice(0, 10);

  const prospects = data.prospects || [];
  const missions = data.missions || [];
  const activities = data.activities || [];
  const reminders = data.reminders || [];
  const campaign = data.campaign || {};

  const activated = prospects.filter(p =>
    ["activated", "joined", "approved"].includes(
      String(p.status || "").toLowerCase()
    )
  ).length;

  const target = Number(campaign.totalTarget || 50);
  const remaining = Math.max(0, target - activated);

  const start = new Date(campaign.startDate || "2026-11-20");
  const end = new Date(campaign.endDate || "2026-11-26");
  const now = new Date(today + "T12:00:00");

  const daysLeft = Math.max(
    0,
    Math.ceil((end - now) / 86400000) + 1
  );

  const overdue = prospects.filter(p =>
    p.nextFollowUp &&
    p.nextFollowUp < today &&
    !["activated", "joined", "approved", "not interested"]
      .includes(String(p.status || "").toLowerCase())
  );

  const interested = prospects.filter(p =>
    ["interested", "following up"].includes(
      String(p.status || "").toLowerCase()
    )
  );

  const pendingTasks = reminders.filter(r =>
    r.date < today && !r.completed
  );

  const dailyMission = missions.find(m => m.date === today);
  const missionDone = dailyMission
    ? (dailyMission.tasks || []).reduce(
        (sum, task) => sum + Number(task.completed || 0), 0
      )
    : 0;

  const dailyTarget = Number(
    campaign.dailyTargets?.[
      Math.max(0, Math.floor((now - start) / 86400000))
    ] || 0
  );

  const averageNeeded = daysLeft > 0
    ? Math.ceil(remaining / daysLeft)
    : remaining;

  const advice = [];

  if (remaining === 0) {
    advice.push({
      type: "success",
      title: "Campaign target reached",
      text: "You have recorded your target of 50 activated members. Focus on verifying records and supporting new members."
    });
  } else if (daysLeft === 0) {
    advice.push({
      type: "danger",
      title: "Campaign deadline reached",
      text: `${remaining} activations remain. Review your campaign honestly and record the actual outcome.`
    });
  } else {
    advice.push({
      type: "info",
      title: "Your daily recruitment pace",
      text: `You need approximately ${averageNeeded} genuine activations per remaining campaign day to reach your target.`
    });
  }

  if (overdue.length > 0) {
    advice.push({
      type: "danger",
      title: "Follow-ups need attention",
      text: `${overdue.length} prospect(s) have overdue follow-ups. Contact interested prospects first and update their next follow-up dates.`
    });
  }

  if (interested.length > 0) {
    advice.push({
      type: "success",
      title: "Work on warm prospects",
      text: `You have ${interested.length} interested or following-up prospects. Give them clear information and answer their questions without pressuring them.`
    });
  }

  if (pendingTasks.length > 0) {
    advice.push({
      type: "danger",
      title: "Overdue personal tasks",
      text: `${pendingTasks.length} reminder task(s) are overdue. Reschedule or complete them so important work is not forgotten.`
    });
  }

  if (missionDone === 0) {
    advice.push({
      type: "warning",
      title: "Start today's missions",
      text: "No mission activity has been recorded for today. Begin with WhatsApp status updates and direct conversations."
    });
  }

  const sourceCounts = {};
  prospects.forEach(p => {
    const source = p.source || "Other";
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });

  const bestSource = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])[0];

  if (bestSource) {
    advice.push({
      type: "purple",
      title: "Your strongest recorded source",
      text: `${bestSource[0]} has generated ${bestSource[1]} prospect(s). Continue testing this channel and compare how many eventually activate.`
    });
  }

  if (advice.length === 0) {
    advice.push({
      type: "info",
      title: "Build your campaign records",
      text: "Add prospects and record your daily activities. Your coach will use those records to provide more useful recommendations."
    });
  }

  const typeClass = {
    success: "status-success",
    danger: "status-danger",
    warning: "status-warning",
    info: "status-info",
    purple: "status-purple"
  };

  container.innerHTML = `
    <div class="page-heading">
      <div>
        <h2>Campaign Coach</h2>
        <p>Practical guidance based on your recorded campaign progress.</p>
      </div>
      <button class="primary-button" id="refresh-coach">
        <i class="fa-solid fa-rotate"></i> Refresh advice
      </button>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Activated members</span>
        <strong>${activated}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Still needed</span>
        <strong>${remaining}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Days remaining</span>
        <strong>${daysLeft}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Daily pace needed</span>
        <strong>${averageNeeded}</strong>
      </div>
    </div>

    <div class="card ai-coach-card">
      <div class="card-header">
        <div>
          <span class="status-badge status-purple">PERSONAL CAMPAIGN REVIEW</span>
          <h3>Your campaign assessment</h3>
        </div>
        <i class="fa-solid fa-brain"></i>
      </div>
      <p>
        These recommendations are generated from your saved records.
        They are not a live AI service, and missing data may affect the advice.
      </p>
    </div>

    <div class="content-grid">
      ${advice.map(item => `
        <div class="card">
          <div class="card-header">
            <h3>${item.title}</h3>
            <span class="status-badge ${typeClass[item.type]}">
              ${item.type.toUpperCase()}
            </span>
          </div>
          <p>${item.text}</p>
        </div>
      `).join("")}
    </div>

    <div class="card">
      <h3>Recommended action plan for today</h3>
      <ol>
        <li>Follow up with overdue prospects.</li>
        <li>Contact at least 10 genuine potential members.</li>
        <li>Publish 3 WhatsApp statuses.</li>
        <li>Publish 1 Facebook post and 1 Facebook Reel.</li>
        <li>Publish 1 TikTok video.</li>
        <li>Record conversations, responses and actual activations.</li>
      </ol>
      <p class="text-secondary">
        Record only activities you actually complete. Never count registrations
        as activations until membership is confirmed.
      </p>
    </div>
  `;

  container.querySelector("#refresh-coach")
    ?.addEventListener("click", () => renderCoach(container));
  }
