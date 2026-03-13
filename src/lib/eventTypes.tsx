import {
  CalendarDays, GraduationCap, Users, PackageCheck, Flag, ClipboardCheck,
  type LucideProps,
} from 'lucide-react'
import type { EventType } from '../types'
import type { ComponentType } from 'react'

export interface EventTypeInfo {
  type: EventType
  label: string
  Icon: ComponentType<LucideProps>
}

export const EVENT_TYPES: EventTypeInfo[] = [
  { type: 'evento', label: 'Evento', Icon: CalendarDays },
  { type: 'parcial', label: 'Parcial', Icon: GraduationCap },
  { type: 'reunion', label: 'Reunión', Icon: Users },
  { type: 'entrega', label: 'Entrega', Icon: PackageCheck },
  { type: 'hito', label: 'Hito', Icon: Flag },
  { type: 'control', label: 'Control', Icon: ClipboardCheck },
]

export function getEventTypeInfo(type: EventType | undefined | null): EventTypeInfo {
  return EVENT_TYPES.find((t) => t.type === type) ?? EVENT_TYPES[0]
}

export function EventTypeIcon({ type, size = 14, className }: { type: EventType | undefined | null; size?: number; className?: string }) {
  const { Icon } = getEventTypeInfo(type)
  return <Icon size={size} className={className} />
}
