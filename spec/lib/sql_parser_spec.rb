# coding: UTF-8

require 'spec_helper'

describe CartoDB::SqlParser do
  it "should return the affected tables" do
    sql = "select coalesce('tabname', null) from cdb_tablemetadata;select 1;select * from spatial_ref_sys"
    CartoDB::SqlParser.new(sql, connection: $user_1.in_database)
      .affected_tables.should =~ ["cartodb.cdb_tablemetadata", "public.spatial_ref_sys"]
  end

end
