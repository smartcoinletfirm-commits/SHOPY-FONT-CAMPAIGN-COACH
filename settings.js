
import {
  getData,
  updateCampaign,
  updateSettings,
  exportBackup,
  restoreBackup,
  clearCampaignData,
  checkStorage
} from "./storage.js";

export function renderSettings(container) {
  const data = getData();
  const campaign = data.campaign || {};
  const settings = data.settings || {};

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);

  container.innerHTML = `
    <div class="page-heading">
      <div>
        <h2>Settings & Backup</h2>
        <p>Manage your campaign and protect your saved records.</p>
      </div>
    </div>

    <div class="card">
      <h3>Campaign settings</h3>

      <form id="campaign-settings-form">
        <div class="form-group">
          <label>Campaign name</label>
          <input class="form-control" name="name"
            value="${escapeHTML(campaign.name || "SHOPY FONT First 50 Campaign")}">
        </div>

        <div class="form-group">
          <label>Campaign start date</label>
          <input class="form-control" type="date" name="startDate"
            value="${escapeHTML(campaign.startDate || "2026-11-20")}" required>
        </div>

        <div class="form-group">
          <label>Campaign end date</label>
          <input class="form-control" type="date" name="endDate"
            value="${escapeHTML(campaign.endDate || "2026-11-26")}" required>
        </div>

        <div class="form-group">
          <label>Total activation target</label>
          <input class="form-control" type="number" min="1"
            name="totalTarget"
            value="${Number(campaign.totalTarget || 50)}" required>
        </div>

        <button class="primary-button" type="submit">
          Save campaign settings
        </button>
      </form>
    </div>

    <div class="card">
      <h3>Daily recruitment targets</h3>
      <p class="text-secondary">
        Set the number of genuine activations you aim for each day.
      </p>

      <form id="daily-target-form">
        ${(campaign.dailyTargets || [3,7,7,8,8,8,9])
          .map((target, index) => `
            <div class="form-group">
              <label>Day ${index + 1}</label>
              <input class="form-control" type="number"
                min="0" name="target${index}"
                value="${Number(target)}">
            </div>
          `).join("")}

        <button class="primary-button" type="submit">
          Save daily targets
        </button>
      </form>
    </div>

    <div class="card">
      <h3>Personal preferences</h3>

      <form id="preferences-form">
        <div class="form-group">
          <label>Display name</label>
          <input class="form-control" name="displayName"
            value="${escapeHTML(settings.displayName || "")}"
            placeholder="Your campaign name">
        </div>

        <div class="form-group">
          <label>Daily working hours</label>
          <input class="form-control" type="number" min="1" max="16"
            name="workingHours"
            value="${Number(settings.workingHours || 2)}">
        </div>

        <button class="primary-button" type="submit">
          Save preferences
        </button>
      </form>
    </div>

    <div class="card">
      <h3>Backup your campaign</h3>
      <p>
        Download a JSON copy of your prospects, activities, missions,
        reminders and other saved campaign records.
      </p>
      <button class="primary-button" id="export-backup">
        <i class="fa-solid fa-download"></i> Download backup
      </button>
    </div>

    <div class="card">
      <h3>Restore a backup</h3>
      <p class="text-secondary">
        Restoring replaces your current saved campaign records.
        Download a backup of your current data first.
      </p>
      <input class="form-control" type="file" id="backup-file"
        accept=".json,application/json">
      <button class="secondary-button" id="restore-backup">
        <i class="fa-solid fa-upload"></i> Restore backup
      </button>
    </div>

    <div class="card">
      <h3>Local storage status</h3>
      <p id="storage-status">Checking browser storage...</p>
      <p class="text-secondary">
        Your records are saved in this browser on this device.
        They are not automatically uploaded to the cloud.
        Clearing browser data may permanently remove them.
      </p>
    </div>

    <div class="card">
      <h3>Danger zone</h3>
      <p class="text-secondary">
        This permanently clears your locally saved campaign records.
        Download a backup before continuing.
      </p>
      <button class="danger-button" id="clear-data">
        Clear all campaign data
      </button>
    </div>
  `;

  container.querySelector("#campaign-settings-form")
    .addEventListener("submit", event => {
      event.preventDefault();

      const values = Object.fromEntries(
        new FormData(event.currentTarget).entries()
      );

      if (values.endDate < values.startDate) {
        alert("The end date cannot be before the start date.");
        return;
      }

      updateCampaign({
        name: values.name.trim(),
        startDate: values.startDate,
        endDate: values.endDate,
        totalTarget: Number(values.totalTarget)
      });

      alert("Campaign settings saved.");
      renderSettings(container);
    });

  container.querySelector("#daily-target-form")
    .addEventListener("submit", event => {
      event.preventDefault();

      const form = new FormData(event.currentTarget);
      const targets = Array.from({ length: 7 }, (_, index) =>
        Math.max(0, Number(form.get(`target${index}`) || 0))
      );

      updateCampaign({ dailyTargets: targets });
      alert("Daily targets saved.");
      renderSettings(container);
    });

  container.querySelector("#preferences-form")
    .addEventListener("submit", event => {
      event.preventDefault();

      const values = Object.fromEntries(
        new FormData(event.currentTarget).entries()
      );

      updateSettings({
        displayName: values.displayName.trim(),
        workingHours: Number(values.workingHours)
      });

      alert("Preferences saved.");
    });

  container.querySelector("#export-backup")
    .addEventListener("click", () => {
      const backup = exportBackup();

      const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `shopy-font-campaign-backup-${new Date()
        .toISOString().slice(0, 10)}.json`;

      link.click();
      URL.revokeObjectURL(url);
    });

  container.querySelector("#restore-backup")
    .addEventListener("click", async () => {
      const file = container.querySelector("#backup-file").files[0];

      if (!file) {
        alert("Choose a backup JSON file first.");
        return;
      }

      if (!confirm("Replace your current campaign data with this backup?")) {
        return;
      }

      try {
        const contents = await file.text();
        const backup = JSON.parse(contents);

        restoreBackup(backup);

        alert("Backup restored successfully.");
        renderSettings(container);
      } catch (error) {
        alert("Could not restore backup: " + error.message);
      }
    });

  container.querySelector("#clear-data")
    .addEventListener("click", () => {
      const confirmed = confirm(
        "WARNING: This will permanently clear all campaign records. Continue?"
      );

      if (!confirmed) return;

      const secondConfirm = prompt(
        'Type DELETE to confirm clearing your campaign data.'
      );

      if (secondConfirm !== "DELETE") {
        alert("Data clearing cancelled.");
        return;
      }

      clearCampaignData();
      alert("Campaign data cleared.");
      location.reload();
    });

  const status = checkStorage();

  container.querySelector("#storage-status").textContent =
    status.available
      ? "Browser storage is available."
      : "Browser storage may be unavailable. Your records may not save correctly.";
}
