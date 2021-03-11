import { $, $$, encode } from '@sciter';
import { start, buildArgs } from './jumpcutter.js';

adjustWindow();
$('#browse').addEventListener('click', openFile);
$('#save-as').addEventListener('click', saveFile);
$('#start').addEventListener('click', start);
document.on('input', 'input', updatePreview);

function adjustWindow() {
  const [_, w] = document.state.contentWidths();
  const h = $('.container').state.contentHeight(w) + 10;
  const [sw, sh] = Window.this.screenBox('frame', 'dimension');
  Window.this.move((sw - w) / 2, (sh - h) / 2, w, h, true);
}

function openFile() {
  const filter = 'All Files (*.*)|*.*';
  const filename = Window.this.selectFile('open', filter);
  if (filename === null) return;
  $('#input-file').value = filename.replace('file://', '');
}

function saveFile() {
  const filename = Window.this.selectFile('save');
  if (filename === null) return;
  $('#output-file').value = filename.replace('file://', '');
}

function updatePreview() {
  const args = buildArgs();
  console.log(JSON.stringify(args));
}