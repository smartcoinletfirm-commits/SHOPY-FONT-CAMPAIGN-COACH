
import { getData, addRecord, updateRecord, deleteRecord, createId } from "./storage.js";

export function renderChallenges(container) {
  const data = getData();
  const challenges = data.challenges || [];

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);

  const today = new Date().toISOString().slice(0, 10);

  const open = challenges.filter(c => c.status !== "resolved");
  const resolved = challenges.filter(c => c.status === "resolved");

  const form = `
    <div class="card">
      <h3>Record a campaign challenge</h3>
      <form id="challenge-form">
        <div class="form-group">
          <label>Problem or challenge</label>
          <input class="form-control" name="title" required
            placeholder="e.g. Low response to WhatsApp statuses">
        </div>

        <div class="form-group">
          <label>Category</label>
          <select class="form-control" name="category">
            <option>Low recruitment</option>
            <option>Low engagement</option>
            <option>Follow-up problem</option>
            <option>Time management</option>
            <option>Technical problem</option>
            <option>Personal challenge</option>
            <option>Other</option>
          </select>
        </div>

        <div class="form-group">
          <label>Possible cause</label>
          <textarea class="form-control" name="cause" rows="2"
            placeholder="What do you think caused this problem?"></textarea>
        </div>

        <div class="form-group">
          <label>Proposed solution</label>
          <textarea class="form-control" name="solution" rows="3"
            placeholder="What action will you take?"></textarea>
        </div>

        <div class="form-group">
          <label>Priority</label>
          <select class="form-control" name="priority">
            <option>High</option>
            <option selected>Medium</option>
            <option>Low</option>
          </select>
        </div>

        <div class="form-group">
          <label>Target resolution date</label>
          <input class="form-control" type="date" name="dueDate">
        </div>

        <button class="primary-button" type="submit">
          <i class="fa-solid fa-plus"></i> Save challenge
        </button>
      </form>
    </div>
  `;

  const challengeCards = challenges.length
    ? challenges.map(challenge => {
        const isResolved = challenge.status === "resolved";
        const overdue = !isResolved &&
          challenge.dueDate &&
          challenge.dueDate < today;

        return `
          <div class="card">
            <div class="card-header">
              <div>
                <h3>${escapeHTML(challenge.title)}</h3>
                <span class="text-secondary">
                  ${escapeHTML(challenge.category || "Other")}
                </span>
              </div>
              <span class="status-badge ${
                isResolved ? "status-success" :
                overdue ? "status-danger" : "status-warning"
              }">
                ${isResolved ? "RESOLVED" :
                  overdue ? "OVERDUE" : "OPEN"}
              </span>
            </div>

            <p><strong>Possible cause:</strong><br>
              ${escapeHTML(challenge.cause || "Not recorded")}
            </p>

            <p><strong>Solution:</strong><br>
              ${escapeHTML(challenge.solution || "Not recorded")}
            </p>

            <p class="text-secondary">
              Priority: ${escapeHTML(challenge.priority || "Medium")}
              ${challenge.dueDate
                ? " · Due: " + escapeHTML(challenge.dueDate)
                : ""}
            </p>

            <div class="card-actions">
              <button class="secondary-button"
                data-edit="${escapeHTML(challenge.id)}">
                Edit
              </button>

              <button class="${
                isResolved ? "secondary-button" : "primary-button"
              }" data-toggle="${escapeHTML(challenge.id)}">
                ${isResolved ? "Reopen" : "Mark resolved"}
              </button>

              <button class="danger-button"
                data-delete="${escapeHTML(challenge.id)}">
                Delete
              </button>
            </div>
          </div>
        `;
      }).join("")
    : `
      <div class="card empty-state">
        <i class="fa-solid fa-lightbulb"></i>
        <h3>No challenges recorded</h3>
        <p>Record a problem when it happens and create an action plan.</p>
      </div>
    `;

  container.innerHTML = `
    <div class="page-heading">
      <div>
        <h2>Problems & Challenges</h2>
        <p>Identify obstacles and take practical recovery actions.</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Total challenges</span>
        <strong>${challenges.length}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Open challenges</span>
        <strong>${open.length}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Resolved</span>
        <strong>${resolved.length}</strong>
      </div>
    </div>

    ${form}

    <div class="page-heading">
      <div>
        <h3>Challenge history</h3>
        <p>Review your problems and solutions.</p>
      </div>
    </div>

    <div class="content-grid">
      ${challengeCards}
    </div>
  `;

  container.querySelector("#challenge-form")
    ?.addEventListener("submit", event => {
      event.preventDefault();

      const values = Object.fromEntries(
        new FormData(event.currentTarget).entries()
      );

      addRecord("challenges", {
        id: createId(),
        ...values,
        status: "open",
        createdAt: new Date().toISOString()
      });

      renderChallenges(container);
    });

  container.addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit]");
    const toggleButton = event.target.closest("[data-toggle]");
    const deleteButton = event.target.closest("[data-delete]");

    if (editButton) {
      const item = getData().challenges.find(
        c => c.id === editButton.dataset.edit
      );

      if (!item) return;

      const title = prompt("Edit challenge title:", item.title);
      if (title === null) return;

      const cause = prompt("Edit possible cause:", item.cause || "");
      if (cause === null) return;

      const solution = prompt(
        "Edit proposed solution:", item.solution || ""
      );
      if (solution === null) return;

      updateRecord("challenges", item.id, {
        title: title.trim(),
        cause,
        solution
      });

      renderChallenges(container);
    }

    if (toggleButton) {
      const item = getData().challenges.find(
        c => c.id === toggleButton.dataset.toggle
      );

      if (!item) return;

      updateRecord("challenges", item.id, {
        status: item.status === "resolved" ? "open" : "resolved",
        resolvedAt: item.status === "resolved"
          ? null : new Date().toISOString()
      });

      renderChallenges(container);
    }

    if (deleteButton) {
      const id = deleteButton.dataset.delete;

      if (confirm("Delete this challenge permanently?")) {
        deleteRecord("challenges", id);
        renderChallenges(container);
      }
    }
  }, { once: true });
      }
