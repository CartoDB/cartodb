
import sys
import os.path

if (len(sys.argv) != 3):
    print "rails2grunt rails_file grunt.json"
    sys.exit()

rails_file = sys.argv[1];
rails_path = os.path.abspath(rails_file)
name = os.path.basename(rails_file).split('.')[0]

def normalize(f):
    return f \
        .replace('../../../lib/assets/javascripts/', 'javascripts/') \
        .replace('../../../vendor/assets/javascripts/', 'javascripts/vendor/')

lines = []
for x in open(rails_file):
    tk = x.split(' ')
    if tk[0] == '//=':
        f = tk[2][:-1]
        if tk[1] == 'require':
            if '/' not in f:
                lines.append("'vendor/assets/javascripts/" + f + ".js',")
            else:
                lines.append("'%s'," % (normalize(f) + ".js"))
        elif tk[1] == 'require_tree':
            lines.append("'%s'," % (normalize(f) + "/**/*.js"))

print "%s: [\n%s\n]" % (name, '\n'.join(lines)[:-1])


