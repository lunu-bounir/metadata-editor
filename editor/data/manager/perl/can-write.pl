use lib 'ExifTool';
use Image::ExifTool;

my $result = Image::ExifTool::CanWrite(@ARGV[0]);
print "$result\n";
