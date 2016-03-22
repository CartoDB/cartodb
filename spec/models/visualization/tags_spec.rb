# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../services/data-repository/repository'
require_relative '../../../app/models/visualization/tags'
require_relative '../../../app/models/visualization/collection'
require 'helpers/unique_names_helper'

include UniqueNamesHelper
include CartoDB

describe Visualization::Tags do
  before(:each) do
    Varnish.any_instance.stubs(:send_command).returns(true)
    @db = Rails::Sequel.connection
    Visualization.repository  = DataRepository::Backend::Sequel.new(@db, :visualizations)

    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

    # For relator->permission
    user_id = UUIDTools::UUID.timestamp_create.to_s
    user_name = 'whatever'
    user_apikey = '123'
    @user_mock = mock
    @user_mock.stubs(:id).returns(user_id)
    @user_mock.stubs(:username).returns(user_name)
    @user_mock.stubs(:api_key).returns(user_apikey)
    Visualization::Relator.any_instance.stubs(:user).returns(@user_mock)
  end

  describe '#filters' do
    it 'checks that filtering by locked works' do
      vis_1_tag = 'v1tag'
      vis_2_tag = 'v2tag'

      Visualization::Member.new(random_attributes(user_id: @user_mock.id, name: 'viz_1', locked:true, \
                                                         tags: [vis_1_tag])).store
      Visualization::Member.new(random_attributes(user_id: @user_mock.id, name: 'viz_2', locked:false, \
                                                         tags: [vis_2_tag])).store

      tags = Visualization::Tags.new(@user_mock)

      records = tags.names()
      records.length.should eq 2

      records = tags.names(locked: false)
      records.length.should eq 1
      records.first.should eq vis_2_tag

      records = tags.names(locked: true)
      records.length.should eq 1
      records.first.should eq vis_1_tag
    end
  end

  describe 'searching' do
    it 'should search for tags correctly' do
      manolo_tag = 'manolo'
      manoloescobar_tag = 'manoloescobar'
      manolo_escobar_tag = 'Manolo Escobar'


      v1 = Visualization::Member.new(random_attributes(user_id: @user_mock.id, name: 'v1', locked:true, tags: [manolo_tag, manoloescobar_tag, manolo_escobar_tag])).store
      v2 = Visualization::Member.new(random_attributes(user_id: @user_mock.id, name: 'v2', locked:false, tags: [manolo_tag])).store
      v3 = Visualization::Member.new(random_attributes(user_id: @user_mock.id, name: 'v3', locked:false, tags: [manolo_escobar_tag, manoloescobar_tag])).store

      vqb1 = Carto::VisualizationQueryBuilder.new.with_tags([manolo_tag.upcase]).build.map(&:id)

      vqb1.should include v1.id
      vqb1.should include v2.id # Searching for 'manolo' should bring up 'manoloescobar' as well
      vqb1.should include v3.id

      vqb2 = Carto::VisualizationQueryBuilder.new.with_tags([manoloescobar_tag.upcase]).build.map(&:id)

      vqb2.should include v1.id
      vqb2.should_not include v2.id # 'manoloescobar' is not a substring of 'manolo'
      vqb2.should include v3.id

      vqb3 = Carto::VisualizationQueryBuilder.new.with_tags([manolo_escobar_tag.upcase]).build.map(&:id)

      vqb3.should include v1.id
      vqb3.should_not include v2.id
      vqb3.should include v3.id
    end
  end

  def random_attributes(attributes={})
    random = unique_name('viz')
    {
      name:         attributes.fetch(:name, random),
      description:  attributes.fetch(:description, "description #{random}"),
      privacy:      attributes.fetch(:privacy, 'public'),
      tags:         attributes.fetch(:tags, ['tag 1']),
      type:         attributes.fetch(:type, CartoDB::Visualization::Member::TYPE_CANONICAL),
      user_id:      attributes.fetch(:user_id, UUIDTools::UUID.timestamp_create.to_s),
      locked:       attributes.fetch(:locked, false)
    }
  end
end
