
import {
  getData,
  addRecord,
  deleteRecord
} from "./storage.js";

const PLATFORMS = [
  "WhatsApp Status",
  "WhatsApp Direct Messages",
  "Facebook Posts",
  "Facebook Groups",
  "Facebook Reels",
  "TikTok"
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

function getRecords() {
  return getData().socialRecords || [];
}

function sum(records, field) {
  return records.reduce(
    (total, item) => total + Number(item[field] || 0),
    0
  );
}

function renderRecords(records) {
  if (!records.length) {
    return `
      <div class="empty-state">
        <h3>No social media records</h3>
        <p>Record your first post or campaign performance report.</p>
      </div>
    `;
  }

  return `
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Platform</th>
            <th>Posts</th>
            <th>Views</th>
            <th>Conversations</th>
            <th>Prospects</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${records.map(item => `
            <tr>
              <td>${esc(item.date)}</td>
              <td><strong>${esc(item.platform)}</strong></td>
              <td>${Number(item.posts || 0)}</td>
              <td>${Number(item.views || 0).toLocaleString()}</td>
              <td>${Number(item.conversations || 0)}</td>
              <td>${Number(item.prospects || 0)}</td>
              <td>
                <button class="danger-button"
                  data-delete-social="${esc(item.id)}">
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

function renderPlatformCards(records) {
  return PLATFORMS.map(platform => {
    const matching = records.filter(item => item.platform === platform);

    return `
      <div class="stat-card">
        <div class="stat-label">${esc(platform)}</div>
        <div class="stat-value">${sum(matching, "prospects")}</div>
        <div class="muted">Prospects generated</div>
        <div style="margin-top:8px;font-size:12px;color:#64748B;">
          ${sum(matching, "posts")} posts ·
          ${sum(matching, "views").toLocaleString()} views
        </div>
      </div>
    `;
  }).join("");
}

export function renderSocial(container) {
  if (!container) return;

  const records = getRecords();

  const totals = {
    posts: sum(records, "posts"),
    views: sum(records, "views"),
    conversations: sum(records, "conversations"),
    prospects: sum(records, "prospects")
  };

  container.innerHTML = `
    <section>

      <div class="stats-grid" style="margin-bottom:22px;">
        <div class="stat-card">
          <div class="stat-value">${totals.posts}</div>
          <div class="stat-label">Total posts</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${totals.views.toLocaleString()}</div>
          <div class="stat-label">Total views</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${totals.conversations}</div>
          <div class="stat-label">Conversations</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${totals.prospects}</div>
          <div class="stat-label">Prospects generated</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:22px;">
        <h3>Record social media performance</h3>
        <p class="muted">
          Enter real figures from your social media accounts.
          Do not estimate views or claim unverified results.
        </p>

        <form id="social-form">

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;">

            <label>
              <span class="form-label">Platform *</span>
              <select class="form-control" name="platform" required>
                ${PLATFORMS.map(platform =>
                  `<option value="${esc(platform)}">${esc(platform)}</option>`
                ).join("")}
              </select>
            </label>

            <label>
              <span class="form-label">Date *</span>
              <input class="form-control" type="date"
                name="date" value="${today()}" required>
            </label>

            <label>
              <span class="form-label">Number of posts</span>
              <input class="form-control" type="number"
                name="posts" min="0" max="10000" value="1">
            </label>

            <label>
              <span class="form-label">Views / reach</span>
              <input class="form-control" type="number"
                name="views" min="0" max="100000000" value="0">
            </label>

            <label>
              <span class="form-label">Conversations generated</span>
              <input class="form-control" type="number"
                name="conversations" min="0" max="100000" value="0">
            </label>

            <label>
              <span class="form-label">New prospects generated</span>
              <input class="form-control" type="number"
                name="prospects" min="0" max="100000" value="0">
            </label>

          </div>

          <label style="display:block;margin-top:14px;">
            <span class="form-label">Campaign notes</span>
            <textarea class="form-control" name="notes" rows="3"
              placeholder="Which content performed well? What questions did people ask?"></textarea>
          </label>

          <button class="primary-button" style="margin-top:15px;">
            Save performance
          </button>

        </form>
      </div>

      <div class="card" style="margin-bottom:22px;">
        <h3>Performance by platform</h3>
        <div class="stats-grid" style="margin-top:15px;">
          ${renderPlatformCards(records)}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Social media history</h3>
          <span class="status-badge status-info">${records.length} records</span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:15px;">
          <input class="form-control" id="social-search"
            placeholder="Search platform or notes...">

          <input class="form-control" type="date"
            id="social-date">
        </div>

        <div id="social-record-list">
          ${renderRecords(records)}
        </div>
      </div>

    </section>
  `;

  const refresh = () => {
    const query = container.querySelector("#social-search")
      .value.toLowerCase().trim();

    const date = container.querySelector("#social-date").value;

    const filtered = getRecords().filter(item => {
      const matchesQuery = [
        item.platform,
        item.notes,
        item.date
      ].some(value =>
        String(value || "").toLowerCase().includes(query)
      );

      return matchesQuery && (!date || item.date === date);
    });

    container.querySelector("#social-record-list").innerHTML =
      renderRecords(filtered);
  };

  container.querySelector("#social-search")
    .addEventListener("input", refresh);

  container.querySelector("#social-date")
    .addEventListener("change", refresh);

  container.querySelector("#social-form")
    .addEventListener("submit", event => {
      event.preventDefault();

      const values = Object.fromEntries(
        new FormData(event.currentTarget).entries()
      );

      const numericFields = ["posts", "views", "conversations", "prospects"];

      for (const field of numericFields) {
        const value = Number(values[field]);

        if (!Number.isSafeInteger(value) || value < 0) {
          alert(`Please enter a valid ${field} value.`);
          return;
        }

        values[field] = value;
      }

      try {
        addRecord("socialRecords", values);
        renderSocial(container);
      } catch (error) {
        alert(error.message || "Could not save social media record.");
      }
    });

  container.addEventListener("click", event => {
    const button = event.target.closest("[data-delete-social]");

    if (!button) return;

    if (!confirm("Delete this social media record?")) return;

    try {
      deleteRecord("socialRecords", button.dataset.deleteSocial);
      renderSocial(container);
    } catch (error) {
      alert(error.message || "Could not delete record.");
    }
  });
                       }
