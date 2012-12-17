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


RSpec::Matchers.define :have_required_indexes_and_triggers do
  match do |actual|
    @diff = []
    @diff << "update_the_geom_webmercator_trigger" unless actual.has_trigger?('update_the_geom_webmercator_trigger')
    @diff << "update_updated_at_trigger"           unless actual.has_trigger?('update_updated_at_trigger')
    @diff << "the_geom_idx"                        unless actual.has_index?("#{actual.name}_the_geom_idx")
    @diff << "the_geom_webmercator_idx"            unless actual.has_index?("#{actual.name}_the_geom_webmercator_idx")
    @diff.should == []
  end

  failure_message_for_should do |actual|
    "missing #{@diff.inspect}"
  end
end
