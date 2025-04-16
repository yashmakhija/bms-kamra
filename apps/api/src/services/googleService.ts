import { OAuth2Client } from "google-auth-library";
import { config } from "../config";
import { GoogleTokenPayload } from "../types";

const client = new OAuth2Client(config.google.clientId);

export const verifyGoogleToken = async (
  token: string
): Promise<GoogleTokenPayload | null> => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return null;
    }

    return {
      email: payload.email,
      name: payload.name || "",
      picture: payload.picture || "",
      sub: payload.sub,
    };
  } catch (error) {
    console.error("Failed to verify Google token:", error);
    return null;
  }
};
