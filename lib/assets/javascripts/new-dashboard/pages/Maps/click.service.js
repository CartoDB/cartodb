import _ from 'underscore';

export function shiftClick (items, selectedItems, item) {
  if (selectedItems.length === 0) {
    return [item];
  }

  let selectedInBetween;
  let selectedIndex = items.indexOf(item);
  let lastSelectedIndex = items.indexOf(selectedItems[selectedItems.length - 1]);

  if (selectedIndex <= lastSelectedIndex) {
    selectedInBetween = items.slice(selectedIndex, lastSelectedIndex + 1);
  }

  if (selectedIndex >= lastSelectedIndex) {
    selectedInBetween = items.slice(lastSelectedIndex, selectedIndex + 1);
  }
  return _.uniq([...selectedItems, ...selectedInBetween]);
}
