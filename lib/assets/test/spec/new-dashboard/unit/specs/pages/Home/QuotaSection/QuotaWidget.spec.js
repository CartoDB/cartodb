import { shallowMount } from '@vue/test-utils';
import QuotaWidget from 'new-dashboard/pages/Home/QuotaSection/QuotaWidget';

describe('QuotaWidget.vue', () => {
  it('should render correct contents', () => {
    const quotaWidget = shallowMount(QuotaWidget, {
      propsData: {
        name: 'Widget test',
        quotaType: 'quota',
        availableQuota: 1234,
        usedQuota: 40,
        unit: 'Gb' }
    });

    expect(quotaWidget).toMatchSnapshot();
  });

  it('should render correctly compact widget', () => {
    const quotaWidget = shallowMount(QuotaWidget, {
      propsData: {
        name: 'Another test',
        quotaType: 'credits',
        availableQuota: 1234,
        usedQuota: 12,
        mode: 'compact'
      }
    });

    expect(quotaWidget).toMatchSnapshot();
  });

  it('should render warning bar if used ammount is over 60% and under 90%', () => {
    const quotaWidget = shallowMount(QuotaWidget, {
      propsData: {
        name: 'My test',
        quotaType: 'test',
        availableQuota: 1000,
        usedQuota: 610
      }
    });

    expect(quotaWidget).toMatchSnapshot();
  });

  it('should render problem bar if used ammount is over 90%', () => {
    const quotaWidget = shallowMount(QuotaWidget, {
      propsData: {
        name: 'My test',
        quotaType: 'test',
        availableQuota: 1000,
        usedQuota: 932
      }
    });

    expect(quotaWidget).toMatchSnapshot();
  });

  describe('Computed', () => {
    it('should return correct percent', () => {
      const quotaWidget = shallowMount(QuotaWidget, {
        propsData: {
          name: 'My test',
          quotaType: 'test',
          availableQuota: 350,
          usedQuota: 224
        }
      });

      const percent = quotaWidget.vm.getUsedPercent;

      expect(percent).toBe(64);
    });

    it('should not crash and return 100 when the available capacity is 0', () => {
      const quotaWidget = shallowMount(QuotaWidget, {
        propsData: {
          name: 'My test',
          quotaType: 'test',
          availableQuota: 0,
          usedQuota: 0
        }
      });

      const percent = quotaWidget.vm.getUsedPercent;

      expect(percent).toBe(100);
    });

    it('should return correct status of the quota', () => {
      const quotaWidgetGood = shallowMount(QuotaWidget, {
        propsData: {
          name: 'My test',
          quotaType: 'test',
          availableQuota: 100,
          usedQuota: 50
        }
      });
      const quotaWidgetWarning = shallowMount(QuotaWidget, {
        propsData: {
          name: 'My test',
          quotaType: 'test',
          availableQuota: 100,
          usedQuota: 61.4
        }
      });
      const quotaWidgetProblem = shallowMount(QuotaWidget, {
        propsData: {
          name: 'My test',
          quotaType: 'test',
          availableQuota: 100,
          usedQuota: 90.1
        }
      });

      const statusGood = quotaWidgetGood.vm.getStatusBar;
      const statusWarning = quotaWidgetWarning.vm.getStatusBar;
      const statusProblem = quotaWidgetProblem.vm.getStatusBar;

      expect(statusGood).toBe('good');
      expect(statusWarning).toBe('warning');
      expect(statusProblem).toBe('problem');
    });
  });

  describe('Methods', () => {
    it('should round decimals correctly correct percent', () => {
      const quotaWidget = shallowMount(QuotaWidget, {
        propsData: {
          name: 'My test',
          quotaType: 'test',
          availableQuota: 350,
          usedQuota: 224
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
