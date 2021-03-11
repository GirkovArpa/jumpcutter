import { $, $$, encode } from '@sciter';
import { fs, spawn } from '@sys';
import { read_pipe } from './read_pipe.js';

export { start, buildArgs };

async function start() {
  const args = buildArgs();

  let frameRate = args.frame_rate;
  const SAMPLE_RATE = args.sample_rate;
  const SILENT_THRESHOLD = args.silent_threshold;
  const FRAME_SPREADAGE = args.frame_margin;
  const NEW_SPEED = [args.silent_speed, args.sounded_speed];
  const INPUT_FILE = args.input_file;

  const URL = args.url;
  const FRAME_QUALITY = args.frame_quality;

  if (!args.input_file) {
    // the next line seems to cause serious problems while connected to inspector.exe
    Window.this.modal(<error>why u put no input file, that dum</error>);
    return;
  }

  const OUTPUT_FILE = args.output_file || inputToOutputFilename(INPUT_FILE);

  const TEMP_FOLDER = await fs.mkdtemp('TEMP_XXXXXX');
  const AUDIO_FADE_ENVELOPE_SIZE = 400; // smooth out transitiion's audio by quickly fading in/out (arbitrary magic number whatever)

  const args1 = ['-i', INPUT_FILE, '-qscale:v', FRAME_QUALITY, `${TEMP_FOLDER}/frame%06d.jpg`, '-hide_banner'];
  const args2 = ['-i', INPUT_FILE, '-ab', '160k', '-ac', '2', '-ar', SAMPLE_RATE, '-vn', `${TEMP_FOLDER}/audio.wav`];
  const args3 = ['-i', `${TEMP_FOLDER}/input.mp4`, '2>&1'];

  [args1, args2, args3].forEach((params) => {
    $('.preview').innerHTML += params.join(' ') + '<br>';
  });

  const process1 = await ffmpeg(args1);
  await handleProcess(process1);

  const process2 = await ffmpeg(args2);
  await handleProcess(process2);

  const process3 = await ffmpeg(args3);
  const { stdout, stderr } = await handleProcess(process3);

  const {
    sample_rate,
    sample_count,
    max_volume
  } = await new Promise((resolve) => {
    Window.this.xcall('get_wav_metadata', `${TEMP_FOLDER}/audio.wav`, resolve);
  });

  console.log(JSON.stringify({ sample_rate, sample_count, max_volume }));
  
}

function buildArgs() {
  const argNames = [
    'input_file',
    'url',
    'output_file',
    'silent_threshold',
    'sounded_speed',
    'silent_speed',
    'frame_margin',
    'sample_rate',
    'frame_rate',
    'frame_quality'
  ];
  const args = argNames.reduce((args, argName) => {
    const id = argName.replace('_', '-');
    const textbox = $(`#${id}`);
    const { value } = textbox;
    args[argName] = value;
    return args;
  }, {});
  return args;
}

function inputToOutputFilename(filename) {
  const [name, ext] = filename.split('.');
  return `${name}_ALTERED.${ext}`;
}

async function deletePath(s) {
  await fs.rmdir(s);
}

function ffmpeg(args) {
  return spawn(['ffmpeg', ...args], { stdout: 'pipe', stderr: 'pipe' });
}

async function handleProcess(process) {
  const stdout = [];
  const stderr = [];

  for await (const line of read_pipe(process.stdout)) {
    stdout.push(line);
    console.log('[STDOUT]', line);
    $('textarea').innerHTML += `${line}<br>`;
  }

  for await (const line of read_pipe(process.stderr)) {
    stderr.push(line);
    console.log('[STDERR]', line);
    $('textarea').innerHTML += `<stderr>${line}</stderr><br>`;
  }

  return { stdout, stderr };
}
