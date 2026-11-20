/* =========================================
   SHOPY FONT — CAMPAIGN STORAGE
   Local automatic saving system
========================================= */

const STORAGE_KEY = "shopy_font_first50_data_v1";

/* DEFAULT CAMPAIGN DATA */

const DEFAULT_DATA = {
  version: 1,

  campaign: {
    name: "FIRST 50",
    target: 50,
    startDate: "2026-11-20",
    endDate: "2026-11-26",
    createdAt: new Date().toISOString()
  },

  prospects: [],
  activities: [],
  missions: [],
  reminders: [],
  challenges: [],
  socialRecords: [],
  history: [],
  coachAdvice: [],

  settings: {
    ownerName: "Campaign Owner",
    currency: "KES",
    morningReminder: "08:00",
    middayReminder: "13:00",
    eveningReminder: "18:00",
    reportReminder: "20:00",
    remindersEnabled: true,
    dailyStatusTarget: 3,
    facebookPostTarget: 1,
    tiktokVideoTarget: 1,
    facebookReelTarget: 1,
    dailyContactTarget: 10,
    dailyFollowupTarget: 3
  },

  security: {
    pinEnabled: false,
    pinHash: null
  }
};

/* DEEP COPY */

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

/* LOAD DATA */

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      const initialData = cloneData(DEFAULT_DATA);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(initialData)
      );
      return initialData;
    }

    const parsed = JSON.parse(saved);

    return {
      ...cloneData(DEFAULT_DATA),
      ...parsed,

      campaign: {
        ...DEFAULT_DATA.campaign,
        ...(parsed.campaign || {})
      },

      settings: {
        ...DEFAULT_DATA.settings,
        ...(parsed.settings || {})
      },

      security: {
        ...DEFAULT_DATA.security,
        ...(parsed.security || {})
      },

      prospects: Array.isArray(parsed.prospects) ? parsed.prospects : [],
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
      missions: Array.isArray(parsed.missions) ? parsed.missions : [],
      reminders: Array.isArray(parsed.reminders) ? parsed.reminders : [],
      challenges: Array.isArray(parsed.challenges) ? parsed.challenges : [],
      socialRecords: Array.isArray(parsed.socialRecords) ? parsed.socialRecords : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
      coachAdvice: Array.isArray(parsed.coachAdvice) ? parsed.coachAdvice : []
    };

  } catch (error) {
    console.error("Unable to load campaign records:", error);

    throw new Error(
      "Your saved campaign data could not be loaded. Do not overwrite browser storage. Restore a backup or investigate the storage error first."
    );
  }
}

/* ACTIVE APPLICATION DATA */

let campaignData = loadData();

/* SAVE DATA */

function saveData() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(campaignData)
    );

    return true;

  } catch (error) {
    console.error("Campaign saving failed:", error);

    if (typeof showToast === "function") {
      showToast(
        "Saving failed. Export a backup and check browser storage.",
        "error"
      );
    }

    return false;
  }
}

/* GET COMPLETE DATA */

function getData() {
  return campaignData;
}

/* UPDATE A DATA SECTION */

function updateSection(section, value) {
  if (!(section in campaignData)) {
    throw new Error("Unknown campaign data section: " + section);
  }

  campaignData[section] = value;

  return saveData();
}

/* UPDATE CAMPAIGN SETTINGS */

function updateCampaign(values) {
  campaignData.campaign = {
    ...campaignData.campaign,
    ...values
  };

  return saveData();
}

/* UPDATE GENERAL SETTINGS */

function updateSettings(values) {
  campaignData.settings = {
    ...campaignData.settings,
    ...values
  };

  return saveData();
}

/* GENERATE UNIQUE IDS */

function createId(prefix = "record") {
  return (
    prefix +
    "_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).slice(2, 9)
  );
}

/* ADD RECORD */

function addRecord(section, record) {
  if (!Array.isArray(campaignData[section])) {
    throw new Error("Invalid record section: " + section);
  }

  const newRecord = {
    id: createId(section),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...record
  };

  campaignData[section].push(newRecord);

  if (!saveData()) {
    campaignData[section].pop();
    return null;
  }

  return newRecord;
}

/* UPDATE RECORD */

function updateRecord(section, id, updates) {
  if (!Array.isArray(campaignData[section])) {
    throw new Error("Invalid record section: " + section);
  }

  const index = campaignData[section].findIndex(
    item => item.id === id
  );

  if (index === -1) return false;

  const previous = campaignData[section][index];

  campaignData[section][index] = {
    ...previous,
    ...updates,
    id: previous.id,
    updatedAt: new Date().toISOString()
  };

  return saveData();
}

/* DELETE RECORD */

function deleteRecord(section, id) {
  if (!Array.isArray(campaignData[section])) {
    throw new Error("Invalid record section: " + section);
  }

  const previous = campaignData[section];

  campaignData[section] = previous.filter(
    item => item.id !== id
  );

  if (campaignData[section].length === previous.length) {
    return false;
  }

  if (!saveData()) {
    campaignData[section] = previous;
    return false;
  }

  return true;
}

/* FIND RECORD */

function findRecord(section, id) {
  if (!Array.isArray(campaignData[section])) {
    return null;
  }

  return campaignData[section].find(
    item => item.id === id
  ) || null;
}

/* EXPORT BACKUP */

function exportBackup() {
  try {
    const backup = {
      application: "SHOPY FONT FIRST 50 CAMPAIGN COACH",
      version: 1,
      exportedAt: new Date().toISOString(),
      data: campaignData
    };

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
      "shopy-first50-backup-" +
      new Date().toISOString().slice(0, 10) +
      ".json";

    link.click();

    URL.revokeObjectURL(url);

    return true;

  } catch (error) {
    console.error("Backup export failed:", error);
    return false;
  }
}

/* RESTORE BACKUP */

function restoreBackup(file) {
  return new Promise((resolve, reject) => {

    if (!file) {
      reject(new Error("No backup file selected."));
      return;
    }

    const reader = new FileReader();

    reader.onload = event => {
      try {
        const backup = JSON.parse(event.target.result);

        if (
          backup.application !==
          "SHOPY FONT FIRST 50 CAMPAIGN COACH"
        ) {
          throw new Error("This is not a valid campaign backup.");
        }

        if (
          !backup.data ||
          !Array.isArray(backup.data.prospects) ||
          !Array.isArray(backup.data.activities)
        ) {
          throw new Error("Backup data is incomplete.");
        }

        const restored = {
          ...cloneData(DEFAULT_DATA),
          ...backup.data
        };

        campaignData = restored;

        if (!saveData()) {
          throw new Error("Could not save restored data.");
        }

        resolve(true);

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Unable to read backup file."));
    };

    reader.readAsText(file);
  });
}

/* CLEAR CAMPAIGN DATA */

function clearCampaignData() {
  campaignData = cloneData(DEFAULT_DATA);

  return saveData();
}

/* STORAGE AVAILABILITY */

function checkStorage() {
  try {
    const testKey = "__shopy_storage_test__";

    localStorage.setItem(testKey, "ok");
    localStorage.removeItem(testKey);

    return true;

  } catch (error) {
    return false;
  }
}

/* INITIAL STORAGE CHECK */

if (!checkStorage()) {
  console.error(
    "Browser storage is unavailable. Campaign records cannot be saved."
  );
}
