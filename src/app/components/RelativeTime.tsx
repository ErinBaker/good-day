'use client';
import React, { useEffect, useState } from 'react';
import moment from 'moment';

export function RelativeTime({ date }: { date: string | number }) {
  const [relative, setRelative] = useState<string>('');

  useEffect(() => {
    let dateValue: string | number = date;
    if (typeof date === 'string' && !isNaN(Number(date))) {
      dateValue = Number(date);
    }
    const dateObj = moment(dateValue);
    setRelative(dateObj.isValid() ? dateObj.fromNow() : 'Invalid Date');
  }, [date]);

  return <>{relative}</>;
}

export default RelativeTime; 