# Including specs must define `:asset_class`
shared_examples_for 'Asset models' do
  describe '#validate' do
    it 'validates user_id' do
      asset = asset_class.new
      asset.valid?.should be_false
      asset.errors.full_messages.to_s.should =~ /(user_id|User) can't be blank/
    end

    it 'validates file existence' do
      asset = asset_class.new user_id: @user.id, asset_file: (Rails.root + 'db/fake_data/i_dont_exist.png').to_s
      asset.valid?.should be_false
      asset.errors.full_messages.map(&:downcase).should include("file is invalid")
    end

    it 'validates file correct extension' do
      asset = asset_class.new user_id: @user.id, asset_file: (Rails.root + 'db/fake_data/i_dont_exist.json').to_s
      asset.valid?.should be_false
      asset.errors.full_messages.map(&:downcase).should include("file has invalid format")
    end

    it 'validates file correct metadata' do
      asset = asset_class.new user_id: @user.id, asset_file: (Rails.root + 'spec/support/data/fake_png.png').to_s
      asset.valid?.should be_false
      asset.errors.full_messages.map(&:downcase).should include("file doesn't appear to be an image")
    end

    it 'validates SVG files without XML header or extension as long as original_filename has' do
      asset_file = OpenStruct.new(
        original_filename: 'svg_without_xml_declaration.svg',
        path: Rails.root + 'spec/support/data/images/svg_without_xml_declaration',
        size: 1556
      )
      asset = asset_class.new user_id: @user.id, asset_file: asset_file
      asset.valid?.should be_true
      asset.errors.full_messages.map(&:downcase).should_not include("file doesn't appear to be an image")
    end

    it 'validates file size' do
      asset = asset_class.new user_id: @user.id, asset_file: (Rails.root + 'spec/support/data/images/pattern.jpg').to_s

      asset.stubs(:max_size).returns(10)

      asset.valid?.should be_false
      asset.errors.full_messages.map(&:downcase).should include("file is too big, 0.0mb max")
    end

    it 'validates file dimensions' do
      asset = asset_class.new user_id: @user.id, asset_file: (Rails.root + 'spec/support/data/images/1025x1.jpg').to_s
      asset.valid?.should be_false
      asset.errors.full_messages.map(&:downcase).should include("file is too big, 1024x1024 max")
    end

    it 'validates urls' do
      asset = asset_class.new user_id: @user.id, url: "http://foo"
      asset.valid?.should be_false
      asset.errors.full_messages.map(&:downcase).should include("url is invalid")
    end
  end
end