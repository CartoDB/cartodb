import sys
import brewery.ds as ds
import brewery.dq as dq
from chardet.universaldetector import UniversalDetector

filename = sys.argv[1]

detector = UniversalDetector()
for line in file(filename, 'rb'):
    detector.feed(line)
    if detector.done: break
detector.close()

src = ds.CSVDataSource(filename, read_header = True, encoding=detector.result["encoding"], detect_headers=True)
src.initialize()

out = ds.CSVDataTarget(sys.stdout)
out.fields = ds.fieldlist(src.field_names)
out.initialize()
for record in src.records():
    out.append(record)
src.finalize()
out.finalize()