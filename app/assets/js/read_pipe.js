import { PLATFORM } from '@env';
import { decode } from '@sciter';

export async function* read_pipe(pipe) {
  const EOL = PLATFORM === 'Windows' ? '\r\n' : '\n';
  const buffer = [];
  while (pipe) {
    let bytes = '';
    try { bytes = await pipe.read() } catch (e) { return e }
    const chars = decode(bytes);
    for (const char of chars) {
      buffer.push(char);
      const tail = buffer.slice(-EOL.length).join('');
      if (tail === EOL) {
        const line = buffer.join('').replace(EOL, '');
        yield line;
        buffer.length = 0;
      }
    }
  }
}