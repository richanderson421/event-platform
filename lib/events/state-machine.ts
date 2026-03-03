import { EventState } from '@prisma/client';

const allowed: Record<EventState, EventState[]> = {
  DRAFT: ['PUBLISHED', 'CANCELLED'],
  PUBLISHED: ['REGISTRATION_OPEN', 'DRAFT', 'CANCELLED'],
  REGISTRATION_OPEN: ['IN_PROGRESS', 'PUBLISHED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [],
  CANCELLED: ['ARCHIVED']
};

export function canTransition(from: EventState, to: EventState): boolean {
  return allowed[from].includes(to);
}

export function assertTransition(from: EventState, to: EventState): void {
  if (!canTransition(from, to)) throw new Error(`Invalid transition ${from} -> ${to}`);
}
