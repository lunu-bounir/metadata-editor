use lib 'ExifTool';
use Image::ExifTool;

my $sep = "|||";
my $tool = new Image::ExifTool;
my $test = new Image::ExifTool;

my $info = $tool->ImageInfo('input');
my @tags = $tool->GetTagList($info);

foreach my $tag (@tags) {
  print "tag: $tag$sep";

  my $value = $tool->GetValue($tag);
  if (ref $value eq 'ARRAY') {
      print join(',', @value) . "$sep";
  } elsif (ref $value eq 'SCALAR') {
      print "(binary data)$sep";
  } else {
      print "$value$sep";
  }

  my @groups = $tool->GetGroup($tag);
  print join(', ', @groups) . "$sep";

   my ($success, $error) = $test->SetNewValue($tag);
   print $success ? "1$sep" : "0$sep"
}
