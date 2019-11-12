require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/templates_controller'

describe Carto::Api::TemplatesController do
  include_context 'organization with users helper'
  include Rack::Test::Methods
  include Warden::Test::Helpers

  before(:each) do
    ::User.any_instance.stubs(:has_feature_flag?).returns(false)
    ::User.any_instance.stubs(:has_feature_flag?).with('templated_workflows').returns(true)
    Carto::User.any_instance.stubs(:has_feature_flag?).with('templated_workflows').returns(true)
    Carto::User.any_instance.stubs(:has_feature_flag?).with('disabled_cartodb_logo').returns(false)

    bypass_named_maps
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

    @template_3_data = {
      title: 'title3',
      description: 'description 3',
      code: '{ /* 3 */ }',
      min_supported_version: '7.8.9',
      max_supported_version: '666.0.0',
      source_visualization_id: @table.table_visualization.id,
      organization_id: @org_user_owner.organization.id,
      required_tables: [ "#{@org_user_owner.database_schema}.#{@table.name}" ]
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

    @another_template_from_user = Carto::Template.new({
      title: @template_2_data[:title],
      code: @template_2_data[:code],
      description: @template_2_data[:description],
      min_supported_version: @template_2_data[:min_supported_version],
      max_supported_version: @template_2_data[:max_supported_version],
      source_visualization_id: @template_2_data[:source_visualization_id],
      organization_id: @template_2_data[:organization_id],
      required_tables: @template_2_data[:required_tables]
      })
    @another_template_from_user.save

    login(@org_user_owner)
  end

  after(:each) do
    Carto::Template.all.each { |template| template.delete }
    delete_user_data(@org_user_owner)
  end

  it 'tests index action' do
    get_json(api_v1_vis_templates_index_url) do |response|
      response.status.should be_success
      response.body[:items].count.should eq 2

      response.body[:items][0][:id].nil?.should eq false
      response.body[:items][0][:title].should eq @template_2_data[:title]
      response.body[:items][0][:description].should eq @template_2_data[:description]
      response.body[:items][0][:code].should eq @template_2_data[:code]
      response.body[:items][0][:min_supported_version].should eq @template_2_data[:min_supported_version]
      response.body[:items][0][:max_supported_version].should eq @template_2_data[:max_supported_version]
      response.body[:items][0][:source_visualization][:id].should eq @template_2_data[:source_visualization_id]
      response.body[:items][0][:organization][:id].should eq @template_2_data[:organization_id]
      response.body[:items][0][:required_tables].should eq @template_2_data[:required_tables]

      response.body[:items][1][:id].nil?.should eq false
      response.body[:items][1][:title].should eq @template_1_data[:title]
      response.body[:items][1][:description].should eq @template_1_data[:description]
      response.body[:items][1][:code].should eq @template_1_data[:code]
      response.body[:items][1][:min_supported_version].should eq @template_1_data[:min_supported_version]
      response.body[:items][1][:max_supported_version].should eq @template_1_data[:max_supported_version]
      response.body[:items][1][:source_visualization][:id].should eq @template_1_data[:source_visualization_id]
      response.body[:items][1][:organization][:id].should eq @template_1_data[:organization_id]
      response.body[:items][1][:required_tables].should eq @template_1_data[:required_tables]
    end
  end

  it 'tests show action' do
    get_json(api_v1_vis_templates_show_url(id: @template.id)) do |response|
      response.status.should be_success
      response.body[:id].nil?.should eq false
      response.body[:title].should eq @template_1_data[:title]
      response.body[:description].should eq @template_1_data[:description]
      response.body[:code].should eq @template_1_data[:code]
      response.body[:min_supported_version].should eq @template_1_data[:min_supported_version]
      response.body[:max_supported_version].should eq @template_1_data[:max_supported_version]
      response.body[:source_visualization][:id].should eq @template_1_data[:source_visualization_id]
      response.body[:organization][:id].should eq @template_1_data[:organization_id]
      response.body[:required_tables].should eq @template_1_data[:required_tables]
    end
  end

  it 'tests create action' do
    post_json(api_v1_vis_templates_create_url(@template_3_data)) do |response|
      response.status.should be_success
      response.body[:id].nil?.should eq false
      response.body[:title].should eq @template_3_data[:title]
      response.body[:description].should eq @template_3_data[:description]
      response.body[:code].should eq @template_3_data[:code]
      response.body[:min_supported_version].should eq @template_3_data[:min_supported_version]
      response.body[:max_supported_version].should eq @template_3_data[:max_supported_version]
      response.body[:source_visualization][:id].should eq @template_3_data[:source_visualization_id]
      response.body[:organization][:id].should eq @template_3_data[:organization_id]
      response.body[:required_tables].should eq @template_3_data[:required_tables]
    end

    third_template = Carto::Template.where(id: JSON.parse(last_response.body)['id']).first

    third_template.title.should eq @template_3_data[:title]
    third_template.description.should eq @template_3_data[:description]
    third_template.code.should eq @template_3_data[:code]
    third_template.min_supported_version.should eq @template_3_data[:min_supported_version]
    third_template.max_supported_version.should eq @template_3_data[:max_supported_version]
    third_template.source_visualization_id.should eq @template_3_data[:source_visualization_id]
    third_template.organization_id.should eq @template_3_data[:organization_id]
    third_template.required_tables.should eq @template_3_data[:required_tables]

    third_template.destroy
  end

  it 'tests update action' do
    third_template = Carto::Template.new({
      title: @template_3_data[:title],
      code: @template_3_data[:code],
      description: @template_3_data[:description],
      min_supported_version: @template_3_data[:min_supported_version],
      max_supported_version: @template_3_data[:max_supported_version],
      source_visualization_id: @template_3_data[:source_visualization_id],
      organization_id: @template_3_data[:organization_id],
      required_tables: @template_3_data[:required_tables]
    })
    third_template.save.should eq true

    new_fields = {
      title: 'title4',
      description: 'description 4',
      code: '{ /* 4 */ }',
      min_supported_version: '1.1.1',
      max_supported_version: '2.0.0',
      # Doesn't changes but must be sent
      source_visualization_id: third_template[:source_visualization_id],
      # Doesn't changes but must be sent
      organization_id: third_template[:organization_id],
      required_tables: [ "#{@org_user_owner.database_schema}.#{@table.name}",
                         "#{@org_user_owner.database_schema}.#{@other_table.name}" ]
    }

    put_json(api_v1_vis_templates_update_url(new_fields.merge({id: third_template.id}))) do |response|
      response.status.should be_success
      response.body[:title].should eq new_fields[:title]
      response.body[:description].should eq new_fields[:description]
      response.body[:code].should eq new_fields[:code]
      response.body[:min_supported_version].should eq new_fields[:min_supported_version]
      response.body[:max_supported_version].should eq new_fields[:max_supported_version]
      response.body[:source_visualization][:id].should eq new_fields[:source_visualization_id]
      response.body[:organization][:id].should eq new_fields[:organization_id]
      response.body[:required_tables].should eq new_fields[:required_tables]
    end
    third_template = Carto::Template.where(id: third_template.id).first

    third_template.title.should eq new_fields[:title]
    third_template.description.should eq new_fields[:description]
    third_template.code.should eq new_fields[:code]
    third_template.min_supported_version.should eq new_fields[:min_supported_version]
    third_template.max_supported_version.should eq new_fields[:max_supported_version]
    third_template.source_visualization_id.should eq new_fields[:source_visualization_id]
    third_template.organization_id.should eq new_fields[:organization_id]
    third_template.required_tables.should eq new_fields[:required_tables]

    third_template.destroy
  end

  it 'tests destroy action' do
    third_template = Carto::Template.new({
      title: @template_3_data[:title],
      code: @template_3_data[:code],
      description: @template_3_data[:description],
      min_supported_version: @template_3_data[:min_supported_version],
      max_supported_version: @template_3_data[:max_supported_version],
      source_visualization_id: @template_3_data[:source_visualization_id],
      organization_id: @template_3_data[:organization_id],
      required_tables: @template_3_data[:required_tables]
    })
    third_template.save.should eq true

    delete_json(api_v1_vis_templates_destroy_url(id: third_template.id)) do |response|
      response.status.should be_success
    end

    Carto::Template.where(id: third_template.id).first.should eq nil
  end

  it 'tests related_tables_by_xxx actions' do
    get_json(api_v1_tables_related_templates_url({ id: @template_1_data[:required_tables][0] })) do |response|
      response.status.should be_success
      response.body[:items].count.should eq 1
      response.body[:items][0]['id'] = @template.id
      response.body[:items][0]['title'] = @template.title
    end

    get_json(api_v1_visualizations_related_templates_url({ id: @table.table_visualization.id })) do |response|
      response.status.should be_success
      response.body[:items].count.should eq 1
      response.body[:items][0]['id'] = @template.id
      response.body[:items][0]['title'] = @template.title
    end
  end

end
