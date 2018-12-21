export function shiftClick (items, selectedItems, item) {
  if (selectedItems.length === 0) {
    selectedItems.push(item);
    return selectedItems;
  }

  let selectedInBetween;
  let lowerSelectedIndex = items.indexOf(selectedItems[0]);
  let upperSelectedIndex = items.indexOf(selectedItems[selectedItems.length - 1]);
  let selectedIndex = items.indexOf(item);

  if (selectedIndex <= lowerSelectedIndex) {
    lowerSelectedIndex = selectedIndex;
  }

  if (selectedIndex >= upperSelectedIndex) {
    upperSelectedIndex = selectedIndex;
  }

  selectedInBetween = items.slice(lowerSelectedIndex, upperSelectedIndex + 1);

  _clear(selectedItems);

  selectedInBetween.forEach(item => selectedItems.push(item));

  return selectedItems;
}

function _clear (array) {
  while (array.length > 0) {
    array.pop();
  }
}
