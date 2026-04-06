$root = "C:\Workspace\prj\jq\malti-notes"
$tag = '    <script src="./assets/js/site-header.js"></script>' + [Environment]::NewLine

Get-ChildItem $root -Filter *.html |
  Where-Object { $_.Name -ne "animals - Copy.html" } |
  ForEach-Object {
    $path = $_.FullName
    $content = Get-Content $path -Raw
    if ($content -notmatch 'site-header\.js') {
      $marker = "</body>"
      $index = $content.LastIndexOf($marker)
      if ($index -ge 0) {
        $updated = $content.Insert($index, $tag)
        [System.IO.File]::WriteAllText($path, $updated, [System.Text.UTF8Encoding]::new($false))
      }
    }
  }
