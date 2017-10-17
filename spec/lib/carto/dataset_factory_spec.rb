# # encoding: utf-8

require_relative '../../spec_helper_min'
require_relative '../../../lib/carto/dataset_factory'

describe Carto::DatasetFactory do
  let(:name) { 'name' }
  let(:description) { 'description' }
  let(:attributions) { 'attributions' }
  let(:tags) { ['manolo', 'escobar', 'rey'] }
  let(:privacy) { 'privacy' }

  before(:all) { @user = FactoryGirl.create(:carto_user) }
  after(:all) { @user.destroy }

  describe('#with_name') do
    it('should set name properly') do
      Carto::DatasetFactory.new(user: @user)
                           .with_name(name)
                           .visualization
                           .name.should eq name
    end

    it('should preserve name after save') do
      visualization = Carto::DatasetFactory.new(user: @user)
                                           .with_name(name)
                                           .visualization

      visualization.save!.should_not raise_error

      visualization.name.should eq name
    end
  end

  describe('#with_description') do
    it('should set description properly') do
      Carto::DatasetFactory.new(user: @user)
                           .with_description(description)
                           .visualization
                           .description.should eq description
    end

    it('should preserve description after save') do
      visualization = Carto::DatasetFactory.new(user: @user)
                                           .with_description(description)
                                           .visualization

      visualization.save!.should_not raise_error

      visualization.description.should eq description
    end
  end

  describe('#with_attributions') do
    it('should set attributions properly') do
      Carto::DatasetFactory.new(user: @user)
                           .with_attributions(attributions)
                           .visualization
                           .attributions.should eq attributions
    end

    it('should preserve attributions after save') do
      visualization = Carto::DatasetFactory.new(user: @user)
                                           .with_attributions(attributions)
                                           .visualization

      visualization.save!.should_not raise_error

      visualization.attributions.should eq attributions
    end
  end

  describe('#with_tags') do
    it('should set tags properly') do
      Carto::DatasetFactory.new(user: @user)
                           .with_tags(tags)
                           .visualization
                           .tags.should eq tags
    end

    it('should preserve tags after save') do
      visualization = Carto::DatasetFactory.new(user: @user)
                                           .with_tags(tags)
                                           .visualization

      visualization.save!.should_not raise_error

      visualization.tags.should eq tags
    end
  end

  describe('#with_privacy') do
    it('should set privacy properly') do
      Carto::DatasetFactory.new(user: @user)
                           .with_privacy(privacy)
                           .visualization
                           .privacy.should eq privacy
    end

    it('should preserve privacy after save') do
      visualization = Carto::DatasetFactory.new(user: @user)
                                           .with_privacy(privacy)
                                           .visualization

      visualization.save!.should_not raise_error

      visualization.privacy.should eq privacy
    end
  end

end
