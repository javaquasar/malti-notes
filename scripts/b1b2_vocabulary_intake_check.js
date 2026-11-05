/* Source-reviewed B1/B2 lexical intake: physical mounts, saved IDs and generated data. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const {spawnSync} = require('node:child_process');
// Immutable IDs from the pre-intake, browser-verified 2ad249c snapshot.
// Deflated only to keep this self-contained checker compact; no network/Git needed.
const BASELINE = JSON.parse(zlib.inflateSync(Buffer.from("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", "base64")).toString("utf8"));
const EXPECTED = {units:284, labels:274, added:225, enriched:38, nonCourseEnriched:32, sourceKeysSha256:'177e57ff25cd74072df1eb6deb78c295f8b77daf9d2361933b78209a4d1b4c99'};
const norm = x=>String(x??'').normalize('NFKC').replace(/[’‘`´]/g,"'").replace(/\s+/g,' ').trim().toLocaleLowerCase('mt');
const articleNorm = x=>norm(x).replace(/^(?:il-|i[tdnrsxżċz]-|l-)/,'');
const alternatives = x=>String(x??'').split(/\s+\/\s+|\s*(?:→|->)\s*/).map(norm).filter(Boolean);
const idOf = x=>x.slug||x.id||x.lemma;
const keyOf = r=>[r.file,r.groupId,r.slug].join('#');
const sha = x=>crypto.createHash('sha256').update(x).digest('hex');
const esc = x=>String(x).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const text = x=>typeof x==='string'&&x.trim().length>0;
const notes = i=>[...(Array.isArray(i.notes)?i.notes:text(i.notes)?[i.notes]:[]),...(text(i.note)?[i.note]:[])];
const same = (a,b)=>JSON.stringify(a)===JSON.stringify(b);
const PROVENANCE = /\bB[123]\b|Malti\.B|\btextbook\b|\b(?:audit|audited|source)\b|book[- ]aligned|\bbook\s+(?:pp\.?|pages?|chapter|series)\b|printed\s+pages?|supplied\s+(?:book|material)|Ktieb tal-istudent|Schola Publications|transcript|OCR/i;

