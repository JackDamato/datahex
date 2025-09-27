export interface ClarificationItem {
    id: string;
    projectId: string;
    question: string;
    hints: string[];
    timestamp: number;
  }
  
  const queue: ClarificationItem[] = [];
  
  export const clarificationQueue = {
    async enqueue(item: Omit<ClarificationItem, "id">) {
      const id = crypto.randomUUID?.() ?? String(Date.now());
      const entry: ClarificationItem = { id, ...item };
      queue.push(entry);
      return entry;
    },
    async dequeue() {
      return queue.shift() || null;
    },
    async list() {
      return [...queue];
    }
  };