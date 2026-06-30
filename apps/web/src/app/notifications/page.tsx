"use client";

import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  if (isLoading) {
    return <div className="p-8">Loading notifications...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <Button variant="outline" onClick={() => markAllRead.mutate()}>
          Mark all read
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {notifications?.map((notification: any) => (
          <div
            key={notification.id}
            className={`rounded-lg border p-4 ${
              notification.read ? "bg-background" : "bg-muted"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold">{notification.title}</h2>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markRead.mutate(notification.id)}
                >
                  Mark read
                </Button>
              )}
            </div>
          </div>
        ))}
        {notifications?.length === 0 && (
          <p className="text-center text-muted-foreground">No notifications.</p>
        )}
      </div>
    </div>
  );
}
