"use client";

import { useState, useEffect } from "react";
import { useEventSubscriptions } from "@/app/hooks/useBlockchain";
import {
  getStoredEvents,
  clearStoredEvents,
  getEventStats,
  getPinnedEvents,
  togglePinEvent,
  isEventPinned,
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  exportEvents,
  exportEventsCSV,
} from "@/lib/event-streaming";
import { getAllABIs } from "@/lib/abi-store";
import { shortenAddress } from "@/lib/viem";
import Link from "next/link";

export default function EventStreamManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("subscriptions"); // subscriptions, events, settings
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [pinnedEvents, setPinnedEvents] = useState([]);
  const [settings, setSettings] = useState(getNotificationSettings());
  const [showNewSubscription, setShowNewSubscription] = useState(false);
  const [newSubForm, setNewSubForm] = useState({
    address: "",
    eventName: "",
    contractName: "",
    notifyOnEvent: true,
  });
  const [availableContracts, setAvailableContracts] = useState([]);
  const [eventFilter, setEventFilter] = useState("");
  const [notificationBadge, setNotificationBadge] = useState(0);

  const {
    subscriptions,
    loading,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    startAll,
    stopAll,
    refresh,
  } = useEventSubscriptions();

  // Load data
  useEffect(() => {
    if (typeof window !== "undefined") {
      loadData();

      // Set up interval to update badge
      const interval = setInterval(() => {
        const recentEvents = getStoredEvents({ limit: 100 });
        const unseenCount = recentEvents.filter(
          (e) => !e.seen && e.receivedAt > Date.now() - 60000
        ).length;
        setNotificationBadge(unseenCount);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  // Refresh when subscriptions change
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [subscriptions, isOpen]);

  const loadData = () => {
    const allEvents = getStoredEvents();
    setEvents(allEvents);
    setStats(getEventStats());
    setPinnedEvents(getPinnedEvents());

    const abis = getAllABIs();
    const contracts = Object.entries(abis).map(([addr, data]) => ({
      address: addr,
      name: data.name || "Unnamed Contract",
    }));
    setAvailableContracts(contracts);
  };

  const handleCreateSubscription = async (e) => {
    e.preventDefault();

    await createSubscription({
      address: newSubForm.address || undefined,
      eventName: newSubForm.eventName || undefined,
      contractName: newSubForm.contractName || undefined,
      notifyOnEvent: newSubForm.notifyOnEvent,
      enabled: true,
    });

    setNewSubForm({
      address: "",
      eventName: "",
      contractName: "",
      notifyOnEvent: true,
    });
    setShowNewSubscription(false);
    refresh();
  };

  const handleToggleSubscription = (id, enabled) => {
    updateSubscription(id, { enabled: !enabled });
  };

  const handleDeleteSubscription = (id) => {
    if (confirm("Delete this subscription?")) {
      deleteSubscription(id);
    }
  };

  const handleClearEvents = () => {
    if (confirm("Clear all stored events? This cannot be undone.")) {
      clearStoredEvents();
      loadData();
    }
  };

  const handlePinEvent = (eventId) => {
    togglePinEvent(eventId);
    loadData();
  };

  const handleSaveSettings = () => {
    saveNotificationSettings(settings);
    alert("Settings saved!");
  };

  const handleRequestNotifications = async () => {
    const permission = await requestNotificationPermission();
    if (permission === "granted") {
      setSettings({ ...settings, desktop: true });
      saveNotificationSettings({ ...settings, desktop: true });
    }
  };

  const handleExportEvents = (format = "json") => {
    const data = format === "json" ? exportEvents() : exportEventsCSV();
    const blob = new Blob([data], {
      type: format === "json" ? "application/json" : "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `events-${Date.now()}.${format}`;
    a.click();
  };

  const filteredEvents = events.filter((event) => {
    if (!eventFilter) return true;
    return (
      event.decoded?.eventName?.toLowerCase().includes(eventFilter.toLowerCase()) ||
      event.address?.toLowerCase().includes(eventFilter.toLowerCase()) ||
      event.contractName?.toLowerCase().includes(eventFilter.toLowerCase())
    );
  });

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded font-semibold text-sm transition-colors"
        title="Event Stream"
      >
        📡 Events
        {notificationBadge > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {notificationBadge > 9 ? "9+" : notificationBadge}
          </span>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  📡 Event Stream Manager
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Real-time event monitoring and notifications
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-6 pt-4 border-b border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setActiveTab("subscriptions")}
                className={`px-4 py-2 rounded-t font-semibold text-sm transition-colors ${
                  activeTab === "subscriptions"
                    ? "bg-red-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                Subscriptions ({subscriptions.length})
              </button>
              <button
                onClick={() => setActiveTab("events")}
                className={`px-4 py-2 rounded-t font-semibold text-sm transition-colors ${
                  activeTab === "events"
                    ? "bg-red-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                Events ({events.length})
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`px-4 py-2 rounded-t font-semibold text-sm transition-colors ${
                  activeTab === "settings"
                    ? "bg-red-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                Settings
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Subscriptions Tab */}
              {activeTab === "subscriptions" && (
                <div className="space-y-4">
                  {/* Stats */}
                  {stats && (
                    <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {subscriptions.filter((s) => s.enabled).length}
                        </div>
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          Active
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {stats.totalEvents}
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300">
                          Total Events
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {Object.keys(stats.eventsByName).length}
                        </div>
                        <div className="text-xs text-purple-700 dark:text-purple-300">
                          Event Types
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Controls */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowNewSubscription(true)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold text-sm transition-colors"
                    >
                      ➕ New Subscription
                    </button>
                    <button
                      onClick={startAll}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold text-sm transition-colors"
                    >
                      ▶️ Start All
                    </button>
                    <button
                      onClick={stopAll}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded font-semibold text-sm transition-colors"
                    >
                      ⏸️ Stop All
                    </button>
                  </div>

                  {/* Subscriptions List */}
                  {loading ? (
                    <div className="text-center py-12 text-zinc-500">
                      Loading subscriptions...
                    </div>
                  ) : subscriptions.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                      <div className="text-4xl mb-3">📡</div>
                      <div className="font-semibold mb-1">
                        No subscriptions yet
                      </div>
                      <div className="text-sm">
                        Create a subscription to start monitoring events
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subscriptions.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                  {sub.contractName || "All Contracts"}
                                </span>
                                {sub.enabled ? (
                                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                                    Active
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs rounded">
                                    Paused
                                  </span>
                                )}
                              </div>

                              {sub.address && (
                                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                                  📍 {shortenAddress(sub.address)}
                                </div>
                              )}

                              {sub.eventName && (
                                <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                                  📋 Event: {sub.eventName}
                                </div>
                              )}

                              <div className="flex gap-4 text-xs text-zinc-500 mt-2">
                                <span>Events: {sub.eventCount}</span>
                                <span>
                                  Created:{" "}
                                  {new Date(sub.createdAt).toLocaleDateString()}
                                </span>
                                {sub.lastEventAt && (
                                  <span>
                                    Last event:{" "}
                                    {new Date(sub.lastEventAt).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleToggleSubscription(sub.id, sub.enabled)
                                }
                                className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                                  sub.enabled
                                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200"
                                    : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200"
                                }`}
                              >
                                {sub.enabled ? "⏸️ Pause" : "▶️ Start"}
                              </button>
                              <button
                                onClick={() => handleDeleteSubscription(sub.id)}
                                className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm font-semibold hover:bg-red-200 transition-colors"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Events Tab */}
              {activeTab === "events" && (
                <div className="space-y-4">
                  {/* Controls */}
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={eventFilter}
                      onChange={(e) => setEventFilter(e.target.value)}
                      placeholder="Filter events..."
                      className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                    />
                    <button
                      onClick={() => handleExportEvents("json")}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold text-sm transition-colors"
                    >
                      📥 JSON
                    </button>
                    <button
                      onClick={() => handleExportEvents("csv")}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold text-sm transition-colors"
                    >
                      📊 CSV
                    </button>
                    <button
                      onClick={handleClearEvents}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-semibold text-sm transition-colors"
                    >
                      🗑️ Clear
                    </button>
                  </div>

                  {/* Events List */}
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                      <div className="text-4xl mb-3">📋</div>
                      <div className="font-semibold mb-1">No events yet</div>
                      <div className="text-sm">
                        Events will appear here as they are received
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {filteredEvents.map((event, idx) => {
                        const eventId = `${event.transactionHash}-${event.logIndex}`;
                        const isPinned = isEventPinned(eventId);

                        return (
                          <div
                            key={`${eventId}-${idx}`}
                            className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-red-500 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-red-600 dark:text-red-400">
                                  {event.decoded?.eventName || "Unknown"}
                                </span>
                                {event.contractName && (
                                  <span className="text-xs text-zinc-500">
                                    ({event.contractName})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handlePinEvent(eventId)}
                                  className="text-lg hover:scale-110 transition-transform"
                                  title={isPinned ? "Unpin" : "Pin"}
                                >
                                  {isPinned ? "📌" : "📍"}
                                </button>
                                <span className="text-xs text-zinc-500">
                                  {new Date(event.receivedAt).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div>
                                <span className="text-zinc-500">Contract:</span>{" "}
                                <Link
                                  href={`/address/${event.address}`}
                                  className="text-red-500 hover:underline font-mono"
                                >
                                  {shortenAddress(event.address)}
                                </Link>
                              </div>
                              <div>
                                <span className="text-zinc-500">Tx:</span>{" "}
                                <Link
                                  href={`/tx/${event.transactionHash}`}
                                  className="text-red-500 hover:underline font-mono"
                                >
                                  {shortenAddress(event.transactionHash, 8)}
                                </Link>
                              </div>
                            </div>

                            {event.decoded?.args && (
                              <div className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded text-xs">
                                <pre className="font-mono overflow-x-auto">
                                  {JSON.stringify(
                                    event.decoded.args,
                                    (_, v) =>
                                      typeof v === "bigint" ? v.toString() : v,
                                    2
                                  )}
                                </pre>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === "settings" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-6">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                      Notification Settings
                    </h3>

                    <div className="space-y-4">
                      <label className="flex items-center justify-between">
                        <span className="text-zinc-700 dark:text-zinc-300">
                          Enable notifications
                        </span>
                        <input
                          type="checkbox"
                          checked={settings.enabled}
                          onChange={(e) =>
                            setSettings({ ...settings, enabled: e.target.checked })
                          }
                          className="w-5 h-5"
                        />
                      </label>

                      <label className="flex items-center justify-between">
                        <span className="text-zinc-700 dark:text-zinc-300">
                          Show in-app notifications
                        </span>
                        <input
                          type="checkbox"
                          checked={settings.showInApp}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              showInApp: e.target.checked,
                            })
                          }
                          className="w-5 h-5"
                        />
                      </label>

                      <label className="flex items-center justify-between">
                        <span className="text-zinc-700 dark:text-zinc-300">
                          Play sound
                        </span>
                        <input
                          type="checkbox"
                          checked={settings.sound}
                          onChange={(e) =>
                            setSettings({ ...settings, sound: e.target.checked })
                          }
                          className="w-5 h-5"
                        />
                      </label>

                      <div>
                        <label className="flex items-center justify-between mb-2">
                          <span className="text-zinc-700 dark:text-zinc-300">
                            Desktop notifications
                          </span>
                          <input
                            type="checkbox"
                            checked={settings.desktop}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                desktop: e.target.checked,
                              })
                            }
                            className="w-5 h-5"
                          />
                        </label>
                        {settings.desktop &&
                          typeof window !== "undefined" &&
                          "Notification" in window &&
                          Notification.permission !== "granted" && (
                            <button
                              onClick={handleRequestNotifications}
                              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-semibold text-sm transition-colors"
                            >
                              Request Permission
                            </button>
                          )}
                      </div>

                      <div>
                        <label className="block text-zinc-700 dark:text-zinc-300 mb-2">
                          Auto-close after (ms)
                        </label>
                        <input
                          type="number"
                          value={settings.autoClose}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              autoClose: parseInt(e.target.value) || 5000,
                            })
                          }
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveSettings}
                      className="w-full mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold transition-colors"
                    >
                      Save Settings
                    </button>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                    <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      💡 About Event Streaming
                    </div>
                    <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-1 list-disc list-inside">
                      <li>Create subscriptions to monitor specific contracts</li>
                      <li>Events are stored locally in your browser</li>
                      <li>Up to {1000} events are kept in history</li>
                      <li>Export events as JSON or CSV anytime</li>
                      <li>Pin important events to save them</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Subscription Modal */}
      {showNewSubscription && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Create Subscription
            </h3>

            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Contract Address (optional)
                </label>
                {availableContracts.length > 0 ? (
                  <select
                    value={newSubForm.address}
                    onChange={(e) => {
                      const selected = availableContracts.find(
                        (c) => c.address === e.target.value
                      );
                      setNewSubForm({
                        ...newSubForm,
                        address: e.target.value,
                        contractName: selected?.name || "",
                      });
                    }}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">All Contracts</option>
                    {availableContracts.map((contract) => (
                      <option key={contract.address} value={contract.address}>
                        {contract.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newSubForm.address}
                    onChange={(e) =>
                      setNewSubForm({ ...newSubForm, address: e.target.value })
                    }
                    placeholder="0x... or leave empty for all"
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Event Name (optional)
                </label>
                <input
                  type="text"
                  value={newSubForm.eventName}
                  onChange={(e) =>
                    setNewSubForm({ ...newSubForm, eventName: e.target.value })
                  }
                  placeholder="Transfer, Approval, etc."
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Contract Name (optional)
                </label>
                <input
                  type="text"
                  value={newSubForm.contractName}
                  onChange={(e) =>
                    setNewSubForm({
                      ...newSubForm,
                      contractName: e.target.value,
                    })
                  }
                  placeholder="MyContract"
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newSubForm.notifyOnEvent}
                  onChange={(e) =>
                    setNewSubForm({
                      ...newSubForm,
                      notifyOnEvent: e.target.checked,
                    })
                  }
                  className="w-5 h-5"
                />
                <span className="text-zinc-700 dark:text-zinc-300 text-sm">
                  Show notifications for events
                </span>
              </label>

              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewSubscription(false)}
                  className="flex-1 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-semibold transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
