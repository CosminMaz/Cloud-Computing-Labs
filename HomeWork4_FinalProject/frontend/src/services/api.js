import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Axios instance — token injected per-call
const api = axios.create({ baseURL: BASE_URL });

// ── Users ──────────────────────────────────────────────
/**
 * Register or look up the current user in the database.
 * Returns the user's role. If brand new, the role you pass is saved.
 */
export const upsertMe = (token, { role }) =>
    api.post('/api/users/me', { role }, {
        headers: { Authorization: `Bearer ${token}` }
    });

/** Looks up the user by their Entra token. Returns 404 if not yet registered. */
export const getMe = (token) =>
    api.get('/api/users/me', { headers: { Authorization: `Bearer ${token}` } });

// ── Contractors ────────────────────────────────────────
export const getContractors = (token, { page = 1, search = '', limit = 20 } = {}) =>
    api.get('/api/contractors', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit, ...(search ? { search } : {}) },
    });

export const getContractor = (token, id) =>
    api.get(`/api/contractors/${id}`, { headers: { Authorization: `Bearer ${token}` } });

export const getMyProfile = (token) =>
    api.get('/api/contractors/me', { headers: { Authorization: `Bearer ${token}` } });

export const updateMyProfile = (token, data) =>
    api.put('/api/contractors/me', data, { headers: { Authorization: `Bearer ${token}` } });

export const uploadProfilePicture = (token, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/api/upload-profile-picture', form, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

// ── Bookings ───────────────────────────────────────────
export const createBooking = (token, data) =>
    api.post('/api/bookings', data, { headers: { Authorization: `Bearer ${token}` } });

export const getMyBookings = (token) =>
    api.get('/api/bookings/mine', { headers: { Authorization: `Bearer ${token}` } });

export const hasCompletedBookingWith = (token, contractorUserId) =>
    api.get(`/api/bookings/completed-with/${contractorUserId}`, { headers: { Authorization: `Bearer ${token}` } });

export const updateBookingStatus = (token, bookingId, status) =>
    api.patch(`/api/bookings/${bookingId}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } });

export const rescheduleBooking = (token, bookingId, scheduledAt) =>
    api.patch(`/api/bookings/${bookingId}/reschedule`, { scheduled_at: scheduledAt }, { headers: { Authorization: `Bearer ${token}` } });

export const updateContractorNotes = (token, bookingId, notes) =>
    api.patch(`/api/bookings/${bookingId}/notes`, { contractor_notes: notes || null }, { headers: { Authorization: `Bearer ${token}` } });

// ── Reviews ────────────────────────────────────────────
export const getContractorReviews = (token, contractorUserId) =>
    api.get(`/api/reviews/contractor/${contractorUserId}`, { headers: { Authorization: `Bearer ${token}` } });

export const submitReview = (token, data) =>
    api.post('/api/reviews', data, { headers: { Authorization: `Bearer ${token}` } });

export const getMyReview = (token, contractorUserId) =>
    api.get(`/api/reviews/my-review/${contractorUserId}`, { headers: { Authorization: `Bearer ${token}` } });

export const updateReview = (token, reviewId, data) =>
    api.patch(`/api/reviews/${reviewId}`, data, { headers: { Authorization: `Bearer ${token}` } });

// ── Direct Messages ────────────────────────────────────
export const getConversations = (token) =>
    api.get('/api/messages/conversations', { headers: { Authorization: `Bearer ${token}` } });

export const getMessageHistory = (token, otherUserId) =>
    api.get(`/api/messages/${otherUserId}`, { headers: { Authorization: `Bearer ${token}` } });

export const markMessagesRead = (token, otherUserId) =>
    api.post(`/api/messages/${otherUserId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });

// ── Payments ───────────────────────────────────────────
export const setPaymentQuote = (token, bookingId, amount) =>
    api.post('/api/payments/quote', { booking_id: bookingId, amount }, { headers: { Authorization: `Bearer ${token}` } });

export const payBooking = (token, bookingId) =>
    api.post(`/api/payments/${bookingId}/pay`, {}, { headers: { Authorization: `Bearer ${token}` } });

export const revisePayment = (token, bookingId, newAmount) =>
    api.patch(`/api/payments/${bookingId}/revise`, { new_amount: newAmount }, { headers: { Authorization: `Bearer ${token}` } });

export const approveRevision = (token, bookingId) =>
    api.post(`/api/payments/${bookingId}/approve-revision`, {}, { headers: { Authorization: `Bearer ${token}` } });

export const releasePayment = (token, bookingId) =>
    api.post(`/api/payments/${bookingId}/release`, {}, { headers: { Authorization: `Bearer ${token}` } });

// ── Chat / FAQ bot ─────────────────────────────────────
export const askChatbot = (token, { question, contractorId, history }) =>
    api.post('/api/chat/ask', { question, contractor_id: contractorId, history }, {
        headers: { Authorization: `Bearer ${token}` },
    });
