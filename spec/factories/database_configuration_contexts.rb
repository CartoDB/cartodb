shared_context 'database configuration' do

  before(:each) do
    @db         = SequelRails.connection
    @repository = DataRepository::Backend::Sequel.new(@db, :visualizations)
    CartoDB::Visualization.repository = @repository
  end

end
