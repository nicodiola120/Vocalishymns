/**
 * Google Apps Script – Drive File Embedder for Google Sites
 *
 * HOW TO USE:
 * 1. Open https://script.google.com and create a new project
 * 2. Paste this entire file
 * 3. Replace YOUR_FOLDER_ID with your Google Drive folder ID
 * 4. Add/remove file names in the EXPECTED_NAMES array
 * 5. Deploy → New deployment → Web app → Execute as "Me", Access "Anyone"
 * 6. Copy the web app URL and embed it in Google Sites via Insert → Embed → URL
 */

var FOLDER_ID = 'YOUR_FOLDER_ID_HERE';

var EXPECTED_NAMES = ['soprano', 'alto', 'tenor', 'bass', 'lead sheet', 'chords'];

function doGet() {
  var html = HtmlService.createHtmlOutputFromString(generatePage())
    .setTitle('Drive Files')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return html;
}

function generatePage() {
  var folder;
  try {
    folder = DriveApp.getFolderById(FOLDER_ID);
  } catch (e) {
    return '<p style="color:red;">Error: Folder not found or inaccessible.</p>';
  }

  var allFiles = folder.getFiles();
  var fileMap = {};

  while (allFiles.hasNext()) {
    var f = allFiles.next();
    var name = f.getName().toLowerCase();
    if (!fileMap[name]) fileMap[name] = [];
    fileMap[name].push({
      name: f.getName(),
      id: f.getId(),
      mime: f.getMimeType(),
    });
  }

  var rows = '';
  EXPECTED_NAMES.forEach(function (label) {
    var key = label.toLowerCase();
    var match = fileMap[key];
    if (match && match.length > 0) {
      var links = match.map(function (file) {
        var embedUrl = 'https://drive.google.com/file/d/' + file.id + '/preview';
        var isAudio = file.mime.indexOf('audio') !== -1;
        var isVideo = file.mime.indexOf('video') !== -1;
        var isPdf = file.mime === 'application/pdf';

        if (isAudio) {
          return '<audio controls style="width:100%;">' +
            '<source src="https://drive.google.com/uc?export=download&id=' + file.id + '" type="' + file.mime + '">' +
            '</audio>' +
            '<br><a href="' + embedUrl + '" target="_blank">' + file.name + '</a>';
        } else if (isVideo || isPdf) {
          return '<iframe src="' + embedUrl + '" width="100%" height="300" allowfullscreen></iframe>' +
            '<br><a href="' + embedUrl + '" target="_blank">' + file.name + '</a>';
        } else {
          return '<a href="' + embedUrl + '" target="_blank">' + file.name + '</a>';
        }
      }).join('');
      rows += '<div class="file-entry">' +
        '<h3 class="file-label">' + escHtml(label) + '</h3>' +
        '<div class="file-content">' + links + '</div>' +
        '</div>';
    }
  });

  if (!rows) {
    rows = '<p>No matching files found in the folder.</p>';
  }

  return '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<style>' +
    'body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:16px;background:transparent}' +
    '.file-entry{border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin-bottom:12px;background:#fff}' +
    '.file-label{margin:0 0 8px;color:#1a73e8;text-transform:capitalize;font-size:1.1em}' +
    '.file-content a{color:#1a73e8;text-decoration:none;font-size:0.95em}' +
    '.file-content a:hover{text-decoration:underline}' +
    'audio,iframe{display:block;margin-bottom:6px;border-radius:4px}' +
    '</style>' +
    '</head>' +
    '<body>' +
    rows +
    '</body>' +
    '</html>';
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
