#!/usr/bin/env python3
"""Dependency-free, deterministic packaging. Run from any directory."""
import binascii
import hashlib
import json
from pathlib import Path
import shutil
import struct
import zipfile
import zlib

SOURCE = Path(__file__).resolve().parents[1]
OUT = SOURCE / 'dist'
EXTENSION = SOURCE / 'extension'


def png_icon(size):
    """Original vector-like window mark, sampled at 4x and saved as RGBA PNG."""
    def rounded(x, y, left, top, right, bottom, radius):
        if not (left <= x <= right and top <= y <= bottom):
            return False
        cx = min(max(x, left + radius), right - radius)
        cy = min(max(y, top + radius), bottom - radius)
        return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2
    def pixel(x, y):
        if not rounded(x,y,2,2,126,126,28): return (0,0,0,0)
        color=(40,84,68,255)
        if rounded(x,y,23,28,105,90,9): color=(184,232,199,255)
        if rounded(x,y,29,34,99,84,4): color=(40,84,68,255)
        if rounded(x,y,61,64,112,103,7): color=(247,250,247,255)
        if rounded(x,y,67,70,106,97,3): color=(93,172,127,255)
        return color
    raw=bytearray()
    for row in range(size):
        raw.append(0)
        for col in range(size):
            colors=[pixel((col+(sx+.5)/4)*128/size,(row+(sy+.5)/4)*128/size)
                    for sy in range(4) for sx in range(4)]
            raw.extend(round(sum(c[channel] for c in colors)/16) for channel in range(4))
    def chunk(kind, data):
        return struct.pack('!I',len(data))+kind+data+struct.pack('!I',binascii.crc32(kind+data)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',size,size,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(bytes(raw),9))+chunk(b'IEND',b'')


def manifest(browser):
    data={
        'manifest_version':3,
        'name':'Float PiP',
        'author':'Govind Yadav',
        'homepage_url':'https://qurkos.com/',
        'version':'1.0.0',
        'description':'Open accessible videos in picture-in-picture with temporary tab access. Includes guidance for Firefox’s built-in PiP.',
        'permissions':['activeTab','scripting'],
        'icons':{str(s):f'icons/icon{s}.png' for s in (16,32,48,128)},
        'action':{'default_title':'Float PiP','default_popup':'popup.html',
                  'default_icon':{str(s):f'icons/icon{s}.png' for s in (16,32,48)}},
        'commands':{'_execute_action':{'suggested_key':{'default':'Alt+Shift+P'},
                                       'description':'Open Float PiP controls'}},
        'content_security_policy':{'extension_pages':"script-src 'self'; object-src 'none'"}
    }
    if browser=='firefox':
        data['browser_specific_settings']={'gecko':{
            'id':'{2ad48bcc-3324-46fa-95c7-0fce9ef5fa5a}',
            'strict_min_version':'140.0',
            'data_collection_permissions':{'required':['none']}}}
    else:
        data['minimum_chrome_version']='102'
    return data


def archive(directory, destination, prefix=''):
    with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as output:
        for file in sorted(directory.rglob('*')):
            if not file.is_file() or any(part in {'.git', 'dist', 'node_modules', '__pycache__', '.venv', 'venv'} for part in file.relative_to(directory).parts) or file.name in {'.DS_Store', '.env'}: continue
            entry=zipfile.ZipInfo(prefix+file.relative_to(directory).as_posix(),date_time=(1980,1,1,0,0,0))
            entry.compress_type=zipfile.ZIP_DEFLATED
            entry.external_attr=0o100644 << 16
            output.writestr(entry,file.read_bytes())


def build():
    OUT.mkdir(exist_ok=True)
    (EXTENSION/'icons').mkdir(exist_ok=True)
    for size in (16,32,48,128):
        (EXTENSION/'icons'/f'icon{size}.png').write_bytes(png_icon(size))
    (SOURCE/'store-assets').mkdir(exist_ok=True)
    (SOURCE/'store-assets/logo300.png').write_bytes(png_icon(300))
    # Default source manifest is loadable as an unpacked Chrome/Edge extension.
    (EXTENSION/'manifest.json').write_text(json.dumps(manifest('chrome'),indent=2)+'\n')
    (OUT/'packages').mkdir(exist_ok=True)
    for browser in ('chrome','edge','firefox'):
        destination=OUT/'packages'/browser
        if destination.exists(): shutil.rmtree(destination)
        shutil.copytree(EXTENSION,destination)
        (destination/'manifest.json').write_text(json.dumps(manifest(browser),indent=2)+'\n')
        archive(destination,OUT/f'float-pip-{browser}-1.0.0.zip')
    archive(SOURCE,OUT/'float-pip-source-1.0.0.zip',prefix='float-pip-source/')
    zips=sorted(OUT.glob('float-pip-*-1.0.0.zip'))
    (OUT/'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in zips))
    for file in zips: print(f'{file.name}: {file.stat().st_size:,} bytes')


if __name__=='__main__': build()
