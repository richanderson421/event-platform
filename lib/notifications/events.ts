export type NotificationEvent =
  | 'player_requested_join'
  | 'pairings_ready'
  | 'match_disputed'
  | 'event_state_changed';

export interface NotificationPublisher {
  publish(event: NotificationEvent, payload: Record<string, unknown>): Promise<void>;
}

export class NoopPublisher implements NotificationPublisher {
  async publish(): Promise<void> {
    return;
  }
}
