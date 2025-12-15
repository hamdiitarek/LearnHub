"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface QuestionFormProps {
  quizId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "MULTIPLE_SELECT";

export function QuestionForm({ quizId, onSuccess, onCancel }: QuestionFormProps) {
  const [form, setForm] = useState({
    text: "",
    type: "MULTIPLE_CHOICE" as QuestionType,
    points: 1,
  });
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctAnswer, setCorrectAnswer] = useState<string | string[]>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleTypeChange = (type: QuestionType) => {
    setForm({ ...form, type });
    if (type === "TRUE_FALSE") {
      setOptions(["True", "False"]);
      setCorrectAnswer("");
    } else {
      setOptions(["", ""]);
      setCorrectAnswer(type === "MULTIPLE_SELECT" ? [] : "");
    }
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    
    // Update correct answer if needed
    if (form.type === "MULTIPLE_SELECT" && Array.isArray(correctAnswer)) {
      setCorrectAnswer(correctAnswer.filter((a) => newOptions.includes(a)));
    } else if (correctAnswer === options[index]) {
      setCorrectAnswer("");
    }
  };

  const updateOption = (index: number, value: string) => {
    const oldValue = options[index];
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    
    // Update correct answer if the changed option was selected
    if (form.type === "MULTIPLE_SELECT" && Array.isArray(correctAnswer)) {
      setCorrectAnswer(correctAnswer.map((a) => (a === oldValue ? value : a)));
    } else if (correctAnswer === oldValue) {
      setCorrectAnswer(value);
    }
  };

  const handleCorrectAnswerChange = (option: string) => {
    if (form.type === "MULTIPLE_SELECT") {
      const current = Array.isArray(correctAnswer) ? correctAnswer : [];
      if (current.includes(option)) {
        setCorrectAnswer(current.filter((a) => a !== option));
      } else {
        setCorrectAnswer([...current, option]);
      }
    } else {
      setCorrectAnswer(option);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (options.some((o) => !o.trim())) {
      setError("All options must be filled");
      return;
    }

    if (form.type === "MULTIPLE_SELECT") {
      if (!Array.isArray(correctAnswer) || correctAnswer.length === 0) {
        setError("Select at least one correct answer");
        return;
      }
    } else if (!correctAnswer) {
      setError("Select a correct answer");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/quizzes/${quizId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: form.text,
          type: form.type,
          options,
          correctAnswer,
          points: form.points,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add question");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Question</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="questionText">Question *</Label>
            <Textarea
              id="questionText"
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              placeholder="Enter your question..."
              required
              minLength={5}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Question Type</Label>
              <select
                value={form.type}
                onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="TRUE_FALSE">True/False</option>
                <option value="MULTIPLE_SELECT">Multiple Select</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={form.points}
                onChange={(e) =>
                  setForm({ ...form, points: parseInt(e.target.value) || 1 })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Options</Label>
            <p className="text-sm text-gray-500 mb-2">
              {form.type === "MULTIPLE_SELECT"
                ? "Check all correct answers"
                : "Select the correct answer"}
            </p>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type={form.type === "MULTIPLE_SELECT" ? "checkbox" : "radio"}
                    name="correctAnswer"
                    checked={
                      form.type === "MULTIPLE_SELECT"
                        ? Array.isArray(correctAnswer) && correctAnswer.includes(option)
                        : correctAnswer === option
                    }
                    onChange={() => handleCorrectAnswerChange(option)}
                    className="w-4 h-4"
                    disabled={!option.trim()}
                  />
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    disabled={form.type === "TRUE_FALSE"}
                    className="flex-1"
                  />
                  {form.type !== "TRUE_FALSE" && options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {form.type !== "TRUE_FALSE" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="mt-2"
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Option
              </Button>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Question"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
