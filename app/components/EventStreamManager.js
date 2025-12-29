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
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Switch } from "@/app/components/ui/switch";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Separator } from "@/app/components/ui/separator";

export default function EventStreamManager({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
} = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen =
    controlledOnClose !== undefined
      ? (value) => {
          if (!value) controlledOnClose();
        }
      : setInternalIsOpen;
  const [activeTab, setActiveTab] = useState("subscriptions");
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [pinnedEvents, setPinnedEvents] = useState([]);
  const [settings, setSettings] = useState(getNotificationSettings());
  const [showNewSubscription, setShowNewSubscription] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
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
          (e) => !e.seen && e.receivedAt > Date.now() - 60000,
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
    toast.success("Subscription created successfully");
  };

  const handleToggleSubscription = (id, enabled) => {
    updateSubscription(id, { enabled: !enabled });
    toast.success(enabled ? "Subscription paused" : "Subscription started");
  };

  const handleDeleteSubscription = (id) => {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteSubscription(deleteTargetId);
      toast.success("Subscription deleted");
      setDeleteTargetId(null);
    }
    setShowDeleteConfirm(false);
  };

  const handleClearEvents = () => {
    setShowClearConfirm(true);
  };

  const confirmClearEvents = () => {
    clearStoredEvents();
    loadData();
    toast.success("Events cleared");
    setShowClearConfirm(false);
  };

  const handlePinEvent = (eventId) => {
    togglePinEvent(eventId);
    loadData();
    toast.success(isEventPinned(eventId) ? "Event unpinned" : "Event pinned");
  };

  const handleSaveSettings = () => {
    saveNotificationSettings(settings);
    toast.success("Settings saved!");
  };

  const handleRequestNotifications = async () => {
    const permission = await requestNotificationPermission();
    if (permission === "granted") {
      setSettings({ ...settings, desktop: true });
      saveNotificationSettings({ ...settings, desktop: true });
      toast.success("Desktop notifications enabled");
    } else {
      toast.error("Permission denied");
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
    toast.success(`Events exported as ${format.toUpperCase()}`);
  };

  const filteredEvents = events.filter((event) => {
    if (!eventFilter) return true;
    return (
      event.decoded?.eventName
        ?.toLowerCase()
        .includes(eventFilter.toLowerCase()) ||
      event.address?.toLowerCase().includes(eventFilter.toLowerCase()) ||
      event.contractName?.toLowerCase().includes(eventFilter.toLowerCase())
    );
  });

  return (
    <>
      {/* Trigger Button */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="secondary"
        size="sm"
        className="relative"
        title="Event Stream"
      >
        📡 Events
        {notificationBadge > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
          >
            {notificationBadge > 9 ? "9+" : notificationBadge}
          </Badge>
        )}
      </Button>

      {/* Main Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-2xl">
              📡 Event Stream Manager
            </DialogTitle>
            <DialogDescription>
              Real-time event monitoring and notifications
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <TabsList className="mx-6">
              <TabsTrigger value="subscriptions">
                Subscriptions ({subscriptions.length})
              </TabsTrigger>
              <TabsTrigger value="events">Events ({events.length})</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Subscriptions Tab */}
              <TabsContent value="subscriptions" className="mt-4 space-y-4">
                {/* Stats */}
                {stats && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {subscriptions.filter((s) => s.enabled).length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Active
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {stats.totalEvents}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Total Events
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {Object.keys(stats.eventsByName).length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Event Types
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Controls */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowNewSubscription(true)}
                    variant="default"
                  >
                    ➕ New Subscription
                  </Button>
                  <Button onClick={startAll} variant="secondary">
                    ▶️ Start All
                  </Button>
                  <Button onClick={stopAll} variant="secondary">
                    ⏸️ Stop All
                  </Button>
                </div>

                {/* Subscriptions List */}
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : subscriptions.length === 0 ? (
                  <Card>
                    <CardContent className="pt-12 pb-12 text-center">
                      <div className="text-4xl mb-3">📡</div>
                      <CardTitle className="mb-2">
                        No subscriptions yet
                      </CardTitle>
                      <CardDescription>
                        Create a subscription to start monitoring events
                      </CardDescription>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {subscriptions.map((sub) => (
                      <Card key={sub.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold">
                                  {sub.contractName || "All Contracts"}
                                </span>
                                {sub.enabled ? (
                                  <Badge variant="default">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Paused</Badge>
                                )}
                              </div>

                              {sub.address && (
                                <div className="text-sm text-muted-foreground mb-1">
                                  📍 {shortenAddress(sub.address)}
                                </div>
                              )}

                              {sub.eventName && (
                                <div className="text-sm text-muted-foreground mb-1">
                                  📋 Event: {sub.eventName}
                                </div>
                              )}

                              <div className="flex gap-4 text-xs text-muted-foreground mt-2">
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
                              <Button
                                onClick={() =>
                                  handleToggleSubscription(sub.id, sub.enabled)
                                }
                                variant={sub.enabled ? "outline" : "default"}
                                size="sm"
                              >
                                {sub.enabled ? "⏸️ Pause" : "▶️ Start"}
                              </Button>
                              <Button
                                onClick={() => handleDeleteSubscription(sub.id)}
                                variant="destructive"
                                size="sm"
                              >
                                🗑️
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Events Tab */}
              <TabsContent value="events" className="mt-4 space-y-4">
                {/* Controls */}
                <div className="flex gap-2 items-center">
                  <Input
                    type="text"
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                    placeholder="Filter events..."
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleExportEvents("json")}
                    variant="secondary"
                  >
                    📥 JSON
                  </Button>
                  <Button
                    onClick={() => handleExportEvents("csv")}
                    variant="secondary"
                  >
                    📊 CSV
                  </Button>
                  <Button onClick={handleClearEvents} variant="destructive">
                    🗑️ Clear
                  </Button>
                </div>

                {/* Events List */}
                {filteredEvents.length === 0 ? (
                  <Card>
                    <CardContent className="pt-12 pb-12 text-center">
                      <div className="text-4xl mb-3">📋</div>
                      <CardTitle className="mb-2">No events yet</CardTitle>
                      <CardDescription>
                        Events will appear here as they are received
                      </CardDescription>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {filteredEvents.map((event, idx) => {
                      const eventId = `${event.transactionHash}-${event.logIndex}`;
                      const isPinned = isEventPinned(eventId);

                      return (
                        <Card
                          key={`${eventId}-${idx}`}
                          className="hover:border-primary transition-colors"
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-primary">
                                  {event.decoded?.eventName || "Unknown"}
                                </span>
                                {event.contractName && (
                                  <span className="text-xs text-muted-foreground">
                                    ({event.contractName})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => handlePinEvent(eventId)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title={isPinned ? "Unpin" : "Pin"}
                                >
                                  {isPinned ? "📌" : "📍"}
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(
                                    event.receivedAt,
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div>
                                <span className="text-muted-foreground">
                                  Contract:
                                </span>{" "}
                                <Link
                                  href={`/address/${event.address}`}
                                  className="text-primary hover:underline font-mono"
                                >
                                  {shortenAddress(event.address)}
                                </Link>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Tx:
                                </span>{" "}
                                <Link
                                  href={`/tx/${event.transactionHash}`}
                                  className="text-primary hover:underline font-mono"
                                >
                                  {shortenAddress(event.transactionHash, 8)}
                                </Link>
                              </div>
                            </div>

                            {event.decoded?.args && (
                              <div className="bg-muted p-2 rounded text-xs mt-2">
                                <pre className="font-mono overflow-x-auto">
                                  {JSON.stringify(
                                    event.decoded.args,
                                    (_, v) =>
                                      typeof v === "bigint" ? v.toString() : v,
                                    2,
                                  )}
                                </pre>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-4 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable notifications</Label>
                        <div className="text-sm text-muted-foreground">
                          Receive notifications for subscribed events
                        </div>
                      </div>
                      <Switch
                        checked={settings.enabled}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, enabled: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show in-app notifications</Label>
                        <div className="text-sm text-muted-foreground">
                          Display toast notifications within the app
                        </div>
                      </div>
                      <Switch
                        checked={settings.showInApp}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, showInApp: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Play sound</Label>
                        <div className="text-sm text-muted-foreground">
                          Play an audio alert for new events
                        </div>
                      </div>
                      <Switch
                        checked={settings.sound}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, sound: checked })
                        }
                      />
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="space-y-0.5">
                          <Label>Desktop notifications</Label>
                          <div className="text-sm text-muted-foreground">
                            Show browser desktop notifications
                          </div>
                        </div>
                        <Switch
                          checked={settings.desktop}
                          onCheckedChange={(checked) =>
                            setSettings({ ...settings, desktop: checked })
                          }
                        />
                      </div>
                      {settings.desktop &&
                        typeof window !== "undefined" &&
                        "Notification" in window &&
                        Notification.permission !== "granted" && (
                          <Button
                            onClick={handleRequestNotifications}
                            variant="secondary"
                            className="w-full"
                          >
                            Request Permission
                          </Button>
                        )}
                    </div>

                    <Separator />

                    <div>
                      <Label htmlFor="autoClose">Auto-close after (ms)</Label>
                      <Input
                        id="autoClose"
                        type="number"
                        value={settings.autoClose}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            autoClose: parseInt(e.target.value) || 5000,
                          })
                        }
                        className="mt-2"
                      />
                    </div>

                    <Button onClick={handleSaveSettings} className="w-full">
                      Save Settings
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>💡 About Event Streaming</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2 list-disc list-inside text-muted-foreground">
                      <li>
                        Create subscriptions to monitor specific contracts
                      </li>
                      <li>Events are stored locally in your browser</li>
                      <li>Up to 1000 events are kept in history</li>
                      <li>Export events as JSON or CSV anytime</li>
                      <li>Pin important events to save them</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* New Subscription Dialog */}
      <Dialog open={showNewSubscription} onOpenChange={setShowNewSubscription}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Subscription</DialogTitle>
            <DialogDescription>
              Monitor events from specific contracts or all contracts
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubscription} className="space-y-4">
            <div>
              <Label htmlFor="contract-select">
                Contract Address (optional)
              </Label>
              {availableContracts.length > 0 ? (
                <Select
                  value={newSubForm.address}
                  onValueChange={(value) => {
                    const selected = availableContracts.find(
                      (c) => c.address === value,
                    );
                    setNewSubForm({
                      ...newSubForm,
                      address: value,
                      contractName: selected?.name || "",
                    });
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="All Contracts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Contracts</SelectItem>
                    {availableContracts.map((contract) => (
                      <SelectItem
                        key={contract.address}
                        value={contract.address}
                      >
                        {contract.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="contract-address"
                  type="text"
                  value={newSubForm.address}
                  onChange={(e) =>
                    setNewSubForm({ ...newSubForm, address: e.target.value })
                  }
                  placeholder="0x... or leave empty for all"
                  className="font-mono mt-2"
                />
              )}
            </div>

            <div>
              <Label htmlFor="event-name">Event Name (optional)</Label>
              <Input
                id="event-name"
                type="text"
                value={newSubForm.eventName}
                onChange={(e) =>
                  setNewSubForm({ ...newSubForm, eventName: e.target.value })
                }
                placeholder="Transfer, Approval, etc."
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="contract-name">Contract Name (optional)</Label>
              <Input
                id="contract-name"
                type="text"
                value={newSubForm.contractName}
                onChange={(e) =>
                  setNewSubForm({ ...newSubForm, contractName: e.target.value })
                }
                placeholder="MyContract"
                className="mt-2"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="notify-on-event"
                checked={newSubForm.notifyOnEvent}
                onCheckedChange={(checked) =>
                  setNewSubForm({ ...newSubForm, notifyOnEvent: checked })
                }
              />
              <Label htmlFor="notify-on-event">
                Show notifications for events
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewSubscription(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this subscription. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Events Confirmation AlertDialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Events?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all stored events. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearEvents}>
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
