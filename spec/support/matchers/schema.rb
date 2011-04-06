require 'rspec/expectations'

RSpec::Matchers.define :be_equal_to_default_cartodb_schema do |expected|
  match do |actual|
    actual.should == [
      [:cartodb_id, "number"], [:name, "string"], [:description, "string"],
      [:the_geom, "geometry", "geometry", "point"], [:created_at, "date"], [:updated_at, "date"]
    ]
  end
end

RSpec::Matchers.define :be_equal_to_default_db_schema do |expected|
  match do |actual|
    actual.should == [
      [:cartodb_id, "integer"], [:name, "text"], [:description, "text"],
      [:the_geom, "geometry", "geometry", "point"], [:created_at, "timestamp"], [:updated_at, "timestamp"]
    ]
  end
end