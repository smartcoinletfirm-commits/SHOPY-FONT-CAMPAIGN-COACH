const STORAGE_KEY = "shopy_font_first50_data_v1";

export const DEFAULT_DATA = {
  campaign: {
    name: "SHOPY FONT First 50 Campaign",
    target: 50,
    startDate: "2026-11-20",
    endDate: "2026-11-26",
    dailyTargets: [3, 7, 7, 8, 8, 8, 9]
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
    reminderEnabled: true,
    morningReminder: "08:00",
    eveningReminder: "19:00",
    dailyTargets: {
      whatsappStatuses: 3,
      facebookPosts: 1,
      tiktokVideos: 1,
      facebookReels: 1,
      directOutreach: 10,
      followUps: 3
    },
    pinEnabled: false,
    pin: ""
  }
};

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function normaliseData(data) {
  const defaults = cloneDefaults();

  return {
    ...defaults,
    ...data,
    campaign: {
      ...defaults.campaign,
      ...(data.campaign || {})
    },
    settings: {
      ...defaults.settings,
      ...(data.settings || {}),
      dailyTargets: {
        ...defaults.settings.dailyTargets,
        ...(data.settings?.dailyTargets || {})
      }
    },
    prospects: Array.isArray(data.prospects) ? data.prospects : [],
    activities: Array.isArray(data.activities) ? data.activities : [],
    missions: Array.isArray(data.missions) ? data.missions : [],
    reminders: Array.isArray(data.reminders) ? data.reminders : [],
    challenges: Array.isArray(data.challenges) ? data.challenges : [],
    socialRecords: Array.isArray(data.socialRecords) ? data.socialRecords : [],
    history: Array.isArray(data.history) ? data.history : [],
    coachAdvice: Array.isArray(data.coachAdvice) ? data.coachAdvice : []
  };
}

export function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return cloneDefaults();
    }

    return normaliseData(JSON.parse(saved));
  } catch (error) {
    console.error("Could not load campaign data:", error);
    return cloneDefaults();
  }
}

export let campaignData = loadData();

export function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaignData));
    return true;
  } catch (error) {
    console.error("Could not save campaign data:", error);
    throw new Error("Saving failed. Check your browser storage space.");
  }
}

export function getData() {
  return campaignData;
}

export function updateSection(section, value) {
  if (!(section in campaignData)) {
    throw new Error(`Unknown data section: ${section}`);
  }

  campaignData[section] = value;
  saveData();
  return campaignData[section];
}

export function updateCampaign(updates) {
  campaignData.campaign = {
    ...campaignData.campaign,
    ...updates
  };

  saveData();
  return campaignData.campaign;
}

export function updateSettings(updates) {
  campaignData.settings = {
    ...campaignData.settings,
    ...updates,
    dailyTargets: {
      ...campaignData.settings.dailyTargets,
      ...(updates.dailyTargets || {})
    }
  };

  saveData();
  return campaignData.settings;
}

export function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function addRecord(section, record) {
  if (!Array.isArray(campaignData[section])) {
    throw new Error(`Invalid record section: ${section}`);
  }

  const newRecord = {
    id: record.id || createId(),
    createdAt: record.createdAt || new Date().toISOString(),
    ...record
  };

  campaignData[section].unshift(newRecord);

  try {
    saveData();
  } catch (error) {
    campaignData[section].shift();
    throw error;
  }

  return newRecord;
}

export function updateRecord(section, id, updates) {
  const records = campaignData[section];

  if (!Array.isArray(records)) {
    throw new Error(`Invalid record section: ${section}`);
  }

  const index = records.findIndex(item => item.id === id);

  if (index === -1) {
    throw new Error("Record not found.");
  }

  const previous = records[index];

  records[index] = {
    ...previous,
    ...updates,
    id: previous.id
  };

  try {
    saveData();
  } catch (error) {
    records[index] = previous;
    throw error;
  }

  return records[index];
}

export function deleteRecord(section, id) {
  const records = campaignData[section];

  if (!Array.isArray(records)) {
    throw new Error(`Invalid record section: ${section}`);
  }

  const index = records.findIndex(item => item.id === id);

  if (index === -1) {
    return false;
  }

  const removed = records.splice(index, 1)[0];

  try {
    saveData();
  } catch (error) {
    records.splice(index, 0, removed);
    throw error;
  }

  return true;
}

export function findRecord(section, id) {
  const records = campaignData[section];

  if (!Array.isArray(records)) {
    return null;
  }

  return records.find(item => item.id === id) || null;
}

export function exportBackup() {
  const backup = {
    app: "SHOPY FONT First 50 Campaign Coach",
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
  link.download = `shopy-font-campaign-backup-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export async function restoreBackup(file) {
  if (!file) {
    throw new Error("Choose a backup file first.");
  }

  const text = await file.text();
  const parsed = JSON.parse(text);

  const restoredData = parsed.data || parsed;

  if (
    !restoredData ||
    typeof restoredData !== "object" ||
    !Array.isArray(restoredData.prospects) ||
    !Array.isArray(restoredData.activities)
  ) {
    throw new Error("This file is not a valid campaign backup.");
  }

  const previousData = campaignData;
  campaignData = normaliseData(restoredData);

  try {
    saveData();
  } catch (error) {
    campaignData = previousData;
    throw error;
  }

  return campaignData;
}

export function clearCampaignData() {
  const previousData = campaignData;
  campaignData = cloneDefaults();

  try {
    saveData();
  } catch (error) {
    campaignData = previousData;
    throw error;
  }

  return campaignData;
}

export function checkStorage() {
  try {
    const testKey = `${STORAGE_KEY}_test`;
    localStorage.setItem(testKey, "ok");
    localStorage.removeItem(testKey);

    return {
      available: true,
      message: "Browser storage is working."
    };
  } catch (error) {
    return {
      available: false,
      message: "Browser storage is unavailable or full."
    };
  }
   }
     
