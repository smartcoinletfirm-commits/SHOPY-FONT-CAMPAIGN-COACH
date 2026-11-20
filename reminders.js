
import {
  getData,
  addRecord,
  updateRecord,
  deleteRecord
} from "./storage.js";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function getReminders() {
  return getData().reminders || [];
}

function reminderStatus(item) {
  if (item.completed) return "Completed";
  if (item.date < today()) return "Overdue";
  if (item.date === today()) return "Due today";
  return "Upcoming";
}

function statusClass(status) {
  if (status === "Completed") return "status-success";
  if (status === "Overdue") return "status-danger";
  if (status === "Due today") return "status-warning";
  return "status-info";
}

function renderReminderList(items) {
  if (!items.length) {
    return `
      <div class="empty-state">
        <h3>No reminders yet</h3>
        <p>Create a reminder so you don't forget an important action.</p>
      </div>
    `;
  }

  return `
    <div style="display:grid;gap:12px;">
      ${items.map(item => {
        const status = reminderStatus(item);

        return `
          <div class="card" style="padding:16px;">
            <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
              <div style="flex:1;">
                <h3 style="margin:0 0 7px;${item.completed ? "text-decoration:line-through;" : ""}">
                  ${esc(item.title)}
                </h3>

                <p class="muted">${esc(item.notes || "No additional notes")}</p>

                <p style="font-size:13px;margin-top:8px;">
                  <strong>Due:</strong> ${esc(item.date)}
                  ${item.time ? ` at ${esc(item.time)}` : ""}
                </p>

                <span class="status-badge ${statusClass(status)}">
                  ${status}
                </span>
              </div>

              <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
                ${!item.completed ? `
                  <button class="primary-button"
                    data-complete-reminder="${esc(item.id)}">
                    Complete
                  </button>
                ` : `
                  <button class="secondary-button"
                    data-reopen-reminder="${esc(item.id)}">
                    Reopen
                  </button>
                `}

                <button class="danger-button"
                  data-delete-reminder="${esc(item.id)}">
                  Delete
                </button>
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

export function renderReminders(container) {
  if (!container) return;

  const reminders = getReminders();

  const overdue = reminders.filter(item =>
    reminderStatus(item) === "Overdue"
  ).length;

  const dueToday = reminders.filter(item =>
    reminderStatus(item) === "Due today"
  ).length;

  const completed = reminders.filter(item => item.completed).length;

  container.innerHTML = `
    <section>

      <div class="stats-grid" style="margin-bottom:20px;">
        <div class="stat-card">
          <div class="stat-value" style="color:#DC2626;">${overdue}</div>
          <div class="stat-label">Overdue tasks</div>
        </div>

        <div class="stat-card">
          <div class="stat-value" style="color:#D97706;">${dueToday}</div>
          <div class="stat-label">Due today</div>
        </div>

        <div class="stat-card">
          <div class="stat-value" style="color:#059669;">${completed}</div>
          <div class="stat-label">Completed tasks</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${reminders.length}</div>
          <div class="stat-label">Total reminders</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:22px;">
        <h3>Create a reminder or task</h3>

        <form id="reminder-form">
          <label style="display:block;margin-bottom:14px;">
            <span class="form-label">Task title *</span>
            <input class="form-control" name="title" required
              maxlength="120" placeholder="e.g. Follow up with John">
          </label>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;">
            <label>
              <span class="form-label">Due date *</span>
              <input class="form-control" type="date"
                name="date" min="2020-01-01" value="${today()}" required>
            </label>

            <label>
              <span class="form-label">Time (optional)</span>
              <input class="form-control" type="time" name="time">
            </label>

            <label>
              <span class="form-label">Reminder category</span>
              <select class="form-control" name="category">
                <option>Prospect follow-up</option>
                <option>Social media</option>
                <option>Direct outreach</option>
                <option>Campaign planning</option>
                <option>Personal task</option>
                <option>Other</option>
              </select>
            </label>
          </div>

          <label style="display:block;margin-top:14px;">
            <span class="form-label">Notes</span>
            <textarea class="form-control" name="notes" rows="3"
              placeholder="Additional information..."></textarea>
          </label>

          <button class="primary-button" style="margin-top:15px;">
            Save reminder
          </button>
        </form>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Your reminders and tasks</h3>
          <select id="reminder-filter" class="form-control" style="max-width:180px;">
            <option value="all">All tasks</option>
            <option value="Overdue">Overdue</option>
            <option value="Due today">Due today</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div id="reminder-list">
          ${renderReminderList(reminders)}
        </div>
      </div>

      <div class="card" style="margin-top:20px;">
        <h3>About notifications</h3>
        <p class="muted">
          These reminders are saved locally in your browser. This version
          displays overdue and upcoming tasks when you open the app.
          Browser notifications may require permission and the app to remain
          open. Reliable alerts while the app is closed require additional
          PWA and push-notification infrastructure.
        </p>
      </div>

    </section>
  `;

  const list = container.querySelector("#reminder-list");
  const filter = container.querySelector("#reminder-filter");

  function refresh() {
    const selected = filter.value;

    const filtered = getReminders()
      .filter(item =>
        selected === "all" || reminderStatus(item) === selected
      )
      .sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        return `${a.date} ${a.time || ""}`
          .localeCompare(`${b.date} ${b.time || ""}`);
      });

    list.innerHTML = renderReminderList(filtered);
  }

  filter.addEventListener("change", refresh);

  container.querySelector("#reminder-form")
    .addEventListener("submit", event => {
      event.preventDefault();

      const values = Object.fromEntries(
        new FormData(event.currentTarget).entries()
      );

      if (!values.title.trim() || !values.date) {
        alert("Please enter a task title and due date.");
        return;
      }

      try {
        addRecord("reminders", {
          title: values.title.trim(),
          date: values.date,
          time: values.time,
          category: values.category,
          notes: values.notes.trim(),
          completed: false
        });

        renderReminders(container);
      } catch (error) {
        alert(error.message || "Could not save reminder.");
      }
    });

  container.addEventListener("click", event => {
    const completeButton = event.target.closest("[data-complete-reminder]");
    const reopenButton = event.target.closest("[data-reopen-reminder]");
    const deleteButton = event.target.closest("[data-delete-reminder]");

    try {
      if (completeButton) {
        updateRecord("reminders", completeButton.dataset.completeReminder, {
          completed: true,
          completedAt: new Date().toISOString()
        });
      }

      if (reopenButton) {
        updateRecord("reminders", reopenButton.dataset.reopenReminder, {
          completed: false,
          completedAt: null
        });
      }

      if (deleteButton) {
        if (!confirm("Delete this reminder?")) return;

        deleteRecord("reminders", deleteButton.dataset.deleteReminder);
      }

      refresh();
    } catch (error) {
      alert(error.message || "Could not update reminder.");
    }
  });
            }
