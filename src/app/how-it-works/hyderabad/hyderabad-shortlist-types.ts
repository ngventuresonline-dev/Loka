export type Verdict = 'Lead Rec' | 'Strong Rec' | 'Conditional' | 'Pass'

export function verdictPillClass(verdict: Verdict, pass?: boolean): string {
  if (pass || verdict === 'Pass') {
    return 'bg-stone-200 text-stone-700 border border-stone-300'
  }
  if (verdict === 'Lead Rec') return 'bg-[#FF5200]/15 text-[#B83200] border border-[#FF5200]/30'
  if (verdict === 'Strong Rec') return 'bg-emerald-50 text-emerald-900 border border-emerald-200'
  return 'bg-amber-50 text-amber-950 border border-amber-200'
}
