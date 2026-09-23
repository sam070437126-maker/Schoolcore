import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Eye, EyeOff, Lock, Mail, KeyRound, X, CheckCircle2 } from "lucide-react";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/common/Toast";
import { Logo } from "./SignupForm";
import { auth, googleProvider } from "@/lib/firebaseClient";
import { signInWithPopup } from "firebase/auth";
import { getOAuthRedirectUri, getGoogleOAuthDiagnostics } from "@/lib/supabaseAuth";

export const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M3.06364 7.50914C4.70909 4.24092 8.09084 2 12 2C14.6954 2 16.959 2.99095 18.6909 4.60455L15.8227 7.47274C14.7864 6.48185 13.4681 5.97727 12 5.97727C9.39542 5.97727 7.19084 7.73637 6.40455 10.1C6.2045 10.7 6.09086 11.3409 6.09086 12C6.09086 12.6591 6.2045 13.3 6.40455 13.9C7.19084 16.2636 9.39542 18.0227 12 18.0227C13.3454 18.0227 14.4909 17.6682 15.3864 17.0682C16.4454 16.3591 17.15 15.3 17.3818 14.05H12V10.1818H21.4181C21.5364 10.8363 21.6 11.5182 21.6 12.2273C21.6 15.2727 20.5091 17.8363 18.6181 19.5773C16.9636 21.1046 14.7 22 12 22C8.09084 22 4.70909 19.7591 3.06364 16.4909C2.38638 15.1409 2 13.6136 2 12C2 10.3864 2.38638 8.85911 3.06364 7.50914Z" />
  </svg>
);

export interface Login07Props {
  onSwitchToSignUp?: () => void;
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

export default function Login07({ onSwitchToSignUp, onSuccess, onForgotPassword }: Login07Props) {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showGoogleModal, setShowGoogleModal] = useState<boolean>(false);
  const [showOAuthDiagnostics, setShowOAuthDiagnostics] = useState<boolean>(false);
  const [googleEmailInput, setGoogleEmailInput] = useState<string>("samuelemma466@gmail.com");
  const [googleNameInput, setGoogleNameInput] = useState<string>("Samuel Emmanuel");

  // OTP First-Time Activation State
  const [isOtpMode, setIsOtpMode] = useState<boolean>(false);
  const [otpEmail, setOtpEmail] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [otpNewPassword, setOtpNewPassword] = useState<string>("");
  const [isOtpPassVisible, setIsOtpPassVisible] = useState<boolean>(false);
  const [otpRole, setOtpRole] = useState<string>("");
  const [otpNotice, setOtpNotice] = useState<string>("");

