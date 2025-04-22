import axios, { AxiosError, AxiosInstance } from "axios";
import { API_CONFIG, ENDPOINTS, STORAGE_KEYS } from "./config";
import {
  AuthResponse,
  Booking,
  BookingStatus,
  ChangePasswordRequest,
  CreateBookingRequest,
  DeleteAccountRequest,
  GoogleLoginRequest,
  LoginRequest,
  PhoneOtpRequest,
  ProcessPaymentRequest,
  RazorpayOrderResponse,
  RazorpayStatusResponse,
  RazorpayVerifyRequest,
  RegisterRequest,
  UpdateProfileRequest,
  User,
  VerifyAuthResponse,
  VerifyOtpRequest,
  Show,
  ShowCreateInput,
  Event,
  EventCreateInput,
  Showtime,
  ShowtimeCreateInput,
  Category,
  CategoryCreateInput,
  PriceTier,
  PriceTierCreateInput,
  SeatSection,
  SeatSectionCreateInput,
  Venue,
  VenueCreateInput,
  UpdateEventInput,
  UpdateShowtimeInput,
  UpdateSeatSectionInput,
  UpdateVenueInput,
  UpdatePriceTierInput,
  UpdateCategoryInput,
  PriceTierCreateWithTypeInput,
} from "./types";

