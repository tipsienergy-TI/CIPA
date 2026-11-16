export type Candidate = {
  id: string;
  name: string;
  department: string;
  photo_url: string | null;
};

export type ResultCandidate = Candidate & { votes: number };

export type Results = {
  candidates: ResultCandidate[];
  blank: number;
  eligible: number;
  voted: number;
};

export type VoterHit = {
  id: string;
  name: string;
  hint: string | null;
  voted: boolean;
};

export type VoterRow = {
  id: string;
  name: string;
  registration: string | null;
  has_voted: boolean;
};
