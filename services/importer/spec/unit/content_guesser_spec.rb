require_relative '../../lib/importer/content_guesser'

describe CartoDB::Importer2::ContentGuesser do

  before(:each) do
    CartoDB::Stats::Aggregator.stubs(:read_config).returns({})
  end

  describe '#enabled?' do
    it 'returns a true value if set so in options' do
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, {guessing: {enabled: true}}
      guesser.enabled?.should eq true
    end

    it 'returns a false value if set so in options' do
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, {guessing: {enabled: false}}
      guesser.enabled?.should eq false
    end

    it 'returns a false-like value if not set in options' do
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, {}
      guesser.enabled?.should eq false
    end

  end

  describe '#country_column' do
    it 'returns nil if guessing is not enabled' do
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, {guessing: {enabled: false}}
      guesser.country_column.should eq nil
    end

    it 'returns the first column name which contents are countries, if present' do
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, {guessing: {enabled: true}}
      columns = [
        {column_name: 'any_column' },
        {column_name: 'country_column'},
        {column_name: 'any_other_column'}
      ]
      guesser.stubs(:columns).returns(columns)
      guesser.stubs(:is_country_column?).with({column_name: 'any_column'}).returns(false)
      guesser.stubs(:is_country_column?).with({column_name: 'country_column'}).returns(true)
      guesser.stubs(:is_country_column?).with({column_name: 'any_other_column'}).returns(false)

      guesser.country_column.should eq 'country_column'
    end

    it "returns nil if there's no column containing countries" do
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, {guessing: {enabled: true}}
      columns = [
        {column_name: 'any_column' },
        {column_name: 'any_other_column'}
      ]
      guesser.stubs(:columns).returns(columns)
      guesser.stubs(:is_country_column?).returns(false)

      guesser.country_column.should be_nil
    end
  end

  describe '#columns' do
    it 'queries the db to get a list of columns with their corresponding data types' do
      db = mock
      db.expects(:[]).returns(:any_iterable_list_of_columns)
      table_name = 'any_table_name'
      schema = 'any_schema'
      guesser = CartoDB::Importer2::ContentGuesser.new db, table_name, schema, nil
      guesser.columns.should == :any_iterable_list_of_columns
    end
  end

  describe '#is_country_column?' do
    it 'returns true if a sample proportion is above a given threshold' do
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, {guessing: {enabled: true}}
      column = {column_name: 'candidate_column_name', data_type: 'text'}
      guesser.stubs(:sample).returns [
         {candidate_column_name: 'USA'},
         {candidate_column_name: 'Spain'},
         {candidate_column_name: 'not a country'}
      ]
      guesser.stubs(:countries).returns Set.new ['usa', 'spain', 'france', 'canada']
      guesser.stubs(:threshold).returns 0.5
      importer_stats_mock = mock
      proportion = 2.0/3.0
      importer_stats_mock.expects(:gauge).once().with('country_proportion', proportion)
      guesser.set_importer_stats(importer_stats_mock)

      guesser.is_country_column?(column).should eq true
    end

    it 'returns false if sample.count == 0' do
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, {guessing: {enabled: true}}
      column = {column_name: 'candidate_column_name', data_type: 'text'}
      guesser.stubs(:sample).returns []
      guesser.stubs(:countries).returns Set.new ['usa', 'spain', 'france', 'canada']
      guesser.stubs(:threshold).returns 0.5

      guesser.is_country_column?(column).should eq false
    end

    it 'returns false if countries.count == 0' do
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, {guessing: {enabled: true}}
      column = {column_name: 'candidate_column_name', data_type: 'text'}
      guesser.stubs(:sample).returns [
         {candidate_column_name: 'USA'},
         {candidate_column_name: 'Spain'},
         {candidate_column_name: 'not a country'}
      ]
      guesser.stubs(:countries).returns Set.new []
      guesser.stubs(:threshold).returns 0.5

      guesser.is_country_column?(column).should eq false
    end

    it 'returns false if sample.count == 0 and countries.count == 0' do
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, {guessing: {enabled: true}}
      column = {column_name: 'candidate_column_name', data_type: 'text'}
      guesser.stubs(:sample).returns []
      guesser.stubs(:countries).returns Set.new []
      guesser.stubs(:threshold).returns 0.5

      guesser.is_country_column?(column).should eq false
    end

  end

  describe '#is_text_type?' do
    it 'returns false if the column type is not compatible' do
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, nil
      column = {data_type: 'integer'}
      guesser.is_text_type?(column).should eq false
    end

    it 'returns true if the column type is of a compatible type' do
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, nil
      column = {data_type: 'text'}
      guesser.is_text_type?(column).should eq true
    end
  end

  describe '#countries' do
    it 'queries the sql api to get a Set of countries' do
      countries_column = CartoDB::Importer2::ContentGuesser::COUNTRIES_COLUMN
      api_mock = mock
      api_mock
        .expects(:fetch)
        .with(CartoDB::Importer2::ContentGuesser::COUNTRIES_QUERY)
        .returns([
          {countries_column => 'usa'},
          {countries_column => 'united states'},
          {countries_column => 'spain'},
          {countries_column => 'es'},
          {countries_column => 'france'},
          {countries_column => 'fr'}
        ])
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, nil
      guesser.geocoder_sql_api = api_mock
      guesser.countries.should eq Set.new ['usa', 'united states', 'spain', 'es', 'france', 'fr']
    end

    it 'caches the response so no need to call the sql api on successive calls' do
      api_mock = mock
      api_mock
        .expects(:fetch)
        .once
        .with(CartoDB::Importer2::ContentGuesser::COUNTRIES_QUERY)
        .returns([])
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, nil
      guesser.geocoder_sql_api = api_mock

      guesser.countries.should eq Set.new []
      guesser.countries.should eq Set.new []
    end

    it 'shall not add countries from DB if length < 2' do
      countries_column = CartoDB::Importer2::ContentGuesser::COUNTRIES_COLUMN
      api_mock = mock
      api_mock
        .expects(:fetch)
        .with(CartoDB::Importer2::ContentGuesser::COUNTRIES_QUERY)
        .returns([
          {countries_column => 'usa'},
          {countries_column => 'united states'},
          {countries_column => 'fr'},
          {countries_column => 's'},
          {countries_column => ''},
        ])
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, nil
      guesser.geocoder_sql_api = api_mock
      guesser.countries.should eq Set.new ['usa', 'united states', 'fr']
    end

  end

  describe '#id_column' do
    it 'should return a column name known to be sequential and with index' do
      db = mock
      list_of_columns = [
        { column_name: "data", data_type: "string" },
        { column_name: "ogc_fid", data_type: "integer" },
        { column_name: "more_data", data_type: "string" }
      ]
      db.expects(:[]).once.returns(list_of_columns)
      guesser = CartoDB::Importer2::ContentGuesser.new db, nil, nil, nil
      guesser.id_column.should eq 'ogc_fid'
    end

    it "should use objectid in case the file is a gdb one" do
      db = mock
      list_of_columns = [
        { column_name: "data", data_type: "string" },
        { column_name: "objectid", data_type: "integer" },
        { column_name: "more_data", data_type: "string" }
      ]
      db.expects(:[]).once.returns(list_of_columns)
      guesser = CartoDB::Importer2::ContentGuesser.new db, nil, nil, nil
      guesser.id_column.should eq 'objectid'
    end

    it "should raise an exception if there's no suitable id column" do
      db = mock
      list_of_columns = [
        { column_name: "data", data_type: "string" },
        { column_name: "more_data", data_type: "string" }
      ]
      db.expects(:[]).once.returns(list_of_columns)
      guesser = CartoDB::Importer2::ContentGuesser.new db, nil, nil, nil
      expect {guesser.id_column}.to raise_error(CartoDB::Importer2::ContentGuesserException)
    end

  end

  describe '#metric_entropy' do
    it 'should be low for repeated elements after normalization' do
      column = { column_name: 'candidate_column_name' }
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, nil
      guesser.stubs(:sample).returns [
         {candidate_column_name: '1400US600'},
         {candidate_column_name: '1400US601'},
         {candidate_column_name: '1400US602'}
      ]
      guesser.metric_entropy(column).should > 0.99
      guesser.metric_entropy(column, guesser.country_name_normalizer).should < 0.5
    end
  end

  describe '#country_name_normalizer' do
    it 'should handle gracefully nil values' do
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, nil
      guesser.country_name_normalizer.call(nil).should == ''
    end
  end

  describe '#is_ip_column?' do

    it "returns true if column contains IP's" do
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, {guessing: {enabled: true}}
      column = {column_name: 'candidate_column_name', data_type: 'text'}
      guesser.stubs(:sample).returns [
         {candidate_column_name: '192.168.1.1'},
         {candidate_column_name: '162.243.83.87'},
         {candidate_column_name: '173.194.66.104'}
      ]
      guesser.stubs(:threshold).returns 0.9

      guesser.is_ip_column?(column).should eq true
    end

    it 'returns false if sample contains a bunch of integers #1803' do
      guesser = CartoDB::Importer2::ContentGuesser.new nil, nil, nil, {guessing: {enabled: true}}
      column = {column_name: 'candidate_column_name', data_type: 'text'}
      guesser.stubs(:sample).returns [
         {candidate_column_name: '12345'},
         {candidate_column_name: '67891'},
         {candidate_column_name: '1024'}
      ]
      guesser.stubs(:threshold).returns 0.9

      guesser.is_ip_column?(column).should eq false
    end
  end

end
