require 'ruby-prof'
require 'stringio'

require 'carto/configuration'

module CartoDB

  # A profiler based on https://github.com/justinweiss/request_profiler/
  class Profiler
    include Carto::Configuration

    def initialize(printer: nil, exclude: nil)
      @printer = printer || ::RubyProf::CallTreePrinter
      @exclusions = exclude
    end

    def call(request, response)
      mode = profile_mode(request)

      ::RubyProf.measure_mode = mode
      ::RubyProf.start
      begin
        yield
      ensure
        result = ::RubyProf.stop
        write_result(result, request, response)
      end
    end

    def profile_mode(request)
      mode_string = request.params["profile_request"]
      if mode_string
        if mode_string.downcase == "true" or mode_string == "1"
          ::RubyProf::PROCESS_TIME
        else
          ::RubyProf.const_get(mode_string.upcase)
        end
      end
    end

    def format(printer)
      case printer
      when ::RubyProf::FlatPrinter
        'txt'
      when ::RubyProf::FlatPrinterWithLineNumbers
        'txt'
      when ::RubyProf::GraphPrinter
        'txt'
      when ::RubyProf::GraphHtmlPrinter
        'html'
      when ::RubyProf::DotPrinter
        'dot'
      when ::RubyProf::CallTreePrinter
        "out.#{Process.pid}"
      when ::RubyProf::CallStackPrinter
        'html'
      else
        'txt'
      end
    end

    def prefix(printer)
      case printer
      when ::RubyProf::CallTreePrinter
        "callgrind."
      else
        ""
      end
    end

    def write_result(result, request, response)
      result.eliminate_methods!(@exclusions) if @exclusions
      printer = @printer.new(result)
      url = request.fullpath.gsub(/[?\/]/, '-')
      filename = "#{prefix(printer)}#{Time.now.strftime('%Y-%m-%d-%H-%M-%S')}-#{url.slice(0, 50)}.#{format(printer)}"

      in_mem_file = ""
      ::StringIO.open(in_mem_file, 'w+') do |f|
        printer.print(f)
      end

      response.body = in_mem_file
      response.status = 200
      response.content_type = 'text/plain'
      response.headers['Content-Disposition'] = "attachment; filename=\"#{filename}\""
    end

  end
end
