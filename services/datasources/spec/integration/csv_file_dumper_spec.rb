require 'spec_helper_min'
require_relative '../../lib/datasources'
require_relative '../doubles/json_to_csv_converter'

include CartoDB::Datasources

describe CSVFileDumper do

  before(:each) do
  end

  describe '#dumping data' do
    it 'tests streaming dump' do
      output_stream_name ='/tmp/csv_file_dumper_test.csv'

      File.unlink(output_stream_name) if File.exists?(output_stream_name)

      converter_mock = CartoDB::TwitterSearch::Doubles::JSONToCSVConverter.new

      dumper = CSVFileDumper.new(converter_mock, false)

      dumper.buffer_size=2

      input_filename_1 = 'stream_input_1'
      input_filename_2 = 'stream_input_2'
      input_data1 = File.read(File.join(File.dirname(__FILE__), "../fixtures/#{input_filename_1}"))
      input_data2 = File.read(File.join(File.dirname(__FILE__), "../fixtures/#{input_filename_2}"))

      names_list = [ input_filename_1, input_filename_2 ]

      stream = File.open(output_stream_name, 'wb')

      dumper.begin_dump(input_filename_1)
      dumper.dump(input_filename_1, [input_data1])
      dumper.end_dump(input_filename_1)
      dumper.begin_dump(input_filename_2)
      dumper.dump(input_filename_2, [input_data2])
      dumper.end_dump(input_filename_2)

      dumper.merge_dumps_into_stream(names_list, stream)

      stream.close

      data = File.read(output_stream_name)
      data.should eq "\n#{input_data1}\n#{input_data2}\n"
      File.unlink(output_stream_name)

    end
  end

end
