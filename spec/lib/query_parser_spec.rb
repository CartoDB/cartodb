# coding: UTF-8

require 'spec_helper'

describe CartoDB::QueryParser do

  describe "parse_select method" do

    it "should raise if query is not a select" do
      user = create_user
      lambda {
        CartoDB::QueryParser.parse_select("delete from wherever", user)
      }.should raise_error(CartoDB::InvalidQuery)
    end

    it "should parse select * from a single table query" do
      user = create_user
      table = new_table
      table.name = 'twitts'
      table.user_id = user.id
      table.force_schema = "login varchar, message varchar"
      table.save

      query, columns = CartoDB::QueryParser.parse_select("select * from twitts", user)
      query.should == "select cartodb_id,login,message,created_at,updated_at from twitts"
      columns.should == [
        [:cartodb_id, "number"], [:login, "string"], [:message, "string"],
        [:created_at, "date"], [:updated_at, "date"]
      ]
    end

  end

end
