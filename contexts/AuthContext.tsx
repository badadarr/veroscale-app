import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on initial load
    const initAuth = async () => {
      try {
        // Only access localStorage in browser environment
        if (typeof window !== "undefined" && window.localStorage) {
          const token = localStorage.getItem("token");

          if (token) {
            // Set default auth header for axios
            if (axios.defaults.headers.common) {
              axios.defaults.headers.common[
                "Authorization"
              ] = `Bearer ${token}`;
            }

            // Fetch user data from localStorage
            const userData = localStorage.getItem("user");
            if (userData) {
              try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
              } catch (parseError) {
                console.error("Error parsing user data:", parseError);
                // Clear invalid data
                localStorage.removeItem("token");
                localStorage.removeItem("user");
              }
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Safe cleanup for mobile
        if (typeof window !== "undefined" && window.localStorage) {
          try {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          } catch (storageError) {
            console.error("Error cleaning up localStorage:", storageError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);

    try {
      const { data } = await axios.post("/api/auth/login", { email, password });

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

        setUser(data.user);
        toast.success("Login successful");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please check your credentials.");
      throw new Error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);

    try {
      // Try to call logout API, but don't fail if it errors
      try {
        await axios.post("/api/auth/logout");
        console.log("Logout API call successful");
      } catch (apiError) {
        console.warn(
          "Logout API call failed, proceeding with client cleanup:",
          apiError
        );
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always perform client-side cleanup regardless of API call result
      try {
        // Safe localStorage removal for mobile compatibility
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }

        // Safe deletion of axios header
        if (axios.defaults.headers.common) {
          delete axios.defaults.headers.common["Authorization"];
        }

        setUser(null);

        // Navigate to login page
        router.push("/login");

        // Show success message
      } catch (cleanupError) {
        console.error("Error during logout cleanup:", cleanupError);
        // Even if cleanup fails, still navigate to login
        router.push("/login");
        toast.success("Logged out successfully");
      }

      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
