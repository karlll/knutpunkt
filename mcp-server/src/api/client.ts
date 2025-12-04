import axios, { AxiosInstance } from 'axios';

export interface Task {
  id: string;
  number: number;
  title: string;
  description: string;
  status: 'planned' | 'ongoing' | 'done';
  createdAt: string;
  updatedAt: string;
  assignees: string[];
  categories: string[];
  priority: 'low' | 'medium' | 'high';
  order: number;
}

export interface TaskCreate {
  title: string;
  description: string;
  status?: 'planned' | 'ongoing' | 'done';
  assignees?: string[];
  categories?: string[];
  priority?: 'low' | 'medium' | 'high';
  order?: number;
}

export interface TaskUpdate {
  title: string;
  description: string;
  status?: 'planned' | 'ongoing' | 'done';
  assignees?: string[];
  categories?: string[];
  priority?: 'low' | 'medium' | 'high';
  order?: number;
}

export class KnutpunktApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:8080/api/v1') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  async listTasks(params?: {
    status?: string;
    assignee?: string;
    category?: string;
    priority?: string;
  }): Promise<Task[]> {
    const response = await this.client.get<Task[]>('/tasks', { params });
    return response.data;
  }

  async getTask(id: string): Promise<Task> {
    const response = await this.client.get<Task>(`/tasks/${id}`);
    return response.data;
  }

  async updateTask(id: string, update: TaskUpdate): Promise<Task> {
    const response = await this.client.put<Task>(`/tasks/${id}`, update);
    return response.data;
  }

  async updateTaskStatus(id: string, status: 'planned' | 'ongoing' | 'done'): Promise<Task> {
    const response = await this.client.patch<Task>(`/tasks/${id}/status`, { status });
    return response.data;
  }

  async createTask(create: TaskCreate): Promise<Task> {
    const response = await this.client.post<Task>('/tasks', create);
    return response.data;
  }

  async deleteTask(id: string): Promise<void> {
    await this.client.delete(`/tasks/${id}`);
  }
}

// Export singleton instance
export const apiClient = new KnutpunktApiClient(
  process.env.KNUTPUNKT_API_URL || 'http://localhost:8080/api/v1'
);
