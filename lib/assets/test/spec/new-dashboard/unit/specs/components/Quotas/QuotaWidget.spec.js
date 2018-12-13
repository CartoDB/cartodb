import { shallowMount } from '@vue/test-utils';
import QuotaWidget from 'new-dashboard/components/Quotas/QuotaWidget';

describe('QuotaWidget.vue', () => {
  it('should render correct contents', () => {
    const quotaWidget = shallowMount(QuotaWidget, {
      propsData: {
        name: 'Widget test',
        amount: 'quota',
        availableCapacity: 1234,
        usedCapacity: 40,
        unit: 'Gb' }
    });

    expect(quotaWidget).toMatchSnapshot();
  });

  it('should put as maximum 100% width in the quota bar', () => {
    const quotaWidget = shallowMount(QuotaWidget, {
      propsData: {
        name: 'Another test',
        amount: 'credits',
        availableCapacity: 1234,
        usedCapacity: 2000
      }
    });

    expect(quotaWidget).toMatchSnapshot();
  });

  it('should render correctly compact widget', () => {
    const quotaWidget = shallowMount(QuotaWidget, {
      propsData: {
        name: 'Another test',
        amount: 'credits',
        availableCapacity: 1234,
        usedCapacity: 12,
        type: 'compact'
      }
    });

    expect(quotaWidget).toMatchSnapshot();
  });

  it('should render warning bar if used ammount is over 60% and under 90%', () => {
    const quotaWidget = shallowMount(QuotaWidget, {
      propsData: {
        name: 'My test',
        amount: 'test',
        availableCapacity: 1000,
        usedCapacity: 610
      }
    });

    expect(quotaWidget).toMatchSnapshot();
  });

  it('should render problem bar if used ammount is over 90%', () => {
    const quotaWidget = shallowMount(QuotaWidget, {
      propsData: {
        name: 'My test',
        amount: 'test',
        availableCapacity: 1000,
        usedCapacity: 932
      }
    });

    expect(quotaWidget).toMatchSnapshot();
  });

  describe('Computed', () => {
    it('should return correct percent', () => {
      const quotaWidget = shallowMount(QuotaWidget, {
        propsData: {
          name: 'My test',
          amount: 'test',
          availableCapacity: 350,
          usedCapacity: 224
        }
      });

      const percent = quotaWidget.vm.getUsedPercent;

      expect(percent).toBe(64);
    });

    it('should not crash and return 100 when the available capacity is 0', () => {
      const quotaWidget = shallowMount(QuotaWidget, {
        propsData: {
          name: 'My test',
          amount: 'test',
          availableCapacity: 0,
          usedCapacity: 0
        }
      });

      const percent = quotaWidget.vm.getUsedPercent;

      expect(percent).toBe(100);
    });

    it('should return correct status of the quota', () => {
      const quotaWidgetGood = shallowMount(QuotaWidget, {
        propsData: {
          name: 'My test',
          amount: 'test',
          availableCapacity: 100,
          usedCapacity: 50
        }
      });
      const quotaWidgetWarning = shallowMount(QuotaWidget, {
        propsData: {
          name: 'My test',
          amount: 'test',
          availableCapacity: 100,
          usedCapacity: 61.4
        }
      });
      const quotaWidgetProblem = shallowMount(QuotaWidget, {
        propsData: {
          name: 'My test',
          amount: 'test',
          availableCapacity: 100,
          usedCapacity: 90.1
        }
      });

      const statusGood = quotaWidgetGood.vm.getStatusBar;
      const statusWarning = quotaWidgetWarning.vm.getStatusBar;
      const statusProblem = quotaWidgetProblem.vm.getStatusBar;

      expect(statusGood).toBe('good');
      expect(statusWarning).toBe('warning');
      expect(statusProblem).toBe('problem');
    });

    it('should return if is compact or not', () => {
      const normalWidget = shallowMount(QuotaWidget, {
        propsData: {
          name: 'My test',
          amount: 'test',
          availableCapacity: 100,
          usedCapacity: 50
        }
      });
      const compactWidget = shallowMount(QuotaWidget, {
        propsData: {
          name: 'My test',
          amount: 'test',
          availableCapacity: 100,
          usedCapacity: 50,
          type: 'compact'
        }
      });

      const normal = normalWidget.vm.isCompact;
      const compact = compactWidget.vm.isCompact;

      expect(normal).toBe(false);
      expect(compact).toBe(true);
    });
  });

  describe('Methods', () => {
    it('should round decimals correctly correct percent', () => {
      const quotaWidget = shallowMount(QuotaWidget, {
        propsData: {
          name: 'My test',
          amount: 'test',
          availableCapacity: 350,
          usedCapacity: 224
        }
      });

      const value1 = quotaWidget.vm.roundOneDecimal(0);
      const value2 = quotaWidget.vm.roundOneDecimal(0.1234);
      const value3 = quotaWidget.vm.roundOneDecimal(120.2);
      const value4 = quotaWidget.vm.roundOneDecimal(129.0);
      const value5 = quotaWidget.vm.roundOneDecimal(45.8);
      const value6 = quotaWidget.vm.roundOneDecimal(45.26);

      expect(String(value1)).toBe('0');
      expect(String(value2)).toBe('0.1');
      expect(String(value3)).toBe('120.2');
      expect(String(value4)).toBe('129');
      expect(String(value5)).toBe('45.8');
      expect(String(value6)).toBe('45.3');
    });
  });
});
