"""Offline browser QA of compiled app using about:blank and in-memory synthetic data.
This does not navigate external URLs or bypass managed browser network policies.
"""
import json,re
from pathlib import Path
from playwright.sync_api import sync_playwright

base=Path(__file__).resolve().parent.parent
out=base.parent/'browser_qa';out.mkdir(parents=True,exist_ok=True)
engine=(base/'dist/assets/engine.js').read_text()
main=(base/'dist/assets/main.js').read_text()
engine=re.sub(r'\bexport\s+(?=(?:class|const|function|async\s+function)\b)','',engine)
main=re.sub(r"^import\s+\{.+?\}\s+from\s+'./engine.js';\s*",'',main,flags=re.M)
code=engine+'\n'+main
html=f'<html><head><meta charset="UTF-8"><style>{(base/"dist/styles.css").read_text()}</style></head><body><div id="app"></div></body></html>'
raw={p.name:p.read_text() for p in (base/'dist/data').glob('*.json')}
for p in (base/'dist/protocols').glob('*.md'):raw[p.name]=p.read_text()
raw['site_config.json']=(base/'dist/site_config.json').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for label,width,height in [('desktop',1600,960),('mobile',390,844)]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate("""(raw)=>{
    Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{}}});
    window.fetch=async url=>{
      let file=String(url).split('/').pop();
      return raw[file] === undefined ? new Response('Not Found',{status:404}) : new Response(raw[file],{status:200});
    };
    // Memory-only location in about:blank cannot be replaced. Keep share state locally.
    history.replaceState=()=>{};
  }""",raw)
  page.add_script_tag(content=code)
  page.wait_for_selector('h1',timeout=3000)
  page.wait_for_timeout(300)
  print('\n',label,'errors:',errors)
  print('heading',page.locator('h1').inner_text())
  print('routes:',page.locator('#route-list').inner_text()[:200].replace('\n',' / '))
  print('body width',page.evaluate('document.body.scrollWidth'),'viewport',width)
  page.screenshot(path=str(out/f'{label}.png'),full_page=True,animations='disabled')
  if label=='desktop':
   page.locator('[data-ore="B"]').click()
   print('after ore B',page.locator('#current-ore').inner_text(),page.locator('#route-list').inner_text()[:160].replace('\n',' / '))
   page.locator('[data-ore="C"]').click()
   page.locator('#grade-slider').evaluate("el => {el.value = '1.40'; el.dispatchEvent(new Event('input',{bubbles:true}));}")
   print('slider changed',page.locator('#grade').input_value(),page.locator('#status-message').inner_text()[:100])
   page.locator('[data-loss="constant_residue"]').click()
   print('hypothesis',page.locator('#status-message').inner_text()[:130])
   page.locator('[data-protocol="SYN-P07"]').first.click()
   page.wait_for_selector('#source-modal.open',timeout=2000)
   print('protocol',page.locator('#modal-title').inner_text(),len(page.locator('#modal-body').inner_text()))
   page.locator('#modal-close').click()
   page.locator('#try-out-of-scope').click()
   print('scope',page.locator('#status-message').inner_text()[:180])
   page.locator('#language').click()
   print('language',page.locator('h1').inner_text())
   page.screenshot(path=str(out/'desktop-en.png'),full_page=False,animations='disabled')
  page.close()
 browser.close()
