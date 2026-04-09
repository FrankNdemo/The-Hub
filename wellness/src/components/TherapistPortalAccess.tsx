import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
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

const TherapistPortalAccess = () => {
  const navigate = useNavigate();
  const { therapist, isTherapistAuthenticated, loginTherapist, verifyTherapistPassphrase, resetTherapistPassword } =
    useWellnessHub();
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [passphraseError, setPassphraseError] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState(therapist.email);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [forgotSecret, setForgotSecret] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const passphraseInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const formatPassphraseError = (message: string) => {
    const normalized = message.trim().toLowerCase();

    if (normalized.includes("unable to reach the wellness api")) {
      return "Unable to verify the secret passphrase right now. Refresh the page and try again.";
    }

    return message;
  };

  useEffect(() => {
    setEmail(therapist.email);
  }, [therapist.email]);

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
    if (!loginOpen || mode !== "login") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      passwordInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [loginOpen, mode]);

  const resetDialogState = () => {
    setMode("login");
    setEmail(therapist.email);
    setPassword("");
    setLoginError("");
    setForgotSecret("");
    setResetPassword("");
    setConfirmResetPassword("");
    setResetError("");
    setIsLoggingIn(false);
    setIsResettingPassword(false);
  };

  const unlockPortal = async (value: string) => {
    setIsUnlocking(true);

    const result = await verifyTherapistPassphrase(value);

    if (!result.success) {
      setPassphrase("");
      setPassphraseError(formatPassphraseError(result.error));
      setIsUnlocking(false);
      window.requestAnimationFrame(() => {
        passphraseInputRef.current?.focus();
      });
      return;
    }

    setPassphraseError("");
    setPassphrase("");
    resetDialogState();
    setLoginOpen(true);
    setShowPassphrase(false);
    setIsUnlocking(false);
  };

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
    navigate("/therapist/portal");
  };

  const handlePasswordReset = async (event: FormEvent) => {
    event.preventDefault();

    if (resetPassword !== confirmResetPassword) {
      setResetError("Your new password confirmation does not match.");
      return;
    }

    setIsResettingPassword(true);
    const result = await resetTherapistPassword(email, forgotSecret, resetPassword);
    setIsResettingPassword(false);

    if (!result.success) {
      setResetError(result.error);
      return;
    }

    setForgotSecret("");
    setResetPassword("");
    setConfirmResetPassword("");
    setResetError("");
    setMode("login");
    toast.success("Password reset. Use your new password to log in.");
  };

  if (isTherapistAuthenticated) {
    return null;
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-3 text-center">
      {showPassphrase ? (
        <form
          onSubmit={handlePassphraseSubmit}
          className="w-full max-w-xs rounded-[1.75rem] border border-primary/20 bg-primary/5 px-4 py-3 shadow-card"
        >
          <div className="flex items-center">
            <Input
              ref={passphraseInputRef}
              value={passphrase}
              onChange={(event) => handlePassphraseChange(event.target.value)}
              placeholder="Enter secure passphrase"
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
        <DialogContent className="max-w-md rounded-[1.75rem] border-border/60 p-0">
          <div className="rounded-[1.75rem] bg-gradient-to-br from-secondary/70 via-background to-background p-7">
            <DialogHeader>
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <DialogTitle className="font-heading text-3xl text-foreground">
                {mode === "login" ? "Therapist Login" : "Reset Password"}
              </DialogTitle>
              <DialogDescription className="leading-6">
                {mode === "login"
                  ? "Secure access to bookings, notifications, and blog publishing tools."
                  : "Use the saved therapist email and secret passphrase to create a new password."}
              </DialogDescription>
            </DialogHeader>

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="mt-6 space-y-5">
                <div>
                  <Label htmlFor="therapist-email">Email</Label>
                  <Input
                    id="therapist-email"
                    type="email"
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
                  }}
                  className="w-full text-sm text-primary transition-colors hover:text-primary/80"
                >
                  Forgot password?
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordReset} className="mt-6 space-y-5">
                <div>
                  <Label htmlFor="forgot-email">Therapist email</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="forgot-secret">Secret passphrase</Label>
                  <Input
                    id="forgot-secret"
                    value={forgotSecret}
                    onChange={(event) => setForgotSecret(event.target.value)}
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reset-password">New password</Label>
                  <Input
                    id="reset-password"
                    type="password"
                    value={resetPassword}
                    onChange={(event) => setResetPassword(event.target.value)}
                    className="mt-2"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-reset-password">Confirm new password</Label>
                  <Input
                    id="confirm-reset-password"
                    type="password"
                    value={confirmResetPassword}
                    onChange={(event) => setConfirmResetPassword(event.target.value)}
                    className="mt-2"
                    required
                  />
                </div>
                {resetError ? <p className="text-sm text-destructive">{resetError}</p> : null}
                <p className="text-sm leading-6 text-muted-foreground">
                  The email here matches the therapist profile. If you need to change the secret passphrase itself,
                  sign in and update it from the dashboard security section.
                </p>
                <Button type="submit" variant="hero" className="w-full rounded-full" disabled={isResettingPassword}>
                  {isResettingPassword ? "Saving..." : "Save New Password"}
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
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TherapistPortalAccess;
