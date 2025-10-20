/**
 * Hook for real-time date and time updates
 */

import { useState, useEffect } from 'react';
import { DateUtils } from '../utils/dateUtils';

export interface CurrentDateTime {
  iso: string;
  dateString: string;
  formattedDate: string;
  timestamp: number;
  time: string;
  quarter: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export const useCurrentDateTime = (updateInterval: number = 1000): CurrentDateTime => {
  const [currentDateTime, setCurrentDateTime] = useState<CurrentDateTime>(() => {
    const now = new Date();
    return {
      iso: DateUtils.getCurrentISODate(),
      dateString: DateUtils.getCurrentDateString(),
      formattedDate: DateUtils.getCurrentDateFormatted(),
      timestamp: DateUtils.getCurrentTimestamp(),
      time: DateUtils.getCurrentTime(),
      quarter: DateUtils.getCurrentQuarter(),
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds()
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentDateTime({
        iso: DateUtils.getCurrentISODate(),
        dateString: DateUtils.getCurrentDateString(),
        formattedDate: DateUtils.getCurrentDateFormatted(),
        timestamp: DateUtils.getCurrentTimestamp(),
        time: DateUtils.getCurrentTime(),
        quarter: DateUtils.getCurrentQuarter(),
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds()
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return currentDateTime;
};

export default useCurrentDateTime;



