import { useState, useEffect } from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({
  className = "",
}: NotificationBellProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(() => {
    // No issues to fetch
    setPendingCount(0);
  }, [user]);

  const handleClick = () => {
    // Issues functionality removed
    router.push("/dashboard");
  };

  // Show for all users - but with different functionality based on role
  if (!user) {
    return null;
  }

  return (
    <div
      className={`relative ${className} cursor-pointer`}
      onClick={handleClick}
    >
      <Bell className="w-5 h-5 text-gray-600 transition-colors hover:text-primary-600" />
      {pendingCount > 0 && (
        <span className="absolute flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full -top-2 -right-2">
          {pendingCount > 9 ? "9+" : pendingCount}
        </span>
      )}
      {pendingCount > 0 && (
        <div className="absolute right-0 z-10 px-2 py-1 text-xs text-yellow-800 border border-yellow-200 rounded-md shadow-sm top-6 bg-yellow-50 whitespace-nowrap">
          <AlertTriangle className="inline w-3 h-3 mr-1" />
          {pendingCount} pending issue{pendingCount !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
