// src/api/endpoints.ts
// Wind Turbine Management API — v2.0.0 (OAS 3.1)
// Lưu ý: api.baseURL nên trỏ tới ".../api/v1"

export const AUTH = {
  REGISTER: "/auth/register",
  VERIFY_REGISTRATION: "/auth/verify-registration",
  RESEND_REGISTRATION_OTP: "/auth/resend-registration-otp",
  LOGIN: "/auth/login",
  FORGOT_PASSWORD: "/auth/forgot-password",
  VERIFY_RESET_OTP: "/auth/verify-reset-otp",
  RESEND_RESET_OTP: "/auth/resend-reset-otp",
  RESET_PASSWORD: "/auth/reset-password",
  VERIFY_OTP: "/auth/verify-otp",
  CHANGE_PASSWORD: "/auth/change-password",
  RESEND_OTP: "/auth/resend-otp",
  LOGOUT: "/auth/logout",
  ME: "/auth/me",

  ADMIN: {
    PENDING_USERS: "/auth/admin/pending-users",
    APPROVE_USER: "/auth/admin/approve-user",
    ALL_USERS: "/auth/admin/all-users",
    DELETE_USER: (user_id: string) => `/auth/admin/delete-user/${user_id}`,
  },
} as const;

// =======================
// Projects
// =======================
// =======================
// Projects
// =======================
export const PROJECTS = {
  CREATE: "/projects/",                         // POST /projects/
  LIST: "/projects/",                           // GET  /projects/
  DETAIL: (project_id: string) => `/projects/${project_id}`, // GET detail
  LIST_ALL: "/projects/list",                   // GET  /projects/list (admin)

  UPDATE: (project_id: string) => `/projects/${project_id}`, // PUT
  DELETE: (project_id: string) => `/projects/${project_id}`, // DELETE
  BULK_DELETE: "/projects/bulk",                // DELETE (body: string[])
} as const;

// =======================
// Windfarms
// =======================
export const WINDFARMS = {
  CREATE: (project_id: string) => `/windfarms/project/${project_id}`,        // POST
  BATCH_CREATE: (project_id: string) => `/windfarms/project/${project_id}/batch`, // POST
  LIST_BY_PROJECT: (project_id: string) => `/windfarms/project/${project_id}`,    // GET
  LIST_ALL: "/windfarms/list",                                                     // GET
  DETAIL: (windfarm_id: string) => `/windfarms/${windfarm_id}`,                   // GET
  UPDATE: (windfarm_id: string) => `/windfarms/${windfarm_id}`,                   // PUT
  DELETE: (windfarm_id: string) => `/windfarms/${windfarm_id}`,                   // DELETE
  BULK_DELETE: "/windfarms/bulk",                                                 // DELETE (body: string[])
} as const;

// =======================
// Turbines
// =======================
export const TURBINES = {
  // POST /turbines/windfarm/{windfarm_id}
  CREATE_BY_WINDFARM: (windfarm_id: string) => `/turbines/windfarm/${windfarm_id}`,

  // GET /turbines/windfarm/{windfarm_id}
  LIST_BY_WINDFARM: (windfarm_id: string) => `/turbines/windfarm/${windfarm_id}`,

  // GET /turbines/list  (Admin-only)
  LIST_ALL: "/turbines/list",

  // GET/PUT/DELETE /turbines/{turbine_id}
  DETAIL: (turbine_id: string) => `/turbines/${turbine_id}`,
  UPDATE: (turbine_id: string) => `/turbines/${turbine_id}`,
  DELETE: (turbine_id: string) => `/turbines/${turbine_id}`,

  // PUT /turbines/{turbine_id}/status
  UPDATE_STATUS: (turbine_id: string) => `/turbines/${turbine_id}/status`,
} as const;
// =======================
// Audit
// =======================

export const AUDIT = {
  LOGS: "/audit/logs",          // GET (query filter)
  CLEANUP: "/audit/cleanup",    // POST
  STATS: "/audit/stats",        // GET
} as const;


// =======================
// Members (project-scoped)
// =======================
export const MEMBERS = {
  MY_ROLE: (project_id: string) => `/members/my-role/${project_id}`,                  // GET
  LIST: (project_id: string) => `/members/project/${project_id}`,                     // GET
  ADD: (project_id: string) => `/members/project/${project_id}`,                      // POST
  SEARCH_USERS: (project_id: string) => `/members/project/${project_id}/search-users`,// GET
  UPDATE: (project_id: string, user_id: string) => `/members/project/${project_id}/${user_id}`, // PUT
  REMOVE: (project_id: string, user_id: string) => `/members/project/${project_id}/${user_id}`, // DELETE
} as const;


// =======================
// Default / Health
// =======================
export const DEFAULT = {
  HEALTH: "/health",
  ROOT: "/",
} as const;
