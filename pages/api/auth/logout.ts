import { NextApiRequest, NextApiResponse } from "next";
import { executeQuery } from "../../../lib/db-adapter";
import { getUserFromToken } from "../../../lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const user = await getUserFromToken(req);

    if (!user) {
      // Even if user is not found, allow logout to proceed
      console.warn("User not found during logout, proceeding anyway");
      return res.status(200).json({ message: "Logged out successfully" });
    }

    // Try to close user sessions, but don't fail logout if this fails
    try {
      await executeQuery({
        table: "public.sessions",
        action: "update",
        data: {
          status: "inactive",
          end_time: new Date().toISOString(),
        },
        filters: {
          user_id: user.id,
          status: "active",
        },
      });
      console.log("User sessions closed successfully");
    } catch (sessionError) {
      // Log the error but don't fail the logout
      console.error("Error closing sessions (non-critical):", sessionError);
    }

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    // Always return success for logout to ensure client-side cleanup happens
    return res.status(200).json({ message: "Logged out successfully" });
  }
}
