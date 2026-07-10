import React, { useState,useEffect } from 'react';
import './LoginAndRegistration.css'
import albumIllustration from '../assets/album_illustration.png';
import axios from "axios";
import { useNavigate } from "react-router-dom";


export default function LoginAndRegister({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); 

  const [timeLeft, setTimeLeft] = useState(300);
  
  // State for forms
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  
  // Validation errors
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState("success");

const [showOtpPopup, setShowOtpPopup] = useState(false);
const [otp, setOtp] = useState("");
const [otpMode, setOtpMode] = useState(""); // login | register
const [otpEmail, setOtpEmail] = useState("");

const [isResendingOtp, setIsResendingOtp] = useState(false);

const minutes = Math.floor(timeLeft / 60);

const seconds = String(
    timeLeft % 60
).padStart(2, "0");

useEffect(() => {

    if (!showOtpPopup) return;

    setTimeLeft(300);

    const interval = setInterval(() => {

        setTimeLeft(prev => {

            if (prev <= 1) {
                clearInterval(interval);
                return 0;
            }

            return prev - 1;

        });

    }, 1000);

  return () => clearInterval(interval);

}, [showOtpPopup]);


  const triggerToast = (
    message,
    type = "success"
  ) => {

    setToastMessage(message);
    setToastType(type);

    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!loginData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(loginData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!loginData.password) {
      newErrors.password = 'Password is required';
    } else if (loginData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit Action (Send OTP)
    setIsLoading(true);
    try {

      await axios.post(
      "http://localhost:5000/api/auth/login",
      {
          email: loginData.email,
          password: loginData.password
      }
  );

setOtp("");
setOtpMode("login");
setOtpEmail(loginData.email);
setShowOtpPopup(true);
setTimeout(() => {
    document.getElementById("otp-0")?.focus();
}, 100);

    setIsLoading(false);

} catch(error) {

    triggerToast(
        error.response?.data?.message ||
        "Login failed",
        "error"
    );
    setIsLoading(false);

}
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!registerData.fullName) {
      newErrors.fullName = 'Full Name is required';
    }
    
    if (!registerData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(registerData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!registerData.password) {
      newErrors.password = 'Password is required';
    } else if (registerData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!registerData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (registerData.password !== registerData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit Action (Send OTP)
    setIsLoading(true);
    try {

    const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
            fullName: registerData.fullName,
            email: registerData.email,
            password: registerData.password
        }
    );

    setOtp("");
    setOtpMode("register");
    setOtpEmail(registerData.email);
    setShowOtpPopup(true);
      setTimeout(() => {
      document.getElementById("otp-0")?.focus();
  }, 100);

    triggerToast("OTP sent to your email");
    setIsLoading(false);

} catch(error) {

    triggerToast(
        error.response?.data?.message ||
        "Registration failed",
        "error"
    );
    setIsLoading(false);

}
  };
const handleOtpVerify = async () => {

try {
      if(timeLeft === 0){
      triggerToast(
          "OTP expired. Please request a new one.",
          "error"
      );
      return;
    }

    let response;

    if (otpMode === "register") {

        response = await axios.post(
            "http://localhost:5000/api/auth/verify-register-otp",
            {
                email: otpEmail,
                otp
            }
        );

        triggerToast("Registration successful");

    } else {

        response = await axios.post(
            "http://localhost:5000/api/auth/verify-login-otp",
            {
                email: otpEmail,
                otp
            }
        );

        triggerToast("Login successful");
    }

    localStorage.setItem(
        "token",
        response.data.token
    );

    localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
    );

    setOtp("");
    setShowOtpPopup(false);

    setTimeout(() => {
      navigate("/dashboard");
    }, 1200);

} catch (error) {

    triggerToast(
        error.response?.data?.message ||
        "OTP verification failed",
        "error"
    );
}


};

const handleOtpChange = (index, value) => {

    if (!/^\d?$/.test(value)) return;

    const otpArray = otp.split("");

    otpArray[index] = value;

    const newOtp = otpArray.join("");

    setOtp(newOtp);

    if (value && index < 5) {
        document
            .getElementById(`otp-${index + 1}`)
            ?.focus();
    }
};
const handleResendOtp = async () => {

    try {

        setIsResendingOtp(true);

        if (otpMode === "register") {

            await axios.post(
                "http://localhost:5000/api/auth/register",
                {
                    fullName: registerData.fullName,
                    email: registerData.email,
                    password: registerData.password
                }
            );

        } else {

            await axios.post(
                "http://localhost:5000/api/auth/login",
                {
                    email: loginData.email,
                    password: loginData.password
                }
            );

        }

        setOtp("");
        setTimeLeft(300);

        triggerToast("A new OTP has been sent.");

        setTimeout(() => {
            document.getElementById("otp-0")?.focus();
        }, 100);

    }
    catch (err) {

        triggerToast(
            err.response?.data?.message ||
            "Unable to resend OTP",
            "error"
        );

    }
    finally {

        setIsResendingOtp(false);

    }

};
  return (
    <div className="app-container">
      <div className="auth-card">
        {/* Left Half: Branding & Illustration */}
        <div className="auth-left">
          <div className="left-brand">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
            <span>OurSnaps</span>
          </div>

          <div className="left-illustration-container">
            <img src={albumIllustration} alt="Memory Album Illustration" className="left-image" />
          </div>

          <div className="left-text">
            <h2>Relive your event, effortlessly.</h2>
            <p>Smart recognition delivers every photo you’re in, instantly.</p>
          </div>
        </div>

        {/* Right Half: Form Panels */}
        <div className="auth-right">
          <div className="auth-header">
            <h1>Welcome to OurSnaps</h1>
            <p>{activeTab === 'login' ? 'Sign in to access your albums' : 'Create an account to start sharing'}</p>
          </div>

          <div className="tab-switch">
            <button
              onClick={() => handleTabChange('login')}
              className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            >
              Login
            </button>
            <button
              onClick={() => handleTabChange('register')}
              className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            >
              Register
            </button>
          </div>

          {activeTab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="auth-form" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email Address</label>
                <div className="input-wrapper">
                  <svg className="input-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <input
                    type="email"
                    id="login-email"
                    className={`input-field ${errors.email ? 'error' : ''}`}
                    placeholder="you@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  />
                </div>
                {errors.email && <span className="field-error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    className={`input-field ${errors.password ? 'error' : ''}`}
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle Password Visibility"
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <span className="field-error-message">{errors.password}</span>}
              </div>

              <button type="submit" className="btn-submit" disabled={isLoading}>
                {isLoading ? (
                  <span>Sending OTP...</span>
                ) : (
                  <>
                    <span>Send OTP to Mail</span>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="auth-form" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">Full Name</label>
                <div className="input-wrapper">
                  <svg className="input-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input
                    type="text"
                    id="reg-name"
                    className={`input-field ${errors.fullName ? 'error' : ''}`}
                    placeholder="John Doe"
                    value={registerData.fullName}
                    onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                  />
                </div>
                {errors.fullName && <span className="field-error-message">{errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email Address</label>
                <div className="input-wrapper">
                  <svg className="input-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <input
                    type="email"
                    id="reg-email"
                    className={`input-field ${errors.email ? 'error' : ''}`}
                    placeholder="you@example.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  />
                </div>
                {errors.email && <span className="field-error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="reg-password"
                    className={`input-field ${errors.password ? 'error' : ''}`}
                    placeholder="Min. 6 characters"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle Password Visibility"
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <span className="field-error-message">{errors.password}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="reg-confirm"
                    className={`input-field ${errors.confirmPassword ? 'error' : ''}`}
                    placeholder="Repeat password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle Password Visibility"
                  >
                    {showConfirmPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <span className="field-error-message">{errors.confirmPassword}</span>}
              </div>

              <button type="submit" className="btn-submit" disabled={isLoading}>
                {isLoading ? (
                  <span>Sending OTP...</span>
                ) : (
                  <>
                    <span>Send OTP to Mail</span>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Success Toast Notification */}
      <div className={`toast-notification ${showToast ? 'show' : ''} ${toastType}`}>
        
        {
  toastType === "success" ? (

    <svg
      className="toast-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>

  ) : (

    <svg
      className="toast-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>

  )
}
        <span>{toastMessage}</span>
      </div>
      {showOtpPopup && (
        <div className="otp-overlay">

            <div className="otp-modal">
              <button
                  className="otp-close-btn"
                  onClick={() => setShowOtpPopup(false)}
                >
                  ✕
              </button>

                

                {timeLeft > 0 ? (
    <>
      <h2>Verify OTP</h2>

                <p>
                    Enter the OTP sent to your email
                </p>
        <div className="otp-container">

            {[0,1,2,3,4,5].map((index) => (
                <input
                    id={`otp-${index}`}
                    key={index}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength="1"
                    className="otp-box"
                    value={otp[index] || ""}
                    onChange={(e)=>
                        handleOtpChange(index,e.target.value)
                    }
                    onKeyDown={(e)=>{
                        if(
                            e.key==="Backspace" &&
                            !otp[index] &&
                            index>0
                        ){
                            document.getElementById(`otp-${index-1}`)?.focus();
                        }
                    }}
                />
            ))}

        </div>

        <div className="otp-timer">
            Expires in:
            <span>{minutes}:{seconds}</span>
        </div>

        <button
            onClick={handleOtpVerify}
            disabled={otp.length !== 6}
            className="btn-submit"
        >
            Verify OTP
        </button>
    </>
) : (
    <div className="otp-expired">

        <div className="expired-icon">⌛</div>

        <h3>OTP Expired</h3>

        <p>
            Your verification code has expired.
            Click below to receive a new OTP.
        </p>

        <button
        className="btn-submit"
        onClick={handleResendOtp}
        disabled={isResendingOtp}>
        {isResendingOtp ? "Resending..." : "Resend OTP"}
    </button>

    </div>
)}

            </div>

        </div>
    )}
    </div>
  );
}
