// localStorageMock.ts
declare global {
  interface Window {
    localStorage: Storage;
  }
}

localStorage.__proto__.getCrmItem = (key: string) => {
  let itemKey = key;
  if (
    key !== 'u_id' &&
    key !== 'token' &&
    key !== 'contact_columns' &&
    key !== 'task_columns' &&
    key !== 'activity_columns'
  ) {
    itemKey = 'crm.' + key;
  }
  const value = localStorage.getItem(itemKey);
  return value;
};

localStorage.__proto__.removeCrmItem = (key: string) => {
  let itemKey = key;
  if (
    key !== 'u_id' &&
    key !== 'token' &&
    key !== 'contact_columns' &&
    key !== 'task_columns' &&
    key !== 'activity_columns'
  ) {
    itemKey = 'crm.' + key;
  }
  localStorage.removeItem(itemKey);
};

localStorage.__proto__.setCrmItem = (key: string, value: string) => {
  let itemKey = key;
  if (
    key !== 'u_id' &&
    key !== 'token' &&
    key !== 'contact_columns' &&
    key !== 'task_columns' &&
    key !== 'activity_columns'
  ) {
    itemKey = 'crm.' + key;
  }
  localStorage.setItem(itemKey, value);
};
export {};
