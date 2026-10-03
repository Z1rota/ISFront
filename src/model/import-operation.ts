export interface ImportOperation {
  id: number;
  status: 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
  username: string;
  addedCount: number | null;
  createdAt: string;
}
