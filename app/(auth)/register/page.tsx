"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT" as "STUDENT" | "INSTRUCTOR",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push("/login?registered=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const field = (
    id: keyof typeof formData,
    label: string,
    type: string,
    placeholder: string,
    autoComplete: string,
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={formData[id]}
        onChange={handleChange}
        required
        disabled={isLoading}
      />
    </div>
  );

  return (
    <div className="w-full max-w-[400px]">
      <h1 className="font-display text-[44px] leading-none">Start learning</h1>
      <p className="mt-3 text-[15px] text-muted-foreground">
        A free account saves your progress, quizzes and certificates.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <div className="rounded-xl bg-clay/10 p-3 text-[14px] text-clay">
            {error}
          </div>
        )}

        <fieldset className="grid grid-cols-2 gap-2" disabled={isLoading}>
          <legend className="sr-only">I want to</legend>
          {[
            ["STUDENT", "Learn", "Take courses"],
            ["INSTRUCTOR", "Teach", "Curate courses"],
          ].map(([value, title, hint]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-xl border p-3 transition ${
                formData.role === value
                  ? "border-forest bg-accent"
                  : "border-border bg-card hover:border-ink/30"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={value}
                checked={formData.role === value}
                onChange={handleChange}
                className="sr-only"
              />
              <span className="block text-[15px] font-semibold">{title}</span>
              <span className="block text-[12.5px] text-muted-foreground">
                {hint}
              </span>
            </label>
          ))}
        </fieldset>

        {field("name", "Full name", "text", "Nour Hassan", "name")}
        {field("email", "Email", "email", "name@example.com", "email")}
        {field(
          "password",
          "Password",
          "password",
          "At least 8 characters",
          "new-password",
        )}
        {field(
          "confirmPassword",
          "Confirm password",
          "password",
          "••••••••",
          "new-password",
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full rounded-full"
          disabled={isLoading}
        >
          {isLoading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-8 text-[14px] text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-forest hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
