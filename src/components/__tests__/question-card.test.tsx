import { describe, it, expect, vi } from "vitest";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionCard } from "@/components/question-card";
import type { Question } from "@/types/question";

const singleQuestion: Question = {
  id: "q1",
  certificationId: "aws-sap",
  domain: "Domain A",
  difficulty: "professional",
  type: "single",
  stem: "Which service provides managed Kubernetes?",
  options: [
    { key: "A", text: "Amazon ECS" },
    { key: "B", text: "Amazon EKS" },
    { key: "C", text: "AWS Lambda" },
    { key: "D", text: "Amazon EC2" },
  ],
  correctAnswers: ["B"],
  explanation: "EKS is the managed Kubernetes service.",
  tags: ["containers"],
};

describe("QuestionCard", () => {
  it("renders question stem and all options", () => {
    const { container } = render(
      <QuestionCard
        question={singleQuestion}
        onAnswer={vi.fn()}
        showResult={false}
      />
    );
    const card = within(container);
    expect(card.getAllByText(/managed Kubernetes/).length).toBeGreaterThanOrEqual(1);
    expect(card.getAllByText("Amazon ECS").length).toBeGreaterThanOrEqual(1);
    expect(card.getAllByText("Amazon EKS").length).toBeGreaterThanOrEqual(1);
    expect(card.getAllByText("AWS Lambda").length).toBeGreaterThanOrEqual(1);
    expect(card.getAllByText("Amazon EC2").length).toBeGreaterThanOrEqual(1);
  });

  it("calls onAnswer with selected option for single-select", async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <QuestionCard
        question={singleQuestion}
        onAnswer={onAnswer}
        showResult={false}
      />
    );
    const card = within(container);
    await user.click(card.getAllByText("Amazon EKS")[0]);
    await user.click(card.getAllByRole("button", { name: /submit/i })[0]);
    expect(onAnswer).toHaveBeenCalledWith(["B"]);
  });

  it("hides submit button when showResult is true", () => {
    const { container } = render(
      <QuestionCard
        question={singleQuestion}
        onAnswer={vi.fn()}
        showResult={true}
        selectedAnswers={["B"]}
      />
    );
    const card = within(container);
    expect(card.queryByText(/submit answer/i)).not.toBeInTheDocument();
  });
});
