// Enhanced Event Streaming Utilities
// Real-time event subscriptions, notifications, and persistence

import { publicClient } from "./viem";
import { decodeLogs } from "./contract-decoder";
import { getAllABIs } from "./abi-store";

// Storage keys
const STORAGE_KEYS = {
  EVENTS: "furnacescout_events",
  SUBSCRIPTIONS: "furnacescout_subscriptions",
  SETTINGS: "furnacescout_event_settings",
  PINNED: "furnacescout_pinned_events",
};

// Maximum stored events (prevent storage overflow)
const MAX_STORED_EVENTS = 1000;

/**
 * Event Subscription Manager
 */
class EventSubscriptionManager {
  constructor() {
    this.subscriptions = new Map();
    this.unwatchFunctions = new Map();
    this.eventHandlers = new Set();
    this.loadSubscriptions();
  }

  /**
   * Load subscriptions from localStorage
   */
  loadSubscriptions() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
      if (stored) {
        const subs = JSON.parse(stored);
        Object.entries(subs).forEach(([id, sub]) => {
          this.subscriptions.set(id, sub);
        });
      }
    } catch (error) {
      console.error("Failed to load subscriptions:", error);
    }
  }

  /**
   * Save subscriptions to localStorage
   */
  saveSubscriptions() {
    try {
      const subs = Object.fromEntries(this.subscriptions);
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
    } catch (error) {
      console.error("Failed to save subscriptions:", error);
    }
  }

  /**
   * Create a new subscription
   */
  async subscribe(options) {
    const {
      id = `sub-${Date.now()}-${Math.random()}`,
      address,
      eventName,
      fromBlock = "latest",
      enabled = true,
      notifyOnEvent = true,
      contractName,
    } = options;

    const subscription = {
      id,
      address: address?.toLowerCase(),
      eventName,
      fromBlock,
      enabled,
      notifyOnEvent,
      contractName,
      createdAt: Date.now(),
      lastEventAt: null,
      eventCount: 0,
    };

    this.subscriptions.set(id, subscription);
    this.saveSubscriptions();

    if (enabled) {
      await this.startWatching(id);
    }

    return subscription;
  }

  /**
   * Start watching a subscription
   */
  async startWatching(subscriptionId) {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub || !sub.enabled) return;

    // Stop existing watch if any
    this.stopWatching(subscriptionId);

    try {
      const watchParams = {
        onLogs: (logs) => this.handleLogs(subscriptionId, logs),
        onError: (error) => this.handleError(subscriptionId, error),
        pollingInterval: 1000,
      };

      // Add address filter if specified
      if (sub.address) {
        watchParams.address = sub.address;
      }

      // Start watching
      const unwatch = publicClient.watchEvent(watchParams);
      this.unwatchFunctions.set(subscriptionId, unwatch);
    } catch (error) {
      console.error(`Failed to start watching subscription ${subscriptionId}:`, error);
    }
  }

  /**
   * Stop watching a subscription
   */
  stopWatching(subscriptionId) {
    const unwatch = this.unwatchFunctions.get(subscriptionId);
    if (unwatch) {
      unwatch();
      this.unwatchFunctions.delete(subscriptionId);
    }
  }

  /**
   * Handle received logs
   */
  handleLogs(subscriptionId, logs) {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) return;

    // Decode logs
    const decodedLogs = decodeLogs(logs);

    // Filter by event name if specified
    let filteredLogs = decodedLogs;
    if (sub.eventName) {
      filteredLogs = decodedLogs.filter(
        (log) =>
          log.decoded?.eventName?.toLowerCase() === sub.eventName.toLowerCase()
      );
    }

    if (filteredLogs.length === 0) return;

    // Update subscription stats
    sub.lastEventAt = Date.now();
    sub.eventCount += filteredLogs.length;
    this.saveSubscriptions();

    // Store events
    storeEvents(
      filteredLogs.map((log) => ({
        ...log,
        subscriptionId,
        contractName: sub.contractName,
        receivedAt: Date.now(),
      }))
    );

    // Notify handlers
    this.notifyHandlers({
      type: "events",
      subscriptionId,
      events: filteredLogs,
      subscription: sub,
    });

    // Show notification if enabled
    if (sub.notifyOnEvent) {
      showEventNotification(filteredLogs, sub);
    }
  }

  /**
   * Handle errors
   */
  handleError(subscriptionId, error) {
    console.error(`Subscription ${subscriptionId} error:`, error);
    this.notifyHandlers({
      type: "error",
      subscriptionId,
      error,
    });
  }

  /**
   * Register event handler
   */
  on(handler) {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Notify all handlers
   */
  notifyHandlers(event) {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error("Event handler error:", error);
      }
    });
  }

  /**
   * Update subscription
   */
  updateSubscription(id, updates) {
    const sub = this.subscriptions.get(id);
    if (!sub) return null;

    const wasEnabled = sub.enabled;
    Object.assign(sub, updates);
    this.saveSubscriptions();

    // Handle enabled state change
    if (updates.enabled !== undefined) {
      if (updates.enabled && !wasEnabled) {
        this.startWatching(id);
      } else if (!updates.enabled && wasEnabled) {
        this.stopWatching(id);
      }
    }

    return sub;
  }

  /**
   * Delete subscription
   */
  deleteSubscription(id) {
    this.stopWatching(id);
    this.subscriptions.delete(id);
    this.saveSubscriptions();
  }

  /**
   * Get all subscriptions
   */
  getAllSubscriptions() {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get subscription by ID
   */
  getSubscription(id) {
    return this.subscriptions.get(id);
  }

  /**
   * Start all enabled subscriptions
   */
  async startAll() {
    for (const [id, sub] of this.subscriptions) {
      if (sub.enabled) {
        await this.startWatching(id);
      }
    }
  }

  /**
   * Stop all subscriptions
   */
  stopAll() {
    for (const id of this.unwatchFunctions.keys()) {
      this.stopWatching(id);
    }
  }

  /**
   * Clear all subscriptions
   */
  clearAll() {
    this.stopAll();
    this.subscriptions.clear();
    this.saveSubscriptions();
  }
}

