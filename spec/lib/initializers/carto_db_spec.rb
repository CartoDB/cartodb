# encoding: utf-8

require_relative '../../spec_helper'

require_relative '../../../config/initializers/carto_db'

describe CartoDB do
  before do
  end

  before(:each) do
  end
  let(:instance) { CartoDB.new }

  describe '#url_methods' do
    it '..' do

      Cartodb.expects(:get_session_domain).returns("test.local")

      puts Cartodb.session_domain
    end
  end

end
