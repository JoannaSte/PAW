export const activityMap: Record<string, number> = {
  "Low": 1,
  "Moderately Active": 2,
  "Highly Active": 3,
};

export interface UserDataRecord {
  sleep?: string | number | null;
  sleep_hours?: string | number | null;
  stress?: string | number | null;
  stress_level?: string | number | null;
  quality?: string | number | null;
  sleep_quality_score?: string | number | null;
  activity_level?: string | null;
  date?: string | null;
  record_date?: string | null;
  hourly_steps_vector?: (number | string)[] | null;
}

export interface ChartDataPoint {
  x: number;
  date: string;
  sleep: number | null;
  stress: number | null;
  quality: number | null;
  activity: number | null;
}

export interface StepsDataPoint {
  x: number;
  steps: number;
  date: string;
}

export function parseUserData(userData: UserDataRecord[] | null | undefined): ChartDataPoint[] {
  if (!Array.isArray(userData)) return [];
  return userData.map((r, index) => {
    const sleepVal = r.sleep !== undefined ? r.sleep : r.sleep_hours;
    const stressVal = r.stress !== undefined ? r.stress : r.stress_level;
    const qualityVal = r.quality !== undefined ? r.quality : r.sleep_quality_score;

    const sleep = sleepVal !== null && sleepVal !== undefined ? Number(sleepVal) : NaN;
    const stress = stressVal !== null && stressVal !== undefined ? Number(stressVal) : NaN;
    const quality = qualityVal !== null && qualityVal !== undefined ? Number(qualityVal) : NaN;
    const activity = r.activity_level ? (activityMap[r.activity_level] || 0) : 0;

    return {
      x: index,
      date: r.date || r.record_date || "brak daty",
      sleep: isNaN(sleep) ? null : sleep,
      stress: isNaN(stress) ? null : stress,
      quality: isNaN(quality) ? null : quality,
      activity: isNaN(activity) ? null : activity,
    };
  });
}

export function calculateStepsData(userData: UserDataRecord[] | null | undefined): StepsDataPoint[] {
  if (!Array.isArray(userData)) return [];
  return userData.flatMap((r, dayIndex) => {
    const stepsVector = r.hourly_steps_vector || [];
    const recordDate = r.date || r.record_date || "brak daty";
    return stepsVector.map((val, i) => ({
      x: dayIndex * 24 + i,
      steps: Number(val) || 0,
      date: recordDate,
    }));
  });
}

export function calculateAverage(
  chartData: ChartDataPoint[] | null | undefined,
  key: keyof Omit<ChartDataPoint, 'date' | 'x'>
): string | number {
  if (!chartData || chartData.length === 0) return 0;
  const sum = chartData.reduce((acc, d) => {
    const val = d[key];
    return acc + (typeof val === 'number' ? val : 0);
  }, 0);
  return (sum / chartData.length).toFixed(2);
}