/**
 * API Client for BMS application
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: API_CONFIG.headers,
    });

    // Add authentication interceptor
    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ----- Auth Methods -----

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      ENDPOINTS.auth.register,
      data
    );
    this.handleAuthResponse(response.data);
    return response.data;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      ENDPOINTS.auth.login,
      data
    );
    this.handleAuthResponse(response.data);
    return response.data;
  }

  async googleLogin(data: GoogleLoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      ENDPOINTS.auth.google,
      data
    );
    this.handleAuthResponse(response.data);
    return response.data;
  }

  async requestPhoneOtp(
    data: PhoneOtpRequest
  ): Promise<{ message: string; code?: string }> {
    const response = await this.client.post<{ message: string; code?: string }>(
      ENDPOINTS.auth.phoneRequestOtp,
      data
    );
    return response.data;
  }

  async verifyPhoneOtp(data: VerifyOtpRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      ENDPOINTS.auth.phoneVerifyOtp,
      data
    );
    this.handleAuthResponse(response.data);
    return response.data;
  }

  async verifyAuth(): Promise<VerifyAuthResponse> {
    try {
      const response = await this.client.get<VerifyAuthResponse>(
        ENDPOINTS.auth.verify
      );
      return response.data;
    } catch (error) {
      return { authenticated: false };
    }
  }

  // ----- User Methods -----

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>(ENDPOINTS.user.me);
    return response.data;
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await this.client.put<User>(ENDPOINTS.user.profile, data);
    return response.data;
  }

  async changePassword(
    data: ChangePasswordRequest
  ): Promise<{ message: string }> {
    const response = await this.client.post<{ message: string }>(
      ENDPOINTS.user.changePassword,
      data
    );
    return response.data;
  }

  async deleteAccount(
    data: DeleteAccountRequest
  ): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(
      ENDPOINTS.user.deleteAccount,
      { data }
    );
    return response.data;
  }

  // ----- Booking Methods -----

  async createBooking(data: CreateBookingRequest): Promise<Booking> {
    const response = await this.client.post<Booking>(
      ENDPOINTS.booking.create,
      data
    );
    return response.data;
  }

  async getUserBookings(): Promise<Booking[]> {
    const response = await this.client.get<Booking[]>(
      ENDPOINTS.booking.getUserBookings
    );
    return response.data;
  }

  async getBookingById(id: string): Promise<Booking> {
    const response = await this.client.get<Booking>(
      ENDPOINTS.booking.getById(id)
    );
    return response.data;
  }

  async cancelBooking(
    id: string
  ): Promise<{ success: boolean; booking: Booking }> {
    const response = await this.client.post<{
      success: boolean;
      booking: Booking;
    }>(ENDPOINTS.booking.cancel(id));
    return response.data;
  }

  async processPayment(
    id: string,
    data: ProcessPaymentRequest
  ): Promise<{ success: boolean; booking: Booking }> {
    const response = await this.client.post<{
      success: boolean;
      booking: Booking;
    }>(ENDPOINTS.booking.payment(id), data);
    return response.data;
  }

  // ----- Razorpay Methods -----

  async getRazorpayStatus(): Promise<RazorpayStatusResponse> {
    try {
      const response = await this.client.get<RazorpayStatusResponse>(
        ENDPOINTS.razorpay.status
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get Razorpay status:", error);
      return {
        status: "not_configured",
        keyId: null,
        webhookConfigured: false,
        environment: "unknown",
      };
    }
  }

  async createRazorpayOrder(bookingId: string): Promise<RazorpayOrderResponse> {
    // Validate input
    if (!bookingId) {
      throw new Error("Booking ID is required to create Razorpay order");
    }

    // Initialize retry counter and import MAX_RETRIES from config
    let retryCount = 0;
    const MAX_RETRIES = 3; // Match the value in RAZORPAY_CONFIG
    const RETRY_DELAY = 2000;

    const executeRequest = async (): Promise<RazorpayOrderResponse> => {
      try {
        console.log(
          `Creating Razorpay order for booking: ${bookingId} (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})`
        );

        // Ensure authentication token exists
        const token = this.getToken();
        if (!token) {
          console.error(
            "No authentication token available. Please log in again."
          );
          throw new Error("Authentication required. Please log in again.");
        }

        // Make API call
        const response = await this.client.post<{
          status: string;
          message?: string;
          data?: RazorpayOrderResponse;
        }>(
          ENDPOINTS.razorpay.createOrder(bookingId),
          {},
          {
            timeout: 10000, // 10 seconds timeout
          }
        );

        // Check if the response is successful and contains data
        if (
          response.data.status === "success" &&
          response.data.data &&
          response.data.data.orderId
        ) {
          return response.data.data;
        }

        // If we got here, we have a response but it's not what we expected
        const errorMessage =
          response.data?.message || "Failed to create Razorpay order";
        console.error("Razorpay order creation failed:", errorMessage);
        throw new Error(errorMessage);
      } catch (error: any) {
        // Handle axios errors
        if (error.response) {
          // The server responded with a status code outside the 2xx range
          if (
            (error.response.status === 403 || error.response.status === 401) &&
            retryCount < MAX_RETRIES
          ) {
            console.error(
              `Authentication error for Razorpay. Attempt ${retryCount + 1}/${MAX_RETRIES}. Trying to restore session...`
            );

            // Try to refresh auth state if possible
            try {
              const authState = await this.verifyAuth();
              if (!authState.authenticated) {
                throw new Error(
                  "Authentication session expired. Please log in again to continue with payment."
                );
              }

              // Increment retry counter
              retryCount++;

              // Wait before retry
              await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));

              // Try again
              return executeRequest();
            } catch (authError) {
              console.error("Failed to restore authentication:", authError);
              throw new Error(
                "Authentication session expired. Please log in again to continue with payment."
              );
            }
          }

          const errorMessage =
            error.response.data?.message ||
            `Error ${error.response.status}: Failed to create Razorpay order`;
          console.error("Razorpay order creation error:", errorMessage);
          throw new Error(errorMessage);
        } else if (error.request) {
          // The request was made but no response was received
          console.error("Razorpay order creation error: No response received");
          throw new Error(
            "Payment gateway not responding. Please try again later."
          );
        } else {
          // Something happened in setting up the request
          console.error(
            "Razorpay order creation error:",
            error.message || error
          );
          throw new Error(error.message || "Failed to create payment order");
        }
      }
    };

    // Start the first attempt
    return executeRequest();
  }

  async verifyRazorpayPayment(
    bookingId: string,
    data: RazorpayVerifyRequest
  ): Promise<{ status: string; message?: string }> {
    // Validate inputs
    if (!bookingId) {
      throw new Error("Booking ID is required to verify payment");
    }

    if (
      !data.razorpayPaymentId ||
      !data.razorpayOrderId ||
      !data.razorpaySignature
    ) {
      throw new Error(
        "Payment verification requires payment ID, order ID, and signature"
      );
    }

    try {
      const response = await this.client.post<{
        status: string;
        message?: string;
      }>(ENDPOINTS.razorpay.verifyPayment(bookingId), data, {
        timeout: 15000, // 15 seconds timeout for payment verification
      });

      return response.data;
    } catch (error: any) {
      // Handle axios errors with detailed logging
      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          `Payment verification failed with status ${error.response.status}`;
        console.error("Razorpay payment verification error:", errorMessage);
        throw new Error(errorMessage);
      } else if (error.request) {
        console.error(
          "Razorpay payment verification error: No response received"
        );
        throw new Error(
          "Payment verification timed out. Please check your booking status."
        );
      } else {
        console.error(
          "Razorpay payment verification error:",
          error.message || error
        );
        throw new Error(error.message || "Failed to verify payment");
      }
    }
  }

  // ----- Auth Utilities -----

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
  }

  private handleAuthResponse(data: AuthResponse): void {
    if (data.token) {
      localStorage.setItem(STORAGE_KEYS.token, data.token);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
    }
  }

  getStoredUser(): User | null {
    const userJson = localStorage.getItem(STORAGE_KEYS.user);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson) as User;
    } catch (error) {
      return null;
    }
  }

  private getToken(): string | null {
    // For browser environment
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.token);
    }
    // For non-browser environment (SSR)
    return null;
  }

  // ----- Show Management Methods -----

  async getAllShows(
    page = 1,
    limit = 10
  ): Promise<{ shows: Show[]; total: number; page: number; limit: number }> {
    const response = await this.client.get<{
      shows: Show[];
      total: number;
      page: number;
      limit: number;
    }>(`${ENDPOINTS.shows.getAll}?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getShowById(id: string): Promise<Show> {
    const response = await this.client.get<Show>(ENDPOINTS.shows.getById(id));
    return response.data;
  }

  async createShow(data: ShowCreateInput): Promise<Show> {
    const response = await this.client.post<Show>(ENDPOINTS.shows.create, data);
    return response.data;
  }

  async updateShow(id: string, data: Partial<ShowCreateInput>): Promise<Show> {
    const response = await this.client.put<Show>(
      ENDPOINTS.shows.update(id),
      data
    );
    return response.data;
  }

  async deleteShow(id: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(
      ENDPOINTS.shows.delete(id)
    );
    return response.data;
  }

  // ----- Event Methods -----

  async getEventsByShowId(showId: string): Promise<Event[]> {
    const response = await this.client.get<Event[]>(
      ENDPOINTS.events.getByShow(showId)
    );
    return response.data;
  }

  async getEventById(id: string): Promise<Event> {
    const response = await this.client.get<Event>(ENDPOINTS.events.getById(id));
    return response.data;
  }

  async createEvent(data: EventCreateInput): Promise<Event> {
    const response = await this.client.post<Event>(
      ENDPOINTS.shows.createEvent,
      data
    );
    return response.data;
  }

  async updateEvent(id: string, data: UpdateEventInput): Promise<Event> {
    const response = await this.client.put<Event>(
      ENDPOINTS.events.update(id),
      data
    );
    return response.data;
  }

  async deleteEvent(id: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(
      ENDPOINTS.events.delete(id)
    );
    return response.data;
  }

  // ----- Showtime Methods -----

  async getShowtimesByEventId(eventId: string): Promise<Showtime[]> {
    const response = await this.client.get<Showtime[]>(
      ENDPOINTS.showtimes.getByEvent(eventId)
    );
    return response.data;
  }

  async getShowtimeById(id: string): Promise<Showtime> {
    const response = await this.client.get<Showtime>(
      ENDPOINTS.showtimes.getById(id)
    );
    return response.data;
  }

  async createShowtime(data: ShowtimeCreateInput): Promise<Showtime> {
    const response = await this.client.post<Showtime>(
      ENDPOINTS.shows.createShowtime,
      data
    );
    return response.data;
  }

  async updateShowtime(
    id: string,
    data: UpdateShowtimeInput
  ): Promise<Showtime> {
    const response = await this.client.put<Showtime>(
      ENDPOINTS.showtimes.update(id),
      data
    );
    return response.data;
  }

  async deleteShowtime(id: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(
      ENDPOINTS.showtimes.delete(id)
    );
    return response.data;
  }

  // ----- Category Methods -----

  async getAllCategories(
    page = 1,
    limit = 10
  ): Promise<{
    categories: Category[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await this.client.get<{
      categories: Category[];
      total: number;
      page: number;
      limit: number;
    }>(`${ENDPOINTS.categories.getAll}?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getCategoryById(id: string): Promise<Category> {
    const response = await this.client.get<Category>(
      ENDPOINTS.categories.getById(id)
    );
    return response.data;
  }

  async getCategoriesByType(type: string): Promise<Category[]> {
    const response = await this.client.get<Category[]>(
      ENDPOINTS.categories.getByType(type)
    );
    return response.data;
  }

  async createCategory(data: CategoryCreateInput): Promise<Category> {
    const response = await this.client.post<Category>(
      ENDPOINTS.categories.create,
      data
    );
    return response.data;
  }

  async updateCategory(
    id: string,
    data: UpdateCategoryInput
  ): Promise<Category> {
    const response = await this.client.put<Category>(
      ENDPOINTS.categories.update(id),
      data
    );
    return response.data;
  }

  async deleteCategory(id: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(
      ENDPOINTS.categories.delete(id)
    );
    return response.data;
  }

  // ----- Price Tier Methods -----

  async getAllPriceTiers(
    page = 1,
    limit = 10,
    showId?: string
  ): Promise<{
    priceTiers: PriceTier[];
    total: number;
    page: number;
    limit: number;
  }> {
    let url = `${ENDPOINTS.priceTiers.getAll}?page=${page}&limit=${limit}`;
    if (showId) url += `&showId=${showId}`;

    const response = await this.client.get<{
      priceTiers: PriceTier[];
      total: number;
      page: number;
      limit: number;
    }>(url);
    return response.data;
  }

  async getPriceTierById(id: string): Promise<PriceTier> {
    const response = await this.client.get<PriceTier>(
      ENDPOINTS.priceTiers.getById(id)
    );
    return response.data;
  }

  async getPriceTiersByShowId(showId: string): Promise<PriceTier[]> {
    const response = await this.client.get<PriceTier[]>(
      ENDPOINTS.priceTiers.getByShow(showId)
    );
    return response.data;
  }

  async createPriceTier(data: PriceTierCreateInput): Promise<PriceTier> {
    const response = await this.client.post<PriceTier>(
      ENDPOINTS.priceTiers.create,
      data
    );
    return response.data;
  }

  async createPriceTierWithType(
    data: PriceTierCreateWithTypeInput
  ): Promise<PriceTier> {
    const response = await this.client.post<PriceTier>(
      ENDPOINTS.priceTiers.create,
      data
    );
    return response.data;
  }

  async updatePriceTier(
    id: string,
    data: UpdatePriceTierInput
  ): Promise<PriceTier> {
    const response = await this.client.put<PriceTier>(
      ENDPOINTS.priceTiers.update(id),
      data
    );
    return response.data;
  }

  async deletePriceTier(id: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(
      ENDPOINTS.priceTiers.delete(id)
    );
    return response.data;
  }

  // ----- Seat Section Methods -----

  async getSeatSectionById(id: string): Promise<SeatSection> {
    const response = await this.client.get<SeatSection>(
      ENDPOINTS.seatSections.getById(id)
    );
    return response.data;
  }

  async getSeatSectionsByShowtimeId(
    showtimeId: string
  ): Promise<SeatSection[]> {
    const response = await this.client.get<SeatSection[]>(
      ENDPOINTS.seatSections.getByShowtime(showtimeId)
    );
    return response.data;
  }

  /**
   * Create a seat section using the dedicated /seat-sections endpoint
   * Note: For creating sections when setting up a show, use createSeatSectionViaShow instead
   */
  async createSeatSection(data: SeatSectionCreateInput): Promise<SeatSection> {
    const response = await this.client.post<SeatSection>(
      ENDPOINTS.seatSections.create,
      data
    );
    return response.data;
  }

  async updateSeatSection(
    id: string,
    data: UpdateSeatSectionInput
  ): Promise<SeatSection> {
    const response = await this.client.put<SeatSection>(
      ENDPOINTS.seatSections.update(id),
      data
    );
    return response.data;
  }

  async deleteSeatSection(id: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(
      ENDPOINTS.seatSections.delete(id)
    );
    return response.data;
  }

  // ----- Venue Methods -----

  async getAllVenues(): Promise<Venue[]> {
    const response = await this.client.get<Venue[]>(ENDPOINTS.venues.getAll);
    return response.data;
  }

  async getVenueById(id: string): Promise<Venue> {
    const response = await this.client.get<Venue>(ENDPOINTS.venues.getById(id));
    return response.data;
  }

  async createVenue(data: VenueCreateInput): Promise<Venue> {
    const response = await this.client.post<Venue>(
      ENDPOINTS.venues.create,
      data
    );
    return response.data;
  }

  async updateVenue(id: string, data: UpdateVenueInput): Promise<Venue> {
    const response = await this.client.post<Venue>(
      ENDPOINTS.venues.update(id),
      data
    );
    return response.data;
  }

  async deleteVenue(id: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(
      ENDPOINTS.venues.delete(id)
    );
    return response.data;
  }

  // ----- Admin Methods -----

  async getAllBookings(
    page = 1,
    limit = 20,
    status?: string,
    userId?: string,
    showId?: string
  ): Promise<{
    bookings: Booking[];
    total: number;
    page: number;
    limit: number;
  }> {
    let url = `${ENDPOINTS.admin.getAllBookings}?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (userId) url += `&userId=${userId}`;
    if (showId) url += `&showId=${showId}`;

    const response = await this.client.get<{
      bookings: Booking[];
      total: number;
      page: number;
      limit: number;
    }>(url);
    return response.data;
  }

  async getAllUsers(
    page = 1,
    limit = 20
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await this.client.get<{
      users: User[];
      total: number;
      page: number;
      limit: number;
    }>(`${ENDPOINTS.admin.getAllUsers}?page=${page}&limit=${limit}`);
    return response.data;
  }

  // ----- Admin Analytics Methods -----

  async getDashboardStats(): Promise<{
    totalBookings: number;
    totalRevenue: number;
    totalUsers: number;
    recentBookings: Booking[];
    upcomingShows: Show[];
  }> {
    const response = await this.client.get<{
      totalBookings: number;
      totalRevenue: number;
      totalUsers: number;
      recentBookings: Booking[];
      upcomingShows: Show[];
    }>(ENDPOINTS.admin.getDashboardStats);
    return response.data;
  }

  async getBookingAnalytics(
    startDate?: string,
    endDate?: string
  ): Promise<{
    dailyBookings: { date: string; count: number }[];
    bookingsByStatus: { status: BookingStatus; count: number }[];
    bookingsByShow: { showId: string; showTitle: string; count: number }[];
  }> {
    let url = ENDPOINTS.admin.getBookingAnalytics;
    if (startDate || endDate) {
      url += "?";
      if (startDate) url += `startDate=${startDate}`;
      if (startDate && endDate) url += "&";
      if (endDate) url += `endDate=${endDate}`;
    }

    const response = await this.client.get<{
      dailyBookings: { date: string; count: number }[];
      bookingsByStatus: { status: BookingStatus; count: number }[];
      bookingsByShow: { showId: string; showTitle: string; count: number }[];
    }>(url);
    return response.data;
  }

  async getRevenueStats(
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalRevenue: number;
    dailyRevenue: { date: string; amount: number }[];
    revenueByShow: { showId: string; showTitle: string; amount: number }[];
    revenueByCategory: { categoryType: string; amount: number }[];
  }> {
    let url = ENDPOINTS.admin.getRevenueStats;
    if (startDate || endDate) {
      url += "?";
      if (startDate) url += `startDate=${startDate}`;
      if (startDate && endDate) url += "&";
      if (endDate) url += `endDate=${endDate}`;
    }

    const response = await this.client.get<{
      totalRevenue: number;
      dailyRevenue: { date: string; amount: number }[];
      revenueByShow: { showId: string; showTitle: string; amount: number }[];
      revenueByCategory: { categoryType: string; amount: number }[];
    }>(url);
    return response.data;
  }

  async getUserStats(): Promise<{
    userGrowth: { date: string; count: number }[];
    usersByStatus: { isActive: boolean; count: number }[];
    topBookingUsers: { userId: string; userName: string; bookings: number }[];
  }> {
    const response = await this.client.get<{
      userGrowth: { date: string; count: number }[];
      usersByStatus: { isActive: boolean; count: number }[];
      topBookingUsers: { userId: string; userName: string; bookings: number }[];
    }>(ENDPOINTS.admin.getUserStats);
    return response.data;
  }

  // Add new method for creating sections using the shows endpoint
  async createSeatSectionViaShow(
    data: SeatSectionCreateInput
  ): Promise<SeatSection> {
    const response = await this.client.post<SeatSection>(
      ENDPOINTS.shows.createSection,
      data
    );
    return response.data;
  }

  // Add this new method for publishing a show
  async publishShow(id: string): Promise<Show> {
    const response = await this.client.post<Show>(ENDPOINTS.shows.publish(id));
    return response.data;
  }
}

export const apiClient = new ApiClient();
