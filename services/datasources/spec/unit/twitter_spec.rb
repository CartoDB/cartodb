# encoding: utf-8

require_relative '../../lib/datasources'
require_relative '../doubles/user'

include CartoDB::Datasources

describe Search::Twitter do

  def get_config
    {
      'auth_required' => false,
      'username'      => '',
      'password'      => '',
      'search_url'    => 'a'
    }
  end #get_config

  describe '#filters' do
    it 'tests category filters' do
      user_mock = Doubles::User.new

      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_terms = terms_fixture

      expected_output_terms = [
          { 'Category 1' => 'uno has:geo OR @dos has:geo OR #tres has:geo' },
          { 'Category 2' => 'aaa has:geo OR bbb has:geo' }
      ]

      output = twitter_datasource.send :build_queries_from_fields, input_terms

      output.should eq expected_output_terms
    end

    it 'tests date filters' do
      user_mock = Doubles::User.new

      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_dates = dates_fixture

      output = twitter_datasource.send :build_date_from_fields, input_dates, 'from'
      output.should eq '20140303134900'

      output = twitter_datasource.send :build_date_from_fields, input_dates, 'to'
      output.should eq '20140304115900'

      expect {
        twitter_datasource.send :build_date_from_fields, input_dates, 'wadus'
      }.to raise_error ParameterError

    end

    it 'tests basic search flow' do
      user_mock = Doubles::User.new

      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_terms = terms_fixture
      input_dates = dates_fixture

      output = twitter_datasource.get_resource(::JSON.dump(
        {
          categories: input_terms[:categories],
          dates:      input_dates[:dates]
        }
      ))


    end

  end

  def terms_fixture
    {
      categories: [
        {
          category: 'Category 1',
          terms:    ['uno', '@dos', '#tres']
        },
        {
          category: 'Category 2',
          terms:    ['aaa', 'bbb']
        }
      ]
    }
  end

  def dates_fixture
    {
      dates: {
        fromDate: '2014-03-03',
        fromHour: '13',
        fromMin:  '49',
        toDate:   '2014-03-04',
        toHour:   '11',
        toMin:    '59'
      }
    }
  end

end

