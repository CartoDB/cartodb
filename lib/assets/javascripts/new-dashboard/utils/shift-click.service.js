export function shiftClick (items, selectedItems, currentClickedItem, singleSelectedItem) {
  if (selectedItems.length === 0) {
    return [currentClickedItem];
  }

  let currentSelectedItems;
  let previousSelectedRange;
  let previousSelectedRangeStart;
  let previousSelectedRangeEnd;

  const lastSelectedItemIndex = items.findIndex(item => item.id === selectedItems[selectedItems.length - 1].id);
  const currentClickedItemIndex = items.indexOf(currentClickedItem);
  const singleSelectedItemIndex = items.findIndex(item => item.id === singleSelectedItem.id);

  if (currentClickedItemIndex >= singleSelectedItemIndex) {
    currentSelectedItems = items.slice(singleSelectedItemIndex, currentClickedItemIndex + 1);
    previousSelectedRangeStart = lastSelectedItemIndex - 1;
    previousSelectedRangeEnd = currentClickedItemIndex - 1;
  }

  if (currentClickedItemIndex < singleSelectedItemIndex) {
    currentSelectedItems = items.slice(currentClickedItemIndex, singleSelectedItemIndex + 1);
    previousSelectedRangeStart = singleSelectedItemIndex + 1;
    previousSelectedRangeEnd = lastSelectedItemIndex + 1;
  }

  previousSelectedRange = items.slice(previousSelectedRangeStart, previousSelectedRangeEnd);
  selectedItems = removeElementsFromArray(selectedItems, previousSelectedRange);
  currentSelectedItems = selectedItems.concat(currentSelectedItems);

  return Array.from(new Set(currentSelectedItems));
}

const removeElementsFromArray = function (array, elementsToRemove) {
  return array.filter((item) => {
    console.log(item.id, item.name);
    console.log(!elementsToRemove.includes(item));
    return !elementsToRemove.includes(item);
  });
};