// Singleton instance
let subscriptionManager = null;

/**
 * Get subscription manager instance
 */
export function getSubscriptionManager() {
  if (typeof window === "undefined") return null;
  if (!subscriptionManager) {
    subscriptionManager = new EventSubscriptionManager();
  }
  return subscriptionManager;
}

/**
 * Store events in localStorage
 */
export function storeEvents(events) {
  if (typeof window === "undefined") return;

  try {
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.EVENTS) || "[]"
    );

    // Add new events
    const allEvents = [...events, ...stored];

    // Trim to max size (keep newest)
    const trimmed = allEvents.slice(0, MAX_STORED_EVENTS);

    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Failed to store events:", error);
  }
}

/**
 * Get stored events
 */
export function getStoredEvents(filters = {}) {
  if (typeof window === "undefined") return [];

  try {
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.EVENTS) || "[]"
    );

    let filtered = stored;

    // Filter by address
    if (filters.address) {
      filtered = filtered.filter(
        (event) =>
          event.address?.toLowerCase() === filters.address.toLowerCase()
      );
    }

    // Filter by event name
    if (filters.eventName) {
      filtered = filtered.filter(
        (event) =>
          event.decoded?.eventName
            ?.toLowerCase()
            .includes(filters.eventName.toLowerCase())
      );
    }

    // Filter by subscription
    if (filters.subscriptionId) {
      filtered = filtered.filter(
        (event) => event.subscriptionId === filters.subscriptionId
      );
    }

    // Filter by date range
    if (filters.fromDate) {
      filtered = filtered.filter(
        (event) => event.receivedAt >= filters.fromDate
      );
    }

    if (filters.toDate) {
      filtered = filtered.filter((event) => event.receivedAt <= filters.toDate);
    }

    // Limit results
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  } catch (error) {
    console.error("Failed to get stored events:", error);
    return [];
  }
}

/**
 * Clear stored events
 */
export function clearStoredEvents() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.EVENTS);
}

/**
 * Get event statistics
 */
export function getEventStats() {
  const events = getStoredEvents();
  const subscriptions = getSubscriptionManager()?.getAllSubscriptions() || [];

  return {
    totalEvents: events.length,
    totalSubscriptions: subscriptions.length,
    activeSubscriptions: subscriptions.filter((s) => s.enabled).length,
    eventsByContract: events.reduce((acc, event) => {
      const addr = event.address?.toLowerCase();
      acc[addr] = (acc[addr] || 0) + 1;
      return acc;
    }, {}),
    eventsByName: events.reduce((acc, event) => {
      const name = event.decoded?.eventName || "Unknown";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {}),
  };
}

/**
 * Pin/unpin event
 */
export function togglePinEvent(eventId) {
  if (typeof window === "undefined") return;

  try {
    const pinned = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.PINNED) || "[]"
    );

    const index = pinned.indexOf(eventId);
    if (index > -1) {
      pinned.splice(index, 1);
    } else {
      pinned.push(eventId);
    }

    localStorage.setItem(STORAGE_KEYS.PINNED, JSON.stringify(pinned));
    return !index > -1;
  } catch (error) {
    console.error("Failed to toggle pin:", error);
    return false;
  }
}

