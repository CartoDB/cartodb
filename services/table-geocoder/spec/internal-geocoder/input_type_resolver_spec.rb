require_relative '../../lib/internal-geocoder/input_type_resolver.rb'

class String
  # We just need this instead of adding the whole rails thing
  def present?
    self && !empty?
  end
end

describe CartoDB::InternalGeocoder::InputTypeResolver do

  before(:each) do
    @internal_geocoder = mock
    @input_type_resolver = CartoDB::InternalGeocoder::InputTypeResolver.new(@internal_geocoder)
  end

  describe '#type' do

    it 'should return an array characterizing the inputs for <namedplace, country_name, region_name, point>' do
      @internal_geocoder.stubs('kind').once.returns(:namedplace)
      @internal_geocoder.stubs('geometry_type').once.returns(:point)
      @internal_geocoder.stubs('country_column').once.returns(nil)
      @internal_geocoder.stubs('region_column').once.returns(nil)
      @internal_geocoder.stubs('regions').once.returns('region')

      @input_type_resolver.type.should == [:namedplace, :text, :text, :point]
    end

  end

  describe '#kind' do
    it 'should return the type of the internal geocoding: namedplace' do
      @internal_geocoder.stubs('kind').once.returns(:namedplace)
      @input_type_resolver.kind.should == :namedplace
    end
  end

  describe '#geometry_type' do
    it 'should return the type of the geometry to be geocoded: polygon' do
      @internal_geocoder.stubs('geometry_type').once.returns(:polygon)
      @input_type_resolver.geometry_type.should == :polygon
    end
  end

  describe '#country_input_type' do
    it 'should return column if a column was passed' do
      @internal_geocoder.stubs('country_column').once.returns('any_column_name')
      @input_type_resolver.country_input_type.should == :column
    end

    it 'should return column if no column was passed' do
      @internal_geocoder.stubs('country_column').once.returns(nil)
      @input_type_resolver.country_input_type.should == :text
    end
  end

  describe '#region_input_type' do
    it 'should return :column if a column is present' do
      @internal_geocoder.stubs('region_column').once.returns('wadus')
      @input_type_resolver.region_input_type.should == :column
    end

    it 'should return :text if regions are present' do
      @internal_geocoder.stubs('region_column').once.returns(nil)
      @internal_geocoder.stubs('regions').once.returns('minnesota')
      @input_type_resolver.region_input_type.should == :text
    end

    it 'should return nil if no column or text are present' do
      @internal_geocoder.stubs('region_column').once.returns(nil)
      @internal_geocoder.stubs('regions').once.returns('')
      @input_type_resolver.region_input_type.should == nil
    end
  end

end
