# # encoding: utf-8

require_relative '../../spec_helper_min'
require_relative '../../../lib/carto/dataset_factory'

describe Carto::DatasetFactory do
  let(:metadata) do
    {
      info: {
        name: 'name',
        description: 'description',
        attributions: 'attributions',
        source: 'carto,osm',
        classification: {
          tags: ['manolo', 'escobar', 'rey']
        }
      },
      publishing: {
        privacy: 'private'
      }
    }
  end

  before(:all) do
    @user = FactoryGirl.create(:carto_user)
  end

  after(:all) do
    @user.destroy
  end

  before(:each) do
    bypass_named_maps

    @factory = Carto::DatasetFactory.new(
      user: @user,
      metadata: metadata,
      kind: Carto::Visualization::KIND_RASTER,
      geometry_type: 'geometry'
    )
  end

  after(:each) do
    @factory.dataset_visualization.destroy
    @factory = nil
  end

  it('sets values properly') do
    dataset_visualization = @factory.dataset_visualization

    dataset_visualization.name.should eq metadata[:info][:name]
    dataset_visualization.description.should eq metadata[:info][:description]
    dataset_visualization.attributions.should eq metadata[:info][:attributions]
    dataset_visualization.source.should eq metadata[:info][:source]
    dataset_visualization.tags.should eq metadata[:info][:classification][:tags]
    dataset_visualization.privacy.should eq metadata[:publishing][:privacy]
  end

  it('preserves values after saving') do
    dataset_visualization = @factory.dataset_visualization

    expect { dataset_visualization.save! }.to_not raise_error

    persisted_visualization = Carto::Visualization.find(dataset_visualization.id)

    persisted_visualization.name.should eq metadata[:info][:name]
    persisted_visualization.description.should eq metadata[:info][:description]
    persisted_visualization.attributions.should eq metadata[:info][:attributions]
    dataset_visualization.source.should eq metadata[:info][:source]
    persisted_visualization.tags.should eq metadata[:info][:classification][:tags]
    persisted_visualization.privacy.should eq metadata[:publishing][:privacy]
  end

  it('generates proper model reflections') do
    dataset_visualization = @factory.dataset_visualization

    dataset_visualization.layers.should_not be_empty
    dataset_visualization.map.layers.should_not be_empty
  end

  it('preserves proper model reflections after save') do
    dataset_visualization = @factory.dataset_visualization

    expect { dataset_visualization.save! }.to_not raise_error

    persisted_visualization = Carto::Visualization.find(dataset_visualization.id)

    persisted_visualization.layers.should_not be_empty
    persisted_visualization.map.layers.should_not be_empty

    persisted_visualization.layers.count.should eq 3
    persisted_visualization.map.layers.count.should eq 3
  end
end
