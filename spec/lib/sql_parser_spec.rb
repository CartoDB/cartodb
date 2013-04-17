# coding: UTF-8

require 'spec_helper'

describe CartoDB::SqlParser do
  before do
    @user = create_user(username: 'test', email: "client@example.com", password: "clientex")
    @connection = @user.in_database
  end

  it "should return the affected tables" do
    sql = "select * from cdb_tablemetadata;select cartodb_id from unexisting_table;selecterror;select 1;select * from spatial_ref_sys"
    CartoDB::SqlParser.new(sql, connection: @connection).affected_tables.should =~ ["cdb_tablemetadata", "spatial_ref_sys"]
  end
end
