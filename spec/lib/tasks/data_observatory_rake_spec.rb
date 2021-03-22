require 'spec_helper_unit'

describe 'data_observatory.rake' do
  before do
    Rake.application.rake_require('tasks/data_observatory')
    Rake::Task.define_task(:environment)

    @user = create(:valid_user, username: 'fulano')
  end

  describe '#purchase_datasets' do
    before do
      Rake::Task['cartodb:data_observatory:purchase_datasets'].reenable
    end

    it 'throws an error if username is not provided' do
      expect {
        Rake::Task['cartodb:data_observatory:purchase_datasets'].invoke
      }.to raise_error(RuntimeError, 'USAGE: data_observatory:purchase_datasets["username","path/datasets.csv"]')
    end

    it 'throws an error if the datasets path is not provided' do
      expect {
        Rake::Task['cartodb:data_observatory:purchase_datasets'].invoke('fulano')
      }.to raise_error(RuntimeError, 'USAGE: data_observatory:purchase_datasets["username","path/datasets.csv"]')
    end

    it 'calls subscribe from Carto::DoLicensingService with the expected parameters' do
      File.stubs(:open).returns(csv_example)
      service_mock = mock
      service_mock.expects(:subscribe).twice
      Carto::DoLicensingService.expects(:new).twice.with('fulano').returns(service_mock)
      Rake::Task['cartodb:data_observatory:purchase_datasets'].invoke('fulano', 'datasets.csv')
    end
  end

  describe '#remove_purchase' do
    before(:each) do
      Rake::Task['cartodb:data_observatory:remove_purchase'].reenable
    end

    it 'throws an error if username is not provided' do
      expect {
        Rake::Task['cartodb:data_observatory:remove_purchase'].invoke
      }.to raise_error(RuntimeError, 'USAGE: data_observatory:remove_purchase["username","project.schema.table"]')
    end

    it 'throws an error if dataset_id is not provided' do
      expect {
        Rake::Task['cartodb:data_observatory:remove_purchase'].invoke('fulano')
      }.to raise_error(RuntimeError, 'USAGE: data_observatory:remove_purchase["username","project.schema.table"]')
    end

    it 'calls unsubscribe from Carto::DoLicensingService with the expected parameters' do
      service_mock = mock
      service_mock.expects(:unsubscribe).once.with('carto.abc.dataset')
      Carto::DoLicensingService.expects(:new).once.with('fulano').returns(service_mock)

      Rake::Task['cartodb:data_observatory:remove_purchase'].invoke('fulano', 'carto.abc.dataset')
    end
  end

  def csv_example
    CSV.generate do |csv|
      csv << ["dataset_id", "available_in", "price", "expires_at", "view_def"]
      csv << ["dataset1", "bq;bigtable", "100", "2020-09-27T08:00:00", "where do_date='1986-11-12'"]
      csv << ["dataset2", "bigtable", "200", "2020-12-31T12:00:00", nil]
    end
  end

end