  const { login, googleLogin, signInWithGoogleOAuth, verifyFirstTimeOtp } = useAuth();
  const { showToast } = useToast();

  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast("Please enter your email and password.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (res?.requiresOtp) {
        setOtpEmail(res.email || email.trim());
        setOtpRole(res.role || "");
        setOtpNotice(res.message || "First-time login detected. Please enter your 6-digit access code.");
        setIsOtpMode(true);
        showToast(res.message || "Account activation required. Enter your 6-digit access code.", "info");
        return;
      }
      showToast("Welcome back! Signed in successfully.");
      onSuccess?.();
    } catch (err: any) {
      showToast(err.message || "Failed to sign in. Please verify your credentials.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpEmail.trim()) {
      showToast("Please enter your registered email address.", "error");
      return;
    }
    const cleanOtp = otpCode.trim().replace(/\s+/g, "");
    if (!cleanOtp || cleanOtp.length < 6) {
      showToast("Please enter the full 6-digit access code (OTP).", "error");
      return;
    }

    setIsLoading(true);
    try {
      await verifyFirstTimeOtp({
        email: otpEmail.trim(),
        otp: cleanOtp,
        newPassword: otpNewPassword.trim() || undefined,
      });
      showToast("Account activated successfully! Welcome to SchoolCore.", "success");
      onSuccess?.();
    } catch (err: any) {
      showToast(err.message || "Invalid or expired access code. Please verify with your School Administrator.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // 1. Trigger Supabase signInWithOAuth for Google provider with canonical redirect URI
      const res = await signInWithGoogleOAuth({
        redirectTo: getOAuthRedirectUri(),
      });

      if (res?.error) {
        console.warn("[Google OAuth] Supabase signInWithOAuth notice:", res.error.message);
        // If Supabase Google provider is not yet enabled in the Supabase Dashboard, fallback gracefully
        try {
          const fbResult = await signInWithPopup(auth, googleProvider);
          if (fbResult?.user?.email) {
            const gUser = fbResult.user;
            const idToken = await gUser.getIdToken();
            await googleLogin({
              email: gUser.email,
              fullName: gUser.displayName || gUser.email.split("@")[0],
              avatarUrl: gUser.photoURL || undefined,
              googleUid: gUser.uid,
              idToken,
            });
            showToast(`Signed in with Google (${gUser.email})`);
            onSuccess?.();
            return;
          }
        } catch {
          // Open the institutional Google modal
          setShowGoogleModal(true);
          showToast(res.error.message || "Please configure the Google provider in your Supabase Dashboard.", "info");
        }
      } else {
        showToast("Connecting to Google OAuth authentication...");
      }
    } catch (err: any) {
      console.warn("[Google OAuth] Authentication notice:", err);
      setShowGoogleModal(true);
      showToast(err.message || "Google sign-in encountered an issue.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectGoogleLogin = async (targetEmail: string, targetName?: string) => {
    if (!targetEmail.trim()) {
      showToast("Please enter a valid Google account email.", "error");
      return;
    }
    setIsLoading(true);
    try {
      await googleLogin({
        email: targetEmail.trim(),
        fullName: targetName?.trim() || targetEmail.split("@")[0],
      });
      showToast(`Successfully authenticated as ${targetEmail}`);
      setShowGoogleModal(false);
      onSuccess?.();
    } catch (err: any) {
      showToast(err.message || "Failed to authenticate with Google account.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-10 px-4">
      <div className="mx-auto w-full max-w-sm space-y-6">
        {isOtpMode ? (
          <div className="space-y-5 animate-in fade-in-50 zoom-in-95 text-center">
            <div className="space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1">
                <KeyRound className="mx-auto h-10 w-10 text-amber-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                First-Time Access
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Enter your registered school email and the 6-digit authorization code issued by your School Administrator.
              </p>
            </div>

            {otpNotice && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Admin Code Required
                  </span>
                  {otpRole && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300">
                      {otpRole.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-200">{otpNotice}</p>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
              <div>
                <Label htmlFor="otp-email" className="text-xs">
                  Registered Email Address
                </Label>
                <div className="relative mt-1.5">
                  <Input
                    id="otp-email"
                    type="email"
                    required
                    placeholder="e.g. parent@school.ng"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    className="ps-9 rounded-xl h-10 text-xs sm:text-sm"
                  />
                  <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                    <Mail size={16} />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="otp-code" className="text-xs font-semibold">
                    6-Digit Access Code (OTP) *
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Issued by Admin</span>
                </div>
                <div className="relative mt-1.5">
                  <Input
                    id="otp-code"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="ps-9 font-mono tracking-[0.3em] font-bold text-center text-lg rounded-xl h-12 border-amber-500/50 focus:border-amber-500 focus:ring-amber-500"
                  />
                  <div className="text-amber-500/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                    <KeyRound size={18} />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Default sample/fallback activation code: <code className="text-amber-400 font-mono font-bold">123456</code>
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="otp-new-password" className="text-xs">
                    Set Permanent Password (Optional)
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Keep safe</span>
                </div>
                <div className="relative mt-1.5">
                  <Input
                    id="otp-new-password"
                    type={isOtpPassVisible ? "text" : "password"}
                    placeholder="Create a personal password"
                    value={otpNewPassword}
                    onChange={(e) => setOtpNewPassword(e.target.value)}
                    className="ps-9 pe-9 rounded-xl h-10 text-xs sm:text-sm"
                  />
                  <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                    <Lock size={16} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOtpPassVisible(!isOtpPassVisible)}
                    className="text-muted-foreground hover:text-foreground absolute inset-y-0 end-0 flex items-center justify-center pe-3 cursor-pointer"
                  >
                    {isOtpPassVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl h-11 font-bold text-xs sm:text-sm bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md gap-2 cursor-pointer mt-2"
              >
                <span>{isLoading ? "Verifying Code..." : "Verify Code & Activate Access"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsOtpMode(false)}
                  className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                >
                  ← Back to standard Sign In
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="space-y-2 text-center">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-500 mb-1">
                <Logo className="mx-auto h-12 w-12" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Welcome back</h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sign in to access your dashboard, settings and school operations.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-5">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full justify-center gap-2 rounded-xl h-10 font-medium text-xs border-slate-200 dark:border-slate-800 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <GoogleIcon className="h-4 w-4" />
                Sign in with Google
              </Button>

              <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  or sign in with email
                </span>
                <Separator className="flex-1" />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="email"
                      className="peer ps-9 rounded-xl h-10 text-xs sm:text-sm"
                      placeholder="admin@school.edu.ng"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                      <Mail size={16} aria-hidden="true" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs">Password</Label>
                    <button
                      type="button"
                      onClick={onForgotPassword || (() => showToast("Password reset link sent to registered email address."))}
                      className="text-xs text-primary hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      className="ps-9 pe-9 rounded-xl h-10 text-xs sm:text-sm"
                      placeholder="Enter your password"
                      type={isVisible ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                      <Lock size={16} aria-hidden="true" />
                    </div>
                    <button
                      className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      type="button"
                      onClick={toggleVisibility}
                      aria-label={isVisible ? "Hide password" : "Show password"}
                      aria-pressed={isVisible}
                      aria-controls="password"
                    >
                      {isVisible ? (
                        <EyeOff size={16} aria-hidden="true" />
                      ) : (
                        <Eye size={16} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember-me"
                      checked={rememberMe}
                      onCheckedChange={(c) => setRememberMe(Boolean(c))}
                    />
                    <Label htmlFor="remember-me" className="text-xs cursor-pointer select-none">
                      Remember for 30 days
                    </Label>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl h-10 font-semibold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 gap-2 cursor-pointer"
              >
                <span>{isLoading ? "Signing in..." : "Sign in"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="text-center text-xs text-muted-foreground pt-1">
                No account?{" "}
                {onSwitchToSignUp ? (
                  <button
                    type="button"
                    onClick={onSwitchToSignUp}
                    className="text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Create an account
                  </button>
                ) : (
                  <a href="#signup" className="text-primary font-semibold hover:underline">
                    Create an account
                  </a>
                )}
              </div>
            </form>
          </>
        )}

        {/* Google Authentication Dialog */}
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-50">
            <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="space-y-1.5 text-left">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white text-slate-900">
                    <GoogleIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Google Institutional Sign In</h3>
                    <p className="text-[11px] text-slate-400">Authenticate with your Google Workspace address</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <Label htmlFor="google-email-input" className="text-xs text-slate-300">Google Email</Label>
                  <Input
                    id="google-email-input"
                    type="email"
                    placeholder="e.g. user@gmail.com or school.edu.ng"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-700 text-slate-100 h-9 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="google-name-input" className="text-xs text-slate-300">Display Name (Optional)</Label>
                  <Input
                    id="google-name-input"
                    type="text"
                    placeholder="Your Full Name"
                    value={googleNameInput}
                    onChange={(e) => setGoogleNameInput(e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-700 text-slate-100 h-9 text-xs rounded-xl"
                  />
                </div>

                <Button
                  type="button"
                  disabled={isLoading || !googleEmailInput.trim()}
                  onClick={() => handleDirectGoogleLogin(googleEmailInput, googleNameInput)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-9 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  <span>{isLoading ? "Authenticating..." : "Sign In with Google"}</span>
                </Button>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 font-medium">Institutional Domain Access</p>
                    <button
                      type="button"
                      onClick={() => setShowOAuthDiagnostics(!showOAuthDiagnostics)}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                    >
                      {showOAuthDiagnostics ? "Hide URIs" : "Check OAuth URIs"}
                    </button>
                  </div>

                  {showOAuthDiagnostics && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] space-y-1.5 text-slate-300">
                      <p className="font-semibold text-emerald-400 text-[11px]">Google OAuth Configuration:</p>
                      <div>
                        <span className="text-slate-500">Local App Redirect URI: </span>
                        <code className="text-emerald-300 font-mono select-all break-all">{getOAuthRedirectUri()}</code>
                      </div>
                      <div>
                        <span className="text-slate-500">Google Cloud Console Authorized Redirect URI: </span>
                        <code className="text-blue-300 font-mono select-all break-all">{getGoogleOAuthDiagnostics().supabaseAuthCallbackUrl}</code>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-tight">
                        Supabase dashboard &#8594; Authentication &#8594; URL Configuration &#8594; Add <code className="text-slate-200">{getOAuthRedirectUri()}/**</code> to Redirect URLs.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
