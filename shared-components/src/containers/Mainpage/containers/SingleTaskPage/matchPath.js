import { matchPath } from 'react-router';

export const getTaskIdFromPath = pathname => {
  const taskMatch = matchPath(pathname, {
    path: '/tasks/:taskId',
    exact: true,
    strict: false
  });

  return taskMatch.params.taskId;
};
