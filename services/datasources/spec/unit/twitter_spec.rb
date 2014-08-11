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
    it 'test that filter options work correctly' do
      user_mock = Doubles::User.new

      twitter_datasource = Search::Twitter.get_new(get_config, user_mock)

      input_terms = {
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

      expected_output_terms = [
          { 'Category 1' => 'uno has:geo OR @dos has:geo OR #tres has:geo' },
          { 'Category 2' => 'aaa has:geo OR bbb has:geo' }
      ]

      output = twitter_datasource.send :build_queries_from_fields, input_terms

      output.should eq expected_output_terms
    end
  end #run

end

