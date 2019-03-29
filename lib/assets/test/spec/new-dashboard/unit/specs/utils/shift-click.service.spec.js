import _ from 'underscore';
import { shiftClick } from 'new-dashboard/utils/shift-click.service';

describe('.shiftClick', () => {
  describe('when there is a selected item', () => {
    it('should keep the item selected when clicked', () => {
      const dummyItems = [{id: 0}, {id: 1}, {id: 2}, {id: 3}];
      const dummyItem = dummyItems[2];
      const selectedItems = [dummyItem];

      let selectedInBetween = shiftClick(dummyItems, selectedItems, dummyItem, dummyItem);

      expect(_.sortBy(selectedInBetween, 'id')).toEqual([dummyItem]);
    });
    describe('and another item is selected after', () => {
      it('should select all the items in between', () => {
        const dummyItems = [{id: 0}, {id: 1}, {id: 2}, {id: 3}];
        const fromItem = dummyItems[0];
        const toItem = dummyItems[3];
        const selectedItems = [fromItem];

        let selectedInBetween = shiftClick(dummyItems, selectedItems, toItem, fromItem);
        expect(_.sortBy(selectedInBetween, 'id')).toEqual(dummyItems);
      });
    });
    describe('and another item is selected before', () => {
      it('should select all the items in between', () => {
        const dummyItems = [{id: 0}, {id: 1}, {id: 2}, {id: 3}];
        const fromItem = dummyItems[3];
        const toItem = dummyItems[0];
        const selectedItems = [fromItem];

        let selectedInBetween = shiftClick(dummyItems, selectedItems, toItem, fromItem);
        expect(_.sortBy(selectedInBetween, 'id')).toEqual(dummyItems);
      });
    });
  });

  describe('when there are multiple selected items', () => {
    describe('and another item is selected after', () => {
      it('should select all the items in between', () => {
        const dummyItems = [{id: 0}, {id: 1}, {id: 2}, {id: 3}];
        const selectedItems = [dummyItems[0], dummyItems[1]];
        let selectedInBetween = shiftClick(dummyItems, selectedItems, dummyItems[3], dummyItems[0]);

        expect(_.sortBy(selectedInBetween, 'id')).toEqual(dummyItems);
      });
    });
    describe('and another item is selected before', () => {
      it('should select all the items in between', () => {
        const dummyItems = [{id: 0}, {id: 1}, {id: 2}, {id: 3}];
        const selectedItems = [dummyItems[2], dummyItems[3]];
        let selectedInBetween = shiftClick(dummyItems, selectedItems, dummyItems[0], dummyItems[3]);

        expect(_.sortBy(selectedInBetween, 'id')).toEqual(dummyItems);
      });
    });

    describe('when there is a selected item and a shift selected item below', () => {
      describe('and another is shift selected above those two', () => {
        it('should select two elements: the selected one and the one above', () => {
          const dummyItems = [{id: 0}, {id: 1}, {id: 2}];
          const selectedItems = [dummyItems[1], dummyItems[2]];
          let selectedInBetween = shiftClick(dummyItems, selectedItems, dummyItems[0], dummyItems[1]);
          expect(_.sortBy(selectedInBetween, 'id')).toEqual([{id: 0}, {id: 1}]);
        });
      });

      describe('when there is a selected item and a shift selected item above', () => {
        describe('and another is shift selected below those two', () => {
          it('should select two elements: the selected one and the one below', () => {
            const dummyItems = [{id: 0}, {id: 1}, {id: 2}];
            const selectedItems = [dummyItems[1], dummyItems[0]];
            let selectedInBetween = shiftClick(dummyItems, selectedItems, dummyItems[2], dummyItems[1]);
            expect(_.sortBy(selectedInBetween, 'id')).toEqual([{id: 1}, {id: 2}]);
          });
        });
      });
    });
  });
});
