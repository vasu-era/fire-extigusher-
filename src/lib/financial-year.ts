export function getCurrentFY(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  if (month >= 4) {
    return `${String(year).slice(-2)}-${String(year + 1).slice(-2)}`;
  } else {
    return `${String(year - 1).slice(-2)}-${String(year).slice(-2)}`;
  }
}

export function getFYFromDate(date: Date): { fy_short: string; fy_start: string; fy_end: string } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  if (month >= 4) {
    return {
      fy_short: `${String(year).slice(-2)}-${String(year + 1).slice(-2)}`,
      fy_start: `${year}-04-01`,
      fy_end: `${year + 1}-03-31`,
    };
  } else {
    return {
      fy_short: `${String(year - 1).slice(-2)}-${String(year).slice(-2)}`,
      fy_start: `${year - 1}-04-01`,
      fy_end: `${year}-03-31`,
    };
  }
}

export function getFYDates(fy: string): { start_date: string; end_date: string } {
  if (fy === 'all') {
    return { start_date: '2000-01-01', end_date: '2100-12-31' };
  }
  
  const parts = fy.split('-');
  const start_year = 2000 + parseInt(parts[0]);
  const end_year = 2000 + parseInt(parts[1]);
  
  return {
    start_date: `${start_year}-04-01`,
    end_date: `${end_year}-03-31`,
  };
}

export function generateCertificateNo(fy: string, number: number): string {
  return `RGS/${fy}/${number}`;
}

export function parseCertificateNo(certNo: string): { fy: string; number: number } | null {
  const match = certNo.match(/^RGS\/(\d{2}-\d{2})\/(\d+)$/);
  if (!match) return null;
  return {
    fy: match[1],
    number: parseInt(match[2]),
  };
}

export interface FYOption {
  key: string;
  label: string;
}

export function generateFYOptions(oldestYear: number): FYOption[] {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentFullYear = now.getFullYear();
  const presentFYStart = currentMonth >= 4 ? currentFullYear : currentFullYear - 1;

  const options: FYOption[] = [];
  for (let y = presentFYStart; y >= oldestYear - 1; y--) {
    const key = `${String(y).slice(-2)}-${String(y + 1).slice(-2)}`;
    const label = `FY ${y}-${String(y + 1).slice(-2)}`;
    options.push({ key, label });
  }
  return options;
}
