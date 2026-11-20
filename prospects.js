
import {
  getData,
  addRecord,
  updateRecord,
  deleteRecord
} from "./storage.js";

const statuses = [
  "New",
  "Contacted",
  "Interested",
  "Following Up",
  "Activated",
  "Not Interested"
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

function dateToday() {
  return new Date().toISOString().slice(0, 10);
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();

  if (value === "activated") return "status-success";
  if (value === "interested") return "status-info";
  if (value === "not interested") return "status-danger";
  if (value === "following up") return "status-warning";

  return "status-purple";
}

function getProspects() {
  return getData().prospects || [];
}

function renderRows(prospects) {
  if (!prospects.length) {
    return `
      <div class="empty-state">
        <h3>No prospects yet</h3>
        <p>Start by adding someone you have genuinely contacted or plan to contact.</p>
      </div>
    `;
  }

  return `
    <div class="table-responsive">
      <table>
        <thead>
          <tr>
            <th>Name and phone</th>
            <th>Source</th>
            <th>Interest</th>
            <th>Status</th>
            <th>Next follow-up</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${prospects.map(person => `
            <tr>
              <td>
                <strong>${esc(person.name)}</strong>
                <div class="muted">${esc(person.phone)}</div>
              </td>
              <td>${esc(person.source || "Not specified")}</td>
              <td>${esc(person.interest || "Not set")}</td>
              <td>
                <span class="status-badge ${statusClass(person.status)}">
                  ${esc(person.status || "New")}
                </span>
              </td>
              <td>${esc(person.nextFollowUpDate || "Not scheduled")}</td>
              <td>
                <button class="secondary-button" data-edit-prospect="${esc(person.id)}">
                  Edit
                </button>
                <button class="danger-button" data-delete-prospect="${esc(person.id)}">
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

function prospectForm(person = null) {
  const editing = Boolean(person);

  return `
    <form id="prospect-form" class="card" style="margin-bottom:20px;">
      <div class="card-header">
        <h3>${editing ? "Edit prospect" : "Add a prospect"}</h3>
        ${editing ? `<span class="status-badge status-info">Editing</span>` : ""}
      </div>

      <input type="hidden" name="id" value="${esc(person?.id || "")}">

      <div class="form-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:15px;">
        <label>
          <span class="form-label">Full name *</span>
          <input class="form-control" name="name" required maxlength="100"
            value="${esc(person?.name || "")}" placeholder="Prospect's name">
        </label>

        <label>
          <span class="form-label">Phone number *</span>
          <input class="form-control" name="phone" required maxlength="30"
            value="${esc(person?.phone || "")}" placeholder="+254...">
        </label>

        <label>
          <span class="form-label">Source channel</span>
          <select class="form-control" name="source">
            ${["WhatsApp", "Facebook", "TikTok", "Facebook Reel", "Direct Outreach", "Referral", "Other"]
              .map(source => `<option ${person?.source === source ? "selected" : ""}>${source}</option>`)
              .join("")}
          </select>
        </label>

        <label>
          <span class="form-label">Interest level</span>
          <select class="form-control" name="interest">
            ${["Not assessed", "Low", "Medium", "Interested", "Very Interested"]
              .map(level => `<option ${person?.interest === level ? "selected" : ""}>${level}</option>`)
              .join("")}
          </select>
        </label>

        <label>
          <span class="form-label">Package considered</span>
          <input class="form-control" name="package"
            value="${esc(person?.package || "")}" placeholder="e.g. Starter">
        </label>

        <label>
          <span class="form-label">Prospect status</span>
          <select class="form-control" name="status">
            ${statuses.map(status => `
              <option value="${status}" ${person?.status === status ? "selected" : ""}>
                ${status}
              </option>
            `).join("")}
          </select>
        </label>

        <label>
          <span class="form-label">First contact date</span>
          <input class="form-control" type="date" name="firstContactDate"
            value="${esc(person?.firstContactDate || dateToday())}">
        </label>

        <label>
          <span class="form-label">Expected joining date</span>
          <input class="form-control" type="date" name="expectedJoiningDate"
            value="${esc(person?.expectedJoiningDate || "")}">
        </label>

        <label>
          <span class="form-label">Last follow-up date</span>
          <input class="form-control" type="date" name="lastFollowUpDate"
            value="${esc(person?.lastFollowUpDate || "")}">
        </label>

        <label>
          <span class="form-label">Next follow-up date</span>
          <input class="form-control" type="date" name="nextFollowUpDate"
            value="${esc(person?.nextFollowUpDate || "")}">
        </label>
      </div>

      <label style="display:block;margin-top:15px;">
        <span class="form-label">Notes</span>
        <textarea class="form-control" name="notes" rows="3"
          placeholder="Record the conversation, questions, concerns or agreed next step...">${esc(person?.notes || "")}</textarea>
      </label>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;">
        <button class="primary-button" type="submit">
          ${editing ? "Save changes" : "Save prospect"}
        </button>
        <button class="secondary-button" type="button" id="cancel-prospect-form">
          Cancel
        </button>
      </div>
    </form>
  `;
}

function renderHistory(person) {
  const history = Array.isArray(person.followUpHistory)
    ? person.followUpHistory
    : [];

  return `
    <div class="card" style="margin-top:18px;">
      <h3>Follow-up history: ${esc(person.name)}</h3>

      <form id="followup-form" data-person-id="${esc(person.id)}">
        <label>
          <span class="form-label">Record a conversation or follow-up</span>
          <textarea class="form-control" name="note" rows="3" required
            placeholder="What happened? What did you agree on?"></textarea>
        </label>

        <label style="display:block;margin-top:12px;">
          <span class="form-label">Next follow-up date</span>
          <input class="form-control" type="date" name="nextDate">
        </label>

        <button class="primary-button" style="margin-top:12px;">
          Save follow-up
        </button>
      </form>

      <div style="margin-top:20px;">
        ${history.length ? history.slice().reverse().map(item => `
          <div style="padding:12px 0;border-bottom:1px solid #E2E8F0;">
            <strong>${esc(item.date || "")}</strong>
            <p>${esc(item.note)}</p>
          </div>
        `).join("") : `<p class="muted">No follow-ups recorded yet.</p>`}
      </div>
    </div>
  `;
}

export function renderProspects(container) {
  if (!container) return;

  const prospects = getProspects();

  container.innerHTML = `
    <section>
      <div class="stats-grid" style="margin-bottom:20px;">
        <div class="stat-card">
          <div class="stat-value">${prospects.length}</div>
          <div class="stat-label">Total prospects</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${prospects.filter(p => p.status === "Interested").length}</div>
          <div class="stat-label">Interested</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${prospects.filter(p => p.status === "Activated").length}</div>
          <div class="stat-label">Activated</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${prospects.filter(p =>
            p.nextFollowUpDate &&
            p.nextFollowUpDate < dateToday() &&
            !["Activated", "Not Interested"].includes(p.status)
          ).length}</div>
          <div class="stat-label">Overdue follow-ups</div>
        </div>
      </div>

      <div id="prospect-form-container">
        ${prospectForm()}
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Your prospect list</h3>
          <span class="status-badge status-info">${prospects.length} records</span>
        </div>

        <input class="form-control" id="prospect-search"
          placeholder="Search by name, phone or source..." style="margin-bottom:15px;">

        <div id="prospect-table">
          ${renderRows(prospects)}
        </div>
      </div>

      <div id="prospect-history-container"></div>
    </section>
  `;

  const formContainer = container.querySelector("#prospect-form-container");

  function resetForm() {
    formContainer.innerHTML = prospectForm();
  }

  function refreshTable(search = "") {
    const query = search.toLowerCase().trim();

    const filtered = getProspects().filter(person =>
      [person.name, person.phone, person.source]
        .some(value => String(value || "").toLowerCase().includes(query))
    );

    container.querySelector("#prospect-table").innerHTML = renderRows(filtered);
  }

  container.querySelector("#prospect-search").addEventListener("input", event => {
    refreshTable(event.target.value);
  });

  container.addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-prospect]");
    const deleteButton = event.target.closest("[data-delete-prospect]");

    if (editButton) {
      const person = getProspects().find(p => p.id === editButton.dataset.editProspect);
      if (!person) return;

      formContainer.innerHTML = prospectForm(person);
      formContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (deleteButton) {
      const id = deleteButton.dataset.deleteProspect;

      if (confirm("Delete this prospect and their follow-up history?")) {
        deleteRecord("prospects", id);
        refreshTable(container.querySelector("#prospect-search").value);
        renderProspects(container);
      }
    }
  });

  container.addEventListener("click", event => {
    if (event.target.closest("#cancel-prospect-form")) {
      resetForm();
    }
  });

  container.addEventListener("submit", event => {
    if (event.target.id === "prospect-form") {
      event.preventDefault();

      const form = event.target;
      const values = Object.fromEntries(new FormData(form).entries());
      const id = values.id;
      delete values.id;

      if (!values.name.trim() || !values.phone.trim()) {
        alert("Please enter the prospect's name and phone number.");
        return;
      }

      try {
        if (id) {
          updateRecord("prospects", id, values);
        } else {
          addRecord("prospects", {
            ...values,
            followUpHistory: []
          });
        }

        renderProspects(container);
      } catch (error) {
        alert(error.message || "Could not save prospect.");
      }
    }

    if (event.target.id === "followup-form") {
      event.preventDefault();

      const form = event.target;
      const person = getProspects().find(p => p.id === form.dataset.personId);

      if (!person) return;

      const formData = new FormData(form);
      const note = String(formData.get("note") || "").trim();
      const nextDate = String(formData.get("nextDate") || "");

      if (!note) return;

      const history = Array.isArray(person.followUpHistory)
        ? [...person.followUpHistory]
        : [];

      history.push({
        date: new Date().toISOString(),
        note
      });

      try {
        updateRecord("prospects", person.id, {
          followUpHistory: history,
          lastFollowUpDate: dateToday(),
          nextFollowUpDate: nextDate || person.nextFollowUpDate
        });

        renderProspects(container);
      } catch (error) {
        alert(error.message || "Could not save follow-up.");
      }
    }
  });
               }
        
