import React, { useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRFIDUsers } from "@/hooks/useIoT";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";

type PendingRFIDEntry = {
  key: string;
  uid: string;
  status?: string;
  request_time?: number;
  device_id?: string;
};

export default function PendingRFIDPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { rfidRequests, rfidUsers } = useRFIDUsers();
  // Log-only: disable approval form

  useEffect(() => {
    if (user && user.role !== "admin") {
      toast.error("Only admin can access this page");
      router.replace("/dashboard");
    }
  }, [user, router]);

  const { pendingList, approvedList } = useMemo(() => {
    // Build entries from rfid_requests
    const entries = Object.entries(rfidRequests || {});
    const mapped: PendingRFIDEntry[] = entries.map(([key, val]) => {
      if (typeof val === "string") {
        return {
          key,
          uid: String(val).toUpperCase(),
          request_time: Number.isNaN(parseInt(key, 10))
            ? Date.now()
            : parseInt(key, 10),
          status: "pending",
        };
      }
      if (val && typeof val === "object") {
        const v = val as Record<string, unknown>;
        const raw =
          (v.uid as string) ||
          (v.user_id as string) ||
          (v.rfid as string) ||
          key;
        const resolvedUid = String(raw || "").toUpperCase();
        return {
          key,
          uid: resolvedUid,
          request_time:
            (typeof v.request_time === "number" &&
              (v.request_time as number)) ||
            (Number.isNaN(parseInt(key, 10)) ? Date.now() : parseInt(key, 10)),
          status: (v.status as string) || "pending",
          device_id: (v.device_id as string) || undefined,
        };
      }
      return {
        key,
        uid: "",
        request_time: Number.isNaN(parseInt(key, 10))
          ? Date.now()
          : parseInt(key, 10),
        status: "pending",
      };
    });

    // De-duplicate by UID keeping most recent
    const byUid = new Map<string, PendingRFIDEntry>();
    mapped
      .filter((m) => m.uid)
      .sort((a, b) => (b.request_time || 0) - (a.request_time || 0))
      .forEach((m) => {
        if (!byUid.has(m.uid)) byUid.set(m.uid, m);
      });

    const approvedSet = new Set(Object.keys(rfidUsers || {}));
    const all = Array.from(byUid.values());
    const approvedList = all
      .filter((m) => approvedSet.has(m.uid))
      .map((m) => ({ ...m, status: "approved" }));
    const pendingList = all.filter((m) => !approvedSet.has(m.uid));

    return { pendingList, approvedList };
  }, [rfidRequests, rfidUsers]);

  // No approval actions in log view

  return (
    <DashboardLayout title="RFID Log">
      <div className="p-4">
        <h1 className="text-2xl font-semibold mb-4">RFID Requests Log</h1>
        <p className="text-gray-600 mb-6">
          Riwayat permintaan RFID dari perangkat (read-only).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-medium mb-2">
              Pending RFID Requests ({pendingList.length} total)
            </h2>
            <div className="border rounded-lg overflow-hidden">
              {pendingList.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No pending RFID requests
                </div>
              ) : (
                <div className="divide-y">
                  {pendingList.map((entry, idx) => (
                    <div
                      key={`${entry.uid}-${idx}`}
                      className="p-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-mono text-lg font-semibold text-blue-600">
                          {entry.uid}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {entry.request_time
                            ? new Date(entry.request_time).toLocaleString(
                                "id-ID",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                }
                              )
                            : "Unknown time"}
                          {entry.device_id && ` • Device: ${entry.device_id}`}
                          <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Pending Approval
                          </span>
                        </div>
                      </div>

                      <span className="text-sm text-gray-400">
                        Awaiting admin action in Users page
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <h2 className="font-medium mb-2">
              Approved / Already Picked ({approvedList.length} total)
            </h2>
            <div className="border rounded-lg overflow-hidden">
              {approvedList.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No approved entries yet
                </div>
              ) : (
                <div className="divide-y">
                  {approvedList.map((entry, idx) => {
                    const approvedUser = rfidUsers?.[entry.uid];
                    return (
                      <div
                        key={`${entry.uid}-approved-${idx}`}
                        className="p-4 flex items-center justify-between hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-mono text-lg font-semibold text-green-700">
                            {entry.uid}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {entry.request_time
                              ? new Date(entry.request_time).toLocaleString(
                                  "id-ID",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  }
                                )
                              : "Unknown time"}
                            {entry.device_id && ` • Device: ${entry.device_id}`}
                            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Approved
                            </span>
                          </div>
                          {approvedUser && (
                            <div className="text-xs text-gray-600 mt-1">
                              Assigned to: {approvedUser.name} (
                              {approvedUser.email})
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-gray-400">
                          Already picked
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Catatan Alur RFID</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              ✅ Perangkat mendeteksi RFID tidak dikenal → membuat request di
              Firebase
            </p>
            <p>
              ✅ Admin membuat user Operator di Users dan memasukkan RFID UID
            </p>
            <p>✅ Sistem mengaktifkan akses RFID + login web</p>
            <p>✅ Perangkat otomatis mengenali RFID yang sudah di-approve</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
