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
      base_name = "#{prefix(printer)}#{Time.now.strftime('%Y-%m-%d-%H-%M-%S')}-#{url.slice(0, 50)}"
      printer.print(path: Dir.tmpdir, profile: base_name)

      # see https://github.com/ruby-prof/ruby-prof/blob/1.4.1/lib/ruby-prof/printers/call_tree_printer.rb#L115
      output_file = [base_name, "callgrind.out", $$].join(".")

      response.body = File.read(File.join(Dir.tmpdir, output_file))
      response.status = 200
      response.content_type = 'text/plain'
      response.headers['Content-Disposition'] = "attachment; filename=\"#{output_file}\""
    end

  end
end
