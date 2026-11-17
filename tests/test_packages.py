import json
from pathlib import Path
import struct
import unittest
import zipfile

SOURCE=Path(__file__).resolve().parents[1]
OUT=SOURCE/'dist'

class PackageTests(unittest.TestCase):
    def test_each_package_is_loadable_and_has_only_temporary_access(self):
        for browser in ('chrome','edge','firefox'):
            with self.subTest(browser=browser):
                archive=OUT/f'float-pip-{browser}-1.0.0.zip'
                with zipfile.ZipFile(archive) as z:
                    self.assertIsNone(z.testzip())
                    manifest=json.loads(z.read('manifest.json'))
                    self.assertEqual(manifest['manifest_version'],3)
                    self.assertEqual(manifest['author'],'Govind Yadav')
                    self.assertEqual(manifest['homepage_url'],'https://qurkos.com/')
                    self.assertEqual(set(manifest['permissions']),{'activeTab','scripting'})
                    self.assertNotIn('host_permissions',manifest)
                    self.assertNotIn('content_scripts',manifest)
                    self.assertNotIn('background',manifest)
                    for file in [manifest['action']['default_popup'],*manifest['icons'].values(),
                                 'player.js','popup.js','style.css','help.html']:
                        self.assertIn(file,z.namelist())
                    self.assertEqual(manifest['commands']['_execute_action']['suggested_key']['default'],'Alt+Shift+P')
                    self.assertIn("script-src 'self'",manifest['content_security_policy']['extension_pages'])
                    self.assertLessEqual(len(manifest['description']),132)
                    if browser=='firefox':
                        gecko=manifest['browser_specific_settings']['gecko']
                        self.assertEqual(gecko['strict_min_version'],'140.0')
                        self.assertEqual(gecko['data_collection_permissions']['required'],['none'])
                        self.assertNotIn('minimum_chrome_version',manifest)
                    else:
                        self.assertNotIn('browser_specific_settings',manifest)
    def test_png_icon_dimensions(self):
        for size in (16,32,48,128):
            data=(SOURCE/'extension/icons'/f'icon{size}.png').read_bytes()
            self.assertEqual(data[:8],b'\x89PNG\r\n\x1a\n')
            self.assertEqual(struct.unpack('!II',data[16:24]),(size,size))
    def test_source_archive_contains_rebuild_and_submission_instructions(self):
        with zipfile.ZipFile(OUT/'float-pip-source-1.0.0.zip') as z:
            names=z.namelist()
            for name in ('tools/build.py','docs/PUBLISHING.md','docs/PRIVACY.md','docs/TESTING.md',
                         'docs/privacy-policy.html','tests/player.test.cjs','README.md'):
                self.assertIn('float-pip-source/'+name,names)
    def test_source_archive_excludes_local_and_generated_files(self):
        with zipfile.ZipFile(OUT/'float-pip-source-1.0.0.zip') as z:
            for name in z.namelist():
                self.assertFalse(set(Path(name).parts) & {'.git', 'dist', 'node_modules', '__pycache__', '.venv', 'venv'})
                self.assertNotEqual(Path(name).name, '.env')
    def test_store_asset_dimensions(self):
        for name,size in [('small-promo-440x280.png',(440,280)),('logo300.png',(300,300))]:
            data=(SOURCE/'store-assets'/name).read_bytes()
            self.assertEqual(struct.unpack('!II',data[16:24]),size)

if __name__=='__main__': unittest.main()
