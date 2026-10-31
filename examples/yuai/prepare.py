"""Restore the saved example in a new directory using bundled characters and user audio."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destination', type=Path)
    parser.add_argument('--audio', required=True, type=Path, help='Original MP4 or matching audio')
    args = parser.parse_args()
    here = Path(__file__).resolve().parent
    root = here.parent.parent
    destination = args.destination.resolve()
    audio = args.audio.resolve()
    if destination.exists():
        parser.error('Destination already exists; choose a new directory to protect your edits.')
    if not audio.is_file():
        parser.error('Audio file does not exist.')
    for command in ('ffmpeg', 'ffprobe'):
        if not shutil.which(command):
            parser.error(f'{command} is required on PATH.')
    meta = json.loads((here / 'manifest.json').read_text(encoding='utf-8'))
    for character in meta['cast']:
        frames = root / 'characters' / character / 'frames'
        if not frames.is_dir() or not any(frames.rglob('*.png')):
            parser.error(f'Missing character frames: {frames}')
    probe = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type',
        '-of', 'json', str(audio)], text=True))
    duration = meta['duration_frames'] / meta['fps']
    if not any(s.get('codec_type') == 'audio' for s in probe.get('streams', [])):
        parser.error('Input contains no audio stream.')
    if float(probe['format']['duration']) + 1 / meta['fps'] < duration:
        parser.error(f'Input is shorter than the example ({duration:.3f} seconds).')
    if hashlib.sha256(audio.read_bytes()).hexdigest() != meta['source_media_sha256']:
        print('Note: input differs from the original MP4. Lyrics and beats require the same audio edit.')
    shutil.copytree(here / 'project', destination)
    for notice in ('LICENSE', 'LICENSE.zh-CN.md', 'THIRD_PARTY_NOTICES.md'):
        shutil.copy2(root / notice, destination / notice)
    shutil.copytree(root / 'LICENSES', destination / 'LICENSES', dirs_exist_ok=True)
    for character in meta['cast']:
        shutil.copytree(root / 'characters' / character / 'frames',
                        destination / 'assets' / character / 'frames')
    subprocess.run(['ffmpeg', '-v', 'error', '-n', '-i', str(audio), '-vn',
                    '-t', str(duration), '-ar', '44100', '-ac', '2',
                    str(destination / 'data' / 'song.wav')], check=True)
    print(f'Prepared: {destination}')
    print('Run inside that directory: python tools/run.py doctor')
    print('Then: python tools/run.py still 14 20 27')
    print('Full render: python tools/run.py video')


if __name__ == '__main__':
    main()
