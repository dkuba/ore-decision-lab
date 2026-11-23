import {evaluate,inspectRun,parseNumber,sha256,round,InputValidationError,type FixtureData,type EvaluationInput,type Evaluation,type OreId,type RouteId,type LossModel,type RouteEvaluation,type TestPlan} from './engine.js';

/** No API, telemetry, accounts, or hidden ground truth; all state is local to browser. */
type Lang='ru'|'en';
type Audience='executive'|'engineer';
interface UIState extends EvaluationInput {lang:Lang;audience:Audience;selectedRoute:RouteId;}
const ORES:OreId[]=['A','B','C','D'];
const ORE_DESCS:Record<OreId,{ru:[string,string];en:[string,string]}>= {
  A:{ru:['Доступное золото','Контроль прямого CIL'],en:['Accessible gold','Direct CIL reference']},
  B:{ru:['Сульфидная ассоциация','Флотация и вскрытие'],en:['Sulphide-bound gold','Flotation & pre-oxidation']},
  C:{ru:['Окисленная бедная руда','Heap / CIL и неопределённость'],en:['Oxidized low-grade ore','Heap / CIL uncertainty']},
  D:{ru:['Крупное свободное Au','Гравитация и повторность'],en:['Coarse liberated gold','Gravity & repeatability']},
};
const ROUTE_SHORT:Record<RouteId,{ru:string;en:string}>={
  DIRECT_CIL:{ru:'Прямой CIL',en:'Direct CIL'},CIP:{ru:'Прямой CIP',en:'Direct CIP'},
  GRAVITY_TAILS_CIL:{ru:'Гравитация + CIL хвостов',en:'Gravity + tails CIL'},
  FLOT_POX_CIL:{ru:'Флотация → POX → CIL',en:'Flotation → POX → CIL'},
  FLOT_BIOX_CIL:{ru:'Флотация → BIOX → CIL',en:'Flotation → BIOX → CIL'},
  HEAP_ADR:{ru:'Кучное выщелачивание',en:'Heap leach → ADR'}
};
const UI={
 ru:{lab:'ИНТЕРАКТИВНАЯ ИНЖЕНЕРНАЯ ЛАБОРАТОРИЯ',title:'Когда данные меняют технологию',intro:'Исследуйте четыре синтетических руды. Изменяйте входные условия, сравнивайте технологические гипотезы и проверяйте, какие испытания действительно обосновывают расчёт.',notice:'Демонстратор на полностью синтетических данных. Источники подтверждают методологию, но не реальные извлечения или экономику.',
 scenarios:'Исходные данные',selectOre:'ВЫБЕРИТЕ РУДУ',properties:'Характеристики руды',settings:'УСЛОВИЯ ЭКСПЕРИМЕНТА',grade:'Содержание Au',gradeScope:'Область лабораторных точек: 0,60–1,60 г/т',lossModel:'Модель поведения хвостов',constantRecovery:'Постоянное извлечение',constantResidue:'Постоянные хвосты',switches:'ДОКАЗАТЕЛЬНАЯ БАЗА',mineralogy:'Минералогия доступна',mineralogySmall:'Правила используют формы нахождения Au',testwork:'Испытания доступны',testworkSmall:'Извлечение по измеренным продуктам',heap:'Площадка допускает кучу',heapSmall:'Условный проектный флаг, не Ksat',scope:'Демонстрационный диапазон',
 workspace:'Расчётное пространство',workspaceSub:'Методика → испытания → решение',exectab:'Руководителю',engtab:'Технологу',share:'Скопировать ссылку',live:'Вычислено в браузере',routeAlt:'Технологические альтернативы',routeSub:'Отбор исследований и условное сравнение',recovery:'Извлечение',netback:'Показатель',source:'Источник',status:'Статус',process:'Маршрут',
 chartTitle:'Чувствительность экономического сравнения',chartSub:'Руда C · условные USD на тонну питания',hypoWarning:'Гипотеза постоянных хвостов не согласуется с крайними лабораторными точками. Условного лидера нельзя считать подтверждённым.',
 evidenceTitle:'Почему такой результат?',testPlan:'Программа испытаний',testPlanSub:'Статус по фактически имеющимся опытам',ruleTitle:'Инженерные гипотезы',ruleSub:'Правила предлагают исследования, но не предсказывают извлечение',
 dataTitle:'Исходные характеристики',freeAu:'Свободное Au',sulphideAu:'В сульфидах',otherAu:'Прочее',missing:'Не определено',selected:'Выбранный маршрут',why:'ОСНОВАНИЕ И РАСЧЁТ',traces:'Протоколы и формулы',scopeWarning:'Вне области наблюдений: подтверждённое сравнение недоступно.',
 footer1:'Почему это не готовая фабрика',footer2:'База знаний',footer3:'Следующий шаг — реальное месторождение',footer1text:'Процессы предлагаются как направления исследования. Извлечения получены из искусственных опытов; стоимость условная. Не используется для промышленного проектирования.',footer2text:'Каждое правило связано с литературным механизмом. Открытые публикации не квалифицируют искусственные лабораторные коэффициенты.',footer3text:'Для промышленного пилота понадобятся данные рудных доменов, протоколы испытаний и участие ответственных специалистов. Публичная демонстрация не заменяет их работу.',
 seeSources:'Открыть публикации',seeData:'Лабораторные протоколы',repo:'Репозиторий',contact:'Обсудить пилот',contactMissing:'Контакт оператора будет указан перед публичной публикацией',inputError:'Проверьте введённое значение', gradeOutside:'Посмотреть вне диапазона',reset:'Сбросить',
 hypothesis:'Гипотеза, не квалифицирована',supported:'Синтетические испытания',whyNot:'Причины ограничения',notApproved:'Не является инженерным утверждением',observed:'Измерено синтетически',assumed:'Условный параметр',modelStatus:'Область применимости',testsAvailable:'Пригодных опытов',rulesCount:'Сигналов правил',alternatives:'Маршрутов посчитано',openProtocol:'Открыть протокол',close:'Закрыть',indifference:'Близкие результаты',noWinner:'Нет подтверждённого выбора',explainer:'Что происходит',strength:'Формула воспроизводима, но вывод зависит от качества доказательств.',noGrades:'Для A, B, D содержание фиксировано: свободный what-if показан на C.',dataLink:'Методика и данные',send:'Скопировать описание пилота',copyDone:'Ссылка скопирована',verify:'Как проверено',verification:'Контрольные тесты',downloadNot:'Отчёт о публикации',notConfigured:'Контактная форма пока не настроена: отправка данных отсутствует.'},
 en:{lab:'INTERACTIVE ENGINEERING LABORATORY',title:'When evidence changes the process',intro:'Explore four synthetic gold ores. Change assumptions, compare possible process routes and inspect the tests required to support a calculation.',notice:'Fully synthetic demonstration. Literature supports methods, not fabricated recoveries or actual project economics.',
 scenarios:'Input data',selectOre:'SELECT AN ORE',properties:'Ore characteristics',settings:'EXPERIMENT CONTROLS',grade:'Gold grade',gradeScope:'Lab observations: 0.60–1.60 g/t',lossModel:'Tailings loss model',constantRecovery:'Constant recovery',constantResidue:'Constant residue grade',switches:'EVIDENCE AVAILABILITY',mineralogy:'Mineralogy available',mineralogySmall:'Rules use gold deportment',testwork:'Testwork available',testworkSmall:'Recovery from measured products',heap:'Site allows heap leach',heapSmall:'Synthetic site flag, not loaded Ksat',scope:'Demonstration scope',
 workspace:'Decision workspace',workspaceSub:'Mechanism → testwork → evidence',exectab:'Executive',engtab:'Engineer',share:'Share this scenario',live:'Computed locally',routeAlt:'Process alternatives',routeSub:'Investigation triage and illustrative comparison',recovery:'Recovery',netback:'Screening',source:'Source',status:'Status',process:'Process',
 chartTitle:'Economic sensitivity',chartSub:'Ore C · illustrative USD per tonne of feed',hypoWarning:'The constant-residue hypothesis conflicts with measured synthetic endpoint samples. It cannot yield a qualified winner.',
 evidenceTitle:'Why this outcome?',testPlan:'Testwork programme',testPlanSub:'Resolved against available lab experiments',ruleTitle:'Investigation hypotheses',ruleSub:'Rules suggest tests, not a recovery prediction',
 dataTitle:'Ore properties',freeAu:'Free Au',sulphideAu:'Sulphide-hosted',otherAu:'Other',missing:'Unknown',selected:'Selected route',why:'EVIDENCE AND CALCULATION',traces:'Protocol and formula trace',scopeWarning:'Outside tested range: no supported comparison.',footer1:'What this is not',footer2:'Scientific basis',footer3:'Next step: real ore',footer1text:'Routes are research candidates. Recoveries come from fabricated testwork; costs are assumptions. Not for industrial process design.',footer2text:'Every rule maps to a literature mechanism. Publications do not validate synthetic testwork coefficients.',footer3text:'A real pilot needs ore-domain data, representative testwork, and qualified specialists. This demo is not a substitute.',
 seeSources:'View references',seeData:'Open lab protocols',repo:'Repository',contact:'Discuss a pilot',contactMissing:'Operator contact must be supplied before publication',inputError:'Check the number',gradeOutside:'Try outside range',reset:'Reset',hypothesis:'Unqualified hypothesis',supported:'Synthetic lab evidence',whyNot:'Why not',notApproved:'Not an engineering approval',observed:'Fabricated observation',assumed:'Illustrative input',modelStatus:'Applicability scope',testsAvailable:'Usable lab tests',rulesCount:'Triggered rules',alternatives:'Calculated routes',openProtocol:'View protocol',close:'Close',indifference:'Near-equal scenarios',noWinner:'No supported winner',explainer:'How to read this',strength:'The formula is reproducible; the decision depends on evidence quality.',noGrades:'Grades for A, B, D are fixed; grade what-if applies to C.',dataLink:'Methods & data',send:'Copy pilot enquiry brief',copyDone:'Scenario URL copied',verify:'How it is verified',verification:'Control tests',downloadNot:'Publication status',notConfigured:'No contact form configured; no information is transmitted.'}
} as const;
const ROUTE_BADGE:Record<string,{ru:string;en:string;className:string}>={
 synthetic_supported:{ru:'Рассчитано',en:'Calculated',className:'teal'},
 requires_testwork:{ru:'Нужен опыт',en:'Missing test',className:'amber'},
 not_indicated:{ru:'Не показано',en:'Not indicated',className:''},
 blocked_constraint:{ru:'Ограничение',en:'Constraint',className:'red'},
 out_of_scope:{ru:'Вне scope',en:'Out of scope',className:'red'}
};
const TEST_BADGE:Record<string,{ru:string;en:string;className:string}>={
 available:{ru:'Есть опыт',en:'Available',className:'teal'},needed:{ru:'Нужен опыт',en:'Required',className:'amber'},not_indicated:{ru:'Нет сигнала',en:'No signal',className:''},blocked_constraint:{ru:'Ограничение',en:'Constraint',className:'red'}
};
const RULE_NAMES:Record<string,{ru:string;en:string}>={
 'R-GRAVITY-SIZE-EVIDENCE':{ru:'Крупное свободное золото',en:'Coarse liberated gold'},
 'R-REFRACTORY-SULPHIDE-EVIDENCE':{ru:'Сульфидная ассоциация золота',en:'Gold locked in sulphides'},
 'R-DIRECT-LEACH-CONTROL':{ru:'Контроль прямого выщелачивания',en:'Direct leach control'},
 'R-HEAP-COLUMN-SCREEN':{ru:'Кучное выщелачивание: исследование',en:'Heap leach investigation'}
};
const STAGE_NAMES:Record<string,{ru:string;en:string}>={
 gravity_split:{ru:'Гравитация: распределение Au',en:'Gravity Au split'},gravity_concentrate_final:{ru:'Доводка гравиконцентрата',en:'Gravity concentrate finishing'},gravity_tail_cil_final:{ru:'CIL хвостов гравитации',en:'CIL of gravity tailings'},size_resolved_grg:{ru:'Поклассовый GRG и независимые повторы',en:'Size-resolved GRG and replicates'},flotation_split:{ru:'Флотация: концентрат и хвосты',en:'Flotation split'},concentrate_direct_cil_control:{ru:'Контроль CIL неокисленного концентрата',en:'CIL control on unoxidized concentrate'},sulfide_s_oxidation_balance:{ru:'Баланс сульфидной серы до/после окисления',en:'Sulphide S balance before/after oxidation'},pox_concentrate_final:{ru:'POX + CIL концентрата',en:'POX + concentrate CIL'},biox_concentrate_final:{ru:'BIOX + CIL концентрата',en:'BIOX + concentrate CIL'},cil_final:{ru:'Прямой CIL: продукты и кинетика',en:'Direct CIL: products & kinetics'},duplicate_leach_repeatability:{ru:'Повторные опыты выщелачивания',en:'Leach repeatability'},heap_adr_final:{ru:'Колонный опыт и ADR',en:'Column + ADR'},scoping_infiltration:{ru:'Предварительная инфильтрация',en:'Scoping infiltration'},loaded_ksat:{ru:'Ksat под проектной нагрузкой',en:'Loaded Ksat'},agglomeration_stability:{ru:'Стабильность агломератов',en:'Agglomeration stability'}
};
function nameOfRoute(id:RouteId,lang:Lang){return ROUTE_SHORT[id][lang];}
function nameOfRule(id:string,lang:Lang){return RULE_NAMES[id]?.[lang]??id;}
function nameOfTest(test:TestPlan,lang:Lang){return test.test_id?(STAGE_NAMES[test.test_id]?.[lang]??test.investigation):(lang==='ru'?'Маршрут не показан данными':'No evidence to indicate this route');}
function esc(raw:unknown):string{return String(raw??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]??ch));}
function fmt(value:number|null|undefined,decimals=2,lang:Lang='ru'){
 if(value===null||value===undefined||!Number.isFinite(value))return '—';
 return new Intl.NumberFormat(lang==='ru'?'ru-RU':'en-US',{minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(value);
}
function icon(name:string,size=17){
 const paths:Record<string,string>={
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
 check:'<path d="M20 6 9 17l-5-5"/>',link:'<path d="M10 13a5 5 0 0 0 7 .5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
 copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
 external:'<path d="M13 5h6v6M19 5l-9 9"/><path d="M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6"/>',
 file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
 arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
 chart:'<path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 5-8"/>',
 flask:'<path d="M9 3h6M10 3v7l-5.5 8.3A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.7L14 10V3M8 15h8"/>',
 shield:'<path d="m12 22 7-4V6l-7-4-7 4v12z"/><path d="m9 12 2 2 4-4"/>',
 git:'<circle cx="6" cy="3" r="2"/><circle cx="6" cy="21" r="2"/><circle cx="18" cy="6" r="2"/><path d="M6 5v14M18 8a6 6 0 0 1-6 6H6"/>',
 alert:'<path d="M10.3 3.8 2.2 18.1A2 2 0 0 0 4 21h16a2 2 0 0 0 1.8-2.9L13.7 3.8a2 2 0 0 0-3.4 0zM12 9v4m0 4h.01"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 layers:'<path d="m12 2 9 5-9 5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/>'};
 return `<span class="icon" style="width:${size}px;height:${size}px" aria-hidden="true"><svg viewBox="0 0 24 24">${paths[name]??paths.info}</svg></span>`;
}
function getLanguage():Lang{return localStorage.getItem('odl-lang')==='en'?'en':'ru';}
function queryBool(v:string|null,defaultValue:boolean){return v===null?defaultValue:v!=='0'&&v!=='false';}
function initialState():UIState{
 const p=new URLSearchParams(window.location.search);
 const ore:OreId=ORES.includes(p.get('ore') as OreId)?p.get('ore') as OreId:'C';
 const grade=p.has('grade')&&ore==='C'?p.get('grade')??'0.8':undefined;
 const lossModel:LossModel=ore==='C'&&p.get('model')==='constant_residue'?'constant_residue':'constant_recovery';
 return {ore,grade,lossModel,mineralogyAvailable:queryBool(p.get('mineralogy'),true),testworkAvailable:queryBool(p.get('testwork'),true),heapSiteFeasible:ore==='C'?queryBool(p.get('heap_site'),true):true,selectedRoute:ore==='B'?'FLOT_POX_CIL':ore==='D'?'GRAVITY_TAILS_CIL':ore==='C'?'HEAP_ADR':'DIRECT_CIL',lang:getLanguage(),audience:'executive'};
}
function activeURL(state:UIState){
 const url=new URL(window.location.href);
 url.search='';url.searchParams.set('ore',state.ore);
 if(state.ore==='C'){
  url.searchParams.set('grade',String(state.grade??'0.8').replace(',','.'));
  url.searchParams.set('model',state.lossModel);
  url.searchParams.set('heap_site',state.heapSiteFeasible?'1':'0');
 }
 if(!state.mineralogyAvailable)url.searchParams.set('mineralogy','0');
 if(!state.testworkAvailable)url.searchParams.set('testwork','0');
 return url;
}
async function loadData():Promise<FixtureData>{
 const files={scenario:'scenario_input.json',runs:'measured_laboratory_products.json',rules:'rules.json',profiles:'lab_sample_profiles.json',literature:'literature_register.json'};
 const values=await Promise.all(Object.values(files).map(async file=>{
  const r=await fetch(`./data/${file}`);
  if(!r.ok)throw new Error(`Missing dataset ${file} (${r.status})`);
  return r.json();
 }));
 const configResponse=await fetch('./site_config.json');
 if(!configResponse.ok)throw new Error('Missing site_config.json');
 siteConfig=await configResponse.json();
 return Object.fromEntries(Object.keys(files).map((k,i)=>[k,values[i]])) as unknown as FixtureData;
}
let data:FixtureData;
let siteConfig:{operator_name:string;contact_email:string;publication_note?:string}={operator_name:'',contact_email:''};
let state:UIState=initialState();
/** Narrative is presentation-only. Every scenario state is evaluated by the same calculation engine. */
let guideStep:0|1|2|null=window.location.search?null:0;
let evaluation:Evaluation;
let fingerprintCounter=0;
const app=document.getElementById('app')!;
const t=()=>UI[state.lang];
const $=(selector:string)=>document.querySelector(selector) as HTMLElement|null;
const metric=(label:string,value:string,foot:string,cls='')=>`<div class="metric ${cls}"><div class="label">${esc(label)}</div><div class="number">${esc(value)}</div><div class="foot">${esc(foot)}</div></div>`;
function renderLayout(){
 const txt=t();document.documentElement.lang=state.lang;
 app.innerHTML=`
 <header class="topbar"><div class="wrap">
  <a class="brand" href="?ore=C" aria-label="Ore Decision Lab"><span class="brand-icon"><svg viewBox="0 0 36 36"><path d="M7 23 17 7l12 16-12 6-10-6Z"/><path d="m17 7 0 22M7 23h22"/></svg></span><span><span class="brand-title">ORE DECISION LAB</span><span class="brand-sub">Interactive Process Intelligence</span></span></a>
  <div class="top-actions"><a class="navlink" href="#experiment">${esc(txt.workspace)}</a><a class="navlink" href="#methods">${esc(txt.dataLink)}</a><button class="plain-btn lang-btn" id="language" aria-label="Switch language">${state.lang==='ru'?'EN':'RU'}</button><a class="plain-btn" href="https://github.com/dkuba/ore-decision-lab" target="_blank" rel="noopener noreferrer">${icon('git',15)}<span class="mobile-hide">GitHub</span></a></div>
 </div></header>
 <main>
  <div class="wrap hero"><div><div class="breadcrumb"><span class="dot"></span>${esc(txt.lab)}<span style="color:#aab8bd">/</span> 01</div><h1>${esc(txt.title)}</h1><p class="hero-description">${esc(txt.intro)}</p></div>
  <div class="hero-callout"><div class="callout-symbol">${icon('shield',21)}</div><div><strong>${state.lang==='ru'?'Честная инженерная гипотеза':'Transparent engineering hypothesis'}</strong><span>${state.lang==='ru'?'Опыты, ограничения и источники доступны для самостоятельной проверки.':'Measured synthetic data, constraints and sources can be inspected.'}</span></div></div></div>
  <div class="wrap" id="quick-start">
   <section class="quick-tour" aria-labelledby="quick-title">
    <div class="quick-heading"><div><div class="quick-kicker">${state.lang==='ru'?'ПРОВЕРЬТЕ САМИ · 60 СЕКУНД':'TRY IT YOURSELF · 60 SECONDS'}</div><h2 id="quick-title">${state.lang==='ru'?'Одно изменение данных — другая технологическая схема':'One input change can change the process'}</h2><p>${state.lang==='ru'?'Ничего не нужно вводить. Нажмите по шагам и посмотрите, когда расчёт меняет вывод — а когда честно отказывается его делать.':'No setup required. Follow the steps to see when the calculation changes its answer — and when evidence is too weak to decide.'}</p></div><button type="button" class="primary-btn quick-next" id="quick-next">${state.lang==='ru'?'Проверить на примере':'Try an example'} ${icon('arrow',16)}</button></div>
    <div class="quick-steps" role="group" aria-label="${state.lang==='ru'?'Шаги демонстрации':'Demo steps'}"><button type="button" class="quick-step" data-guide-step="0"><span class="quick-step-num">01</span><span>${state.lang==='ru'?'Исходная руда':'Starting ore'}<strong>Au 0,80 ${state.lang==='ru'?'г/т':'g/t'}</strong></span></button><button type="button" class="quick-step" data-guide-step="1"><span class="quick-step-num">02</span><span>${state.lang==='ru'?'Больше золота':'Higher grade'}<strong>Au 1,60 ${state.lang==='ru'?'г/т':'g/t'}</strong></span></button><button type="button" class="quick-step" data-guide-step="2"><span class="quick-step-num">03</span><span>${state.lang==='ru'?'Меняем допущение':'Change assumption'}<strong>${state.lang==='ru'?'Другие потери':'Different tailings loss'}</strong></span></button></div>
    <div class="quick-live" id="quick-live" aria-live="polite" aria-atomic="true"></div>
    <div class="quick-bottom"><span>${state.lang==='ru'?'Все руды, испытания и цены вымышлены. Это объяснение метода, а не проект фабрики.':'All ores, experiments and costs are fictional. This explains a method, not a plant design.'}</span><div class="quick-links"><button type="button" class="quick-detail" id="quick-detail">${state.lang==='ru'?'Проверить формулы и источники':'Inspect formulas and sources'} ${icon('arrow',14)}</button><button type="button" class="quick-detail" id="quick-contact">${state.lang==='ru'?'Есть реальное месторождение?':'Have a real project?'} ${icon('arrow',14)}</button></div></div>
   </section>
  </div>
  <div class="wrap"><div class="status-banner">${icon('info',17)}<span><strong>SYNTHETIC DATA</strong> · ${esc(txt.notice)}</span></div></div>
  <div class="wrap workbench" id="experiment">
   <aside class="sidebar panel"><div class="panel-header"><h2>${esc(txt.scenarios)}</h2><p class="sub">${state.lang==='ru'?'Исследуем четыре разных свойства руды':'Four contrasting ore behaviours'}</p></div><div class="panel-body">
    <div class="ore-selection"><div class="sectionline"><span class="upper">${esc(txt.selectOre)}</span><span class="pill">A–D</span></div><div id="ore-choices"></div></div>
    <div class="dividing"></div>
    <section class="grade-controls"><div class="sectionline"><span class="upper">${esc(txt.settings)}</span><span class="pill blue">WHAT-IF</span></div>
     <div id="grade-control"></div>
     <div id="loss-model-control"></div>
    </section>
    <div class="dividing"></div>
    <section><div class="sectionline"><span class="upper">${esc(txt.switches)}</span>${icon('layers',15)}</div>
     <label class="switch-row"><span>${esc(txt.mineralogy)}<small>${esc(txt.mineralogySmall)}</small></span><span class="toggler"><input type="checkbox" id="mineralogy" ${state.mineralogyAvailable?'checked':''}/><span class="toggle-ui"></span></span></label>
     <label class="switch-row"><span>${esc(txt.testwork)}<small>${esc(txt.testworkSmall)}</small></span><span class="toggler"><input type="checkbox" id="testwork" ${state.testworkAvailable?'checked':''}/><span class="toggle-ui"></span></span></label>
     <div id="site-controls"></div>
     <p class="micro-note">${state.lang==='ru'?'Отключение источника — это потеря знания, а не изменение физики руды.':'Hiding evidence removes knowledge, not physical gold.'}</p>
    </section>
    <div class="dividing"></div>
    <section><div class="sectionline"><span class="upper">${esc(txt.dataTitle)}</span><span class="pill">SYN</span></div><div id="ore-profile"></div></section>
    <div class="dividing"></div>
    <button id="reset" class="outline-btn" style="width:100%">${esc(txt.reset)}</button>
   </div></aside>
   <section class="center">
    <article class="panel main-panel"><div class="panel-header"><div><div class="kicker">ANALYSIS WORKSPACE / <span id="current-ore">C</span></div><h2>${esc(txt.workspace)}</h2><p class="sub">${esc(txt.workspaceSub)}</p></div><div class="head-actions"><div class="segment" id="audience-segment"><button data-audience="executive" class="${state.audience==='executive'?'active':''}">${esc(txt.exectab)}</button><button data-audience="engineer" class="${state.audience==='engineer'?'active':''}">${esc(txt.engtab)}</button></div><button id="share" class="plain-btn">${icon('link',14)} ${esc(txt.share)}</button></div></div>
     <div class="top-metrics" id="summary-metrics"></div>
     <div id="status-message" style="margin:14px 18px 0"></div>
     <div class="chart-container" id="chart-panel"></div>
    </article>
    <article class="panel" style="margin-top:15px"><div class="panel-header"><h2>${esc(txt.routeAlt)}</h2><p class="sub">${esc(txt.routeSub)}</p></div><div class="panel-body" style="overflow-x:auto" id="route-list"></div></article>
    <article class="panel" style="margin-top:15px"><div class="panel-header"><h2>${esc(txt.ruleTitle)}</h2><p class="sub">${esc(txt.ruleSub)}</p></div><div class="panel-body" id="rule-list"></div></article>
   </section>
   <aside class="rhs">
    <section class="panel"><div class="panel-header"><h2>${esc(txt.evidenceTitle)}</h2><p class="sub">${esc(txt.why)}</p></div><div class="why-top" id="why-top"></div><div class="panel-body" id="why-details"></div></section>
    <section class="panel"><div class="panel-header"><h2>${esc(txt.testPlan)}</h2><p class="sub">${esc(txt.testPlanSub)}</p></div><div class="panel-body" id="testwork-plan"></div></section>
   </aside>
  </div>
 </main>
 <footer class="foot-section" id="methods"><div class="wrap"><div class="foot-inner">
 <section class="foot-card"><h3>${icon('shield',16)} ${esc(txt.footer1)}</h3><p>${esc(txt.footer1text)}</p><span class="pill amber">NOT INDUSTRIALLY QUALIFIED</span></section>
 <section class="foot-card"><h3>${icon('file',16)} ${esc(txt.footer2)}</h3><p>${esc(txt.footer2text)}</p><div class="foot-links"><button id="all-literature" class="outline-btn">${esc(txt.seeSources)} ${icon('external',14)}</button><button id="all-protocols" class="outline-btn">${esc(txt.seeData)}</button></div></section>
 <section class="foot-card"><h3>${icon('chart',16)} ${esc(txt.footer3)}</h3><p>${esc(txt.footer3text)}</p><p class="small muted">${siteConfig.operator_name?`${state.lang==='ru'?'Оператор: ':'Operator: '}${esc(siteConfig.operator_name)}`:esc(txt.contactMissing)}</p><button class="plain-btn" id="pilot-draft">${esc(siteConfig.contact_email?txt.contact:txt.send)}</button></section>
 </div><div class="foot-bottom"><span>Ore Decision Lab · ${esc(txt.notApproved)} · Literature-audited synthetic candidate</span><span class="mono" id="fingerprint">Fingerprint: ...</span></div></div></footer>
 <div class="modal" id="source-modal" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="modal-title"><div class="dialog"><div class="dialog-head"><h3 id="modal-title">Source</h3><button class="dialog-close" id="modal-close" aria-label="Close">×</button></div><div class="dialog-body" id="modal-body"></div></div></div>`;
 bindStaticEvents();renderControls();refresh();
}
function applyGuideStep(step:0|1|2){
 guideStep=step;
 state.ore='C';
 state.grade=step===0?'0.8':'1.6';
 state.lossModel=step===2?'constant_residue':'constant_recovery';
 state.mineralogyAvailable=true;
 state.testworkAvailable=true;
 state.heapSiteFeasible=true;
 // Derive the selected route from the calculation, never from an answer table.
 const updated=evaluate(data,state);
 state.selectedRoute=updated.leaders[0]??updated.hypotheticalLeaders[0]??'HEAP_ADR';
 renderControls();
 const mineralogy=$('#mineralogy') as HTMLInputElement|null;
 const testwork=$('#testwork') as HTMLInputElement|null;
 if(mineralogy)mineralogy.checked=true;
 if(testwork)testwork.checked=true;
 refresh();
}
function renderQuickTour(){
 const container=$('#quick-live');if(!container)return;
 const lang=state.lang;
 const isRu=lang==='ru';
 const currentOre=state.ore;
 const route=evaluation.leaders[0]??null;
 const hypothetical=evaluation.hypotheticalLeaders[0]??null;
 const grade=fmt(evaluation.inputs.resolvedGrade,2,lang);
 const result=route?nameOfRoute(route,lang):isRu?'Нет подтверждённого лидера':'No evidence-backed leader';
 const hypothesis=evaluation.resultLabel==='hypothesis_only_no_qualified_ranking';
 const evidenceLabel=hypothesis?(isRu?'НЕПОДТВЕРЖДЁННАЯ ГИПОТЕЗА':'UNSUPPORTED HYPOTHESIS'):evaluation.evidenceStatus==='out_of_scope'?(isRu?'ВНЕ ДИАПАЗОНА ОПЫТОВ':'OUTSIDE TESTED RANGE'):route?(isRu?'УЧЕБНЫЙ РАСЧЁТ':'SYNTHETIC CALCULATION'):(isRu?'НУЖНЫ ИСПЫТАНИЯ':'TESTWORK NEEDED');
 const text=hypothesis?(isRu?`В этой гипотезе условно выше ${hypothetical?nameOfRoute(hypothetical,lang):'один маршрут'}, но она противоречит крайним опытам. Подтверждённого решения нет.`:`This assumption favours ${hypothetical?nameOfRoute(hypothetical,lang):'one route'}, but disagrees with endpoint tests. There is no evidence-backed winner.`):
  route?(isRu?'Расчёт сравнивает два способа переработки одного типа руды. Более высокое извлечение не всегда означает более выгодную схему.':'The model compares two routes for the same ore. Higher recovery does not always mean better illustrative economics.'):
  isRu?'Расчёт не позволяет надёжно сравнить схемы при этих входных условиях.':'These inputs do not support a reliable comparison.';
 const cRoute=(id:RouteId)=>evaluation.alternatives.find(x=>x.route_id===id);
 const heap=cRoute('HEAP_ADR'),cil=cRoute('DIRECT_CIL');
 const rows:RouteEvaluation[]=currentOre==='C'?[heap,cil].filter((r):r is RouteEvaluation=>r!==undefined):evaluation.alternatives.filter(r=>r.status==='synthetic_supported').slice(0,2);
 const label=(r:RouteEvaluation|undefined)=>r?.screening_value_USD_per_t===undefined?'—':fmt(r.screening_value_USD_per_t,2,lang);
 const active=guideStep;
 document.querySelectorAll<HTMLButtonElement>('[data-guide-step]').forEach(btn=>{
  const step=Number(btn.dataset.guideStep);
  const chosen=step===active;
  btn.classList.toggle('is-active',chosen);
  btn.setAttribute('aria-pressed',chosen?'true':'false');
 });
 const id=currentOre==='C'?(isRu?'Руда C':'Ore C'):(isRu?`Руда ${currentOre}`:`Ore ${currentOre}`);
 container.innerHTML=`<div class="quick-answer"><div><span class="quick-eyebrow">${esc(id)} · Au ${esc(grade)} ${isRu?'г/т':'g/t'} · ${esc(evidenceLabel)}</span><div class="quick-answer-title">${esc(result)}</div><p>${esc(text)}</p></div><div class="quick-numbers">${rows.map(r=>`<div><span>${esc(nameOfRoute(r.route_id,lang))}</span><strong>${label(r)}</strong></div>`).join('')}<small>${isRu?'Условный показатель, USD на тонну руды · не NPV':'Illustrative USD per tonne of ore · not NPV'}</small></div></div>${hypothesis?`<div class="quick-uncertainty">${icon('alert',17)} ${esc(isRu?'Система не утверждает победителя: выбранная модель потерь расходится с синтетическими испытаниями.':'No winner can be confirmed: this loss model disagrees with synthetic tests.')}</div>`:''}`;
 const next=$('#quick-next') as HTMLButtonElement|null;
 if(next){const nextText=active===0?(isRu?'Увеличить содержание до 1,60 г/т':'Increase grade to 1.60 g/t'):active===1?(isRu?'Проверить другое допущение':'Test a different assumption'):active===2?(isRu?'Открыть инженерные доказательства':'Open engineering evidence'):(isRu?'Начать с руды C':'Start with ore C');next.innerHTML=esc(nextText)+' '+icon('arrow',16);}
}
function guideLeave(){guideStep=null;}
function renderControls(){
 const txt=t(),lang=state.lang;
 const choice=$('#ore-choices')!;
 choice.innerHTML=ORES.map(o=>{
 const d=ORE_DESCS[o][lang];return `<button type="button" class="ore-choice ${state.ore===o?'active':''}" data-ore="${o}"><span class="ore-letter">${o}</span><span class="ore-main"><strong>${esc(d[0])}</strong><small>${esc(d[1])}</small></span>${state.ore===o?'<span class="ore-check">✓</span>':''}</button>`;
 }).join('');
 const isC=state.ore==='C';
 $('#grade-control')!.innerHTML=isC?`<label class="input-label" for="grade"><span>${esc(txt.grade)}</span><span class="grade-field"><input id="grade" type="text" inputmode="decimal" spellcheck="false" value="${esc(state.grade??'0.8')}" aria-label="${esc(txt.grade)}"><span>${lang==='ru'?'г/т':'g/t'}</span></span></label><input type="range" id="grade-slider" min="0.6" max="1.6" step="0.01" value="${esc(state.grade??'0.8')}" aria-label="${esc(txt.grade)}"/><div class="range-ends"><span>0.60</span><span>0.80</span><span>1.20</span><span>1.60</span></div><p class="micro-note">${esc(txt.gradeScope)} · <button class="source-link" id="try-out-of-scope">${esc(txt.gradeOutside)}</button></p>`:`<div class="callout">${icon('info',16)}${esc(txt.noGrades)}</div>`;
 $('#loss-model-control')!.innerHTML=isC?`<div class="dividing"></div><div class="input-label"><span>${esc(txt.lossModel)}</span></div><div class="two-options"><button data-loss="constant_recovery" class="${state.lossModel==='constant_recovery'?'active':''}">${esc(txt.constantRecovery)}</button><button data-loss="constant_residue" class="${state.lossModel==='constant_residue'?'active':''}">${esc(txt.constantResidue)}</button></div><p class="micro-note">${lang==='ru'?'Две математические гипотезы, но не две одинаково подтверждённые технологии.':'Two mathematical hypotheses, not two equally supported process choices.'}</p>`:'';
 $('#site-controls')!.innerHTML=isC?`<label class="switch-row"><span>${esc(txt.heap)}<small>${esc(txt.heapSmall)}</small></span><span class="toggler"><input type="checkbox" id="site" ${state.heapSiteFeasible?'checked':''}/><span class="toggle-ui"></span></span></label>`:'';
 const assays=data.scenario.ores[state.ore].assays;
 const min=data.scenario.ores[state.ore].mineralogy;
 $('#ore-profile')!.innerHTML=`<div class="basis-grid">${[['Au',`${fmt(Number(assays.Au_gpt),2,lang)} g/t`],['S',`${fmt(Number(assays.S_pct),2,lang)}%`],['As',`${fmt(Number(assays.As_pct),2,lang)}%`],['Corg',`${fmt(Number(assays.organic_C_pct),2,lang)}%`]].map(([k,v])=>`<div class="basis-item"><span class="t">${esc(k)}</span><span class="v">${esc(v)}</span></div>`).join('')}</div><div class="assoc"><div class="assoc-row" title="Gold deportment"><span style="width:${Number(min.free_au_fraction)*100}%"></span><span style="width:${Number(min.sulphide_host_fraction)*100}%"></span><span style="width:${Number(min.other_host_fraction)*100}%"></span></div></div><div class="assoc-legend"><span>${esc(txt.freeAu)} <b>${fmt(Number(min.free_au_fraction)*100,0,lang)}%</b></span><span>${esc(txt.sulphideAu)} <b>${fmt(Number(min.sulphide_host_fraction)*100,0,lang)}%</b></span></div><p class="micro-note">${lang==='ru'?'Состав и формы золота — синтетические наблюдения, не данные месторождения.':'Composition and deportment are fabricated measurements.'} <button class="source-link" data-protocol="${esc(data.scenario.ore_source_ids[state.ore])}">${esc(txt.source)} →</button></p>`;
 choice.querySelectorAll<HTMLButtonElement>('[data-ore]').forEach(b=>b.addEventListener('click',()=>{guideLeave();state.ore=b.dataset.ore as OreId;state.grade=undefined;state.lossModel='constant_recovery';state.heapSiteFeasible=true;state.selectedRoute=state.ore==='B'?'FLOT_POX_CIL':state.ore==='D'?'GRAVITY_TAILS_CIL':state.ore==='C'?'HEAP_ADR':'DIRECT_CIL';renderControls();refresh();}));
 $('#grade-slider')?.addEventListener('input',event=>{const value=(event.currentTarget as HTMLInputElement).value;guideLeave();state.grade=value;const field=$('#grade') as HTMLInputElement|null;if(field)field.value=Number(value).toFixed(2);refresh();});
 const field=$('#grade') as HTMLInputElement|null;
 if(field){
  const commit=()=>{try{const g=parseNumber(field.value,'Au',{positive:true});guideLeave();state.grade=String(g);field.value=String(g);refresh();}catch(err){showError((err as Error).message);field.value=String(state.grade??'0.8');}};
  field.addEventListener('change',commit);field.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();field.blur();}});
 }
 $('#try-out-of-scope')?.addEventListener('click',()=>{guideLeave();state.grade='1.85';(($('#grade') as HTMLInputElement)).value='1.85';refresh();});
 document.querySelectorAll<HTMLButtonElement>('[data-loss]').forEach(b=>b.addEventListener('click',()=>{guideLeave();state.lossModel=b.dataset.loss as LossModel;document.querySelectorAll('[data-loss]').forEach(x=>x.classList.toggle('active',(x as HTMLElement).dataset.loss===state.lossModel));refresh();}));
 const site=$('#site') as HTMLInputElement|null;
 site?.addEventListener('change',()=>{guideLeave();state.heapSiteFeasible=site.checked;refresh();});
 document.querySelectorAll<HTMLButtonElement>('#ore-profile [data-protocol]').forEach(b=>b.addEventListener('click',()=>void openProtocol(b.dataset.protocol!)));
}
function bindStaticEvents(){
 document.querySelectorAll<HTMLButtonElement>('[data-guide-step]').forEach(b=>b.addEventListener('click',()=>applyGuideStep(Number(b.dataset.guideStep) as 0|1|2)));
 $('#quick-next')?.addEventListener('click',()=>{
  if(guideStep===2){state.audience='engineer';document.querySelectorAll<HTMLButtonElement>('[data-audience]').forEach(b=>b.classList.toggle('active',b.dataset.audience==='engineer'));refresh();$('#why-top')?.scrollIntoView({behavior:'smooth',block:'start'});}
  else applyGuideStep(guideStep===0?1:guideStep===1?2:0);
 });
 $('#quick-detail')?.addEventListener('click',()=>{state.audience='engineer';document.querySelectorAll<HTMLButtonElement>('[data-audience]').forEach(b=>b.classList.toggle('active',b.dataset.audience==='engineer'));refresh();$('#why-top')?.scrollIntoView({behavior:'smooth',block:'start'});});
 $('#quick-contact')?.addEventListener('click',()=>{$('#pilot-draft')?.click();});
 const mn=$('#mineralogy') as HTMLInputElement,tw=$('#testwork') as HTMLInputElement;
 mn.addEventListener('change',()=>{guideLeave();state.mineralogyAvailable=mn.checked;refresh();});
 tw.addEventListener('change',()=>{guideLeave();state.testworkAvailable=tw.checked;refresh();});
 $('#language')?.addEventListener('click',()=>{state.lang=state.lang==='ru'?'en':'ru';localStorage.setItem('odl-lang',state.lang);renderLayout();});
 $('#reset')?.addEventListener('click',()=>{const lang=state.lang,audience=state.audience;guideStep=0;state={...initialState(),lang,audience};renderControls();refresh();});
 $('#share')?.addEventListener('click',async()=>{
  const url=activeURL(state).toString();
  try{await navigator.clipboard.writeText(url);toast(t().copyDone);}catch{showTextModal(t().share,`<p>${esc(url)}</p>`);}
 });
 $('#all-literature')?.addEventListener('click',()=>showLiterature());
 $('#all-protocols')?.addEventListener('click',()=>showProtocolList());
 $('#pilot-draft')?.addEventListener('click',async()=>{
  const draft=state.lang==='ru'?'Запрос на предварительное обследование месторождения\nОбъект: [название]\nДоступные данные: скважины / химические анализы / минералогия / протоколы испытаний\nВопрос для проверки: [основная технологическая развилка]\nОжидаемые результаты обследования: карта доказательности, перечень альтернатив, программа недостающих испытаний, основания для пилота.\nСтоимость и условия согласовываются отдельно.':'Request for an ore-processing discovery assessment\nDeposit: [name]\nAvailable: drilling / assays / mineralogy / testwork\nDecision to test: [question]\nDeliverable: evidence inventory, alternatives and missing-testwork plan.\nScope and pricing by agreement.';
  if(siteConfig.contact_email){
    const email=siteConfig.contact_email.trim();
    // Contact configured by the site operator; no submitted data is stored by ODL.
    if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      window.location.href=`mailto:${email}?subject=${encodeURIComponent('Ore Decision Lab — pilot enquiry')}&body=${encodeURIComponent(draft)}`;
      return;
    }
  }
  try{await navigator.clipboard.writeText(draft);toast(state.lang==='ru'?'Описание пилота скопировано':'Pilot brief copied');}catch{}
  showTextModal(t().contact,`<p>${state.lang==='ru'?'Предварительное предложение для промышленного партнёра.':'A preliminary discovery offer for industrial partners.'}</p><pre>${esc(draft)}</pre><p>${esc(t().notConfigured)}</p>`);
 });
 $('#modal-close')?.addEventListener('click',closeModal);
 $('#source-modal')?.addEventListener('click',e=>{if(e.target===$('#source-modal'))closeModal();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
 document.querySelectorAll<HTMLButtonElement>('[data-audience]').forEach(b=>b.addEventListener('click',()=>{state.audience=b.dataset.audience as Audience;document.querySelectorAll('[data-audience]').forEach(x=>x.classList.toggle('active',(x as HTMLElement).dataset.audience===state.audience));refresh();}));
}
function showError(message:string){const existing=$('#input-error');if(existing)existing.remove();const controls=$('#grade-control');controls?.insertAdjacentHTML('afterbegin',`<div id="input-error" class="errorbox">${esc(message)}</div>`);}
let timerToast:number|undefined;
function toast(message:string){document.querySelector('#toast')?.remove();const node=document.createElement('div');node.id='toast';node.className='pill teal';node.textContent=message;node.style.cssText='position:fixed;right:20px;bottom:20px;z-index:200;padding:13px 16px;box-shadow:0 8px 30px #0c333333;font-size:12px';document.body.append(node);if(timerToast)clearTimeout(timerToast);timerToast=window.setTimeout(()=>node.remove(),2600);}
function showTextModal(title:string,body:string){$('#modal-title')!.textContent=title;$('#modal-body')!.innerHTML=body;const modal=$('#source-modal')!;modal.classList.add('open');modal.setAttribute('aria-hidden','false');($('#modal-close') as HTMLElement)?.focus();}
function closeModal(){const modal=$('#source-modal');modal?.classList.remove('open');modal?.setAttribute('aria-hidden','true');}
async function openProtocol(id:string){
 if(!/^SYN-P(?:0[1-9]|1[0-2])$/.test(id))return;
 try{const response=await fetch(`./protocols/${id}.md`);if(!response.ok)throw new Error(`${response.status}`);const body=await response.text();showTextModal(`${id} · ${state.lang==='ru'?'синтетический протокол':'synthetic protocol'}`,`<p>${state.lang==='ru'?'Исходный текст учебного лабораторного протокола. Не реальные измерения.':'Synthetic laboratory protocol; not field measurements.'}</p><pre>${esc(body)}</pre>`);}catch(err){showTextModal(id,`<p>${esc((err as Error).message)}</p>`);}
}
function showProtocolList(){
 const html=`<p>${state.lang==='ru'?'12 синтетических лабораторных протоколов; не являются результатами реальных исследований.':'Twelve synthetic laboratory protocols; not real observations.'}</p>`+Array.from({length:12},(_,i)=>{const id=`SYN-P${String(i+1).padStart(2,'0')}`;return `<div class="mini-rule"><strong>${id}</strong><button class="outline-btn" data-list-protocol="${id}">${icon('file',14)} ${esc(t().openProtocol)}</button></div>`;}).join('');
 showTextModal(t().seeData,html);
 document.querySelectorAll<HTMLButtonElement>('[data-list-protocol]').forEach(b=>b.addEventListener('click',()=>void openProtocol(b.dataset.listProtocol!)));
}
function showLiterature(){
 const html=`<p>${state.lang==='ru'?'Механизмы исследований основаны на публикациях. Цифры искусственных руд не заимствованы из этих работ.':'Published studies support the qualitative methodology; the fabricated ore values are not sourced from them.'}</p>`+data.literature.sources.map(item=>`<div class="mini-rule"><div><strong>${esc(item.id)} · ${esc(item.title)}</strong><p>${esc(item.basis)}</p><p style="color:#ae791d">${esc(item.does_not_support)}</p></div><a class="outline-btn" href="${esc(item.url.startsWith('https://')?item.url:'#')}" target="_blank" rel="noopener noreferrer">${icon('external',13)}</a></div>`).join('');
 showTextModal(t().seeSources,html);
}
function outcomeInfo(e:Evaluation){
 const lang=state.lang,tt=t();
 if(e.resultLabel==='hypothesis_only_no_qualified_ranking')return {headline:tt.hypothesis,body:lang==='ru'?'Показано лишь условное сравнение. Крайние синтетические испытания противоречат модели постоянных хвостов.':'Illustrative comparison only. The constant-tailings-grade hypothesis conflicts with synthetic endpoint observations.',pill:'amber',metric:'—'};
 if(e.evidenceStatus==='out_of_scope')return {headline:tt.scopeWarning,body:lang==='ru'?'Для этого содержания нет подтверждённых опытов. Вне диапазона нельзя экстраполировать извлечение.':'No supporting testwork exists beyond the studied grade range.',pill:'red',metric:'—'};
 if(e.resultLabel==='provisional_calculation_only')return {headline:tt.noWinner,body:lang==='ru'?'Числа отдельных опытов видны, но без минералогических сведений правила применимости не подтверждены.':'Existing experiments are visible, but missing mineralogy prevents reliable investigation triage.',pill:'amber',metric:'—'};
 if(!e.leaders.length)return {headline:tt.noWinner,body:lang==='ru'?'Нет допустимых для сравнения вариантов. Проверяем недостающие испытания и ограничения.':'No comparable routes. Inspect missing tests and constraints.',pill:'red',metric:'—'};
 if(e.resultLabel==='indifference_zone')return {headline:tt.indifference,body:lang==='ru'?'Разница условного показателя менее 0,50 USD/т. Победитель не объявляется.':'The illustrative difference is ≤ 0.50 USD/t. No unique winner is declared.',pill:'amber',metric:e.leaders.map(r=>nameOfRoute(r,lang)).join(' / ')};
 return {headline:nameOfRoute(e.leaders[0],lang),body:lang==='ru'?'Условный лидер среди вариантов с пригодными синтетическими опытами. Это не промышленное утверждение.':'Illustrative leader among routes with synthetic supporting experiments. Not a qualified process recommendation.',pill:'teal',metric:''};
}
function getGrade(){return evaluation.inputs.resolvedGrade;}
function refresh(){
 try{
  evaluation=evaluate(data,state);
  const txt=t();
  const label=$('#current-ore');if(label)label.textContent=state.ore;
  const result=outcomeInfo(evaluation);
  const supported=evaluation.alternatives.filter(x=>x.status==='synthetic_supported');
  const validTests=state.testworkAvailable?data.runs.filter(r=>r.ore_id===state.ore&&inspectRun(r,Number(data.scenario.lab_max_abs_relative_imbalance)).quality_status==='accepted').length:0;
  $('#summary-metrics')!.innerHTML=[
   metric(txt.rulesCount,String(evaluation.rules.filter(x=>x.status==='triggered').length),state.lang==='ru'?'Направлений исследования':'Investigation signals'),
   metric(txt.testsAvailable,String(validTests),state.lang==='ru'?'Учебные лабораторные опыты':'Synthetic laboratory runs','good'),
   metric(txt.alternatives,String(supported.length),state.lang==='ru'?'Без блокирующих ошибок':'No blocking errors')
  ].join('');
  const special=state.ore==='C'&&state.lossModel==='constant_residue'&&evaluation.evidenceStatus!=='out_of_scope'&&evaluation.alternatives.some(x=>x.status==='synthetic_supported');
  $('#status-message')!.innerHTML=(special?`<div class="callout warn">${icon('alert',18)}<span>${esc(txt.hypoWarning)}</span></div>`:evaluation.evidenceStatus==='out_of_scope'?`<div class="callout bad">${icon('alert',18)}<span>${esc(txt.scopeWarning)}</span></div>`:evaluation.resultLabel==='provisional_calculation_only'?`<div class="callout warn">${icon('info',17)}<span>${esc(result.body)}</span></div>`:'');
  $('#chart-panel')!.innerHTML=state.ore==='C'?renderChart():renderAlternateChart();
  renderRoutes();renderRules();renderWhy();renderTestwork();renderQuickTour();
  const slider=$('#grade-slider') as HTMLInputElement|null;
  if(slider){slider.value=String(Math.max(.6,Math.min(1.6,getGrade())));slider.style.background=`linear-gradient(to right,var(--teal) ${((Math.max(.6,Math.min(1.6,getGrade()))-.6)/1)*100}%,#e3edef 0%)`;}
  const url=activeURL(state);
  history.replaceState(null,'',`${url.pathname}${url.search}${url.hash}`);
  const fid=++fingerprintCounter;
  void sha256(evaluation.inputFingerprintMaterial).then(hash=>{if(fid===fingerprintCounter)$('#fingerprint')!.textContent=`SHA-256: ${hash.slice(0,16)}…`;}).catch(()=>{$('#fingerprint')!.textContent='SHA-256: unavailable';});
 }catch(err){const message=err instanceof InputValidationError?err.message:`${(err as Error).message}`;showError(message);}
}
function renderChart(){
 const tt=t(),lang=state.lang,base={...state,ore:'C' as OreId,heapSiteFeasible:state.heapSiteFeasible};
 const grade=getGrade(),smin=.6,smax=1.6;
 const readings:{g:number;heap:number|null;cil:number|null}[]=[];
 for(let j=0;j<=40;j++){
  const g=round(smin+j*(smax-smin)/40,4);
  const v=evaluate(data,{...base,grade:g});
  const heap=v.alternatives.find(x=>x.route_id==='HEAP_ADR');
  const cil=v.alternatives.find(x=>x.route_id==='DIRECT_CIL');
  readings.push({g,heap:heap?.status==='synthetic_supported'?heap.screening_value_USD_per_t??null:null,cil:cil?.status==='synthetic_supported'?cil.screening_value_USD_per_t??null:null});
 }
 const scores=readings.flatMap(x=>[x.heap,x.cil].filter((n):n is number=>n!==null));
 const minY=Math.floor((Math.min(...scores,0)-8)/20)*20,maxY=Math.ceil((Math.max(...scores,0)+8)/20)*20;
 const left=55,top=16,width=600,height=225;
 const x=(g:number)=>left+(g-smin)/(smax-smin)*width;
 const y=(v:number)=>top+(maxY-v)/(maxY-minY)*height;
 const path=(k:'heap'|'cil')=>readings.filter(p=>p[k]!==null).map((p,i)=>`${i?'L':'M'}${x(p.g).toFixed(2)} ${y(p[k]!).toFixed(2)}`).join(' ');
 const grid=Array.from({length:5},(_,j)=>{const val=minY+(maxY-minY)*j/4;return `<line x1="${left}" y1="${y(val)}" x2="${left+width}" y2="${y(val)}" stroke="#e7edf0" stroke-width="1"/><text x="${left-11}" y="${y(val)+4}" text-anchor="end" fill="#91a0aa" font-size="11">${round(val,0)}</text>`;}).join('');
 const ax=[.6,.8,1.0,1.2,1.4,1.6].map(g=>`<text x="${x(g)}" y="${top+height+22}" fill="#8ca0aa" font-size="11" text-anchor="middle">${g.toFixed(1)}</text>`).join('');
 let indif='';
 if(state.lossModel==='constant_recovery'){
  const bounds=readings.filter(r=>r.heap!==null&&r.cil!==null&&Math.abs(r.heap-r.cil)<=Number(data.scenario.indifference_band_USD_per_t)+.2).map(r=>r.g);
  if(bounds.length){const lo=Math.max(.6,Math.min(...bounds)-.018),hi=Math.min(1.6,Math.max(...bounds)+.018);indif=`<rect x="${x(lo)}" y="${top}" width="${x(hi)-x(lo)}" height="${height}" fill="#e8a943" opacity=".11"/><text x="${x(lo)+3}" y="${top+12}" fill="#b0883b" font-size="9">≈</text>`;}
 }
 const isIn=grade>=.6&&grade<=1.6;
 const currentHeap=evaluation.alternatives.find(z=>z.route_id==='HEAP_ADR')?.screening_value_USD_per_t;
 const currentCil=evaluation.alternatives.find(z=>z.route_id==='DIRECT_CIL')?.screening_value_USD_per_t;
 const cursor=isIn?`<line x1="${x(grade)}" y1="${top}" x2="${x(grade)}" y2="${top+height}" stroke="#536a7a" stroke-width="1.3" stroke-dasharray="4 5"/>${currentHeap!==undefined?`<circle cx="${x(grade)}" cy="${y(currentHeap)}" r="5" stroke="#fff" stroke-width="2" fill="#078c83"/>`:''}${currentCil!==undefined?`<circle cx="${x(grade)}" cy="${y(currentCil)}" r="5" stroke="#fff" stroke-width="2" fill="#5276af"/>`:''}`:'';
 const labDots=state.lossModel==='constant_recovery'?[.6,.8,1.6].map(g=>{const p=readings.find(r=>Math.abs(r.g-g)<1e-8);return p&&p.heap!==null&&p.cil!==null?`<circle cx="${x(g)}" cy="${y(p.heap)}" r="3.2" stroke="#078c83" stroke-width="1.6" fill="white"/><circle cx="${x(g)}" cy="${y(p.cil)}" r="3.2" stroke="#5276af" stroke-width="1.6" fill="white"/>`:'';}).join(''):'';
 const chart=`<div class="panel-heading"><div><h3>${esc(tt.chartTitle)}</h3><p>${esc(tt.chartSub)} · <span class="mono">Au = ${fmt(grade,2,lang)} g/t</span></p></div><span class="pill ${state.lossModel==='constant_residue'?'amber':'teal'}">${state.lossModel==='constant_residue'?'HYPOTHESIS':'SYNTHETIC SERIES'}</span></div><div class="chart-wrap"><svg class="chart-svg" viewBox="0 0 690 292" role="img" aria-label="${esc(tt.chartTitle)}"><rect x="0" y="0" width="690" height="292" fill="transparent"/>${grid}${indif}<path d="${path('heap')}" fill="none" stroke="#078c83" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="${path('cil')}" fill="none" stroke="#5276af" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${labDots}${cursor}${ax}<text x="${left+width/2}" y="286" text-anchor="middle" fill="#8298a4" font-size="11">Au, g/t</text></svg></div><div class="chart-footer"><div class="legend"><span><i style="background:#078c83"></i> ${esc(nameOfRoute('HEAP_ADR',lang))}</span><span><i style="background:#5276af"></i> ${esc(nameOfRoute('DIRECT_CIL',lang))}</span>${state.lossModel==='constant_recovery'?'<span><i class="dash"></i> 0.6 / 0.8 / 1.6</span>':''}</div><span class="pill ${state.lossModel==='constant_residue'?'amber':'blue'}">${state.lossModel==='constant_residue'?'NOT QUALIFIED':'WHAT-IF'}</span></div><p class="figure-note">${state.lossModel==='constant_recovery'?lang==='ru'?'Интерполяция трёх синтетических точек. Светлая зона отмечает различие менее ±0,50 USD/т — это условное правило отображения, не доверительный интервал.':'Three synthetic observations with interpolated recovery; yellow band reflects a display rule, not statistical confidence.':lang==='ru'?'Гипотеза постоянных хвостов согласована с 0,80 г/т, но не с крайними опытами. Сплошные линии показывают модель, а не подтверждённый прогноз.':'Constant tailings grade matches 0.80 g/t but conflicts with endpoints. Curves are a rival assumption, not a validated prediction.'}</p>`;
 const observations=state.lossModel==='constant_residue'&&evaluation.modelVsObservations.length?`<details class="detail" open style="margin-top:12px"><summary>${lang==='ru'?'Гипотеза против наблюдений: остаточное Au':'Hypothesis vs observations: tailings Au'}</summary><div class="detail-content"><p>${lang==='ru'?'Модель предполагает постоянное содержание Au в хвостах. Сравните его с отдельными синтетическими опытами. Численные расхождения не являются доверительными интервалами.':'This model assumes constant tailings Au. Compare it against separate synthetic testwork. Differences are not confidence intervals.'}</p><div style="overflow-x:auto"><table><thead><tr><td>${lang==='ru'?'Процесс':'Process'}</td><td>Au g/t</td><td>${lang==='ru'?'Остаток':'Observed'}</td><td>${lang==='ru'?'Модель':'Model'}</td></tr></thead><tbody>${evaluation.modelVsObservations.map(row=>`<tr><td>${row.route_id==='HEAP_ADR'?'Heap':'CIL'}</td><td>${fmt(row.grade_gpt,2,lang)}</td><td>${fmt(row.observed_tails_gpt,4,lang)}</td><td style="color:${Math.abs(row.residual_difference_gpt)>.02?'#b35b40':'#557877'}">${fmt(row.hypothesis_predicted_tails_gpt,4,lang)}</td></tr>`).join('')}</tbody></table></div></div></details>`:'';
 return chart+observations;
}
function renderAlternateChart(){
 const lang=state.lang;
 const routes=evaluation.alternatives.filter(r=>r.status==='synthetic_supported');
 const chart=routes.length?routes.sort((a,b)=>(b.recovery??0)-(a.recovery??0)).map(r=>`<div style="margin:13px 0"><div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px;font-size:11px"><strong>${esc(nameOfRoute(r.route_id,lang))}</strong><span class="mono">${fmt((r.recovery??0)*100,2,lang)}%</span></div><div class="track" style="height:9px;background:#eef2f3;overflow:hidden;border-radius:5px"><div style="height:100%;background:${r.route_id===state.selectedRoute?'#078c83':'#8eb7b5'};width:${(r.recovery??0)*100}%;border-radius:5px"></div></div></div>`).join(''):`<div class="callout warn">${esc(t().noWinner)}</div>`;
 return `<div class="panel-heading"><div><h3>${state.lang==='ru'?'Сквозное извлечение по опытам':'Testwork-based total recovery'}</h3><p>${state.lang==='ru'?'Измеренные синтетические продукты каждой стадии':'Fabricated product assays by stage'}</p></div><span class="pill blue">SYN · Au</span></div><div style="padding:8px 3px">${chart}</div><p class="figure-note">${state.lang==='ru'?'Для переработки концентрата извлечения перемножаются; для переработки хвостов учитываются две ветви, включая доводку концентрата.':'Concentrate recovery compounds; gravity routes account for both finished concentrate and tailings.'}</p>`;
}
function renderRoutes(){
 const lang=state.lang,tt=t();
 const table=`<table class="route-table"><thead><tr><th>${esc(tt.process)}</th><th>${esc(tt.status)}</th><th>${esc(tt.recovery)}</th><th>${esc(tt.netback)}<span class="tiny"> USD/t</span></th></tr></thead><tbody>${evaluation.alternatives.map(r=>{
  const info=ROUTE_BADGE[r.status],active=state.selectedRoute===r.route_id;
  return `<tr class="${active?'chosen':''}" tabindex="0" role="button" data-route="${r.route_id}" aria-label="${esc(nameOfRoute(r.route_id,lang))}"><td><div class="route-name">${esc(nameOfRoute(r.route_id,lang))}</div><span class="route-hint">${r.selection_signal==='indicated_by_rules'?'● '+(lang==='ru'?'Сигнал правила':'Rule signal'):(lang==='ru'?'Нет сигнала':'No rule signal')}</span></td><td><span class="pill ${info.className}">${esc(info[lang])}</span></td><td class="amount ${r.recovery===undefined?'empty':''}">${r.recovery!==undefined?fmt(r.recovery*100,2,lang)+'%':'—'}</td><td class="amount ${r.screening_value_USD_per_t===undefined?'empty':''}">${r.screening_value_USD_per_t!==undefined?fmt(r.screening_value_USD_per_t,2,lang):'—'}</td></tr>`;
 }).join('')}</tbody></table><p class="micro-note">${lang==='ru'?'USD/т — условный screening-показатель, не NPV или прогноз. Красные/жёлтые статусы исключают необоснованный инженерный выбор.':'USD/t is illustrative netback, not NPV or a project forecast.'}</p>`;
 $('#route-list')!.innerHTML=table;
 document.querySelectorAll<HTMLElement>('[data-route]').forEach(row=>{
  const handler=()=>{state.selectedRoute=row.dataset.route as RouteId;renderRoutes();renderWhy();};
  row.addEventListener('click',handler);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();handler();}});
 });
}
function renderRules(){
 const lang=state.lang;
 $('#rule-list')!.innerHTML=evaluation.rules.map(rule=>{
  const status=rule.status,lit=rule.literature_sources.join(', '),n=nameOfRule(rule.rule_id,lang);
  return `<div class="mini-rule"><span class="rule-dot ${status==='triggered'?'on':status==='unknown_missing_knowledge'?'unknown':''}"></span><div style="flex:1"><strong>${esc(n)}</strong><p><span class="mono" style="font-size:9px">${esc(rule.rule_id)}</span> · ${esc(lit)}</p>${state.audience==='engineer'?`<p>${rule.input_facts.map(f=>`${esc(f.field)} = ${esc(f.observed_value)}`).join(' · ')}</p>`:''}</div><span class="pill ${status==='triggered'?'teal':status==='unknown_missing_knowledge'?'amber':''}">${status==='triggered'?(lang==='ru'?'Сработало':'Triggered'):status==='unknown_missing_knowledge'?(lang==='ru'?'Неизвестно':'Unknown'):(lang==='ru'?'Не сработало':'Inactive')}</span></div>`;
 }).join('')+`<div class="callout" style="margin-top:12px">${icon('info',17)}<span>${lang==='ru'?'Признаки руды задают перечень исследований; коэффициенты извлечения берутся только из испытаний и не выводятся из содержания S, As или крупности Au.':'Ore properties drive investigation triage; lab tests, not chemical thresholds, determine recovery rates.'}</span></div>`;
}
function explanationForRoute(r:RouteEvaluation){
 const lang=state.lang;
 if(r.status==='synthetic_supported')return lang==='ru'?'Для этого маршрута есть пригодные синтетические опыты с указанными продуктами и допусками QA.':'Testwork exists with separately accounted products and acceptable synthetic QA.';
 if(r.status==='out_of_scope')return lang==='ru'?'Опытов в данной области параметров нет. Извлечение не экстраполируется.':'No tests cover these conditions; recovery cannot be extrapolated.';
 if(r.status==='blocked_constraint')return lang==='ru'?'Текущие условия или лабораторный предварительный фильтр блокируют расчёт этой схемы.':'A site constraint or laboratory screening gate blocks this route.';
 if(r.status==='not_indicated')return lang==='ru'?'Нет признаков, обосновывающих заказ этих испытаний на первом этапе. Имеющиеся опыты при этом не стираются.':'Evidence does not motivate ordering additional studies. Existing experiments remain visible.';
 return lang==='ru'?'Недостаёт одного или нескольких критичных технологических испытаний.':'One or more critical process tests are missing.';
}
function blockerName(blocker:string,lang:Lang){
 const [kind,detail]=blocker.split(':');
 if(kind==='missing_test')return `${lang==='ru'?'Не хватает опыта:':'Missing test:'} ${STAGE_NAMES[detail]?.[lang]??detail.replaceAll('_',' ')}`;
 if(kind==='out_of_scope')return lang==='ru'?'Изменённая точка вне лабораторной области применимости':'Outside lab applicability scope';
 if(kind==='site_constraint_failed')return lang==='ru'?'Площадочное условие не выполнено':'Site constraint failed';
 if(kind==='missing_lab_gate')return lang==='ru'?'Нет лабораторной предварительной проверки':'Missing laboratory screening';
 if(kind==='laboratory_gate_failed')return lang==='ru'?'Лабораторный предварительный тест не пройден':'Lab screening failed';
 return blocker.replaceAll('_',' ');
}
function renderWhy(){
 const lang=state.lang,tt=t();
 const route=evaluation.alternatives.find(r=>r.route_id===state.selectedRoute)??evaluation.alternatives[0];
 const badge=ROUTE_BADGE[route.status];
 $('#why-top')!.innerHTML=`<span class="pill ${badge.className}">${esc(badge[lang])}</span><div class="why-main">${esc(nameOfRoute(route.route_id,lang))}</div><p class="why-note">${esc(explanationForRoute(route))}</p>${route.recovery!==undefined?`<div class="key-stat"><span class="t">${esc(tt.recovery)}</span><span class="v positive">${fmt(route.recovery*100,2,lang)}%</span></div><div class="key-stat"><span class="t">${lang==='ru'?'Условный показатель':'Synthetic netback'}</span><span class="v">${fmt(route.screening_value_USD_per_t,2,lang)} USD/t</span></div>`:''}`;
 let blocks='';
 if(route.blockers.length)blocks=`<div class="detail-list" style="margin-bottom:13px"><div class="upper muted" style="margin:8px 0">${esc(tt.whyNot)}</div>${route.blockers.map(b=>`<div style="display:flex;gap:8px;font-size:10px;color:#885a2b">${icon('alert',14)}${esc(blockerName(b,lang))}</div>`).join('')}</div>`;
 const traces=route.source_traces.length?`<details class="detail" ${state.audience==='engineer'?'open':''}><summary>${esc(tt.traces)} · ${route.source_traces.length}</summary><div class="detail-content">${route.source_traces.map(tr=>`<div style="padding-bottom:11px;border-bottom:1px solid #edf1f3;margin-bottom:11px"><div style="display:flex;justify-content:space-between;gap:8px"><strong class="mono">${esc(tr.run_id)}</strong><button class="source-link" data-protocol="${esc(tr.protocol_id)}">${icon('file',13)} ${esc(tr.protocol_id)}</button></div><table><tr><td>Au feed, g</td><td>${fmt(tr.feed_au_g,6,'en')}</td></tr><tr><td>Au calc. products, g</td><td>${fmt(tr.calculated_head_au_g,6,'en')}</td></tr><tr><td>QA Δ, %</td><td>${fmt(tr.imbalance_percent,4,lang)}</td></tr>${Object.entries(tr.product_au_g).map(([kind,mass])=>`<tr><td>Au ${esc(kind)}, g</td><td>${fmt(mass,6,'en')}</td></tr>`).join('')}<tr><td>Stage recovery, %</td><td>${fmt((tr.stage_recovery_fraction??0)*100,3,lang)}</td></tr></table><div class="trace-line">R = Au ${tr.product_au_g.concentrate!==undefined?'concentrate':'recovered'} / Σ Au products</div></div>`).join('')}${route.excluded_lab_repeats.map(tr=>`<p class="pill amber">Excluded repeat: ${esc(tr.run_id)}</p>`).join('')}</div></details>`:'';
 const formula=route.formula_trace?`<details class="detail" open><summary>${lang==='ru'?'Формула и входные значения':'Formula trace'}</summary><div class="detail-content"><div class="trace-line">${esc(route.formula_trace)}</div>${route.model_trace?`<div class="trace-line">${esc(route.model_trace)}</div>`:''}<p style="margin-bottom:0">${lang==='ru'?'Значения округлены только при показе. Стоимости и цена металла заданы искусственно.':'Display rounded only. Costs and gold price are invented.'}</p></div></details>`:'';
 const equipment=state.audience==='engineer'?`<details class="detail"><summary>${lang==='ru'?'Операции и оборудование':'Operations & equipment'}</summary><div class="detail-content">${route.equipment.map(x=>`<p style="margin:5px 0">• ${esc(x)}</p>`).join('')}</div></details>`:'';
 const labGate=route.lab_gate_evaluations.length?`<details class="detail"><summary>${lang==='ru'?'Лабораторный фильтр':'Lab screening gate'}</summary><div class="detail-content">${route.lab_gate_evaluations.map(g=>`<p>${lang==='ru'?'Инфильтрация':'Infiltration'}: ${esc(g.observed?.measured_value??'—')} ${esc(g.observed?.unit??'')} / ${lang==='ru'?'условный минимум':'illustrative minimum'} ${esc(g.observed?.required_minimum??'—')} · ${g.passed?'PASS':'BLOCK'}<br><strong>${lang==='ru'?'Не является Ksat под нагрузкой':'Not loaded Ksat'}</strong></p>`).join('')}</div></details>`:'';
 $('#why-details')!.innerHTML=`${blocks}<div class="detail-list">${formula}${traces}${labGate}${equipment}</div><p class="micro-note">${esc(tt.notApproved)}</p>`;
 document.querySelectorAll<HTMLButtonElement>('#why-details [data-protocol]').forEach(b=>b.addEventListener('click',()=>void openProtocol(b.dataset.protocol!)));
}
function renderTestwork(){
 const lang=state.lang;
 const relevant=evaluation.testworkPlan.filter(p=>p.status!=='not_indicated').sort((a,b)=>(a.priority??99)-(b.priority??99)||String(a.test_id).localeCompare(String(b.test_id)));
 const collapsed=state.audience==='executive'?relevant.slice(0,7):relevant;
 $('#testwork-plan')!.innerHTML=`<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px">${(['available','needed','blocked_constraint'] as const).map(s=>`<span class="pill ${TEST_BADGE[s].className}">${esc(TEST_BADGE[s][lang])}: ${relevant.filter(r=>r.status===s).length}</span>`).join('')}</div>${collapsed.map(p=>`<div class="test-item"><div style="max-width:200px"><div class="test-label">${esc(nameOfTest(p,lang))}</div><small>${esc(p.test_id??'—')} ${p.accepted_run_ids?.length?'· '+esc(p.accepted_run_ids.join(', ')):''}</small></div><span class="pill ${TEST_BADGE[p.status].className}">${esc(TEST_BADGE[p.status][lang])}</span></div>`).join('')}${state.audience==='executive'&&relevant.length>7?`<p class="micro-note">+${relevant.length-7} ${lang==='ru'?'испытаний доступны в режиме технолога':'more items in engineer mode'}</p>`:''}<div class="callout" style="margin-top:12px">${icon('flask',16)}<span>${lang==='ru'?'«Нужен опыт» означает неопределённость, а не то, что операция непригодна.':'Missing a test means uncertainty, not proof that a process is unsuitable.'}</span></div>`;
}
async function main(){
 try{data=await loadData();renderLayout();}
 catch(err){app.innerHTML=`<div class="wrap" style="padding-top:60px"><div class="errorbox"><strong>Ошибка загрузки исходных данных</strong><p>${esc((err as Error).message)}</p><p>Запустите локальный HTTP-сервер из папки dist: <code>npm run serve</code>. Открытие HTML как file:// не поддерживается.</p></div></div>`;}
}
void main();
