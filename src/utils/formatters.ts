export function formatTimeAgo(postDateStr: Date | string | undefined): string | null {
  if (!postDateStr) {
    console.log('formatTimeAgo: postDateStr is empty/undefined');
    return null;
  }

  const postDate = new Date(postDateStr);
  const now = new Date();
  
  console.log('formatTimeAgo DEBUG:', {
    input: postDateStr,
    inputType: typeof postDateStr,
    parsedDate: postDate,
    isValidDate: !isNaN(postDate.getTime()),
    now: now,
    postTime: postDate.getTime(),
    nowTime: now.getTime()
  });
  
  // Verificar se a data é válida
  if (isNaN(postDate.getTime())) {
    console.log('formatTimeAgo: Invalid date');
    return null;
  }
  
  const diffInMs = now.getTime() - postDate.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);

  console.log('formatTimeAgo time difference:', {
    diffInMs,
    diffInSeconds,
    diffInMinutes: diffInSeconds / 60,
    diffInHours: diffInSeconds / 3600
  });

  // Se for negativo (data futura), mostrar "agora mesmo"
  if (diffInSeconds < 0) {
    return "agora mesmo";
  }

  const intervals = {
    ano: 31536000,    // 365 * 24 * 60 * 60
    mês: 2592000,     // 30 * 24 * 60 * 60  
    dia: 86400,       // 24 * 60 * 60
    hora: 3600,       // 60 * 60
    minuto: 60
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      console.log(`formatTimeAgo result: há ${interval} ${unit}${interval > 1 ? (unit === 'mês' ? 'es' : 's') : ''}`);
      return `há ${interval} ${unit}${interval > 1 ? (unit === 'mês' ? 'es' : 's') : ''}`;
    }
  }

  console.log('formatTimeAgo result: agora mesmo');
  return "agora mesmo";
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'agora';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}s`;
  }

  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }

  if (num < 1000000) {
    return `${(num / 1000).toFixed(1)}k`;
  }

  return `${(num / 1000000).toFixed(1)}M`;
}