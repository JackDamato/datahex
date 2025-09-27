interface Clarification {
  projectId: string;
  question: string;
  hints: string[];
  timestamp: number;
}

class ClarificationQueue {
  private pending: Clarification[] = [];

  async enqueue(c: Clarification) {
    this.pending.push(c);
    console.log(`📝 Clarification queued for project ${c.projectId}: ${c.question}`);
  }

  async getForProject(projectId: string) {
    return this.pending.filter((c) => c.projectId === projectId);
  }

  async popForProject(projectId: string) {
    const idx = this.pending.findIndex((c) => c.projectId === projectId);
    if (idx >= 0) {
      return this.pending.splice(idx, 1)[0];
    }
    return null;
  }

  async clearForProject(projectId: string) {
    this.pending = this.pending.filter((c) => c.projectId !== projectId);
  }

  async getAll() {
    return [...this.pending];
  }
}

export const clarificationQueue = new ClarificationQueue();
