import removeElementsFromArray from './remove-items-from-array';

export function shiftClick (items, selectedItems, currentClickedItem, singleSelectedItem) {
  // Get indexes from items
  const lastSelectedItemIndex = items.findIndex(item => item.id === selectedItems[selectedItems.length - 1].id);
  const currentClickedItemIndex = items.indexOf(currentClickedItem);
  const singleSelectedItemIndex = items.findIndex(item => item.id === singleSelectedItem.id);

  // Calculate items to select
  const currentSelectedRangeStart = Math.min(singleSelectedItemIndex, currentClickedItemIndex);
  const itemsToSelect = Math.abs(singleSelectedItemIndex - currentClickedItemIndex) + 1;
  const nextSelectedItems = items.slice(currentSelectedRangeStart, currentSelectedRangeStart + itemsToSelect);

  // If the selection is upwards, reverse selected items so that the delete range is correct
  if (currentClickedItemIndex < singleSelectedItemIndex) {
    nextSelectedItems.reverse();
  }

  // Calculate items to delete
  const previousSelectedRangeStart = Math.min(lastSelectedItemIndex, currentClickedItemIndex);
  const itemsToDelete = Math.abs(lastSelectedItemIndex - currentClickedItemIndex) + 1;
  const previousSelectedRange = items.slice(previousSelectedRangeStart, previousSelectedRangeStart + itemsToDelete);

  // Delete previous items from array and add the new ones
  selectedItems = removeElementsFromArray(selectedItems, previousSelectedRange);
  const currentSelectedItems = selectedItems.concat(nextSelectedItems);
  return Array.from(new Set(currentSelectedItems));
}
