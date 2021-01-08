require 'active_record'
require_relative '../../lib/importer/namedplaces_guesser'
require_relative '../../../../spec/rspec_configuration.rb'
require_relative '../../../../spec/spec_helper_min'

module CartoDB::Importer2

  describe NamedplacesGuesser do

    describe '#found?' do
      it 'raises an exception if not run yet' do
        content_guesser = double
        namedplaces = NamedplacesGuesser.new(content_guesser)
        expect {
          namedplaces.found?
        }.to raise_error(ContentGuesserException, 'not run yet!')
      end

      it 'returns false if there was no namedplaces column found during checks' do
        content_guesser = double
        namedplaces = NamedplacesGuesser.new(content_guesser)
        allow(namedplaces).to receive(:column).and_return(nil)
        allow(namedplaces).to receive(:country_column).and_return(nil)
        allow(namedplaces).to receive(:namedplaces_guess_country)

        namedplaces.run!
        namedplaces.found?.should be_false
      end

      it 'returns true if there was a namedplaces column found' do
        content_guesser = double
        namedplaces = NamedplacesGuesser.new(content_guesser)
        allow(namedplaces).to receive(:column).and_return(:dummy_column)
        allow(namedplaces).to receive(:country_column).and_return(nil)
        allow(namedplaces).to receive(:namedplaces_guess_country)

        namedplaces.run!
        namedplaces.found?.should be_true
      end

    end

    describe '#run!' do
      it "performs a guessing using the country column if there's any" do
        content_guesser = double
        namedplaces = NamedplacesGuesser.new(content_guesser)
        allow(namedplaces).to receive(:country_column).and_return(:dummy_column)
        expect(namedplaces).to receive(:guess_with_country_column).once
        expect(namedplaces).to receive(:namedplaces_guess_country).never

        namedplaces.run!
      end

      it "performs a guessing relying on namedplace_guess_country if there's no country column" do
        content_guesser = double
        namedplaces = NamedplacesGuesser.new(content_guesser)
        allow(namedplaces).to receive(:country_column).and_return(nil)
        expect(namedplaces).to receive(:guess_with_country_column).never
        expect(namedplaces).to receive(:namedplaces_guess_country).once

        namedplaces.run!
      end

    end

    describe '#country_column' do
      it "returns a country column if there's one with a high proportion of countries" do
        content_guesser = double
        namedplaces = NamedplacesGuesser.new(content_guesser)
        allow(namedplaces).to receive(:text_columns).and_return([:my_country_column, :another_column])
        allow(content_guesser).to receive(:country_proportion).with(:my_country_column).and_return(0.9)
        allow(content_guesser).to receive(:country_proportion).with(:another_column).and_return(0.1)
        allow(content_guesser).to receive(:threshold).and_return(0.8)

        namedplaces.country_column.should eq :my_country_column
      end
    end


    # These methods below are private but worth testing

    describe '#guess_with_country_column' do
      it "gets the column with highest proportion of namedplaces, if any" do
        content_guesser = double
        namedplaces = NamedplacesGuesser.new(content_guesser)

        allow(namedplaces).to receive(:text_columns).and_return([:my_country_column, :another_column, :namedplaces_column])
        allow(namedplaces).to receive(:country_column).and_return(:my_country_column)
        allow(namedplaces).to receive(:proportion).with(:another_column).and_return(0.7)
        allow(namedplaces).to receive(:proportion).with(:namedplaces_column).and_return(0.9)
        allow(content_guesser).to receive(:threshold).and_return(0.8)
        allow(namedplaces).to receive(:run?).and_return(true)

        namedplaces.send(:guess_with_country_column)
        namedplaces.column.should eq :namedplaces_column
      end
    end

    describe '#namedplace_guess_country' do
      it "checks all candidates for a positive country guess through the geocoder api" do
        content_guesser = double
        namedplaces = NamedplacesGuesser.new(content_guesser)

        allow(namedplaces).to receive(:text_columns).and_return([
                                                  {column_name: 'japanese_cities'},
                                                  {column_name: 'another_column'}
                                                 ])
        allow(content_guesser).to receive(:sample).and_return([{japanese_cities: 'Tokyo', another_column: 'whatever'}])

        sql_api_mock = double
        expect(sql_api_mock).to receive(:fetch).with("SELECT namedplace_guess_country(Array['Tokyo']) as country").and_return([{'country' => 'JP'}])
        allow(content_guesser).to receive(:geocoder_sql_api).and_return(sql_api_mock)

        allow(namedplaces).to receive(:run?).and_return(true)
        namedplaces.send(:namedplaces_guess_country)
        namedplaces.country.should eq 'JP'
        namedplaces.column[:column_name].should eq 'japanese_cities'
      end
    end

    describe '#proportion' do
      it 'calculates the proportion of namedplaces given a column and a country column' do
        content_guesser = double
        namedplaces = NamedplacesGuesser.new(content_guesser)

        cities_column = {column_name: 'cities_column'}
        countries_column = {column_name: 'countries'}
        allow(content_guesser).to receive(:sample).and_return([{cities_column: 'Tokyo'}])
        allow(namedplaces).to receive(:text_columns).and_return([cities_column])
        allow(namedplaces).to receive(:country_column).and_return(countries_column)
        allow(namedplaces).to receive(:count_namedplaces_with_country_column).with(:cities_column).and_return(1)


        namedplaces.send(:proportion, cities_column).should eq 1.0
      end
    end

    describe '#count_namedplaces_with_country_column' do
      it 'queries the geocoder to get the number of namedplaces from the sample' do
        content_guesser = double
        namedplaces = NamedplacesGuesser.new(content_guesser)

        allow(content_guesser).to receive(:sample).and_return([{japanese_cities: 'Tokyo', country: 'Japan'}])
        allow(namedplaces).to receive(:country_column).and_return({column_name: 'country'})
        allow(namedplaces).to receive(:text_columns).and_return([{column_name: 'japanese_cities'}])

        sql_api_mock = double
        expect(sql_api_mock).to receive(:fetch).with("WITH geo_function as (SELECT (geocode_namedplace(Array['Tokyo'], Array['Japan'])).*) select count(success) FROM geo_function where success = TRUE").and_return([{'count' => 1}])
        allow(content_guesser).to receive(:geocoder_sql_api).and_return(sql_api_mock)


        namedplaces.send(:count_namedplaces_with_country_column, :japanese_cities).should eq 1
      end
    end

  end

end
