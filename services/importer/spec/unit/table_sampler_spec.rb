require_relative '../../lib/importer/table_sampler'

# Open the class for adition of some stuff used only for testing
class CartoDB::Importer2::TableSampler

  def ids_count= n
    @ids_count = n
  end

  def min_id= n
    @min_id = n
  end

  def max_id= n
    @max_id = n
  end

  def min_max_ids= h
    @min_max_ids = h
  end


  public :sample_query, :sample_indices, :sample_indices_add_method, :sample_indices_delete_method
  public :min_id, :max_id, :min_max_ids_query, :ids_count

end


describe CartoDB::Importer2::TableSampler do

  describe '#sample_query' do
    it 'should return the whole dataset if sample_size >= rows' do
      db = nil
      sample_size = 400
      sampler = CartoDB::Importer2::TableSampler.new db, 'table_name', 'ogc_fid', sample_size
      sampler.ids_count = 250 # like countries
      sampler.sample_query.should eq 'SELECT * FROM table_name'
    end

    it 'should have a WHERE clause if sample_size < rows' do
      db = nil
      sample_size = 5
      sampler = CartoDB::Importer2::TableSampler.new db, 'table_name', 'ogc_fid', sample_size
      sampler.min_id = 1
      sampler.max_id = 10
      sampler.sample_query.should match /SELECT \* FROM table_name WHERE ogc_fid IN \([\d,]+\)/
    end
  end

  describe '#sample_indices' do
    it 'should add indices to the null set if the space of candidates is bigger than sample size' do
      db = nil
      sample_size = 5
      sampler = CartoDB::Importer2::TableSampler.new db, 'table_name', 'ogc_fid', sample_size
      sampler.expects(:sample_indices_add_method).once
      sampler.ids_count = 250
      sampler.sample_indices
    end

    it 'should remove indices from the index space when sample size is comparable to index space' do
      db = nil
      sample_size = 300
      sampler = CartoDB::Importer2::TableSampler.new db, 'table_name', 'ogc_fid', sample_size
      sampler.expects(:sample_indices_delete_method).once
      sampler.ids_count = 400
      sampler.sample_indices
    end
  end

  describe '#sample_indices_add_method' do
    it 'should return x indices in the search space' do
      db = nil
      sample_size = 5
      sampler = CartoDB::Importer2::TableSampler.new db, 'table_name', 'ogc_fid', sample_size
      sampler.min_id = 1
      sampler.max_id = 1000
      indices = sampler.sample_indices_add_method
      indices.count.should eq sample_size
      indices.to_a.each { |index| (sampler.min_id..sampler.max_id).member?(index).should be true }
    end
  end

  describe '#sample_indices_delete_method' do
    it 'should return x indices in the search space' do
      db = nil
      sample_size = 10
      sampler = CartoDB::Importer2::TableSampler.new db, 'table_name', 'ogc_fid', sample_size
      sampler.min_id = 1
      sampler.max_id = 11
      indices = sampler.sample_indices_add_method
      indices.count.should eq sample_size
      indices.to_a.each { |index| (sampler.min_id..sampler.max_id).member?(index).should be true }
    end
  end

  describe '#min_max_ids_query' do
    it 'should get the min and max ids of the ids_column' do
      db = nil
      sample_size = :any
      sampler = CartoDB::Importer2::TableSampler.new db, 'table_name', 'ogc_fid', sample_size
      sampler.min_max_ids_query.should eq "SELECT min(ogc_fid), max(ogc_fid) FROM table_name"
    end
  end

  describe '#ids_count' do
    it 'should return 0 if there is no min_id nor max_id' do
      db = nil
      sample_size = :any
      sampler = CartoDB::Importer2::TableSampler.new db, 'table_name', 'ogc_fid', sample_size
      sampler.min_max_ids = {min: nil, max: nil}
      sampler.ids_count.should eq 0
    end
  end

end
