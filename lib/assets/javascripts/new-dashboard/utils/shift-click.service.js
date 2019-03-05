export function shiftClick (items, selectedItems, item) {
  if (selectedItems.length === 0) {
    return [item];
  }

  let selectedInBetween;
  const selectedIndex = items.indexOf(item);
  const lastSelectedIndex = items.findIndex(item => item.id === selectedItems[selectedItems.length - 1].id);

  if (selectedIndex < lastSelectedIndex) {
    selectedInBetween = items.slice(selectedIndex, lastSelectedIndex + 1);
  }

  if (selectedIndex >= lastSelectedIndex) {
    selectedInBetween = items.slice(lastSelectedIndex, selectedIndex + 1);
    selectedInBetween = selectedItems.concat(selectedInBetween);
  }

  return Array.from(new Set(selectedInBetween));
}
