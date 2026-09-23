import {
  AcademicConfig,
  SubjectResult,
  ResultStatus,
  GradingScaleItem,
} from '../types/index.ts';

export interface ScoreInput {
  ca1?: number | null;
  ca2?: number | null;
  ca3?: number | null;
  exam?: number | null;
}

export interface ScoreValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CalculatedScores {
  ca1_score: number | null;
  ca2_score: number | null;
  ca3_score: number | null;
  exam_score: number | null;
  total_score: number;
  percentage: number;
  grade: string;
  remark: string;
  is_pass: boolean;
}

/**
 * Validates score inputs against maximum allowed component scores.
 */
export function validateScoreInputs(
  scores: ScoreInput,
  config?: AcademicConfig
): ScoreValidationResult {
  const errors: string[] = [];
  const ca1Max = config?.assessment_components.find((c) => c.code === 'ca1')?.max_score ?? 10;
  const ca2Max = config?.assessment_components.find((c) => c.code === 'ca2')?.max_score ?? 10;
  const ca3Max = config?.assessment_components.find((c) => c.code === 'ca3')?.max_score ?? 20;
  const examMax = config?.assessment_components.find((c) => c.code === 'exam')?.max_score ?? 60;

  if (scores.ca1 !== undefined && scores.ca1 !== null) {
    if (isNaN(scores.ca1) || scores.ca1 < 0) {
      errors.push('CA1 score cannot be negative');
    } else if (scores.ca1 > ca1Max) {
      errors.push(`CA1 score (${scores.ca1}) exceeds maximum allowed (${ca1Max})`);
    }
  }

  if (scores.ca2 !== undefined && scores.ca2 !== null) {
    if (isNaN(scores.ca2) || scores.ca2 < 0) {
      errors.push('CA2 score cannot be negative');
    } else if (scores.ca2 > ca2Max) {
      errors.push(`CA2 score (${scores.ca2}) exceeds maximum allowed (${ca2Max})`);
    }
  }

  if (scores.ca3 !== undefined && scores.ca3 !== null) {
    if (isNaN(scores.ca3) || scores.ca3 < 0) {
      errors.push('CA3 score cannot be negative');
    } else if (scores.ca3 > ca3Max) {
      errors.push(`CA3 score (${scores.ca3}) exceeds maximum allowed (${ca3Max})`);
    }
  }

  if (scores.exam !== undefined && scores.exam !== null) {
    if (isNaN(scores.exam) || scores.exam < 0) {
      errors.push('Exam score cannot be negative');
    } else if (scores.exam > examMax) {
      errors.push(`Exam score (${scores.exam}) exceeds maximum allowed (${examMax})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Authoritative grade and remark resolution based on the school's configured grading scale.
 */
export function determineGradeAndRemark(
  totalScore: number,
  config?: AcademicConfig
): { grade: string; remark: string; gpaPoint: number } {
  const rounded = Math.round(totalScore);

  if (config?.grading_scale && config.grading_scale.length > 0) {
    const sortedScales = [...config.grading_scale].sort((a, b) => b.min_score - a.min_score);
    for (const scale of sortedScales) {
      if (rounded >= scale.min_score && rounded <= scale.max_score) {
        return {
          grade: scale.grade,
          remark: scale.remark,
          gpaPoint: scale.gpa_point ?? 0,
        };
      }
    }
  }

  // Authoritative standard West African Secondary School Scale fallback
  if (rounded >= 75) return { grade: 'A', remark: 'Excellent', gpaPoint: 5.0 };
  if (rounded >= 65) return { grade: 'B', remark: 'Very Good', gpaPoint: 4.0 };
  if (rounded >= 50) return { grade: 'C', remark: 'Credit', gpaPoint: 3.0 };
  if (rounded >= 45) return { grade: 'D', remark: 'Pass', gpaPoint: 2.0 };
  if (rounded >= 40) return { grade: 'E', remark: 'Fair', gpaPoint: 1.0 };
  return { grade: 'F', remark: 'Fail', gpaPoint: 0.0 };
}

/**
 * Authoritative single engine for calculating continuous assessment & exam results.
 * Preserves historical grades for PUBLISHED results unless specifically recalculating.
 */
export function calculateSubjectResultScores(
  scores: ScoreInput,
  config?: AcademicConfig,
  existingResult?: SubjectResult
): CalculatedScores {
  // If result is already published and we want to preserve historical grades
  const ca1 = scores.ca1 ?? null;
  const ca2 = scores.ca2 ?? null;
  const ca3 = scores.ca3 ?? null;
  const exam = scores.exam ?? null;

  const total = (ca1 || 0) + (ca2 || 0) + (ca3 || 0) + (exam || 0);
  const percentage = Math.min(100, Math.max(0, Math.round(total * 10) / 10));

  let grade: string;
  let remark: string;

  if (existingResult?.status === 'PUBLISHED' && existingResult.grade && existingResult.total_score === total) {
    // Preserve published historical outcome
    grade = existingResult.grade;
    remark = existingResult.remark;
  } else {
    const gradeInfo = determineGradeAndRemark(total, config);
    grade = gradeInfo.grade;
    remark = gradeInfo.remark;
  }

  const passMark = config?.pass_mark ?? 50;
  const is_pass = total >= passMark;

  return {
    ca1_score: ca1,
    ca2_score: ca2,
    ca3_score: ca3,
    exam_score: exam,
    total_score: total,
    percentage,
    grade,
    remark,
    is_pass,
  };
}

/**
 * Standard dense ranking helper: sorts by value descending and calculates positions (1st, 2nd, 3rd...).
 */
export function calculateRankings<T>(
  items: T[],
  scoreExtractor: (item: T) => number
): Map<T, number> {
  const sorted = [...items].sort((a, b) => scoreExtractor(b) - scoreExtractor(a));
  const ranks = new Map<T, number>();

  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && scoreExtractor(sorted[i]) < scoreExtractor(sorted[i - 1])) {
      currentRank = i + 1;
    }
    ranks.set(sorted[i], currentRank);
  }

  return ranks;
}

/**
 * Formats rank number to human-friendly English ordinal (1st, 2nd, 3rd, 4th...).
 */
export function formatOrdinalPosition(pos: number): string {
  if (!pos || pos <= 0) return '-';
  const j = pos % 10;
  const k = pos % 100;
  if (j === 1 && k !== 11) return `${pos}st`;
  if (j === 2 && k !== 12) return `${pos}nd`;
  if (j === 3 && k !== 13) return `${pos}rd`;
  return `${pos}th`;
}
