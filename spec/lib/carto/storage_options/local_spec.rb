require 'spec_helper_min'
require 'tempfile'
require 'helpers/subdomainless_helper'

describe Carto::StorageOptions::Local do
  # Just here to allow subdomainless helpers to work
  def host!(_) end

  shared_examples_for 'upload' do
    let(:prefix) { unique_name('prefix') }
    let(:storage) { described_class.new(prefix) }
    let(:file) { Tempfile.new('test') }
    let(:result) { storage.upload('123', file) }
    let(:path) { result[0] }
    let(:url) { result[1] }

    # rubocop:disable RSpec/BeforeAfterAll
    before(:all) do
      storage.stubs(:public_uploaded_assets_path).returns(upload_path)
      file.write('wadus')
      file.close
    end

    after(:all) do
      file.unlink
    end
    # rubocop:enable RSpec/BeforeAfterAll

    it 'uploads a file' do
      File.exist?(path).should be_true
      File.open(path).read.should eq 'wadus'
    end

    it 'deletes source file' do
      File.exist?(file.path).should be_false
    end

    it 'url starts with domain/uploads/' do
      url.should start_with "/uploads/#{prefix}/123/"
    end

    it 'url should not contain filesystem paths' do
      url.should_not include '/tmp'
      url.should_not include '/carto_uploads'
    end

    it 'target file should have 0644 perms for nginx to serve them' do
      (File.stat(path).mode & 0o777).should eq 0o644
    end
  end

  shared_examples_for 'upload paths' do
    describe 'with default path' do
      let(:upload_path) { 'public/uploads' }

      it_behaves_like 'upload'
    end

    describe 'with custom path' do
      let(:upload_path) { '/tmp/carto_uploads' }

      it_behaves_like 'upload'
    end
  end

  describe 'domainful' do
    before do
      stub_domainful('org')
    end

    it_behaves_like 'upload paths'
  end

  describe 'subdomainless' do
    before do
      stub_subdomainless
    end

    it_behaves_like 'upload paths'
  end
end
