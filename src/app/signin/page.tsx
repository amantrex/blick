"use client";
import { signIn, getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type TabType = "signin" | "signup";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  // Sign-in form state
  const [signinData, setSigninData] = useState({
    email: "",
    password: "",
  });

  // Sign-up form state
  const [signupData, setSignupData] = useState({
    companyName: "",
    companyType: "SCHOOL",
    adminName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Check if already signed in
    getSession().then((session) => {
      if (session) {
        router.push("/dashboard");
      }
    });

    // Check for tab query parameter
    const tabParam = searchParams.get("tab");
    if (tabParam === "signup") {
      setActiveTab("signup");
    }
  }, [router, searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const res = await signIn("credentials", {
        email: signinData.email,
        password: signinData.password,
        redirect: false,
      });
      
      if (res?.error) {
        setError(res.error);
      } else if (res?.ok) {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
      console.error("Sign in error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate passwords match
    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: signupData.companyName,
          companyType: signupData.companyType,
          adminName: signupData.adminName,
          email: signupData.email,
          password: signupData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      setSuccess("Account created successfully! You can now sign in.");
      setActiveTab("signin");
      setSigninData({ email: signupData.email, password: "" });
      setSignupData({
        companyName: "",
        companyType: "SCHOOL",
        adminName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Blick</h1>
          <p className="text-gray-600 mt-2">Fee collection made simple</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("signin")}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === "signin"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === "signup"
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="p-6">
            {activeTab === "signin" ? (
              /* Sign In Form */
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label htmlFor="signin-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="signin-email"
                    required
                    value={signinData.email}
                    onChange={(e) => setSigninData({ ...signinData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="signin-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="signin-password"
                    required
                    value={signinData.password}
                    onChange={(e) => setSigninData({ ...signinData, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white rounded-md py-2 px-4 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            ) : (
              /* Sign Up Form */
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Company/Institution Name *
                  </label>
                  <input
                    type="text"
                    id="company-name"
                    required
                    value={signupData.companyName}
                    onChange={(e) => setSignupData({ ...signupData, companyName: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., ABC School, City Clinic"
                  />
                </div>

                <div>
                  <label htmlFor="company-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Company Type *
                  </label>
                  <select
                    id="company-type"
                    required
                    value={signupData.companyType}
                    onChange={(e) => setSignupData({ ...signupData, companyType: e.target.value as any })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="SCHOOL">School</option>
                    <option value="CLINIC">Clinic</option>
                    <option value="HOSPITAL">Hospital</option>
                    <option value="COLLEGE">College</option>
                    <option value="UNIVERSITY">University</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="admin-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Name *
                  </label>
                  <input
                    type="text"
                    id="admin-name"
                    required
                    value={signupData.adminName}
                    onChange={(e) => setSignupData({ ...signupData, adminName: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="signup-email"
                    required
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="your.email@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="signup-password"
                    required
                    minLength={6}
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    required
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white rounded-md py-2 px-4 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>
            )}

            {/* Error and Success Messages */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
                {success}
              </div>
            )}
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-indigo-600 hover:text-indigo-500 text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}


