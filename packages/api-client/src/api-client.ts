import axios, { AxiosError, AxiosInstance } from "axios";
import { API_CONFIG, ENDPOINTS, STORAGE_KEYS } from "./config";
import {
  AuthResponse,
  Booking,
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
    const response = await this.client.get<RazorpayStatusResponse>(
      ENDPOINTS.razorpay.status
    );
    return response.data;
  }

  async createRazorpayOrder(bookingId: string): Promise<RazorpayOrderResponse> {
    const response = await this.client.post<RazorpayOrderResponse>(
      ENDPOINTS.razorpay.createOrder(bookingId)
    );
    return response.data;
  }

  async verifyRazorpayPayment(
    bookingId: string,
    data: RazorpayVerifyRequest
  ): Promise<{ success: boolean; booking: Booking }> {
    const response = await this.client.post<{
      success: boolean;
      booking: Booking;
    }>(ENDPOINTS.razorpay.verifyPayment(bookingId), data);
    return response.data;
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

  async createEvent(data: EventCreateInput): Promise<Event> {
    const response = await this.client.post<Event>(
      ENDPOINTS.shows.createEvent,
      data
    );
    return response.data;
  }

  // ----- Showtime Methods -----

  async createShowtime(data: ShowtimeCreateInput): Promise<Showtime> {
    const response = await this.client.post<Showtime>(
      ENDPOINTS.shows.createShowtime,
      data
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

  // ----- Seat Section Methods -----

  async getSeatSectionsByShowtimeId(
    showtimeId: string
  ): Promise<SeatSection[]> {
    const response = await this.client.get<SeatSection[]>(
      ENDPOINTS.seatSections.getByShowtime(showtimeId)
    );
    return response.data;
  }

  async createSeatSection(data: SeatSectionCreateInput): Promise<SeatSection> {
    const response = await this.client.post<SeatSection>(
      ENDPOINTS.seatSections.create,
      data
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
}

export const apiClient = new ApiClient();
