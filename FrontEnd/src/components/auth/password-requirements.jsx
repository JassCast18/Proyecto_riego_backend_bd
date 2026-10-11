import { CheckCircle2, Circle } from 'lucide-react'
import { getPasswordChecks } from '@/utils/password-policy.js'

export function PasswordRequirements({ password }) {
  return (
    <div className="grid gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2" aria-live="polite">
      {getPasswordChecks(password).map((rule) => {
        const Icon = rule.valid ? CheckCircle2 : Circle
        return (
          <div key={rule.id} className={`flex min-w-0 items-start gap-2 text-xs ${rule.valid ? 'text-emerald-700' : 'text-slate-500'}`}>
            <Icon size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{rule.label}</span>
          </div>
        )
      })}
    </div>
  )
}

