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
    remote_visualizations.each(&:destroy)
  end

  let(:service) { CartoDB::Visualization::CommonDataService.new }

  def remote_visualizations
    Carto::Visualization.where(user_id: @user.id)
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

    expect(remote_visualizations.count).to eq 1
    expect(remote_visualizations.first.name).to eq 'ds1'
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

    expect(remote_visualizations.count).to eq 1
    expect(remote_visualizations.first.name).to eq 'ds1'
    expect(remote_visualizations.first.description).to eq 'desc'
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

    expect(remote_visualizations.count).to eq 1
    expect(remote_visualizations.first.name).to eq 'ds1'
  end

  it 'should delete removed common data datasets' do
    service.stubs(:get_datasets).returns([dataset('ds1'), dataset('ds2')])
    service.load_common_data_for_user(@user, 'some_url')
    expect(remote_visualizations.count).to eq 2

    service.stubs(:get_datasets).returns([dataset('ds1')])
    added, updated, not_modified, deleted, failed = service.load_common_data_for_user(@user, 'some_url')

    expect(added).to eq 0
    expect(updated).to eq 0
    expect(not_modified).to eq 1
    expect(deleted).to eq 1
    expect(failed).to eq 0

    expect(remote_visualizations.count).to eq 1
    expect(remote_visualizations.first.name).to eq 'ds1'
  end

  it 'should fail when missing some fields, but still import the rest' do
    service.stubs(:get_datasets).returns([dataset('ds1'), {}])
    added, updated, not_modified, deleted, failed = service.load_common_data_for_user(@user, 'some_url')

    expect(added).to eq 1
    expect(updated).to eq 0
    expect(not_modified).to eq 0
    expect(deleted).to eq 0
    expect(failed).to eq 1

    expect(remote_visualizations.count).to eq 1
    expect(remote_visualizations.first.name).to eq 'ds1'
  end
end
