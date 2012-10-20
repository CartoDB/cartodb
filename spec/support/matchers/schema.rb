require 'rspec/expectations'

RSpec::Matchers.define :be_equal_to_default_cartodb_schema do |expected|
  expected = [
    [:cartodb_id, "number"], [:name, "string"], [:description, "string"],
    [:the_geom, "geometry", "geometry", "geometry"], [:created_at, "date"], [:updated_at, "date"]
  ]
  
  match do |actual|
   diff = expected - actual
   diff.should == []
  end
end

RSpec::Matchers.define :be_equal_to_default_db_schema do |expected|
  expected = [
    [:cartodb_id, "integer"], [:name, "text"], [:description, "text"],
    [:the_geom, "geometry", "geometry", "geometry"], [:created_at, "timestamp without time zone"], [:updated_at, "timestamp without time zone"]]

  match do |actual|
   diff = expected - actual
   diff.should == []
  end
end
