export function shiftClick (items, selectedItems, item) {
  var selectedInBetween;
  if (selectedItems.length === 0) {
    if (!selectedItems.includes(item)) {
      selectedItems.push(item);
    }
  } else if (selectedItems.length === 1) {
    let selectedItem = selectedItems[0];
    let fromIndex = items.indexOf(selectedItem);
    let toIndex = items.indexOf(item);

    if (fromIndex !== toIndex) {
      _clear(selectedItems);
      if (fromIndex < toIndex) {
        selectedInBetween = items.slice(fromIndex, toIndex + 1);
      } else {
        selectedInBetween = items.slice(toIndex, fromIndex + 1);
      }
      selectedInBetween.forEach(item => {
        selectedItems.push(item);
      });
    }
  } else if (selectedItems.length > 1) {
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

    selectedInBetween.forEach(item => {
      selectedItems.push(item);
    });
  }

  return selectedItems;
}

function _clear (array) {
  while (array.length > 0) {
    array.pop();
  }
}
