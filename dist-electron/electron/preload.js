"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    db: {
        getExercises: (dayOfWeek) => electron_1.ipcRenderer.invoke('db:getExercises', dayOfWeek),
        getSessions: () => electron_1.ipcRenderer.invoke('db:getSessions'),
        getActiveSession: () => electron_1.ipcRenderer.invoke('db:getActiveSession'),
        createSession: (data) => electron_1.ipcRenderer.invoke('db:createSession', data),
        updateSessionExercise: (id, data) => electron_1.ipcRenderer.invoke('db:updateSessionExercise', id, data),
        endSession: (id, data) => electron_1.ipcRenderer.invoke('db:endSession', id, data),
        getProgression: (days) => electron_1.ipcRenderer.invoke('db:getProgression', days),
        getRapports: () => electron_1.ipcRenderer.invoke('db:getRapports'),
        getStats: () => electron_1.ipcRenderer.invoke('db:getStats'),
        getMedecin: () => electron_1.ipcRenderer.invoke('db:getMedecin'),
        saveMedecin: (data) => electron_1.ipcRenderer.invoke('db:saveMedecin', data),
        getParametres: () => electron_1.ipcRenderer.invoke('db:getParametres'),
        saveParametres: (data) => electron_1.ipcRenderer.invoke('db:saveParametres', data),
    },
    pdf: {
        generate: (sessionId) => electron_1.ipcRenderer.invoke('pdf:generate', sessionId),
        open: (filePath) => electron_1.ipcRenderer.invoke('pdf:open', filePath),
    },
    sync: {
        push: () => electron_1.ipcRenderer.invoke('sync:push'),
        getStatus: () => electron_1.ipcRenderer.invoke('sync:getStatus'),
    },
    system: {
        getResourcePath: (filename) => electron_1.ipcRenderer.invoke('system:getResourcePath', filename),
    },
});
