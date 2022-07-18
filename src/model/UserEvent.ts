export interface UserEvent {
  value: UserEventEntry[];
}

interface UserEventEntry {
  changeType: string;
  resourceData: {
    id: string;
  };
}
