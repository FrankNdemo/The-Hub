import { FormEvent, useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useWellnessHub } from "@/context/WellnessHubContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SecurityView = "password" | "secret" | null;

const TherapistSecurityPanel = () => {
  const { therapist, updateTherapistPassword, updateTherapistSecretPassphrase } = useWellnessHub();
  const [activeView, setActiveView] = useState<SecurityView>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentSecret, setCurrentSecret] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [confirmSecret, setConfirmSecret] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingSecret, setIsSavingSecret] = useState(false);

  const toggleView = (view: Exclude<SecurityView, null>) => {
    setActiveView((current) => (current === view ? null : view));
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Your new password confirmation does not match.");
      return;
    }

    setIsSavingPassword(true);
    const result = await updateTherapistPassword(currentPassword, newPassword);
    setIsSavingPassword(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setActiveView(null);
    toast.success("Therapist password updated.");
  };

  const handleSecretSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (newSecret.trim() !== confirmSecret.trim()) {
      toast.error("Your new secret confirmation does not match.");
      return;
    }

    setIsSavingSecret(true);
    const result = await updateTherapistSecretPassphrase(currentSecret, newSecret);
    setIsSavingSecret(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setCurrentSecret("");
    setNewSecret("");
    setConfirmSecret("");
    setActiveView(null);
    toast.success("Therapist secret passphrase updated.");
  };

  return (
    <section className="min-w-0 space-y-5">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Portal security</h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          Open one action at a time to update the therapist password or the hidden footer passphrase. The portal email
          follows the profile email saved in the profile tab.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <button
          type="button"
          onClick={() => toggleView("password")}
          aria-expanded={activeView === "password"}
          className={`rounded-[1.5rem] border p-4 text-left transition-all duration-200 sm:p-5 ${
            activeView === "password"
              ? "border-primary/30 bg-primary/10 shadow-soft"
              : "border-border/60 bg-card hover:border-primary/20 hover:bg-secondary/35"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">Password</p>
              <h3 className="mt-2 font-heading text-xl font-semibold text-foreground sm:text-2xl">Change portal password</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Update the login password used to access the therapist dashboard.
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => toggleView("secret")}
          aria-expanded={activeView === "secret"}
          className={`rounded-[1.5rem] border p-4 text-left transition-all duration-200 sm:p-5 ${
            activeView === "secret"
              ? "border-primary/30 bg-primary/10 shadow-soft"
              : "border-border/60 bg-card hover:border-primary/20 hover:bg-secondary/35"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">Secret</p>
              <h3 className="mt-2 font-heading text-xl font-semibold text-foreground sm:text-2xl">Change footer passphrase</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Update the hidden passphrase used before the therapist login dialog opens.
              </p>
            </div>
          </div>
        </button>
      </div>

      {activeView === null ? (
        <div className="rounded-[1.5rem] border border-dashed border-border/60 bg-secondary/25 p-5 text-sm leading-7 text-muted-foreground">
          Choose either <span className="font-medium text-foreground">Change portal password</span> or{" "}
          <span className="font-medium text-foreground">Change footer passphrase</span> to open its form.
        </div>
      ) : null}

      {activeView === "password" ? (
        <form onSubmit={handlePasswordSubmit} className="wellness-panel rounded-[1.75rem] border border-border/60 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">Password</p>
              <h3 className="mt-2 font-heading text-xl font-semibold text-foreground sm:text-2xl">Change portal password</h3>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="security-email">Portal email</Label>
              <Input id="security-email" value={therapist.email} className="mt-2" readOnly />
            </div>
            <div>
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2"
                required
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button type="submit" variant="hero" className="w-full rounded-full sm:w-auto" disabled={isSavingPassword}>
              {isSavingPassword ? "Saving..." : "Save Password"}
            </Button>
            <Button
              type="button"
              variant="heroBorder"
              className="w-full rounded-full sm:w-auto"
              onClick={() => setActiveView(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {activeView === "secret" ? (
        <form onSubmit={handleSecretSubmit} className="wellness-panel rounded-[1.75rem] border border-border/60 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/70">Secret</p>
              <h3 className="mt-2 font-heading text-xl font-semibold text-foreground sm:text-2xl">Change footer passphrase</h3>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="current-secret">Current secret passphrase</Label>
              <Input
                id="current-secret"
                value={currentSecret}
                onChange={(event) => setCurrentSecret(event.target.value)}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="new-secret">New secret passphrase</Label>
              <Input
                id="new-secret"
                value={newSecret}
                onChange={(event) => setNewSecret(event.target.value)}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirm-secret">Confirm new secret passphrase</Label>
              <Input
                id="confirm-secret"
                value={confirmSecret}
                onChange={(event) => setConfirmSecret(event.target.value)}
                className="mt-2"
                required
              />
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Forgot the password later? Use this passphrase from the footer access point to create a new one.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button type="submit" variant="hero" className="w-full rounded-full sm:w-auto" disabled={isSavingSecret}>
              {isSavingSecret ? "Saving..." : "Save Secret"}
            </Button>
            <Button
              type="button"
              variant="heroBorder"
              className="w-full rounded-full sm:w-auto"
              onClick={() => setActiveView(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
};

export default TherapistSecurityPanel;
