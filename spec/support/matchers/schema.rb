require 'rspec/expectations'

RSpec::Matchers.define :be_equal_to_default_cartodb_schema do
  expected = [
    [:cartodb_id, "number"], [:name, "string"], [:description, "string"],
    [:the_geom, "geometry", "geometry", "geometry"], [:created_at, "date"], [:updated_at, "date"]
  ]
  match do |actual|
   diff = expected - actual
   diff.should == []
  end
end

RSpec::Matchers.define :be_equal_to_default_db_schema do
  expected = [
    [:cartodb_id, "integer"], [:name, "text"], [:description, "text"],
    [:the_geom, "geometry", "geometry", "geometry"], [:created_at, "timestamp with time zone"], [:updated_at, "timestamp with time zone"]]
  match do |actual|
   diff = expected - actual
   diff.should == []
  end

  failure_message_for_should do
    "missing #{@diff.inspect}"
  end  
end


RSpec::Matchers.define :have_required_indexes_and_triggers do
  match do |actual|
    @diff = []
    @diff << "update_the_geom_webmercator_trigger" unless actual.has_trigger?('update_the_geom_webmercator_trigger')
    @diff << "update_updated_at_trigger"           unless actual.has_trigger?('update_updated_at_trigger')
    @diff << "track_updates"                       unless actual.has_trigger?('track_updates')
    @diff << "the_geom_idx"                        unless actual.has_index?("the_geom")
    @diff << "the_geom_webmercator_idx"            unless actual.has_index?("the_geom_webmercator")
    @diff << "created_at_default"                  unless actual.owner.in_database.schema(actual.name).select {|i| i[0] == :created_at }[0][1][:default] == "now()"
    @diff << "updated_at_default"                  unless actual.owner.in_database.schema(actual.name).select {|i| i[0] == :updated_at }[0][1][:default] == "now()"
    @diff.should == []
  end

  failure_message_for_should do |actual|
    "missing #{@diff.inspect} on #{actual.name}"
  end
end

RSpec::Matchers.define :have_no_invalid_the_geom do
  match do |actual|
    found = false
    actual.schema.each do |colid, coldef|
      if colid == :invalid_the_geom
        found = true
      end
    end
    found.should eq false
  end

  failure_message_for_should do |actual|
    "Found invalid_the_geom on #{actual.name}"
  end
end


RSpec::Matchers.define :pass_sql_tests do
  match do |actual|
    @diff = {}
    actual.in_database(as: :superuser) do |user_database|
      user_database.transaction do
        config = ::Rails::Sequel.configuration.environment_for(Rails.env)
        env  = " PGUSER=#{actual.database_username}"
        env += " PGPORT=#{config['port']}"
        env += " PGHOST=#{config['host']}"
        env += " PGPASSWORD=#{actual.database_password}"
        glob = Rails.root.join('lib/sql/test/*.sql')
        Dir.glob(glob).each do |f|
          testname = File.basename(f)
          tname = File.basename(f, '.sql')
          puts "Testing #{tname}"
          expfile = File.dirname(f) + '/' + tname + '_expect'
          cmd = "#{env} psql -X -tA < #{f} #{actual.database_name} 2>&1 | diff -U2 #{expfile} - 2>&1"
          result = `#{cmd}`
          @diff[testname] = result.gsub(/^.*\@\@/, '') if $? != 0
        end
      end
    end
    @diff.keys.size.should == 0
  end

  failure_message_for_should do |actual|
    @diff.map { |k, v| "\n#{k} failed:\n#{v}" }.join("\n")
  end
end
