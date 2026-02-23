export interface Dungeon {
  id: string;
  name: string;
  abbreviation: string;
}

export interface DungeonRun {
  dungeonId: string;
  level: number;
  score: number;
  completionTime: string;
  date: string;
}

export interface Character {
  id: string;
  name: string;
  realm: string;
  class: string;
  spec: string;
  mythicPlusScore: number;
  runs: DungeonRun[];
  recentRuns: DungeonRun[]; // All recent runs, not just best per dungeon
}

export interface View {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy: string; // User who created the view
  characterIds: string[];
}