const events = {};

export const eventEmitter = {
  on: (event, listener) => {
    if (!events[event]) {
      events[event] = [];
    }
    events[event].push(listener);
    return () => eventEmitter.off(event, listener);
  },
  
  off: (event, listener) => {
    if (!events[event]) return;
    events[event] = events[event].filter(l => l !== listener);
  },
  
  emit: (event, data) => {
    if (!events[event]) return;
    events[event].forEach(listener => listener(data));
  }
};

// Data store to cache the latest data
export const dataStore = {
  users: [],
  consultations: [],
  jobs: [],
  setUsers: (data) => {
    dataStore.users = data;
    eventEmitter.emit('dataUpdated', { type: 'users' });
  },
  setConsultations: (data) => {
    dataStore.consultations = data;
    eventEmitter.emit('dataUpdated', { type: 'consultations' });
  },
  setJobs: (data) => {
    dataStore.jobs = data;
    eventEmitter.emit('dataUpdated', { type: 'jobs' });
  }
};