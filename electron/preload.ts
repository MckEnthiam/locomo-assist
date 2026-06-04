import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  db: {
    getExercises: (dayOfWeek?: number) => ipcRenderer.invoke('db:getExercises', dayOfWeek),
    getSessions: () => ipcRenderer.invoke('db:getSessions'),
    getActiveSession: () => ipcRenderer.invoke('db:getActiveSession'),
    createSession: (data: { dayOfWeek?: number; exerciseIds?: string[] }) =>
      ipcRenderer.invoke('db:createSession', data),
    updateSessionExercise: (id: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:updateSessionExercise', id, data),
    endSession: (id: string, data: { totalDuration?: number }) =>
      ipcRenderer.invoke('db:endSession', id, data),
    getProgression: (days?: number) => ipcRenderer.invoke('db:getProgression', days),
    getRapports: () => ipcRenderer.invoke('db:getRapports'),
    getStats: () => ipcRenderer.invoke('db:getStats'),
    getMedecin: () => ipcRenderer.invoke('db:getMedecin'),
    saveMedecin: (data: Record<string, string | undefined>) =>
      ipcRenderer.invoke('db:saveMedecin', data),
    getParametres: () => ipcRenderer.invoke('db:getParametres'),
    saveParametres: (data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:saveParametres', data),
  },
  pdf: {
    generate: (sessionId?: string) => ipcRenderer.invoke('pdf:generate', sessionId),
    open: (filePath: string) => ipcRenderer.invoke('pdf:open', filePath),
  },
  sync: {
    push: () => ipcRenderer.invoke('sync:push'),
    getStatus: () => ipcRenderer.invoke('sync:getStatus'),
  },
  system: {
    getResourcePath: (filename: string) =>
      ipcRenderer.invoke('system:getResourcePath', filename),
  },
});
