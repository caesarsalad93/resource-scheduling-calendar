import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function PasswordGate({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(
    () => !!localStorage.getItem("site_password")
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuthChanged = useCallback(() => {
    setAuthenticated(!!localStorage.getItem("site_password"));
  }, []);

  useEffect(() => {
    window.addEventListener("auth-changed", handleAuthChanged);
    return () => window.removeEventListener("auth-changed", handleAuthChanged);
  }, [handleAuthChanged]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        localStorage.setItem("site_password", password);
        setAuthenticated(true);
        setPassword("");
      } else {
        setError("Incorrect password");
      }
    } catch {
      setError("Unable to verify password");
    } finally {
      setLoading(false);
    }
  }

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">Schedule Access</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading || !password}>
              {loading ? "Verifying..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default PasswordGate;
