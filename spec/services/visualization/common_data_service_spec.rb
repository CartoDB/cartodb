require_relative '../../spec_helper_min'

describe CartoDB::Visualization::CommonDataService do
  before(:all) do
    @user = create(:valid_user)
  end

  after(:all) do
    @user.destroy
  end

  before(:each) do
    remote_visualizations(@user).each(&:destroy)
  end

  def service
    CartoDB::Visualization::CommonDataService.new
  end

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

  def stub_datasets(datasets)
    CommonDataSingleton.instance.stubs(:datasets).returns(datasets)
  end

  it 'should import common data datasets' do
    stub_datasets([dataset('ds1')])
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
        stub_datasets([dataset('ds1')])
        service.load_common_data_for_user(@user, 'some_url')
      end
    }.not_to raise_error
  end

  it 'should update common data datasets' do
    stub_datasets([dataset('ds1')])
    service.load_common_data_for_user(@user, 'some_url')

    stub_datasets([dataset('ds1', description: 'desc')])
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
    stub_datasets([dataset('ds1')])
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
    stub_datasets([dataset('ds1'), dataset('ds2')])
    service.load_common_data_for_user(@user, 'some_url')
    expect(remote_visualizations(@user).count).to eq 2

    Carto::ExternalSource.count.should eq 2

    stub_datasets([dataset('ds1')])
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

  it 'should not delete anything if common data datasets fetching fails or it\'s empty' do
    stub_datasets([dataset('ds1'), dataset('ds2')])
    service.load_common_data_for_user(@user, 'some_url')
    expect(remote_visualizations(@user).count).to eq 2

    Carto::ExternalSource.count.should eq 2

    stub_datasets([])
    service.load_common_data_for_user(@user, 'some_url').should be_nil

    Carto::ExternalSource.count.should eq 2
    expect(remote_visualizations(@user).count).to eq 2

    common_data_singleton_mock = mock
    common_data_singleton_mock.stubs(:datasets).raises("error!")
    CommonDataSingleton.stubs(:instance).returns(common_data_singleton_mock)
    service.load_common_data_for_user(@user, 'some_url').should be_nil

    Carto::ExternalSource.count.should eq 2
    expect(remote_visualizations(@user).count).to eq 2
  end

  it 'should fail when missing some fields, but still import the rest' do
    stub_datasets([dataset('ds1'), {}])
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
    it 'delete remote visualizations that have been imported but keep the import' do
      viz = create(:carto_table_visualization, user_id: @user.id)
      data_import = create(:data_import, user_id: @user.id, visualization_id: viz.id)
      external_data_import = create(:external_data_import_with_external_source, data_import: data_import)
      visualization = external_data_import.external_source.visualization

      service.send(:delete_remote_visualization, visualization).should be_true

      Carto::Visualization.where(id: visualization.id).should be_empty
      Carto::ExternalSource.where(id: external_data_import.external_source.id).should be_empty
      Carto::ExternalDataImport.where(id: external_data_import.id).should be_empty

      Carto::DataImport.where(id: data_import.id).first.should_not be_nil
      Carto::Visualization.where(id: viz.id).first.should_not be_nil
    end

    it 'delete remote visualizations that have been synced and the sync but keep the import' do
      viz = create(:carto_table_visualization, user_id: @user.id)
      data_import = create(:data_import, user_id: @user.id, visualization_id: viz.id)
      sync = create(:carto_synchronization, user_id: @user.id, visualization_id: viz.id)
      external_data_import = create(:external_data_import_with_external_source,
                                                data_import: data_import,
                                                synchronization: sync)
      visualization = external_data_import.external_source.visualization

      service.send(:delete_remote_visualization, visualization).should be_true

      Carto::Visualization.where(id: visualization.id).should be_empty
      Carto::ExternalSource.where(id: external_data_import.external_source.id).should be_empty
      Carto::ExternalDataImport.where(id: external_data_import.id).should be_empty
      Carto::Synchronization.where(id: sync.id).should be_empty

      Carto::DataImport.where(id: data_import.id).first.should_not be_nil
      Carto::Visualization.where(id: viz.id).first.should_not be_nil
    end
  end
end
