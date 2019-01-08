import { shiftClick } from 'new-dashboard/pages/Maps/click.service';

describe.only('.shiftClick', () => {
  describe('when there is not selected items', () => {
    it('should select the item when the clicked', () => {
      const dummyItems = [{id: 0}, {id: 1}, {id: 2}, {id: 3}];
      const dummyItem = dummyItems[2];
      const selectedItems = [];

      let selectedInBetween = shiftClick(dummyItems, selectedItems, dummyItem);

      expect(selectedInBetween).toEqual([dummyItem]);
    });
  });
  describe('when there is a selected item', () => {
    it('should keep the item selected when clicked', () => {
      const dummyItems = [{id: 0}, {id: 1}, {id: 2}, {id: 3}];
      const dummyItem = dummyItems[2];
      const selectedItems = [dummyItem];

      let selectedInBetween = shiftClick(dummyItems, selectedItems, dummyItem);

      expect(selectedInBetween).toEqual([dummyItem]);
    });
    describe('and another item is selected after', () => {
      it('should select all the items in between', () => {
        const dummyItems = [{id: 0}, {id: 1}, {id: 2}, {id: 3}];
        const fromItem = dummyItems[0];
        const toItem = dummyItems[3];
        const selectedItems = [fromItem];

        let selectedInBetween = shiftClick(dummyItems, selectedItems, toItem);
        expect(selectedInBetween).toEqual(dummyItems);
      });
    });
    describe('and another item is selected before', () => {
      it('should select all the items in between', () => {
        const dummyItems = [{id: 0}, {id: 1}, {id: 2}, {id: 3}];
        const fromItem = dummyItems[3];
        const toItem = dummyItems[0];
        const selectedItems = [fromItem];

        let selectedInBetween = shiftClick(dummyItems, selectedItems, toItem);
        expect(selectedInBetween).toEqual(dummyItems);
      });
    });
  });

  describe('when there are multiple selected items', () => {
    describe('and another item is selected after', () => {
      it('should select all the items in between', () => {
        const dummyItems = [{id: 0}, {id: 1}, {id: 2}, {id: 3}];
        const selectedItems = [dummyItems[0], dummyItems[1]];
        let selectedInBetween = shiftClick(dummyItems, selectedItems, dummyItems[3]);

        expect(selectedInBetween).toEqual(dummyItems);
      });
    });
    describe('and another item is selected before', () => {
      it('should select all the items in between', () => {
        const dummyItems = [{id: 0}, {id: 1}, {id: 2}, {id: 3}];
        const selectedItems = [dummyItems[2], dummyItems[3]];
        let selectedInBetween = shiftClick(dummyItems, selectedItems, dummyItems[0]);

        expect(selectedInBetween).toEqual(dummyItems);
      });
    });
  });
});
