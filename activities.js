
import {
  getData,
  addRecord,
  deleteRecord
} from "./storage.js";

const ACTIVITY_TYPES = [
  "WhatsApp Status",
  "WhatsApp Direct Message",
  "WhatsApp Conversation",
  "Facebook Post",
  "Facebook Group Post",
  "Facebook Comment",
  "Facebook Reel",
  "TikTok Video",
  "Direct Outreach",
  "Phone Call",
  "Referral",
  "Prospect Follow-up",
  "Meeting",
  "Other"
];

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function activities() {
  return getData().activities || [];
}

function renderRecords(records) {
  if (!records.length) {
    return `
      <div class="empty-state">
        <h3>No activities recorded</h3>
        <p>Record your first campaign activity above.</p>
      </div>
    `;
  }

  return `
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Activity</th>
            <th>Quantity</th>
            <th>Notes</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(item => `
            <tr>
              <td>${esc(item.date)}</td>
              <td><strong>${esc(item.type)}</strong></td>
              <td>${esc(item.quantity)}</td>
              <td>${esc(item.notes || "—")}</td>
              <td>
                <button class="danger-button"
                  data-delete-activity="${esc(item.id)}">
                  Delete
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function calculateStats(records) {
  const total = records.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const todayRecords = records.filter(item => item.date === today());

  const todayTotal = todayRecords.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  return { total, todayTotal, todayCount: todayRecords.length };
}

export function renderActivities(container) {
  if (!container) return;

  const records = activities();
  const stats = calculateStats(records);

  container.innerHTML = `
    <section>

      <div class="stats-grid" style="margin-bottom:20px;">
        <div class="stat-card">
          <div class="stat-value">${stats.todayTotal}</div>
          <div class="stat-label">Today's actions</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${stats.todayCount}</div>
          <div class="stat-label">Today's records</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">All recorded actions</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:22px;">
        <div class="card-header">
          <h3>Record a campaign activity</h3>
          <span class="status-badge status-success">Auto-save</span>
        </div>

        <form id="activity-form">

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:15px;">

            <label>
              <span class="form-label">Activity type *</span>
              <select class="form-control" name="type" required>
                ${ACTIVITY_TYPES.map(type =>
                  `<option value="${esc(type)}">${esc(type)}</option>`
                ).join("")}
              </select>
            </label>

            <label>
              <span class="form-label">Quantity *</span>
              <input class="form-control" type="number"
                name="quantity" min="1" max="10000"
                value="1" required>
            </label>

            <label>
              <span class="form-label">Activity date *</span>
              <input class="form-control" type="date"
                name="date" value="${today()}" required>
            </label>

            <label>
              <span class="form-label">Related prospect (optional)</span>
              <select class="form-control" name="prospectId">
                <option value="">No specific prospect</option>
                ${getData().prospects.map(person => `
                  <option value="${esc(person.id)}">
                    ${esc(person.name)}
                  </option>
                `).join("")}
              </select>
            </label>

          </div>

          <label style="display:block;margin-top:15px;">
            <span class="form-label">Notes</span>
            <textarea class="form-control" name="notes" rows="3"
              maxlength="1000"
              placeholder="What did you do? What was the outcome?"></textarea>
          </label>

          <button class="primary-button" type="submit"
            style="margin-top:16px;">
            Save activity
          </button>

        </form>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Activity history</h3>
          <span class="status-badge status-info">
            ${records.length} records
          </span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:15px;">
          <input class="form-control" id="activity-search"
            placeholder="Search activities...">

          <input class="form-control" type="date"
            id="activity-date-filter">
        </div>

        <div id="activity-record-list">
          ${renderRecords(records)}
        </div>
      </div>

      <div class="card" style="margin-top:20px;">
        <h3>Important reminder</h3>
        <p class="muted">
          Record genuine activities only. A published post, a conversation,
          a contacted person and an activated member are different results.
          Do not count the same person multiple times as a new prospect.
        </p>
      </div>

    </section>
  `;

  const refresh = () => {
    const search = container.querySelector("#activity-search").value
      .toLowerCase().trim();

    const date = container.querySelector("#activity-date-filter").value;

    const filtered = activities().filter(item => {
      const matchesSearch = [
        item.type,
        item.notes,
        item.date
      ].some(value =>
        String(value || "").toLowerCase().includes(search)
      );

      const matchesDate = !date || item.date === date;

      return matchesSearch && matchesDate;
    });

    container.querySelector("#activity-record-list").innerHTML =
      renderRecords(filtered);
  };

  container.querySelector("#activity-search")
    .addEventListener("input", refresh);

  container.querySelector("#activity-date-filter")
    .addEventListener("change", refresh);

  container.querySelector("#activity-form")
    .addEventListener("submit", event => {
      event.preventDefault();

      const form = event.currentTarget;
      const values = Object.fromEntries(new FormData(form).entries());

      const quantity = Number(values.quantity);

      if (!values.type || !values.date || !Number.isInteger(quantity) ||
          quantity < 1 || quantity > 10000) {
        alert("Please enter a valid activity and quantity.");
        return;
      }

      try {
        addRecord("activities", {
          type: values.type,
          quantity,
          date: values.date,
          prospectId: values.prospectId || "",
          notes: values.notes.trim()
        });

        renderActivities(container);
      } catch (error) {
        alert(error.message || "Could not save activity.");
      }
    });

  container.addEventListener("click", event => {
    const button = event.target.closest("[data-delete-activity]");

    if (!button) return;

    if (!confirm("Delete this activity record?")) return;

    try {
      deleteRecord("activities", button.dataset.deleteActivity);
      renderActivities(container);
    } catch (error) {
      alert(error.message || "Could not delete activity.");
    }
  });
                    }
