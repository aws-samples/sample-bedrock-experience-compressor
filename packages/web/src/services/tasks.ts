import technicianApi from './technicianApi';
import { Task } from '@xp-compressor/shared';

export const getTasks = async (): Promise<Task[]> => {
  const response = await technicianApi.get('/api/technician/tasks');
  return response.data.tasks;
};

export const getTask = async (taskId: string): Promise<Task> => {
  const response = await technicianApi.get(`/api/technician/tasks/${taskId}`);
  return response.data;
};

export const updateTaskStatus = async (
  taskId: string,
  status: Task['status']
): Promise<void> => {
  await technicianApi.put(`/api/technician/tasks/${taskId}/status`, { status });
};
