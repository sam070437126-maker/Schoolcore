import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Code, Eye, EyeOff, User, GraduationCap, ShieldCheck, BookOpen } from "lucide-react";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/common/Toast";

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    fill="currentColor"
    height="48"
    viewBox="0 0 40 48"
    width="40"
    {...props}
  >
    <clipPath id="signup-logo-clip">
      <path d="m0 0h40v48h-40z" />
    </clipPath>
    <g clipPath="url(#signup-logo-clip)">
      <path d="m25.0887 5.05386-3.933-1.05386-3.3145 12.3696-2.9923-11.16736-3.9331 1.05386 3.233 12.0655-8.05262-8.0526-2.87919 2.8792 8.83271 8.8328-10.99975-2.9474-1.05385625 3.933 12.01860625 3.2204c-.1376-.5935-.2104-1.2119-.2104-1.8473 0-4.4976 3.646-8.1436 8.1437-8.1436 4.4976 0 8.1436 3.646 8.1436 8.1436 0 .6313-.0719 1.2459-.2078 1.8359l10.9227 2.9267 1.0538-3.933-12.0664-3.2332 11.0005-2.9476-1.0539-3.933-12.0659 3.233 8.0526-8.0526-2.8792-2.87916-8.7102 8.71026z" />
      <path d="m27.8723 26.2214c-.3372 1.4256-1.0491 2.7063-2.0259 3.7324l7.913 7.9131 2.8792-2.8792z" />
      <path d="m25.7665 30.0366c-.9886 1.0097-2.2379 1.7632-3.6389 2.1515l2.8794 10.746 3.933-1.0539z" />
      <path d="m21.9807 32.2274c-.65.1671-1.3313.2559-2.0334.2559-.7522 0-1.4806-.102-2.1721-.2929l-2.882 10.7558 3.933 1.0538z" />
      <path d="m17.6361 32.1507c-1.3796-.4076-2.6067-1.1707-3.5751-2.1833l-7.9325 7.9325 2.87919 2.8792z" />
      <path d="m13.9956 29.8973c-.9518-1.019-1.6451-2.2826-1.9751-3.6862l-10.95836 2.9363 1.05385 3.933z" />
    </g>
  </svg>
);

export interface SignupFormProps {
  onSwitchToSignIn?: () => void;
  onSuccess?: () => void;
  onHaveTokenClick?: () => void;
}

export default function SignupForm({ onSwitchToSignIn, onSuccess, onHaveTokenClick }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("admin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [schoolName, setSchoolName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      showToast("Please enter an email address and password.", "error");
      return;
    }

    if (!agreedToTerms) {
      showToast("Please agree to the Terms and Conditions to proceed.", "error");
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || username.trim() || "School Administrator";
    const assignedSchool = schoolName.trim() || "Apex Secondary Academy";

    setIsLoading(true);
    try {
      await register({
        email,
        password,
        full_name: fullName,
        school_name: assignedSchool,
      });
      showToast("Account created successfully! Welcome to your workspace.");
      onSuccess?.();
    } catch (err: any) {
      showToast(err.message || "Failed to create account. Please verify details.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-10 px-4 sm:px-6">
      <div className="w-full max-w-md">
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xl pb-0 bg-white dark:bg-slate-900 rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-col items-center space-y-1.5 pb-4 pt-8">
            <div className="text-emerald-600 dark:text-emerald-500 mb-1 flex items-center justify-center p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50">
              <Logo className="w-10 h-10" />
            </div>
            <div className="space-y-1 flex flex-col items-center text-center">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Create an account
              </h2>
              <p className="text-xs text-muted-foreground">
                Welcome! Create an account to get started with your school workspace.
              </p>
            </div>

            {/* School-Verified Invitation Notice */}
            <div className="w-full mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400">Institutional Invitation Model</span>
                {onHaveTokenClick && (
                  <button
                    type="button"
                    onClick={onHaveTokenClick}
                    className="text-[11px] text-amber-400 hover:underline font-medium cursor-pointer"
                  >
                    Enter Token →
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Teachers, staff, and parents are granted access via secure verification links dispatched by their Principal.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-6 sm:px-8">
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger
                    id="role"
                    className="[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0 h-10 rounded-xl"
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]>span>svg]:shrink-0">
                    <SelectItem value="admin">
                      <ShieldCheck size={16} className="text-emerald-600" aria-hidden="true" />
                      <span className="truncate">School Administrator</span>
                    </SelectItem>
                    <SelectItem value="principal">
                      <GraduationCap size={16} className="text-purple-600" aria-hidden="true" />
                      <span className="truncate">Principal / Head of School</span>
                    </SelectItem>
                    <SelectItem value="teacher">
                      <BookOpen size={16} className="text-blue-600" aria-hidden="true" />
                      <span className="truncate">Subject / Class Teacher</span>
                    </SelectItem>
                    <SelectItem value="designer">
                      <User size={16} className="text-amber-600" aria-hidden="true" />
                      <span className="truncate">Product Designer</span>
                    </SelectItem>
                    <SelectItem value="developer">
                      <Code size={16} className="text-cyan-600" aria-hidden="true" />
                      <span className="truncate">Developer</span>
                    </SelectItem>
                    <SelectItem value="manager">
                      <BarChart size={16} className="text-indigo-600" aria-hidden="true" />
                      <span className="truncate">Product Manager</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    placeholder="e.g. Samuel"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-xl h-10 text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    placeholder="e.g. Adewale"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-xl h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  placeholder="e.g. Bright Future Secondary School"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="rounded-xl h-10 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="e.g. samuel_adewale"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-xl h-10 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email address *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@school.edu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl h-10 text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 rounded-xl h-10 text-xs sm:text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(Boolean(checked))}
                />
                <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer select-none">
                  I agree to the{" "}
                  <a href="#terms" className="text-primary hover:underline font-medium">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="#conditions" className="text-primary hover:underline font-medium">
                    Conditions
                  </a>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-10 transition-all shadow-md shadow-emerald-600/20"
              >
                {isLoading ? "Creating account..." : "Create free account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-100 dark:border-slate-800/80 !py-4 bg-slate-50/50 dark:bg-slate-900/50">
            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              {onSwitchToSignIn ? (
                <button
                  type="button"
                  onClick={onSwitchToSignIn}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  Sign in
                </button>
              ) : (
                <a href="#signin" className="text-primary hover:underline font-semibold">
                  Sign in
                </a>
              )}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
