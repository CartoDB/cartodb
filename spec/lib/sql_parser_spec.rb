# coding: UTF-8

require 'spec_helper'

describe CartoDB::SqlParser do
  before(:all) do
    @user = create_user(username: 'test', email: "client@example.com", password: "clientex")
    @connection = @user.in_database
    @sql = "select coalesce('tabname', null) from cdb_tablemetadata;select 1;select * from spatial_ref_sys"
  end

  after(:all) do
    @user.destroy
  end

  it "should return the affected tables" do
    CartoDB::SqlParser.new(@sql, connection: @connection)
      .affected_tables.should =~ ["cartodb.cdb_tablemetadata", "public.spatial_ref_sys"]
  end

end
