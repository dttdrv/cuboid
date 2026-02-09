import { ActivityEvent, ActivityFilter } from '../data/types';

const STORAGE_KEY = 'cuboid_activity_events';
type ActivityRecord = Record<string, ActivityEvent[]>;

const readRecord = (): ActivityRecord => {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') as ActivityRecord;
  } catch {
    return {};
  }
};

const writeRecord = (value: ActivityRecord) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

export class ActivityStore {
  append(projectId: string, event: ActivityEvent) {
    const record = readRecord();
    const current = record[projectId] || [];
    const next = [...current, event].slice(-500);
    record[projectId] = next;
    writeRecord(record);
  }

  read(projectId: string): ActivityEvent[] {
    const record = readRecord();
    return record[projectId] || [];
  }

  clear(projectId: string) {
    const record = readRecord();
    delete record[projectId];
    writeRecord(record);
  }

  filter(events: ActivityEvent[], filter: ActivityFilter): ActivityEvent[] {
    return events.filter((event) => {
      if (!filter.showTools && (event.kind === 'tool_call' || event.kind === 'tool_result')) return false;
      if (!filter.showReasoning && event.kind === 'reasoning_step') return false;
      if (!filter.showCompile && (event.kind === 'compile_start' || event.kind === 'compile_end')) return false;
      if (!filter.showChanges && (event.kind === 'changeset_created' || event.kind === 'changeset_applied')) return false;
      return true;
    });
  }
}

export const activityStore = new ActivityStore();

