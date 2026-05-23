import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor — unwrap data and normalize errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred";
    console.error(`API Error:`, message);
    return Promise.reject(new Error(message));
  }
);

export const api = {
  // Event Types
  getEventTypes: () => apiClient.get("/event-types"),
  createEventType: (data) => apiClient.post("/event-types", data),
  updateEventType: (id, data) => apiClient.put(`/event-types/${id}`, data),
  deleteEventType: (id) => apiClient.delete(`/event-types/${id}`),

  // Availability
  getAvailability: () => apiClient.get("/availability"),
  updateAvailability: (data) => apiClient.put("/availability", data),

  // Public Booking
  getPublicEventType: (slug) => apiClient.get(`/book/${slug}`),
  getAvailableSlots: (slug, date, timezone, excludeBookingId) =>
    apiClient.get(`/book/${slug}/slots`, {
      params: {
        date,
        timezone,
        ...(excludeBookingId ? { excludeBookingId } : {}),
      },
    }),
  createBooking: (slug, bookingData) =>
    apiClient.post(`/book/${slug}`, bookingData),

  // Meetings (Admin)
  getMeetings: () => apiClient.get("/meetings"),
  cancelMeeting: (id, reason) =>
    apiClient.patch(`/meetings/${id}/cancel`, {
      cancellationReason: reason,
    }),
  rescheduleMeeting: (id, data) =>
    apiClient.patch(`/meetings/${id}/reschedule`, data),
};
