export const editMapMetadata = jest.fn();

export const editDatasetMetadata = jest.fn();

export const changePrivacy = jest.fn();

export const duplicateVisualization = jest.fn();

export const shareVisualization = jest.fn();

export const changeLockState = jest.fn();

export const changeVisualizationsLockState = jest.fn();

export const deleteVisualization = jest.fn(function (visualization, type, actionHandlers) {
  if (actionHandlers && actionHandlers.deselectAll) {
    actionHandlers.deselectAll();
  }
});

export const deleteVisualizations = jest.fn();

export const createMap = jest.fn();

export const duplicateDataset = jest.fn();
