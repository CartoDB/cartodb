require 'active_record'
require_relative '../../lib/importer/namedplaces_guesser'
require_relative '../../../../spec/spec_helper_min'

module CartoDB::Importer2

  describe NamedplacesGuesser do

    describe '#found?' do
      it 'raises an exception if not run yet' do
        content_guesser = mock
        namedplaces = NamedplacesGuesser.new(content_guesser)
        expect {
          namedplaces.found?
        }.to raise_error(ContentGuesserException, 'not run yet!')
      end

      it 'returns false if there was no namedplaces column found during checks' do
        content_guesser = mock
        namedplaces = NamedplacesGuesser.new(content_guesser)
        namedplaces.stubs(:column).returns(nil)
        namedplaces.stubs(:country_column).returns(nil)
        namedplaces.stubs(:namedplaces_guess_country)

        namedplaces.run!
        namedplaces.found?.should be_false
      end

      it 'returns true if there was a namedplaces column found' do
        content_guesser = mock
        namedplaces = NamedplacesGuesser.new(content_guesser)
        namedplaces.stubs(:column).returns(:dummy_column)
        namedplaces.stubs(:country_column).returns(nil)
        namedplaces.stubs(:namedplaces_guess_country)

        namedplaces.run!
        namedplaces.found?.should be_true
      end

    end

    describe '#run!' do
      it "performs a guessing using the country column if there's any" do
        content_guesser = mock
        namedplaces = NamedplacesGuesser.new(content_guesser)
        namedplaces.stubs(:country_column).returns(:dummy_column)
        namedplaces.expects(:guess_with_country_column).once
        namedplaces.expects(:namedplaces_guess_country).never

        namedplaces.run!
      end

      it "performs a guessing relying on namedplace_guess_country if there's no country column" do
        content_guesser = mock
        namedplaces = NamedplacesGuesser.new(content_guesser)
        namedplaces.stubs(:country_column).returns(nil)
        namedplaces.expects(:guess_with_country_column).never
        namedplaces.expects(:namedplaces_guess_country).once

        namedplaces.run!
      end

    end

    describe '#country_column' do
      it "returns a country column if there's one with a high proportion of countries" do
        content_guesser = mock
        namedplaces = NamedplacesGuesser.new(content_guesser)
        namedplaces.stubs(:text_columns).returns([:my_country_column, :another_column])
        content_guesser.stubs(:country_proportion).with(:my_country_column).returns(0.9)
        content_guesser.stubs(:country_proportion).with(:another_column).returns(0.1)
        content_guesser.stubs(:threshold).returns(0.8)

        namedplaces.country_column.should eq :my_country_column
      end
    end


    # These methods below are private but worth testing

    describe '#guess_with_country_column' do
      it "gets the column with highest proportion of namedplaces, if any" do
        content_guesser = mock
        namedplaces = NamedplacesGuesser.new(content_guesser)

        namedplaces.stubs(:text_columns).returns([:my_country_column, :another_column, :namedplaces_column])
        namedplaces.stubs(:country_column).returns(:my_country_column)
        namedplaces.stubs(:proportion).with(:another_column).returns(0.7)
        namedplaces.stubs(:proportion).with(:namedplaces_column).returns(0.9)
        content_guesser.stubs(:threshold).returns(0.8)
        namedplaces.stubs(:run?).returns(true)

        namedplaces.send(:guess_with_country_column)
        namedplaces.column.should eq :namedplaces_column
      end
    end

    describe '#namedplace_guess_country' do
      it "checks all candidates for a positive country guess through the geocoder api" do
        content_guesser = mock
        namedplaces = NamedplacesGuesser.new(content_guesser)

        namedplaces.stubs(:text_columns).returns([
                                                  {column_name: 'japanese_cities'},
                                                  {column_name: 'another_column'}
                                                 ])
        content_guesser.stubs(:sample).returns([{japanese_cities: 'Tokyo', another_column: 'whatever'}])

        sql_api_mock = mock
        sql_api_mock.expects(:fetch)
          .with("SELECT namedplace_guess_country(Array['Tokyo']) as country")
          .returns([{'country' => 'JP'}])
        content_guesser.stubs(:geocoder_sql_api).returns(sql_api_mock)

        namedplaces.stubs(:run?).returns(true)
        namedplaces.send(:namedplaces_guess_country)
        namedplaces.country.should eq 'JP'
        namedplaces.column[:column_name].should eq 'japanese_cities'
      end
    end

    describe '#proportion' do
      it 'calculates the proportion of namedplaces given a column and a country column' do
        content_guesser = mock
        namedplaces = NamedplacesGuesser.new(content_guesser)

        cities_column = {column_name: 'cities_column'}
        countries_column = {column_name: 'countries'}
        content_guesser.stubs(:sample).returns([{cities_column: 'Tokyo'}])
        namedplaces.stubs(:text_columns).returns([cities_column])
        namedplaces.stubs(:country_column).returns(countries_column)
        namedplaces.stubs(:count_namedplaces_with_country_column).with(:cities_column).returns(1)


        namedplaces.send(:proportion, cities_column).should eq 1.0
      end
    end

    describe '#count_namedplaces_with_country_column' do
      it 'queries the geocoder to get the number of namedplaces from the sample' do
        content_guesser = mock
        namedplaces = NamedplacesGuesser.new(content_guesser)

        content_guesser.stubs(:sample).returns([{japanese_cities: 'Tokyo', country: 'Japan'}])
        namedplaces.stubs(:country_column).returns({column_name: 'country'})
        namedplaces.stubs(:text_columns).returns([{column_name: 'japanese_cities'}])

        sql_api_mock = mock
        sql_api_mock.expects(:fetch)
          .with("WITH geo_function as (SELECT (geocode_namedplace(Array['Tokyo'], Array['Japan'])).*) select count(success) FROM geo_function where success = TRUE")
          .returns([{'count' => 1}])
        content_guesser.stubs(:geocoder_sql_api).returns(sql_api_mock)


        namedplaces.send(:count_namedplaces_with_country_column, :japanese_cities).should eq 1
      end
    end

  end

end