/**
 * Get pinned events
 */
export function getPinnedEvents() {
  if (typeof window === "undefined") return [];

  try {
    const pinned = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.PINNED) || "[]"
    );
    const allEvents = getStoredEvents();

    return allEvents.filter((event) =>
      pinned.includes(`${event.transactionHash}-${event.logIndex}`)
    );
  } catch (error) {
    console.error("Failed to get pinned events:", error);
    return [];
  }
}

/**
 * Check if event is pinned
 */
export function isEventPinned(eventId) {
  if (typeof window === "undefined") return false;

  try {
    const pinned = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.PINNED) || "[]"
    );
    return pinned.includes(eventId);
  } catch (error) {
    return false;
  }
}

/**
 * Notification Settings
 */
export function getNotificationSettings() {
  if (typeof window === "undefined") return getDefaultSettings();

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      return { ...getDefaultSettings(), ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to get notification settings:", error);
  }

  return getDefaultSettings();
}

function getDefaultSettings() {
  return {
    enabled: true,
    sound: false,
    desktop: false,
    showInApp: true,
    autoClose: 5000,
  };
}

export function saveNotificationSettings(settings) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save notification settings:", error);
  }
}

/**
 * Show event notification
 */
export function showEventNotification(events, subscription) {
  const settings = getNotificationSettings();
  if (!settings.enabled) return;

  const eventCount = events.length;
  const eventName = events[0]?.decoded?.eventName || "Event";
  const contractName = subscription.contractName || "Contract";

  // Desktop notification
  if (settings.desktop && "Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(`${contractName} Event`, {
        body: `${eventCount} ${eventName} event${eventCount > 1 ? "s" : ""} received`,
        icon: "/favicon.ico",
        tag: subscription.id,
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }

  // Play sound
  if (settings.sound) {
    playNotificationSound();
  }
}

/**
 * Play notification sound
 */
function playNotificationSound() {
  try {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PWKzn77BdGAg+ltryxnMnBSh+zPDZjT0HGme57OihUBELTKXh8bllHAU2jdXzzn0pBSB1xe/glEILEl+16+ujVRUJR5vd8sFuJAUuhM/z1YU5BhltvezimlAOD1ap5O+0YRoHPJPY88p2KAUme8rx3I4+CRZiuOrkn1ITC0uf4PK8aB8GM4nU8tGALQYeb8Lv45ZFDBBYrOXysF0bCECY3PLEcSYEKoHN8diMOwcZaLrr6aFRDwxOp+Lxtnk"
    );
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  } catch (error) {
    // Ignore audio errors
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Export events as JSON
 */
export function exportEvents(filters = {}) {
  const events = getStoredEvents(filters);
  return JSON.stringify(events, null, 2);
}

/**
 * Export events as CSV
 */
export function exportEventsCSV(filters = {}) {
  const events = getStoredEvents(filters);

  const headers = [
    "Timestamp",
    "Block",
    "Transaction",
    "Contract",
    "Event Name",
    "Arguments",
  ];

  const rows = events.map((event) => [
    new Date(event.receivedAt).toISOString(),
    event.blockNumber?.toString() || "",
    event.transactionHash || "",
    event.address || "",
    event.decoded?.eventName || "Unknown",
    event.decoded?.args
      ? JSON.stringify(event.decoded.args).replace(/,/g, ";")
      : "",
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
}

/**
 * Create quick subscriptions for loaded contracts
 */
export function createSubscriptionsForLoadedContracts() {
  const manager = getSubscriptionManager();
  if (!manager) return [];

  const abis = getAllABIs();
  const created = [];

  for (const [address, data] of Object.entries(abis)) {
    // Check if subscription already exists
    const existing = manager
      .getAllSubscriptions()
      .find((sub) => sub.address === address.toLowerCase());

    if (!existing) {
      const subscription = manager.subscribe({
        address,
        contractName: data.name || "Contract",
        enabled: false, // Don't auto-enable
        notifyOnEvent: true,
      });
      created.push(subscription);
    }
  }

  return created;
}

/**
 * Get real-time event stream (hook-friendly)
 */
export function watchEvents(options, callback) {
  const manager = getSubscriptionManager();
  if (!manager) return () => {};

  // Subscribe to events
  const subscription = manager.subscribe({
    ...options,
    enabled: true,
  });

  // Register callback
  const unregister = manager.on((event) => {
    if (event.subscriptionId === subscription.id) {
      callback(event);
    }
  });

  // Cleanup function
  return () => {
    unregister();
    manager.deleteSubscription(subscription.id);
  };
}
