# coding: UTF-8
require_relative '../../spec_helper'

describe Carto::Template do
  include_context 'organization with users helper'

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

  end

end