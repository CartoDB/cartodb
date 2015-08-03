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
      template = Carto::Template.new({
        title: 'title',
        code: '',
        min_supported_version: '1.2.3',
        max_supported_version: '2.0.0',
        source_visualization_id: table.table_visualization.id,
        organization_id: @org_user_owner.organization.id,
        required_tables: [ "#{@org_user_owner.database_schema}.#{table.name}" ]
        })
      template.save.should eq true

      other_table = create_table(privacy: UserTable::PRIVACY_PRIVATE, name: 'table2', user_id: @org_user_owner.id)
      another_template_from_user = Carto::Template.new({
        title: 'title',
        code: '',
        min_supported_version: '1.2.3',
        max_supported_version: '2.0.0',
        source_visualization_id: other_table.table_visualization.id,
        organization_id: @org_user_owner.organization.id,
        required_tables: [ "#{@org_user_owner.database_schema}.#{other_table.name}" ]
      })
      another_template_from_user.save.should eq true

      get_json(api_v1_vis_templates_index_url) do |response|
        response.status.should be_success
        
      end
    end

  end

end