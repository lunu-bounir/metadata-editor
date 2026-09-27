use lib 'ExifTool';
use Image::ExifTool;

my $tool = new Image::ExifTool;

foreach my $tag (@ARGV) {
  $success = $tool->SetNewValue($tag);
}

my $result = $tool->WriteInfo('input', 'output');

print $result = 1 ? "[done]\n" : "[error]\n";
my $e = $tool->GetValue('Error');
my $w = $tool->GetValue('Warning');
print "$e\n$w\n";
