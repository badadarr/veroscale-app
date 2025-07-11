import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle, XCircle, AlertTriangle, User } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { auth } from "@/lib/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

export default function FirebaseAuthTest() {
  const [authStatus, setAuthStatus] = useState("unknown");
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setAuthStatus("authenticated");
        setAuthError(null);
      } else {
        setAuthStatus("unauthenticated");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      await signInAnonymously(auth);
      setAuthStatus("authenticated");
    } catch (error) {
      setAuthError(error.message);
      setAuthStatus("error");

      if (error.code === "auth/admin-restricted-operation") {
        setAuthError(
          "Anonymous authentication is not enabled in Firebase Console. Please enable it first."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (authStatus) {
      case "authenticated":
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "error":
        return <XCircle className="h-6 w-6 text-red-600" />;
      case "unauthenticated":
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      default:
        return <User className="h-6 w-6 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (authStatus) {
      case "authenticated":
        return "text-green-600 bg-green-50 border-green-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      case "unauthenticated":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <DashboardLayout title="Firebase Auth Test">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Firebase Authentication Test
          </h1>
          <p className="text-gray-600">
            Test Firebase Anonymous Authentication untuk IoT access
          </p>
        </div>

        {/* Auth Status Card */}
        <Card className={`border-2 ${getStatusColor()}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span>Authentication Status</span>
              </div>
              <span className="text-sm font-normal capitalize">
                {authStatus}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {authStatus === "authenticated" && user && (
              <div className="space-y-2">
                <p className="text-green-700">
                  ✅ Successfully authenticated with Firebase!
                </p>
                <div className="bg-white p-3 rounded border">
                  <p>
                    <strong>User ID:</strong> {user.uid}
                  </p>
                  <p>
                    <strong>Provider:</strong> Anonymous
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {new Date(user.metadata.creationTime).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {authStatus === "unauthenticated" && (
              <div className="space-y-3">
                <p className="text-yellow-700">
                  ⚠️ Not authenticated. IoT data access will be blocked.
                </p>
                <Button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Signing in..." : "Sign In Anonymously"}
                </Button>
              </div>
            )}

            {authStatus === "error" && (
              <div className="space-y-3">
                <p className="text-red-700">❌ Authentication failed</p>
                {authError && (
                  <div className="bg-white p-3 rounded border border-red-200">
                    <p className="text-sm text-red-600">{authError}</p>
                  </div>
                )}
                <Button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? "Retrying..." : "Retry Authentication"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  If Authentication Fails:
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  <li>
                    Open{" "}
                    <a
                      href="https://console.firebase.google.com/"
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      Firebase Console
                    </a>
                  </li>
                  <li>
                    Select project: <strong>timbangan-online-3cd46</strong>
                  </li>
                  <li>
                    Go to <strong>Authentication &gt; Sign-in method</strong>
                  </li>
                  <li>
                    Find <strong>"Anonymous"</strong> provider
                  </li>
                  <li>
                    Click <strong>"Enable"</strong> and save
                  </li>
                  <li>Return here and click "Sign In Anonymously"</li>
                </ol>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  Current Firebase Rules:
                </h3>
                <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-auto">
                  {`{
  "rules": {
    "devices": {
      "$device": {
        "berat_terakhir": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    },
    "rfid_users": {
      ".read": "auth != null",
      ".write": "auth != null" // simplified for testing
    }
  }
}`}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Rules require authentication - Anonymous auth needed for IoT
                  access
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {authStatus === "authenticated" && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">
                ✅ Ready for IoT!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 mb-3">
                Authentication successful! Your IoT components should now work.
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() =>
                    (window.location.href = "/operations/weight-entry")
                  }
                  className="mr-2"
                >
                  Test Weight Entry
                </Button>
                <Button
                  onClick={() => (window.location.href = "/iot-debug")}
                  variant="outline"
                >
                  IoT Debug Page
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
