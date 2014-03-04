# encoding: utf-8

require_relative '../../lib/synchronizer/file-providers/gdrive'

include CartoDB::Synchronizer::FileProviders

describe GDrive do

  def get_config
    {
      application_name: '',
      client_id: '',
      client_secret: ''
    }
  end #get_config

  describe '#filters' do
    it 'test that filter options work correctly' do
      gdrive_provider = GDrive.get_new(get_config)

      # No filter = all formats allowed
      expected_formats = []
      GDrive::FORMATS_TO_MIME_TYPES.each do |id, mime_types|
        mime_types.each do |mime_type|
          expected_formats = expected_formats.push(mime_type)
        end
      end
      gdrive_provider.setup_formats_filter()
      gdrive_provider.formats.should eq expected_formats

      # Filter to 'documents'
      expected_formats = []
      format_ids = [ GDrive::FORMAT_CSV, GDrive::FORMAT_EXCEL ]
      GDrive::FORMATS_TO_MIME_TYPES.each do |id, mime_types|
        if format_ids.include?(id)
          mime_types.each do |mime_type|
            expected_formats = expected_formats.push(mime_type)
          end
        end

      end
      gdrive_provider.setup_formats_filter(format_ids)
      gdrive_provider.formats.should eq expected_formats
    end
  end #run

  describe '#manual_test' do
    it 'with user interaction, tests the full oauth flow' do
      pending('This test requires manual run, opening the url in a browser, grabbing the code and setting input to it')

      gdrive_provider = GDrive.get_new(get_config)

      gdrive_provider.setup_formats_filter()
      puts gdrive_provider.get_auth_url
      input = ''
      debugger
      gdrive_provider.validate_auth_code(input)
      data = gdrive_provider.get_files_list()
      puts data
    end
  end

end

