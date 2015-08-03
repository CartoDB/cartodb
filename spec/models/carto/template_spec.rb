# coding: UTF-8
require_relative '../../spec_helper'

describe Carto::Template do
  include_context 'organization with users helper'

  after(:each) do
    Carto::Template.all.each { |template| template.delete }

    delete_user_data(@org_user_owner)
  end

  it "Tests basic creation and FKs" do
    expected_title = 'my_first_template'
    expected_min_supported_version = '3.12.0'
    expected_max_supported_version = '3.99.0'
    expected_description = 'example description blablabla'
    expected_code = '{ fake = function(e){}; }'
    expected_required_tables = [ "#{@org_user_owner.database_schema}.table_1",
                                "#{@org_user_owner.database_schema}.table_2-1" ]

    new_template = Carto::Template.new

    new_template.valid?.should eq false
    (new_template.errors.messages.keys - [:title, :organization_id, :source_visualization_id,
                                                 :min_supported_version, :max_supported_version]).should eq []

    new_template.save.should eq false

    new_template.title = expected_title
    # errors list is only updated upon call to valid?
    new_template.valid?.should eq false
    (new_template.errors.messages.keys - [:organization_id, :source_visualization_id,
                                                 :min_supported_version, :max_supported_version]).should eq []

    new_template.min_supported_version = expected_min_supported_version
    new_template.valid?.should eq false
    (new_template.errors.messages.keys - [:organization_id, :source_visualization_id,
                                                 :max_supported_version]).should eq []

    new_template.max_supported_version = expected_max_supported_version
    new_template.valid?.should eq false
    (new_template.errors.messages.keys - [:organization_id, :source_visualization_id]).should eq []

    new_template.organization_id = @organization.id
    new_template.valid?.should eq false
    (new_template.errors.messages.keys - [:source_visualization_id]).should eq []

    table = create_table(privacy: UserTable::PRIVACY_PRIVATE, name: 'some_table_name', user_id: @org_user_owner.id)

    new_template.source_visualization_id = table.table_visualization.id
    new_template.valid?.should eq true
    new_template.errors.messages.keys.should eq []

    new_template.save.should eq true

    new_template.required_tables.should eq []

    new_template.description = expected_description
    new_template.code = expected_code
    new_template.required_tables = expected_required_tables
    new_template.save

    template = Carto::Template.where(id: new_template.id).first
    template.should eq new_template

    template.title.should eq expected_title
    template.description.should eq expected_description
    template.min_supported_version.should eq new_template.min_supported_version
    template.max_supported_version.should eq new_template.max_supported_version
    template.source_visualization_id.should eq new_template.source_visualization_id
    template.organization_id.should eq new_template.organization_id
    template.code.should eq new_template.code
    template.required_tables.should eq new_template.required_tables

    template.required_tables = [ 1 ]
    template.valid?.should eq false
    (template.errors.messages.keys - [:required_tables]).should eq []

    template.required_tables = [ 'invalid name!' ]
    template.valid?.should eq false
    (template.errors.messages.keys - [:required_tables]).should eq []

    template.required_tables = [ 'not_qualified' ]
    template.valid?.should eq false
    (template.errors.messages.keys - [:required_tables]).should eq []
  end

  it 'tests relates_to?() functionality' do
    table = create_table(privacy: UserTable::PRIVACY_PRIVATE, name: 'table1', user_id: @org_user_owner.id)
    table_vis = table.table_visualization
    other_table = create_table(privacy: UserTable::PRIVACY_PRIVATE, name: 'table2', user_id: @org_user_owner.id)

    template = Carto::Template.new({
        title: 'title',
        code: '',
        min_supported_version: '1.2.3',
        max_supported_version: '2.0.0',
        source_visualization_id: table_vis.id,
        organization_id: @org_user_owner.organization.id,
        required_tables: [ "#{@org_user_owner.database_schema}.#{table.name}" ]
        })
    template.save.should eq true

    template.relates_to?(table_vis).should eq true
    template.relates_to?(other_table.table_visualization).should eq false
  end

  it 'tests Visualization models related_templates()' do
    table = create_table(privacy: UserTable::PRIVACY_PRIVATE, name: 'table1', user_id: @org_user_owner.id)
    table_vis = table.table_visualization
    other_table = create_table(privacy: UserTable::PRIVACY_PRIVATE, name: 'table2', user_id: @org_user_owner.id)

    template = Carto::Template.new({
        title: 'title',
        code: '',
        min_supported_version: '1.2.3',
        max_supported_version: '2.0.0',
        source_visualization_id: table_vis.id,
        organization_id: @org_user_owner.organization.id,
        required_tables: [ "#{@org_user_owner.database_schema}.#{table.name}" ]
        })
    template.save.should eq true

    expected_templates = [ template ]

    related_vis = Carto::Visualization.where(id: table_vis.id).first
                                                              .related_templates.should eq expected_templates

    related_vis = CartoDB::Visualization::Member.new(id: table_vis.id).fetch
                                                                      .related_templates.should eq expected_templates

    Carto::Visualization.where(id: other_table.table_visualization.id).first
                                                                      .related_templates.should eq []

    CartoDB::Visualization::Member.new(id: other_table.table_visualization.id).fetch
                                                                              .related_templates.should eq []

  end

end