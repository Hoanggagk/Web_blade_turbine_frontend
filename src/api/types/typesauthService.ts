// src/types/auth.ts

export type RegisterRequest = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
};

export type VerifyRegistrationRequest = {
  otp: string;
};

export type LoginRequest = {
  identifier: string; // email or phone
  password: string;
};

export type VerifyOTPRequest = {
  otp: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type VerifyResetOTPRequest = {
  otp: string;
};

export type ResetPasswordRequest = {
  password: string;
  confirm_password: string;
};

export type ChangePasswordRequest = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};


export type UserResponse = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string; // "user" | "admin" | ...
  is_approved: boolean;
};

export type RegisterResponse = {
  message: string;
};

export type RegisterSuccessResponse = {
  message: string;
  user: UserResponse;
};

export type LoginPendingResponse = {
  message: string;
};

export type LoginSuccessResponse = {
  message: string;
  user: UserResponse;
};

export type SuccessResponse = {
  message: string;
};

export type UserListResponse = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string; // ISO datetime string
};

export type ApproveUserRequest = {
  user_id: string;
};

export type AdminResponse = {
  message: string;
  data?: Record<string, any>;
};
