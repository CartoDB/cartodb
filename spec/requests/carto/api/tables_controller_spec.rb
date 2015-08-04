# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/tables_controller'
require_relative '../../../../spec/requests/api/json/tables_controller_shared_examples'


describe Carto::Api::TablesController do
  include Rack::Test::Methods
  include Warden::Test::Helpers
  
  describe 'dependant templates' do
    include_context 'organization with users helper'

    before(:each) do
      User.any_instance.stubs(:has_feature_flag?)
                       .with('templated_workflows')
                       .returns(true)
      Carto::User.any_instance.stubs(:has_feature_flag?)
                              .with('templated_workflows')
                              .returns(true)

      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)
      @table = create_table(privacy: UserTable::PRIVACY_PRIVATE, name: 'table1', user_id: @org_user_owner.id)
      @other_table = create_table(privacy: UserTable::PRIVACY_PRIVATE, name: 'table2', user_id: @org_user_owner.id)

      @template_1_data = {
        title: 'title1',
        description: 'description 1',
        code: '{ /* 1 */ }',
        min_supported_version: '1.2.3',
        max_supported_version: '2.0.0',
        source_visualization_id: @table.table_visualization.id,
        organization_id: @org_user_owner.organization.id,
        required_tables: [ "#{@org_user_owner.database_schema}.#{@table.name}" ]
      }

      @template_2_data = {
        title: 'title2',
        description: 'description 2',
        code: '{ /* 2 */ }',
        min_supported_version: '4.5.6',
        max_supported_version: '99.0.0',
        source_visualization_id: @other_table.table_visualization.id,
        organization_id: @org_user_owner.organization.id,
        required_tables: [ "#{@org_user_owner.database_schema}.#{@other_table.name}" ]
      }

      @template = Carto::Template.new({
        title: @template_1_data[:title],
        code: @template_1_data[:code],
        description: @template_1_data[:description],
        min_supported_version: @template_1_data[:min_supported_version],
        max_supported_version: @template_1_data[:max_supported_version],
        source_visualization_id: @template_1_data[:source_visualization_id],
        organization_id: @template_1_data[:organization_id],
        required_tables: @template_1_data[:required_tables]
        })
      @template.save

      login_as(@org_user_owner, scope: @org_user_owner.username)
      host! "#{@org_user_owner.username}.localhost.lan"
    end

    after(:each) do
      Carto::Template.all.each { |template| template.delete }
      delete_user_data(@org_user_owner)
    end

    it 'tests api_v1_tables_related_templates action' do
      get_json(api_v1_tables_related_templates_url({ id: @template_1_data[:required_tables][0] })) do |response|
        response.status.should be_success
        response.body[:items].count.should eq 1
        response.body[:items][0]['id'] = @template.id
        response.body[:items][0]['title'] = @template.title
      end
    end

  end


end
