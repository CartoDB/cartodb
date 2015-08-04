# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/templates_controller'

describe Carto::Api::TemplatesController do
  include_context 'organization with users helper'
  include Rack::Test::Methods
  include Warden::Test::Helpers


  before(:each) do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

      #host! "#{@org_user_owner.subdomain}.localhost.lan"
    end

  after(:each) do
    Carto::Template.all.each { |template| template.delete }

    delete_user_data(@org_user_owner)
  end

  #let(:params) { { :api_key => @org_user_owner.api_key } }

  describe 'basic endpoints' do

    before(:each) do
      login(@org_user_owner)
    end

    it 'tests index action' do
      table = create_table(privacy: UserTable::PRIVACY_PRIVATE, name: 'table1', user_id: @org_user_owner.id)
      other_table = create_table(privacy: UserTable::PRIVACY_PRIVATE, name: 'table2', user_id: @org_user_owner.id)

      template_1_data = {
        title: 'title1',
        description: 'description 1',
        code: '{ /* 1 */ }',
        min_supported_version: '1.2.3',
        max_supported_version: '2.0.0',
        source_visualization_id: table.table_visualization.id,
        organization_id: @org_user_owner.organization.id,
        required_tables: [ "#{@org_user_owner.database_schema}.#{table.name}" ]
      }

      template_2_data = {
        title: 'title2',
        description: 'description 2',
        code: '{ /* 2 */ }',
        min_supported_version: '4.5.6',
        max_supported_version: '99.0.0',
        source_visualization_id: other_table.table_visualization.id,
        organization_id: @org_user_owner.organization.id,
        required_tables: [ "#{@org_user_owner.database_schema}.#{other_table.name}" ]
      }

      template = Carto::Template.new({
        title: template_1_data[:title],
        code: template_1_data[:code],
        min_supported_version: template_1_data[:min_supported_version],
        max_supported_version: template_1_data[:max_supported_version],
        source_visualization_id: template_1_data[:source_visualization_id],
        organization_id: template_1_data[:organization_id],
        required_tables: template_1_data[:required_tables]
        })
      template.save.should eq true

      another_template_from_user = Carto::Template.new({
        title: template_2_data[:title],
        code: template_2_data[:code],
        min_supported_version: template_2_data[:min_supported_version],
        max_supported_version: template_2_data[:max_supported_version],
        source_visualization_id: template_2_data[:source_visualization_id],
        organization_id: template_2_data[:organization_id],
        required_tables: template_2_data[:required_tables]
        })
      another_template_from_user.save.should eq true

      get_json(api_v1_vis_templates_index_url) do |response|
        response.status.should be_success
        response.body[:items].count.should eq 2

        response.body[:items][0]['id'].nil?.should eq false
        response.body[:items][0]['title'].should eq template_2_data[:title]
        response.body[:items][0]['code'].should eq template_2_data[:code]
        response.body[:items][0]['min_supported_version'].should eq template_2_data[:min_supported_version]
        response.body[:items][0]['max_supported_version'].should eq template_2_data[:max_supported_version]
        response.body[:items][0]['source_visualization']['id'].should eq template_2_data[:source_visualization_id]
        response.body[:items][0]['organization']['id'].should eq template_2_data[:organization_id]
        response.body[:items][0]['required_tables'].should eq template_2_data[:required_tables]

        response.body[:items][1]['id'].nil?.should eq false
        response.body[:items][1]['title'].should eq template_1_data[:title]
        response.body[:items][1]['code'].should eq template_1_data[:code]
        response.body[:items][1]['min_supported_version'].should eq template_1_data[:min_supported_version]
        response.body[:items][1]['max_supported_version'].should eq template_1_data[:max_supported_version]
        response.body[:items][1]['source_visualization']['id'].should eq template_1_data[:source_visualization_id]
        response.body[:items][1]['organization']['id'].should eq template_1_data[:organization_id]
        response.body[:items][1]['required_tables'].should eq template_1_data[:required_tables]
      end
    end

  end

end