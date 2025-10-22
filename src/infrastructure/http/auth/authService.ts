// src/api/services/authServiceLong.ts
import { api, type ApiResult } from "../core";
import { AUTH } from "../endpoints";
import type {
  RegisterRequest,
  RegisterResponse,
  RegisterSuccessResponse,
  VerifyRegistrationRequest,
  LoginRequest,
  LoginPendingResponse,
  LoginSuccessResponse,
  SuccessResponse,
  ForgotPasswordRequest,
  VerifyResetOTPRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  ApproveUserRequest,
  AdminResponse,
  UserListResponse,
  VerifyOTPRequest,
  UserResponse,
} from "../../../domain/auth/models";

export const authServiceLong = {
  // -----------------
  // Registration
  // -----------------
  register: (data: RegisterRequest): Promise<ApiResult<RegisterResponse>> =>
    api.post<RegisterResponse>(AUTH.REGISTER, data),

  verifyRegistration: (data: VerifyRegistrationRequest): Promise<ApiResult<RegisterSuccessResponse>> =>
    api.post<RegisterSuccessResponse>(AUTH.VERIFY_REGISTRATION, data),

  resendRegistrationOtp: (): Promise<ApiResult<SuccessResponse>> =>
    api.post<SuccessResponse>(AUTH.RESEND_REGISTRATION_OTP),

  // -----------------
  // Login & OTP
  // -----------------
  login: (data: LoginRequest): Promise<ApiResult<LoginPendingResponse>> =>
    api.post<LoginPendingResponse>(AUTH.LOGIN, data),

  verifyOtp: (data: VerifyOTPRequest): Promise<ApiResult<LoginSuccessResponse>> =>
    api.post<LoginSuccessResponse>(AUTH.VERIFY_OTP, data),

  resendOtp: (): Promise<ApiResult<SuccessResponse>> =>
    api.post<SuccessResponse>(AUTH.RESEND_OTP),

  changePassword: (data: ChangePasswordRequest): Promise<ApiResult<SuccessResponse>> =>
    api.post<SuccessResponse>(AUTH.CHANGE_PASSWORD, data),

  logout: (): Promise<ApiResult<SuccessResponse>> =>
    api.post<SuccessResponse>(AUTH.LOGOUT),

  me: (): Promise<ApiResult<UserResponse>> =>
    api.get<UserResponse>(AUTH.ME),

  
  // -----------------
  // Password reset
  // -----------------
  

  forgotPassword: (data: ForgotPasswordRequest): Promise<ApiResult<SuccessResponse>> =>
    api.post<SuccessResponse>(AUTH.FORGOT_PASSWORD, data),

  verifyResetOtp: (data: VerifyResetOTPRequest): Promise<ApiResult<SuccessResponse>> =>
    api.post<SuccessResponse>(AUTH.VERIFY_RESET_OTP, data),

  resendResetOtp: (): Promise<ApiResult<SuccessResponse>> =>
    api.post<SuccessResponse>(AUTH.RESEND_RESET_OTP),

  resetPassword: (data: ResetPasswordRequest): Promise<ApiResult<SuccessResponse>> =>
    api.post<SuccessResponse>(AUTH.RESET_PASSWORD, data),

  // -----------------
  // Admin endpoints
  // -----------------
  getPendingUsers: (): Promise<ApiResult<UserListResponse[]>> =>
    api.get<UserListResponse[]>(AUTH.ADMIN.PENDING_USERS),

  approveUser: (data: ApproveUserRequest): Promise<ApiResult<AdminResponse>> =>
    api.post<AdminResponse>(AUTH.ADMIN.APPROVE_USER, data),

  getAllUsers: (): Promise<ApiResult<UserListResponse[]>> =>
    api.get<UserListResponse[]>(AUTH.ADMIN.ALL_USERS),

  deleteUser: (user_id: string): Promise<ApiResult<AdminResponse>> =>
    api.delete<AdminResponse>(AUTH.ADMIN.DELETE_USER(user_id)),
};
