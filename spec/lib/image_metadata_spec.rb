require_relative '../../lib/cartodb/image_metadata.rb'

describe CartoDB::ImageMetadata do
  let(:png_path) { File.expand_path('../../support/data/images/pattern.png', __FILE__) }
  let(:jpg_path) { File.expand_path('../../support/data/images/pattern.jpg', __FILE__) }
  let(:svg_path) { File.expand_path('../../support/data/images/pattern.svg', __FILE__) }
  let(:svg_no_xml_header_path) { File.expand_path('../../support/data/images/svg_without_xml_header', __FILE__) }

  describe '#extract_metadata' do
    let(:metadata) { CartoDB::ImageMetadata.new(png_path) }
    it 'should call parse_identify if magick is installed' do
      metadata.stubs(:has_magick?).returns(true)
      metadata.expects(:parse_identify).once
      metadata.expects(:parse_file).never
      metadata.extract_metadata
    end

    it 'should call parse_file if magick is not installed' do
      metadata.stubs(:has_magick?).returns(false)
      metadata.expects(:parse_file).once
      metadata.expects(:parse_identify).never
      metadata.extract_metadata
    end
  end

  describe '#parse_file' do
    it 'should extract png dimensions' do
      metadata = CartoDB::ImageMetadata.new(png_path)
      metadata.parse_file
      metadata.width.should eq 260
      metadata.height.should eq 260
    end

    it 'should not raise error when trying to extract jpg dimensions' do
      metadata = CartoDB::ImageMetadata.new(jpg_path)
      expect { metadata.parse_file }.to_not raise_error
      metadata.width.should eq 0
      metadata.height.should eq 0
    end

    it 'should not raise error when trying to extract svg dimensions' do
      metadata = CartoDB::ImageMetadata.new(svg_path)
      expect { metadata.parse_file }.to_not raise_error
      metadata.width.should eq 0
      metadata.height.should eq 0
    end
  end

  describe '#parse_identify' do
    it 'should extract png dimensions' do
      metadata = CartoDB::ImageMetadata.new(png_path)
      metadata.parse_identify
      metadata.width.should eq 260
      metadata.height.should eq 260
    end

    it 'should extract jpg dimensions' do
      metadata = CartoDB::ImageMetadata.new(jpg_path)
      metadata.parse_identify
      metadata.width.should eq 250
      metadata.height.should eq 250
    end

    it 'should extract svg dimensions' do
      metadata = CartoDB::ImageMetadata.new(svg_path)
      expect { metadata.parse_identify }.to_not raise_error
      metadata.width.should eq 645
      metadata.height.should eq 585
    end

    it 'should extract svg dimensions in files without XML header if forced as svg' do
      metadata = CartoDB::ImageMetadata.new(svg_no_xml_header_path, extension: '.svg')
      expect { metadata.parse_identify }.to_not raise_error
      metadata.width.should eq 11
      metadata.height.should eq 11
    end
  end
end
