export interface Participant {
  id: string;
  name: string;
  role: string;
  node_id: string;
  active: boolean;
  since: string;
}

export interface ParticipantsData {
  participants: Participant[];
}
