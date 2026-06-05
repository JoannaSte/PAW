import { describe, it, expect } from 'vitest';
import {
  parseUserData,
  calculateStepsData,
  calculateAverage,
  activityMap
} from './dataUtils';
import type { UserDataRecord, ChartDataPoint } from './dataUtils';

describe('dataUtils', () => {
  describe('activityMap', () => {
    it('should map levels correctly', () => {
      expect(activityMap['Low']).toBe(1);
      expect(activityMap['Moderately Active']).toBe(2);
      expect(activityMap['Highly Active']).toBe(3);
      expect(activityMap['Unknown']).toBeUndefined();
    });
  });

  describe('parseUserData', () => {
    it('should return empty array when input is null, undefined or not an array', () => {
      expect(parseUserData(null)).toEqual([]);
      expect(parseUserData(undefined)).toEqual([]);
      expect(parseUserData({} as any)).toEqual([]);
    });

    it('should parse valid user records correctly', () => {
      const records: UserDataRecord[] = [
        {
          date: '2026-06-01',
          sleep_hours: 7.5,
          sleep_quality_score: 80,
          stress_level: 2,
          activity_level: 'Highly Active',
        },
        {
          record_date: '2026-06-02',
          sleep: '6.0',
          quality: '70',
          stress: '3',
          activity_level: 'Low',
        }
      ];

      const parsed = parseUserData(records);
      expect(parsed).toHaveLength(2);

      expect(parsed[0]).toEqual({
        x: 0,
        date: '2026-06-01',
        sleep: 7.5,
        stress: 2,
        quality: 80,
        activity: 3,
      });

      expect(parsed[1]).toEqual({
        x: 1,
        date: '2026-06-02',
        sleep: 6.0,
        stress: 3,
        quality: 70,
        activity: 1,
      });
    });

    it('should fallback to null or default values for missing/invalid properties', () => {
      const records: UserDataRecord[] = [
        {
          sleep_hours: 'not-a-number',
          sleep_quality_score: null,
          stress_level: undefined,
          activity_level: 'InvalidLevel',
        }
      ];

      const parsed = parseUserData(records);
      expect(parsed[0]).toEqual({
        x: 0,
        date: 'brak daty',
        sleep: null,
        stress: null,
        quality: null,
        activity: 0,
      });
    });
  });

  describe('calculateStepsData', () => {
    it('should return empty array for null, undefined or not an array', () => {
      expect(calculateStepsData(null)).toEqual([]);
      expect(calculateStepsData(undefined)).toEqual([]);
    });

    it('should expand hourly steps vector correctly', () => {
      const records: UserDataRecord[] = [
        {
          date: '2026-06-01',
          hourly_steps_vector: [100, 200, '300'],
        },
        {
          record_date: '2026-06-02',
          hourly_steps_vector: [400],
        }
      ];

      const steps = calculateStepsData(records);
      expect(steps).toEqual([
        { x: 0, steps: 100, date: '2026-06-01' },
        { x: 1, steps: 200, date: '2026-06-01' },
        { x: 2, steps: 300, date: '2026-06-01' },
        { x: 24, steps: 400, date: '2026-06-02' }
      ]);
    });

    it('should fallback steps value to 0 if invalid', () => {
      const records: UserDataRecord[] = [
        {
          date: '2026-06-01',
          hourly_steps_vector: [null as any, 'invalid', 150],
        }
      ];

      const steps = calculateStepsData(records);
      expect(steps).toEqual([
        { x: 0, steps: 0, date: '2026-06-01' },
        { x: 1, steps: 0, date: '2026-06-01' },
        { x: 2, steps: 150, date: '2026-06-01' }
      ]);
    });
  });

  describe('calculateAverage', () => {
    it('should return 0 when chartData is null, undefined or empty', () => {
      expect(calculateAverage(null, 'sleep')).toBe(0);
      expect(calculateAverage(undefined, 'sleep')).toBe(0);
      expect(calculateAverage([], 'sleep')).toBe(0);
    });

    it('should calculate the average of specified key as formatted string', () => {
      const data: ChartDataPoint[] = [
        { x: 0, date: '2026-06-01', sleep: 8, stress: 1, quality: 90, activity: 2 },
        { x: 1, date: '2026-06-02', sleep: 7, stress: 3, quality: 80, activity: 1 },
        { x: 2, date: '2026-06-03', sleep: 6, stress: 2, quality: 70, activity: 3 },
      ];

      expect(calculateAverage(data, 'sleep')).toBe('7.00');
      expect(calculateAverage(data, 'quality')).toBe('80.00');
      expect(calculateAverage(data, 'stress')).toBe('2.00');
      expect(calculateAverage(data, 'activity')).toBe('2.00');
    });

    it('should handle null values in calculating average', () => {
      const data: ChartDataPoint[] = [
        { x: 0, date: '2026-06-01', sleep: 8, stress: 1, quality: 90, activity: null },
        { x: 1, date: '2026-06-02', sleep: null, stress: 3, quality: 80, activity: null },
      ];

      // Since sleep is [8, null], and activity is [null, null]:
      // The function does (8 + 0) / 2 = 4.00, and (0 + 0) / 2 = 0.00
      expect(calculateAverage(data, 'sleep')).toBe('4.00');
      expect(calculateAverage(data, 'activity')).toBe('0.00');
    });
  });
});
