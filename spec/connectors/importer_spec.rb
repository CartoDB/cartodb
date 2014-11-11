# encoding: utf-8
require_relative '../spec_helper'
require_relative '../../app/connectors/importer'

describe CartoDB::Connector::Importer do

  before do

  end

  after do

  end

  it 'should not fail to return a new_name when ALTERing the INDEX fails' do

    # this basically validates the empty rescue handling in rename_the_geom_index_if_exists,
    # if you remove that rescue this test will fail

    runner = mock
    quota_checker = mock
    id = UUIDTools::UUID.timestamp_create.to_s
    destination_schema = 'public'

    database = mock
    database.stubs(:execute).with { |query|
      /ALTER INDEX/.match(query)
    }.raises('wadus')

    database.stubs(:execute).with { |query|
      /ALTER TABLE/.match(query)
    }.returns(nil)

    table_registrar = mock
    table_registrar.stubs(:get_valid_table_name).returns('european_countries')

    importer_table_name = "table_#{UUIDTools::UUID.timestamp_create.to_s}"
    desired_table_name = 'european_countries'

    importer = CartoDB::Connector::Importer.new(runner, table_registrar, quota_checker, database, id, destination_schema)
    new_table_name = importer.rename(OpenStruct.new(table_name: importer_table_name, name: desired_table_name))
    new_table_name.should_not == nil
  end

end



