# coding: UTF-8
require_relative '../../spec_helper_min'

describe CartoDB::Visualization::CommonDataService do
  before(:all) do
    @user = FactoryGirl.create(:valid_user)
  end

  after(:all) do
    @user.destroy
  end

  before(:each) do
    remote_visualizations(@user).each(&:destroy)
  end

  let(:service) { CartoDB::Visualization::CommonDataService.new }

  def remote_visualizations(user)
    Carto::Visualization.where(user_id: user.id, type: Carto::Visualization::TYPE_REMOTE)
  end

  def dataset(name, description: 'A very creative description')
    {
      name: name,
      description: description,
      tags: ['Awesome', 'Data'],
      license: '',
      source: 'Myself',
      attributions: 'Be nice to each other',
      display_name: name,
      url: 'http://example.org',
      geometry_types: '{ST_MultiPolygon}',
      rows: 1000,
      size: 1000000
    }.stringify_keys
  end

  it 'should import common data datasets' do
    service.stubs(:get_datasets).returns([dataset('ds1')])
    added, updated, not_modified, deleted, failed = service.load_common_data_for_user(@user, 'some_url')

    expect(added).to eq 1
    expect(updated).to eq 0
    expect(not_modified).to eq 0
    expect(deleted).to eq 0
    expect(failed).to eq 0

    expect(remote_visualizations(@user).count).to eq 1
    remote_visualization = remote_visualizations(@user).first
    expect(remote_visualization.name).to eq 'ds1'
    expect(remote_visualization.external_source.geometry_types).to eq ["ST_MultiPolygon"]
  end

  it 'should import common data datasets within an ActiveRecord transaction (see #12488)' do
    # This would trigger an exception because of data integrity
    expect {
      ActiveRecord::Base.transaction do
        service.stubs(:get_datasets).returns([dataset('ds1')])
        service.load_common_data_for_user(@user, 'some_url')
      end
    }.not_to raise_error
  end

  it 'should update common data datasets' do
    service.stubs(:get_datasets).returns([dataset('ds1')])
    service.load_common_data_for_user(@user, 'some_url')

    service.stubs(:get_datasets).returns([dataset('ds1', description: 'desc')])
    added, updated, not_modified, deleted, failed = service.load_common_data_for_user(@user, 'some_url')

    expect(added).to eq 0
    expect(updated).to eq 1
    expect(not_modified).to eq 0
    expect(deleted).to eq 0
    expect(failed).to eq 0

    expect(remote_visualizations(@user).count).to eq 1
    expect(remote_visualizations(@user).first.name).to eq 'ds1'
    expect(remote_visualizations(@user).first.description).to eq 'desc'
  end

  it 'should not touch unmodified common data datasets' do
    service.stubs(:get_datasets).returns([dataset('ds1')])
    service.load_common_data_for_user(@user, 'some_url')

    added, updated, not_modified, deleted, failed = service.load_common_data_for_user(@user, 'some_url')

    expect(added).to eq 0
    expect(updated).to eq 0
    expect(not_modified).to eq 1
    expect(deleted).to eq 0
    expect(failed).to eq 0

    expect(remote_visualizations(@user).count).to eq 1
    expect(remote_visualizations(@user).first.name).to eq 'ds1'
  end

  it 'should delete removed common data datasets' do
    service.stubs(:get_datasets).returns([dataset('ds1'), dataset('ds2')])
    service.load_common_data_for_user(@user, 'some_url')
    expect(remote_visualizations(@user).count).to eq 2

    Carto::ExternalSource.count.should eq 2

    service.stubs(:get_datasets).returns([dataset('ds1')])
    added, updated, not_modified, deleted, failed = service.load_common_data_for_user(@user, 'some_url')

    expect(added).to eq 0
    expect(updated).to eq 0
    expect(not_modified).to eq 1
    expect(deleted).to eq 1
    expect(failed).to eq 0

    Carto::ExternalSource.count.should eq 1

    expect(remote_visualizations(@user).count).to eq 1
    expect(remote_visualizations(@user).first.name).to eq 'ds1'
  end

  it 'should fail when missing some fields, but still import the rest' do
    service.stubs(:get_datasets).returns([dataset('ds1'), {}])
    added, updated, not_modified, deleted, failed = service.load_common_data_for_user(@user, 'some_url')

    expect(added).to eq 1
    expect(updated).to eq 0
    expect(not_modified).to eq 0
    expect(deleted).to eq 0
    expect(failed).to eq 1

    expect(remote_visualizations(@user).count).to eq 1
    expect(remote_visualizations(@user).first.name).to eq 'ds1'
  end

  describe 'destroying common data remote visualizations' do
    it 'should not delete remote visualizations that have been imported' do
      data_import = FactoryGirl.create(:data_import, user_id: @user.id)
      external_data_import = FactoryGirl.create(:external_data_import_with_external_source, data_import: data_import)
      visualization = external_data_import.external_source.visualization
      CartoDB::Logger.expects(:warning)
          .with(message: "Couldn't delete #{visualization.id} visualization because it's been imported")
      service.send(:delete_remote_visualization, visualization).should be_false
      Carto::Visualization.find(visualization.id).should be
    end

    it 'should not delete remote visualizations that have been synced' do
      data_import = FactoryGirl.create(:data_import, user_id: @user.id)
      sync = FactoryGirl.create(:carto_synchronization, user_id: @user.id)
      external_data_import = FactoryGirl.create(:external_data_import_with_external_source,
                                                data_import: data_import,
                                                synchronization: sync)
      visualization = external_data_import.external_source.visualization
      CartoDB::Logger.expects(:warning)
          .with(message: "Couldn't delete #{visualization.id} visualization because it's been imported")
      service.send(:delete_remote_visualization, visualization).should be_false
      Carto::Visualization.find(visualization.id).should be
    end
  end
end