function checkIntake(root,options={}) {
 root=path.resolve(root);const errors=[];let checks=0;
 const check=(ok,message)=>{checks++;if(!ok)errors.push(message);};
 const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8').replace(/^\uFEFF/,''));
 const safe=file=>typeof file==='string'&&/^assets\/data\/.+\.json$/.test(file)&&!file.split('/').includes('..');
 const manifest=read(options.manifest||'docs/analysis/b1-b2-vocabulary-intake.json');
 const ds=manifest.dispositions||[];check(ds.length===EXPECTED.units,'Expected 284 source-unit dispositions');
 const keys=ds.map(d=>d.auditKey).sort();check(new Set(keys).size===keys.length,'Duplicate source audit keys');
 check(sha(JSON.stringify(keys))===EXPECTED.sourceKeysSha256,'Source book/lemma set differs from pinned 284-unit audit queue');
 check(new Set(ds.map(d=>d.auditLemma)).size===EXPECTED.labels,'Expected 274 cross-book labels');
 for(const book of ['B1','B2'])check(ds.filter(d=>d.book===book).length===({B1:83,B2:201}[book]),`${book}: stale source-unit count`);
 if(options.sourceAudit) {
  const source=JSON.parse(fs.readFileSync(options.sourceAudit,'utf8'));
  const expected=source.records.flatMap(r=>r.sources.map(s=>s.book+'::'+r.label)).sort();
  check(same(keys,expected),'Manifest source keys differ from supplied COMBINED_GAPS audit');
 }
 check(manifest.source.auditUnits===1012&&manifest.source.previouslyCovered===728&&manifest.source.gapUnits===284,'Source inventory accounting changed');
 const configs=new Map();
 for(const page of fs.readdirSync(root).filter(x=>x.endsWith('.html'))) {
  const html=fs.readFileSync(path.join(root,page),'utf8');
  const config=html.match(/(?:window\.)?MaltiVocabReviewPage\s*=\s*\{([\s\S]*?)\};/)?.[1];if(!config)continue;
  const prop=k=>config.match(new RegExp('\\b'+esc(k)+':\\s*["\']([^"\']+)["\']'))?.[1];
  const url=prop('dataUrl');if(!url?.startsWith('./assets/data/'))continue;
  const file=url.slice(2);const owners=configs.get(file)||[];
  owners.push({page,html,prefix:prop('reviewPrefix'),attribute:prop('groupAttribute')});configs.set(file,owners);
 }
 const banks=new Map(), physical=new Map(), canonical=[];
 const getBank=file=>{
  if(banks.has(file))return banks.get(file);
  check(safe(file),`Unsafe bank path: ${file}`);if(!safe(file))return null;
  if(!fs.existsSync(path.join(root,file))){check(false,`Missing bank: ${file}`);return null;}
  const data=read(file);let groups=data.groups;
  if(!groups&&Array.isArray(data.supplementalItems))groups=[{id:data.chapter.id+'-supplement',items:data.supplementalItems}];
  check(Array.isArray(groups),`No card groups in ${file}`);if(!Array.isArray(groups))return null;
  const b={file,data,groups};banks.set(file,b);return b;
 };
 const register=(file,group,item,reviewId,tier)=>{
  const key=keyOf({file,groupId:group.id,slug:idOf(item)});
  const value={file,groupId:group.id,slug:idOf(item),item,reviewId,tier,key};physical.set(key,value);return value;
 };
 for(const [file,owners] of configs) {
  const b=getBank(file);if(!b)continue;
  const ids=new Set(),groupIds=new Set();
  for(const group of b.groups) {
   check(!groupIds.has(group.id),`Duplicate group ID ${file}#${group.id}`);groupIds.add(group.id);
   const mounts=owners.filter(o=>o.attribute&&new RegExp('\\b'+esc(o.attribute)+'\\s*=\\s*(["\'])'+esc(group.id)+'\\1').test(o.html));
   check(mounts.length>0,`No literal shared-renderer mount for ${file}#${group.id}`);
   if(!mounts.length)continue;
   for(const item of group.items||[]) {
    const stable=idOf(item);check(text(stable)&&!ids.has(norm(stable)),`Duplicate/missing stable ID in ${file}: ${stable}`);ids.add(norm(stable));
    if(item.verificationStatus==='needs-review'||item.review?.enabled===false)continue;
    const value=register(file,group,item,'word::'+mounts[0].prefix+'::'+norm(item.slug||item.maltese),'topic');canonical.push(value);
   }
  }
 }
 const courses=[],courseDefinitions=[];
 for(const base of fs.readdirSync(path.join(root,'assets/data/course/chapters')).filter(f=>f.endsWith('.json'))) {
  const file='assets/data/course/chapters/'+base,b=getBank(file);if(!b)continue;
  const mounted=new Set((b.data.targets||[]).filter(t=>t.contentRef?.file==='assets/data/course_supplemental_content.json').map(t=>t.id));
  for(const group of b.groups)for(const item of group.items||[]) {
   courseDefinitions.push({file,groupId:group.id,item,reviewId:'word::course-supplement::'+item.id});
   if(mounted.has(item.id))courses.push(register(file,group,item,'word::course-supplement::'+item.id,'course'));
  }
 }
 const verbBank=getBank('assets/data/imperative_verbs.json'),verbs=[];
 for(const group of verbBank.groups)for(const item of group.items||[]) {
  const prefix=group.id==='tricky'?'imperative-tricky':'imperative-shortlist';
  verbs.push(register(verbBank.file,group,item,'word::'+prefix+'::'+norm(item.lemma),'verb'));
 }
 for(const item of verbBank.data.lesson23?.trickyItems||[])verbs.push(register(verbBank.file,{id:'tricky'},item,'word::imperative-tricky::'+norm(item.lemma),'verb'));
 const year4=read('assets/data/year4_revision_vocabulary.json');const year4Ids=new Set(),exam=[];
 for(const c of year4.collections)for(const g of c.groups)for(const i of g.items) {
  year4Ids.add('word::year-4-exam::'+norm(idOf(i)||i.maltese));
  if(c.id==='exam')exam.push(register('assets/data/year4_vocabulary.json',g,i,'word::year-4-exam::'+norm(idOf(i)||i.maltese),'exam'));
 }
 const added=new Map(),resolved=new Map(),nonCourseChanged=new Set(),courseChanged=new Set();
 const resolve=(r,label)=>{
  check(safe(r?.file)&&text(r?.groupId)&&text(r?.slug),`${label}: incomplete or unsafe physical reference`);
  if(!safe(r?.file))return null;
  const k=keyOf(r),v=physical.get(k);check(!!v,`${label}: referenced item has no real word-card mount: ${k}`);if(!v)return null;
  check(r.reviewId===v.reviewId,`${label}: stable review ID mismatch ${r.reviewId} vs ${v.reviewId}`);
  if(v.tier==='exam') {
   const original=getBank(r.file)?.groups.find(g=>g.id===r.groupId)?.items.find(i=>idOf(i)===r.slug);
   check(!!original,`${label}: Year4 canonical source item missing`);
   for(const f of ['maltese','english','example','exampleTranslation','notes'])check(same(original?.[f],v.item[f]),`${label}: stale Year4 generated ${f}`);
  }
  resolved.set(k,v);return v;
 };
 const visible=(wanted,item)=>{
  const w=norm(wanted),aw=articleNorm(wanted);
  if(alternatives(item.maltese||item.lemma).some(a=>a===w||articleNorm(a)===aw))return true;
  const re=new RegExp('(^|[^\\p{L}\\p{N}])'+esc(w)+'($|[^\\p{L}\\p{N}])','u');return notes(item).some(n=>re.test(norm(n)));
 };
 for(const d of ds) {
  check(d.auditKey===d.book+'::'+d.auditLemma,`${d.auditKey}: inconsistent source identity`);
  check(['add','enrich','covered','merge','existing'].includes(d.action),`${d.auditKey}: unknown disposition action`);
  check(Array.isArray(d.evidence)&&d.evidence.length>0,`${d.auditKey}: no lexical review evidence`);
  check(Array.isArray(d.cards)&&d.cards.length>0,`${d.auditKey}: no physical card disposition`);
  const values=[];
  for(const r of d.cards||[]) {
   const v=resolve(r,d.auditKey);if(!v)continue;values.push(v);
   if(r.addedCard) {const prev=added.get(v.key);v.approvals=[...(prev?.approvals||[]),{senseDistinction:d.senseDistinction===true||r.senseDistinction===true,reason:r.reason||d.reason||''}];added.set(v.key,v);}
   else if(v.tier==='course')courseChanged.add(v.key);else nonCourseChanged.add(v.key);
  }
  for(const wanted of alternatives(d.headword))check(values.some(v=>visible(wanted,v.item)),`${d.auditKey}: head/accepted form not visible: ${wanted}`);
 }
 for(const k of added.keys())nonCourseChanged.delete(k);
 const listedAdded=manifest.addedCards||[];
 check(listedAdded.length===EXPECTED.added&&added.size===EXPECTED.added,'Expected exactly 225 unique new physical cards');
 check(new Set(listedAdded.map(keyOf)).size===listedAdded.length,'Duplicate addedCards manifest references');
 check(same([...added.keys()].sort(),listedAdded.map(keyOf).sort()),'addedCards list does not match source dispositions');
 for(const v of added.values()) {
  for(const f of ['slug','maltese','english','example','exampleTranslation'])check(text(v.item[f]),`${v.key}: new card lacks ${f}`);
  check(v.item.verificationStatus!=='needs-review',`${v.key}: quarantined card counted as published`);
  check(!Object.keys(v.item.pendingClaims||{}).length,`${v.key}: unresolved pending linguistic claim`);
  for(const f of ['maltese','english','example','exampleTranslation','note','notes','imageAlt'])for(const t of(Array.isArray(v.item[f])?v.item[f]:[v.item[f]]))if(typeof t==='string')check(!PROVENANCE.test(t),`${v.key}: learner-facing ${f} includes source-book/development provenance`);
 }
 check(manifest.enrichedCards.length===EXPECTED.nonCourseEnriched,'Expected 32 enriched non-course source cards');
 for(const e of manifest.enrichedCards) {
  const v=resolve({...e,reviewId:physical.get(keyOf(e))?.reviewId},'enriched '+e.slug);if(!v)continue;
  for(const f of ['slug','id'])if(e.before?.[f]!==undefined)check(v.item[f]===e.before[f],`${v.key}: saved stable ${f} changed`);
  const canonicalItem=getBank(e.file)?.groups.find(g=>g.id===e.groupId)?.items.find(i=>idOf(i)===e.slug);
  check(same(canonicalItem,e.after),`${v.key}: enriched after-snapshot is stale`);
 }
 check(nonCourseChanged.size===EXPECTED.nonCourseEnriched&&courseChanged.size===6,'Expected 32 non-course + 6 course existing card dispositions');
 check(manifest.summary.newCards===added.size&&manifest.summary.enrichedCards===nonCourseChanged.size+courseChanged.size,'Summary card counts stale');
 check(manifest.summary.sourceUnitsResolved===ds.length,'Summary source-unit count stale');
 // Compare every new head and explicitly labelled form with mounted canonical,
 // real course supplements, verb cards and the exam-source collection. Mirrored
 // Year4 topical collections are projections, so do not create duplicate pairs.
 const heads=new Map();const all=[...canonical,...courses,...verbs,...exam];
 for(const v of all) {
  const forms=new Set(alternatives(v.item.maltese||v.item.lemma).map(articleNorm));
  for(const n of notes(v.item)) {
   const m=n.match(/^(?:female|feminine|fem|plural|singular|alternative(?: form)?|variant)\s*:\s*(.+?)[.]?$/i);
   if(m)for(const f of alternatives(m[1]))if(!/[=;()]|\bmeans\b|\bis\b/.test(f))forms.add(articleNorm(f.replace(/[.]$/,'')));
  }
  for(const f of forms) {const vs=heads.get(f)||[];vs.push(v);heads.set(f,vs);}
 }
 const duplicatePairs=new Set(),approvedSenses=[];
 for(const [head,vs] of heads)for(let i=0;i<vs.length;i++)for(let j=i+1;j<vs.length;j++) {
  const a=vs[i],b=vs[j];if(a.key===b.key)continue;const fresh=[added.get(a.key),added.get(b.key)].filter(Boolean);if(!fresh.length)continue;
  const pair=[a.key,b.key].sort().join('::');if(duplicatePairs.has(pair))continue;duplicatePairs.add(pair);
  const approved=fresh.every(v=>v.approvals.some(x=>x.senseDistinction&&text(x.reason)))&&norm(a.item.english)!==norm(b.item.english);
  check(approved,`New duplicate head/form '${head}': ${a.key} (${a.item.english}) vs ${b.key} (${b.item.english})`);
  if(approved)approvedSenses.push({head,cards:[a.key,b.key],glosses:[a.item.english,b.item.english]});
 }
 const catalog=read('assets/data/vocabulary_review_catalog.json').words;
 const currentIds={topic:new Set(canonical.map(v=>v.reviewId)),course:new Set(courses.map(v=>v.reviewId)),verb:new Set(verbs.map(v=>v.reviewId)),aggregate:year4Ids};
 for(const [tier,ids] of Object.entries(BASELINE))for(const id of ids) {
  check(currentIds[tier].has(id),`Old saved review ID disappeared (${tier}): ${id}`);
  if(['topic','aggregate','course'].includes(tier))check(!!catalog[id],`Old catalog word ID disappeared: ${id}`);
 }
 for(const v of added.values()) {
  const c=catalog[v.reviewId];check(!!c,`${v.key}: new word absent from global review catalog`);
  for(const f of ['maltese','english','example','exampleTranslation'])check(c?.[f]===v.item[f],`${v.key}: stale catalog ${f}`);
 }
 for(const v of resolved.values())if(v.tier==='course') {
  const c=catalog[v.reviewId];check(!!c,`${v.key}: enriched course word missing from catalog`);
  for(const f of ['maltese','english','example','exampleTranslation'])check(c?.[f]===v.item[f],`${v.key}: stale course catalog ${f}`);
 }
 const gloss=read('assets/data/course_target_glosses.json'),examples=read('assets/data/course_target_examples.json'),supplemental=read('assets/data/course_supplemental_content.json');
 for(const [key,chapter,id,word] of [['b1-animals::brama','b1-animals','b1-animals-brama','brama'],['b2-school-bag::kulur','b2-school-bag','b2-school-bag-kulur','kulur']]) {
  const item=supplemental.chapters.find(c=>c.id===chapter)?.items.find(i=>i.id===id),local=getBank('assets/data/course/chapters/'+chapter+'.json')?.data.supplementalItems.find(i=>i.id===id);
  check(!!item&&!!local,`${word}: missing generated course item`);
  check(item?.english===gloss.glosses[key]&&local?.english===gloss.glosses[key],`${word}: stale canonical/generated gloss`);
  check(item?.example===examples.examples[key]?.maltese&&local?.example===examples.examples[key]?.maltese,`${word}: stale canonical/generated example`);
  if(word==='brama') {
   check(/jellyfish/i.test(gloss.glosses[key]),'brama must mean jellyfish');
   check(!/bream|garden|ġnien/i.test(JSON.stringify([item?.english,item?.example,item?.exampleTranslation,local?.english,local?.example,local?.exampleTranslation])),'brama retains stale bream/garden content');
  }else check(/pencil|crayon/i.test(gloss.glosses[key])&&/pencil|crayon/i.test(item?.exampleTranslation||''),'kulur equipment sense missing or stale');
 }
 const animals=getBank('assets/data/animals.json');
 for(const v of added.values())if(v.file===animals.file&&v.groupId==='wild-sea')check(!/garden|ġnien/i.test(v.item.example+' '+v.item.exampleTranslation),`${v.key}: marine example put in garden`);
 const protectedFiles=['assets/data/animals.json','assets/data/course_target_examples.json'];
 const before=Object.fromEntries(protectedFiles.map(f=>[f,sha(fs.readFileSync(path.join(root,f)))]));
 const builder=spawnSync(process.execPath,[path.join(root,'scripts/build_course_contextual_examples.js'),'--check'],{cwd:root,encoding:'utf8',windowsHide:true});
 check(builder.status===0,'Authored animal/course examples do not survive deterministic builder --check: '+(builder.stderr||builder.stdout).trim());
 for(const f of protectedFiles)check(before[f]===sha(fs.readFileSync(path.join(root,f))),`Read-only builder check mutated ${f}`);
 const report={status:errors.length?'FAIL':'PASS',checks,sourceUnits:ds.length,sourceLabels:new Set(ds.map(d=>d.auditLemma)).size,newCards:added.size,enrichedNonCourse:nonCourseChanged.size,enrichedCourse:courseChanged.size,referencedCards:resolved.size,canonicalBanks:configs.size,mountedCourseCards:courses.length,backedCourseDefinitions:courseDefinitions.length,oldReviewIdsChecked:Object.fromEntries(Object.entries(BASELINE).map(([k,v])=>[k,v.length])),approvedSensePairs:approvedSenses,catalogWords:Object.keys(catalog).length,builderCheck:(builder.stdout||builder.stderr).trim(),errors};
 return report;
}
if(require.main===module) {
 const arg=k=>{const i=process.argv.indexOf(k);return i<0?undefined:process.argv[i+1];};
 try {
  const report=checkIntake(arg('--root')||path.resolve(__dirname,'..'),{manifest:arg('--manifest'),sourceAudit:arg('--source-audit')});
  if(arg('--report'))fs.writeFileSync(arg('--report'),JSON.stringify(report,null,2)+'\n');
  console.log(report.status+' B1/B2 vocabulary intake: '+JSON.stringify({...report,errors:undefined}));
  if(report.errors.length){console.error(report.errors.slice(0,65).join('\n'));process.exitCode=1;}
 }catch(e){console.error(e.stack||e.message);process.exitCode=1;}
}
module.exports={checkIntake,norm,articleNorm,alternatives};
