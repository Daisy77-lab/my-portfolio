from pathlib import Path
import hashlib,json,shutil
root=Path.cwd();out=root/'_site';out.mkdir()
for p in root.iterdir():
    if p.name in {'.git','.github','.deployment','_site'}:continue
    target=out/p.name
    if p.is_dir():shutil.copytree(p,target)
    else:shutil.copy2(p,target)
for item in json.loads((root/'.deployment/asset-manifest.json').read_text()):
    data=b''.join((root/part).read_bytes() for part in item['parts'])
    assert hashlib.sha256(data).hexdigest()==item['sha256'],item['path']
    target=out/item['path'];target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
assert (out/'index.html').is_file()
print('Static site assembled; all chunked assets passed SHA-256 verification.')
