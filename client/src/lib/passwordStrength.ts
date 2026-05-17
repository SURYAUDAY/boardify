export type StrengthScore = 0 | 1 | 2 | 3 | 4;
export type StrengthLabel = 'Weak' | 'Fair' | 'Good' | 'Strong' | '';

export function calculateStrength(password: string): {
  score: StrengthScore;
  label: StrengthLabel;
} {
  if (!password) return { score: 0, label: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;

  const labels: Record<number, StrengthLabel> = {
    0: 'Weak',
    1: 'Weak',
    2: 'Fair',
    3: 'Good',
    4: 'Strong',
  };
  return { score: score as StrengthScore, label: labels[score] };
}
