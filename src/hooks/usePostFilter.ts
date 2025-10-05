'use client';

import { useState, useEffect } from 'react';

type FilterType = 'all' | 'friends';

export function usePostFilter() {
  const [filter, setFilter] = useState<FilterType>('all');

  const handleFilterChange = (value: string) => {
    setFilter(value as FilterType);
  };

  return {
    filter,
    setFilter: handleFilterChange
  };
}