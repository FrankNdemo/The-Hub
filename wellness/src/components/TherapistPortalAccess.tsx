import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useWellnessHub } from "@/context/WellnessHubContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formatPassphraseError = (message: string) => {
  const normalized = message.trim().toLowerCase();

  if (
    normalized.includes("temporarily unavailable") ||
    normalized.includes("unable to reach") ||
    normalized.includes("something went wrong") ||
    normalized.includes("could not complete")
  ) {
    return "The therapist portal is temporarily unavailable. Please try again shortly.";
  }

  return message;
};

const TherapistPortalAccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    confirmTherapistPasswordReset,
    isTherapistAuthenticated,
    loginTherapist,
    requestTherapistPasswordReset,
    verifyTherapistPassphrase,
  } = useWellnessHub();
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [passphraseError, setPassphraseError] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot" | "sent" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const passphraseInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const unlockAttemptRef = useRef(0);
  const resetUid = searchParams.get("therapist_reset_uid") ?? "";
  const resetToken = searchParams.get("therapist_reset_token") ?? "";

  useEffect(() => {
    if (!resetUid || !resetToken) {
      return;
    }

    setMode("reset");
    setLoginOpen(true);
    setShowPassphrase(false);
  }, [resetToken, resetUid]);

  useEffect(() => {
    if (!showPassphrase || loginOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      passphraseInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [loginOpen, showPassphrase]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("wellness-therapist-access-state", {
        detail: { active: showPassphrase || loginOpen },
      }),
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("wellness-therapist-access-state", {
          detail: { active: false },
        }),
      );
    };
  }, [loginOpen, showPassphrase]);

  useEffect(() => {
    if (!loginOpen || mode !== "login") {
      return;
    }

    setEmail("");
    setPassword("");

    const frame = window.requestAnimationFrame(() => {
      if (emailInputRef.current) {
        emailInputRef.current.value = "";
      }

      if (passwordInputRef.current) {
        passwordInputRef.current.value = "";
      }

      emailInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [loginOpen, mode]);

  const resetDialogState = useCallback(() => {
    setMode("login");
    setEmail("");
    setPassword("");
    setLoginError("");
    setResetPassword("");
    setConfirmResetPassword("");
    setResetError("");
    setIsLoggingIn(false);
    setIsResettingPassword(false);
  }, []);

  const unlockPortal = useCallback(async (value: string, options: { showError?: boolean } = {}) => {
    const showError = options.showError ?? true;
    const attempt = unlockAttemptRef.current + 1;
    unlockAttemptRef.current = attempt;

    if (showError) {
      setIsUnlocking(true);
    }

    let result;

    try {
      result = await verifyTherapistPassphrase(value);
    } catch {
      result = {
        success: false,
        error: "The therapist portal is temporarily unavailable. Please try again shortly.",
      } as const;
    }

    if (attempt !== unlockAttemptRef.current) {
      return;
    }

    if (!result.success) {
      if (showError) {
        setPassphrase("");
        setPassphraseError(formatPassphraseError(result.error));
      }
      if (showError) {
        setIsUnlocking(false);
      }
      if (showError) {
        window.requestAnimationFrame(() => {
          passphraseInputRef.current?.focus();
        });
      }
      return;
    }

    setPassphraseError("");
    setPassphrase("");
    resetDialogState();
    setLoginOpen(true);
    setShowPassphrase(false);
    setIsUnlocking(false);
  }, [resetDialogState, verifyTherapistPassphrase]);

  useEffect(() => {
    if (!showPassphrase || loginOpen) {
      return;
    }

    const value = passphrase.trim();
    if (value.length < 3) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void unlockPortal(value, { showError: false });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [loginOpen, passphrase, showPassphrase, unlockPortal]);

  const handlePassphraseChange = (value: string) => {
    setPassphrase(value);

    if (passphraseError) {
      setPassphraseError("");
    }
  };

  const handlePassphraseSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const value = passphrase.trim();

    if (!value) {
      setPassphrase("");
      setPassphraseError("Enter the secret passphrase.");
      window.requestAnimationFrame(() => {
        passphraseInputRef.current?.focus();
      });
      return;
    }

    await unlockPortal(value);
  };

  const handleDialogChange = (open: boolean) => {
    setLoginOpen(open);

    if (!open) {
      if (mode === "reset") {
        navigate(location.pathname, { replace: true });
      }
      resetDialogState();
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();

    setIsLoggingIn(true);
    const result = await loginTherapist(email, password);
    setIsLoggingIn(false);

    if (!result.success) {
      setLoginError(result.error);
      return;
    }

    setLoginError("");
    setPassword("");
    setLoginOpen(false);
    toast.success("Therapist portal unlocked.");
    navigate("/therapist/portal", { replace: true });
  };

  const handlePasswordResetRequest = async (event: FormEvent) => {
    event.preventDefault();

    setIsResettingPassword(true);
    const result = await requestTherapistPasswordReset(email);
    setIsResettingPassword(false);

    if (!result.success) {
      setResetError(result.error);
      return;
    }

    setResetError("");
    setMode("sent");
    toast.success("Reset email sent. Check your inbox if this email is registered.");
  };

  const handlePasswordResetConfirm = async (event: FormEvent) => {
    event.preventDefault();

    if (resetPassword !== confirmResetPassword) {
      setResetError("Your new password confirmation does not match.");
      return;
    }

    setIsResettingPassword(true);
    const result = await confirmTherapistPasswordReset(resetUid, resetToken, resetPassword);
    setIsResettingPassword(false);

    if (!result.success) {
      setResetError(result.error);
      return;
    }

    setResetPassword("");
    setConfirmResetPassword("");
    setResetError("");
    setMode("login");
    navigate(location.pathname, { replace: true });
    toast.success("Password reset. Use your new password to log in.");
  };

  if (isTherapistAuthenticated) {
    return null;
  }

  const isPassphraseActive = passphrase.trim().length > 0;

  return (
    <div className="mt-8 flex flex-col items-center gap-3 text-center">
      {showPassphrase ? (
        <form
          onSubmit={handlePassphraseSubmit}
          className={`w-full max-w-xs rounded-[1.75rem] border border-primary/25 bg-primary/5 px-4 py-3 transition-shadow duration-300 ${
            isPassphraseActive
              ? "shadow-[0_0_46px_hsl(var(--primary)/0.42)]"
              : "shadow-[0_0_20px_hsl(var(--primary)/0.16)] focus-within:shadow-[0_0_34px_hsl(var(--primary)/0.28)]"
          }`}
        >
          <div className="flex items-center">
            <Input
              ref={passphraseInputRef}
              value={passphrase}
              onChange={(event) => handlePassphraseChange(event.target.value)}
              className="h-10 rounded-full border-0 bg-transparent shadow-none focus-visible:ring-0"
              autoFocus
              aria-label="Enter secure passphrase"
              disabled={isUnlocking}
            />
          </div>
          {passphraseError ? <p className="mt-2 text-xs text-destructive">{passphraseError}</p> : null}
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowPassphrase(true)}
          className="text-sm text-primary/70 transition-colors hover:text-primary"
          aria-label="Open therapist portal"
        >
          @
        </button>
      )}

      <Dialog open={loginOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-[40rem] overflow-hidden rounded-[1.5rem] border-border/60 p-0 sm:w-[min(92vw,40rem)] sm:rounded-[1.75rem] lg:max-w-[36rem]">
          <div className="rounded-[inherit] bg-gradient-to-br from-secondary/70 via-background to-background p-5 sm:p-7">
            <DialogHeader>
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {mode === "forgot" ? <Mail className="h-6 w-6" /> : null}
                {mode === "sent" ? <CheckCircle2 className="h-6 w-6" /> : null}
                {mode === "reset" ? <KeyRound className="h-6 w-6" /> : null}
                {mode === "login" ? <ShieldCheck className="h-6 w-6" /> : null}
              </div>
              <DialogTitle className="font-heading text-3xl text-foreground">
                {mode === "login" ? "Therapist Login" : null}
                {mode === "forgot" ? "Forgot Password?" : null}
                {mode === "sent" ? "Check Your Email" : null}
                {mode === "reset" ? "Create New Password" : null}
              </DialogTitle>
              <DialogDescription className="leading-6">
                {mode === "login" ? "Enter your therapist email and password to open the secure dashboard." : null}
                {mode === "forgot" ? "Enter your therapist email and we will send you a secure reset link." : null}
                {mode === "sent" ? "A secure link is on its way if the email belongs to a therapist account." : null}
                {mode === "reset" ? "Choose a strong new password for your therapist portal." : null}
              </DialogDescription>
            </DialogHeader>

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="mt-5 space-y-4 sm:mt-6 sm:space-y-4.5" autoComplete="off">
                <div>
                  <Label htmlFor="therapist-email">Email</Label>
                  <Input
                    id="therapist-email"
                    ref={emailInputRef}
                    type="email"
                    name="therapist-login-email-manual"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="therapist-password">Password</Label>
                  <Input
                    id="therapist-password"
                    ref={passwordInputRef}
                    type="password"
                    name="therapist-login-password-manual"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2"
                    required
                  />
                </div>
                {loginError ? <p className="text-sm text-destructive">{loginError}</p> : null}
                <Button type="submit" variant="hero" className="w-full rounded-full" disabled={isLoggingIn}>
                  {isLoggingIn ? "Opening Dashboard..." : "Open Dashboard"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setLoginError("");
                    setResetError("");
                  }}
                  className="w-full text-sm text-primary transition-colors hover:text-primary/80"
                >
                  Forgot password?
                </button>
              </form>
            ) : null}

            {mode === "forgot" ? (
              <form onSubmit={handlePasswordResetRequest} className="mt-5 space-y-5 sm:mt-6" autoComplete="off">
                <div>
                  <Label htmlFor="forgot-email">Therapist email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    name="therapist-reset-email"
                    autoComplete="email"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                {resetError ? <p className="text-sm text-destructive">{resetError}</p> : null}
                <Button type="submit" variant="hero" className="w-full rounded-full" disabled={isResettingPassword}>
                  {isResettingPassword ? "Sending Reset Link..." : "Send Reset Link"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setResetError("");
                  }}
                  className="w-full text-sm text-primary transition-colors hover:text-primary/80"
                >
                  Back to login
                </button>
              </form>
            ) : null}

            {mode === "sent" ? (
              <div className="mt-6 space-y-5">
                <p className="text-sm leading-7 text-muted-foreground">
                  If this email is registered, a password reset link has been sent. Please check your inbox and spam
                  folder.
                </p>
                <Button type="button" variant="hero" className="w-full rounded-full" onClick={() => setMode("login")}>
                  Return to Login
                </Button>
              </div>
            ) : null}

            {mode === "reset" ? (
              <form onSubmit={handlePasswordResetConfirm} className="mt-5 space-y-4 sm:mt-6" autoComplete="off">
                <div>
                  <Label htmlFor="reset-password">New password</Label>
                  <Input
                    id="reset-password"
                    type="password"
                    name="therapist-reset-password"
                    autoComplete="new-password"
                    value={resetPassword}
                    onChange={(event) => setResetPassword(event.target.value)}
                    className="mt-2"
                    minLength={8}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-reset-password">Confirm new password</Label>
                  <Input
                    id="confirm-reset-password"
                    type="password"
                    name="therapist-confirm-reset-password"
                    autoComplete="new-password"
                    value={confirmResetPassword}
                    onChange={(event) => setConfirmResetPassword(event.target.value)}
                    className="mt-2"
                    minLength={8}
                    required
                  />
                </div>
                {resetError ? <p className="text-sm text-destructive">{resetError}</p> : null}
                <Button type="submit" variant="hero" className="w-full rounded-full" disabled={isResettingPassword}>
                  {isResettingPassword ? "Updating Password..." : "Reset Password"}
                </Button>
              </form>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TherapistPortalAccess;
