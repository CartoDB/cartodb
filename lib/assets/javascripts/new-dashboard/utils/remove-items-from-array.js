export default function removeElementsFromArray (array, elementsToRemove) {
  return array.filter(item => !elementsToRemove.includes(item));
}
