import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const backendURL = import.meta.env.VITE_BACKEND_URL;

const loadAuthFromStorage = () => {
  try {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    const activeVehicleIndex = localStorage.getItem("activeVehicleIndex");

    if (!token || !user) {
      return null;
    }

    return {
      token,
      user: JSON.parse(user),
      activeVehicleIndex: activeVehicleIndex ? parseInt(activeVehicleIndex) : 0,
    };
  } catch {
    return null;
  }
};

const saveAuthToStorage = ({ token, user }) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

const clearAuthStorage = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("activeVehicleIndex");
};

const persistedAuth = loadAuthFromStorage();

export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async ({ credential, requestedRole }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${backendURL}/auth/google`, {
        credential,
        requestedRole,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to log in with Google"
      );
    }
  }
);

export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async (mobile, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${backendURL}/auth/login/phone`, {
        mobile,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send OTP"
      );
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ mobile, otp, requestedRole }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${backendURL}/auth/login/phone/verify`, {
        mobile,
        otp,
        requestedRole,
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to verify OTP"
      );
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (formData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.put(`${backendURL}/api/user/update-profile`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.msg || "Failed to update profile"
      );
    }
  }
);

export const addVehicle = createAsyncThunk(
  "auth/addVehicle",
  async ({ vehicleId, nickname }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const response = await axios.post(`${backendURL}/api/user/add-vehicle`, {
        vehicleId,
        nickname
      }, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.msg || "Failed to add vehicle"
      );
    }
  }
);

const initialState = {
  user: persistedAuth?.user || null,
  token: persistedAuth?.token || null,
  isAuthenticated: Boolean(persistedAuth?.token),
  isNewUser: false,
  loading: false,
  otpSent: false,
  activeVehicleIndex: persistedAuth?.activeVehicleIndex || 0,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    resetOtpState: (state) => {
      state.otpSent = false;
    },
    setActiveVehicle: (state, action) => {
      state.activeVehicleIndex = action.payload;
      localStorage.setItem("activeVehicleIndex", action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isNewUser = false;
      state.loading = false;
      state.otpSent = false;
      state.activeVehicleIndex = 0;
      state.error = null;
      clearAuthStorage();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isNewUser = Boolean(action.payload.isNewUser);
        state.error = null;
        saveAuthToStorage(action.payload);
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOtp.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = true;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.isNewUser = Boolean(action.payload.isNewUser);
        state.error = null;
        saveAuthToStorage(action.payload);
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.error = null;
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addVehicle.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.error = null;
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(addVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAuthError, resetOtpState, logout, setActiveVehicle } = authSlice.actions;

export default authSlice.reducer;
