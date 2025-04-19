/**
 * Helper function to fetch data from API with consistent error handling
 */
export async function fetchFromApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiUrl = import.meta.env.VITE_API_URL || "";

  // Add timestamp for GET requests to prevent caching
  let url = `${apiUrl}${endpoint}`;
  if (options.method === undefined || options.method === "GET") {
    // Add a timestamp parameter to bust cache if one doesn't already exist
    if (!url.includes("_t=")) {
      const cacheBuster = `_t=${Date.now()}`;
      url += url.includes("?") ? `&${cacheBuster}` : `?${cacheBuster}`;
    }
  }

  // Create default headers with strong cache control directives
  const defaultHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("bms_auth_token")}`,
    "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
    "X-Request-Time": Date.now().toString(), // Add request time for tracing/debugging
  };

  // Merge provided headers with defaults, ensuring cache control is applied
  const finalHeaders = {
    ...defaultHeaders,
    ...(options.headers || {}),
  };

  // Apply final headers to options
  const finalOptions = {
    ...options,
    headers: finalHeaders,
  };

  try {
    console.log(`API Request: ${url}`, {
      method: finalOptions.method || "GET",
      timestamp: new Date().toISOString(),
    });

    const response = await fetch(url, finalOptions);

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = "";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || response.statusText;
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(`API error (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`Error fetching from ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Helper for admin-specific API endpoints
 * This ensures consistent path handling for all admin operations
 */
export async function fetchFromAdminApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Ensure endpoint starts with '/' but doesn't duplicate it
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  return fetchFromApi<T>(`/admin${normalizedEndpoint}`, options);
}

/**
 * Helper for entity-specific API endpoints (venues, shows, bookings)
 * This provides consistent behavior for regular API endpoints
 */
export async function fetchFromEntityApi<T>(
  entity:
    | "venues"
    | "shows"
    | "bookings"
    | "users"
    | "categories"
    | "price-tiers",
  endpoint: string = "",
  options: RequestInit = {}
): Promise<T> {
  // Ensure endpoint starts with '/' if not empty
  let normalizedEndpoint = endpoint
    ? endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`
    : "";

  // Add timestamp for cache busting if it's a GET request and doesn't already have one
  if (
    (options.method === undefined || options.method === "GET") &&
    !normalizedEndpoint.includes("_t=")
  ) {
    const timestamp = Date.now();
    normalizedEndpoint += normalizedEndpoint.includes("?")
      ? `&_t=${timestamp}`
      : `?_t=${timestamp}`;
  }

  // Enhanced options with stronger cache control
  const enhancedOptions = {
    ...options,
    headers: {
      ...options.headers,
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  };

  return fetchFromApi<T>(`/${entity}${normalizedEndpoint}`, enhancedOptions);
}

/**
 * Delay helper for handling timing issues between mutations and queries
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safely converts any API response to an array
 * If response is already an array, returns it, otherwise returns an empty array
 */
export function ensureArray<T>(data: any): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  // If data is an object with a "data" property that's an array, return that
  if (data && typeof data === "object" && Array.isArray(data.data)) {
    return data.data;
  }

  // If data is an object with a "results" property that's an array, return that
  if (data && typeof data === "object" && Array.isArray(data.results)) {
    return data.results;
  }

  // If data is an object with a property that's an array, return that
  if (data && typeof data === "object") {
    for (const key of [
      "venues",
      "shows",
      "bookings",
      "users",
      "categories",
      "price-tiers",
      "priceTiers",
    ]) {
      if (Array.isArray(data[key])) {
        return data[key];
      }
    }
  }

  // Otherwise return empty array
  console.warn("API response was not an array:", data);
  return [];
}
