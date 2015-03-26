# encoding: utf-8

require_relative '../../lib/importer/namedplaces_guesser'

RSpec.configure do |config|
  config.mock_with :mocha
end

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
        namedplaces.stubs(:namedplace_guess_country)

        namedplaces.run!
        namedplaces.found?.should be_false
      end

      it 'returns true if there was a namedplaces column found' do
        content_guesser = mock
        namedplaces = NamedplacesGuesser.new(content_guesser)
        namedplaces.stubs(:column).returns(:dummy_column)
        namedplaces.stubs(:country_column).returns(nil)
        namedplaces.stubs(:namedplace_guess_country)

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
        namedplaces.expects(:namedplace_guess_country).never

        namedplaces.run!
      end

      it "performs a guessing relying on namedplace_guess_country if there's no country column" do
        content_guesser = mock
        namedplaces = NamedplacesGuesser.new(content_guesser)
        namedplaces.stubs(:country_column).returns(nil)
        namedplaces.expects(:guess_with_country_column).never
        namedplaces.expects(:namedplace_guess_country).once

        namedplaces.run!
      end

    end

    describe '#country_column' do
      it "returns a country column if there's one with a high proportion of countries" do
        content_guesser = mock
        namedplaces = NamedplacesGuesser.new(content_guesser)
        namedplaces.stubs(:text_columns).returns([:my_country_column, :another_column])
        country_proportion_stub = Proc.new {|column| puts "hola"; column[:country_proportion]}
        content_guesser.stubs(:country_proportion).with(:my_country_column).returns(0.9)
        content_guesser.stubs(:country_proportion).with(:another_column).returns(0.1)
        content_guesser.stubs(:threshold).returns(0.8)

        namedplaces.country_column.should eq :my_country_column
      end
    end

  end

end
