import type { Question } from '../hooks/useGameStore';

export interface SafeQuestion extends Question {
  text: string;
  choices: string[];
  correct: number;
}

export function normalizeQuestion(question: Question | null | undefined): SafeQuestion | null {
  if (!question) return null;
  
  return {
    ...question,
    text: question.text || '문제를 불러올 수 없습니다.',
    choices: Array.isArray(question.choices) ? question.choices : [],
    correct: typeof question.correct === 'number' ? question.correct : 0,
  };
}

export function isValidQuestionIndex(index: number, questions: Question[]): boolean {
  return index >= 0 && index < questions.length && questions[index] != null;
}

export function clampIndex(index: number, max: number): number {
  return Math.max(0, Math.min(index, max - 1));
}