require 'spec_helper_min'
require 'rake'

describe 'data_observatory.rake' do
  before(:all) do
    Rake.application.rake_require('tasks/data_observatory')
    Rake::Task.define_task(:environment)

    @user = FactoryGirl.create(:valid_user, username: 'fulano')
  end

  after(:all) do
    @user.destroy
  end

  describe '#purchase_datasets' do
    before(:each) do
      Rake::Task['cartodb:data_observatory:purchase_datasets'].reenable
    end

    after(:each) do
      File.unstub(:open)
      Cartodb::Central.unstub(:new)
      Cartodb::Central.any_instance.unstub(:create_do_datasets)
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

    it 'calls create_do_datasets from Central with the expected parameters' do
      File.stubs(:open).returns(csv_example)
      central_mock = mock
      Cartodb::Central.stubs(:new).returns(central_mock)

      expected_datasets = [
        { dataset_id: 'dataset1', available_in: ['bq', 'spanner'], price: 100,
          expires_at: Time.new(2020, 9, 27, 8, 0, 0) },
        { dataset_id: 'dataset2', available_in: ['spanner'], price: 200,
          expires_at: Time.new(2020, 12, 31, 12, 0, 0) }
      ]
      central_mock.expects(:create_do_datasets).once.with(username: 'fulano', datasets: expected_datasets)

      Rake::Task['cartodb:data_observatory:purchase_datasets'].invoke('fulano', 'datasets.csv')
    end

    it 'stores the metadata in Redis' do
      File.stubs(:open).returns(csv_example)
      Cartodb::Central.any_instance.stubs(:create_do_datasets)

      redis_key = "do:fulano:datasets"
      bq_datasets = [
        { dataset_id: 'dataset1', expires_at: Time.new(2020, 9, 27, 8, 0, 0) }
      ].to_json
      spanner_datasets = [
        { dataset_id: 'dataset1', expires_at: Time.new(2020, 9, 27, 8, 0, 0) },
        { dataset_id: 'dataset2', expires_at: Time.new(2020, 12, 31, 12, 0, 0) }
      ].to_json

      Rake::Task['cartodb:data_observatory:purchase_datasets'].invoke('fulano', 'datasets.csv')

      $users_metadata.hmget(redis_key, 'bq').should eq [bq_datasets]
      $users_metadata.hmget(redis_key, 'spanner').should eq [spanner_datasets]
    end

  end

  def csv_example
    CSV.generate do |csv|
      csv << ["dataset1", "bq;spanner", "100", "2020-09-27T08:00:00"]
      csv << ["dataset2", "spanner", "200", "2020-12-31T12:00:00"]
    end
  end

end
