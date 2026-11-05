/* Verify the completed, source-reviewed vocabulary intake against real banks. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const EXPECTED_UNITS = 336;
const DISPUTED = new Set(['isiefer','isuq','iżomm','jaħsel','jgħallem','jidħol','jħares','nagħtik','naħseb','ngħumu','tiftaħ','issir','Mużew','riħ']);
const ACTIONS = new Set(['add','enrich','existing','merge']);
const normalize = value => String(value ?? '').normalize('NFKC').replace(/[’`´]/g,"'").replace(/\s+/g,' ').trim().toLocaleLowerCase('mt');
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const alternatives = value => String(value || '').split(/\s+\/\s+|\s*(?:→|->)\s*/).map(normalize).filter(Boolean);
const escape = value => String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const identity = (file,group,item) => [file,group,item.slug || item.id || item.lemma || item.maltese].join('#');
const learnerFields = ['maltese','english','example','exampleTranslation','note','notes','imageAlt'];
// Ordinary vocabulary such as ktieb / book and examples about books are valid.
// The rejected text is book provenance or development/audit information in UI.
const provenanceText = /\bB[123]\b|Malti\.B|\btextbook\b|\b(?:audit|audited|source)\b|book[- ]aligned|\bbook\s+(?:pp\.?|pages?|chapter|series)\b|printed\s+pages?|supplied\s+(?:book|material)|Ktieb tal-istudent|Schola Publications|transcript|OCR/i;

function configurations(root) {
  const result = new Map();
  for (const page of fs.readdirSync(root).filter(file=>file.endsWith('.html')).sort()) {
    const html = fs.readFileSync(path.join(root,page),'utf8');
    const config = html.match(/(?:window\.)?MaltiVocabReviewPage\s*=\s*\{([\s\S]*?)\};/)?.[1];
    if (!config) continue;
    const property = key => config.match(new RegExp('\\b'+escape(key)+':\\s*["\']([^"\']+)["\']'))?.[1];
    const url = property('dataUrl');
    if (!url?.startsWith('./assets/data/')) continue;
    const file = url.slice(2);
    const records = result.get(file) || [];
    records.push({page,html,attribute:property('groupAttribute'),prefix:property('reviewPrefix')});
    result.set(file,records);
  }
  return result;
}

function checkIntake(root, manifestFile='docs/analysis/b3-vocabulary-intake.json') {
  root = path.resolve(root);
  const errors=[];
  const check = (condition,message) => { if (!condition) errors.push(message); };
  const read = file => JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  const manifest=read(manifestFile);
  const dispositions=manifest.dispositions;
  assert.ok(Array.isArray(dispositions),'Manifest dispositions must be an array');
  check(dispositions.length===EXPECTED_UNITS,`Expected ${EXPECTED_UNITS} audit-unit dispositions, got ${dispositions.length}`);
  if (manifest.source?.gapUnits !== undefined) check(manifest.source.gapUnits===EXPECTED_UNITS,'Source gap-unit total changed');
  if (manifest.source?.auditUnits !== undefined && manifest.source?.previouslyCovered !== undefined) {
    check(manifest.source.auditUnits===manifest.source.previouslyCovered+EXPECTED_UNITS,'Source total must equal previously covered plus intake units');
  }
  const configs=configurations(root);
  const banks=new Map();
  const added=new Map();
  const resolved=new Map();
  const units=new Set();
  const actionCounts={};

  function bank(file) {
    if (banks.has(file)) return banks.get(file);
    check(typeof file==='string' && /^assets\/data\/.+\.json$/.test(file) && !file.split('/').includes('..'),`Unsafe or non-data bank reference: ${file}`);
    if(typeof file!=='string'||!/^assets\/data\/.+\.json$/.test(file)||file.split('/').includes('..'))return null;
    const absolute=path.resolve(root,file);
    check(absolute.startsWith(root+path.sep) && fs.existsSync(absolute),`Missing data bank: ${file}`);
    if(!absolute.startsWith(root+path.sep)||!fs.existsSync(absolute))return null;
    const data=read(file);
    let groups=data.groups;
    if (!groups && Array.isArray(data.supplementalItems)) {
      groups=[{id:path.basename(file,'.json')+'-supplement',items:data.supplementalItems}];
    }
    check(Array.isArray(groups),`No supported groups in ${file}`);
    if(!Array.isArray(groups))return null;
    const groupIds=new Set();
    const ids=new Map();
    for(const group of groups) {
      check(nonempty(group.id)&&!groupIds.has(group.id),`Duplicate or empty group ID in ${file}: ${group.id}`);
      groupIds.add(group.id);
      for(const item of group.items||[]) {
        const id=item.slug||item.id||item.lemma||item.maltese;
        if(!nonempty(id))continue;
        const key=normalize(id);
        const previous=ids.get(key);
        check(!previous,`Duplicate stable ID in ${file}: ${id} (${previous} and ${group.id})`);
        ids.set(key,group.id);
      }
    }
    const value={file,data,groups};banks.set(file,value);return value;
  }

  function resolve(reference,unit) {
    const file=reference?.file;
    const data=bank(file);
    if(!data)return null;
    check(nonempty(reference.groupId)&&nonempty(reference.slug),`${unit}: card reference requires groupId and slug`);
    const group=data.groups.find(group=>group.id===reference.groupId);
    check(Boolean(group),`${unit}: missing group ${file}#${reference.groupId}`);
    if(!group)return null;
    // Canonical vocab uses slug/id; the shared imperative adapter uses lemma.
    const candidates=(group.items||[]).filter(item=>[item.slug,item.id,...(file==='assets/data/imperative_verbs.json'?[item.lemma]:[])].includes(reference.slug));
    check(candidates.length===1,`${unit}: expected one exact card ${file}#${reference.groupId}/${reference.slug}, found ${candidates.length}`);
    if(candidates.length!==1)return null;
    const item=candidates[0];
    const owners=configs.get(file)||[];
    if(owners.length) {
      const mounts=owners.filter(owner=>owner.attribute&&new RegExp('\\b'+escape(owner.attribute)+'\\s*=\\s*(["\'])'+escape(group.id)+'\\1').test(owner.html));
      check(mounts.length>0,`${unit}: group has no real vocabulary-card mount: ${file}#${group.id}`);
      if(reference.reviewId&&mounts.length) {
        const possible=mounts.map(owner=>'word::'+owner.prefix+'::'+normalize(item.slug||item.maltese));
        check(possible.includes(reference.reviewId),`${unit}: review identity mismatch for ${file}/${reference.slug}: ${reference.reviewId}`);
      }
    } else if(file==='assets/data/imperative_verbs.json') {
      if(reference.reviewId) {
        const prefix=group.id==='tricky'?'imperative-tricky':'imperative-shortlist';
        check(reference.reviewId==='word::'+prefix+'::'+normalize(item.lemma),`${unit}: imperative review identity changed`);
      }
    } else if(Array.isArray(data.data.supplementalItems)) {
      if(reference.reviewId)check(reference.reviewId==='word::course-supplement::'+item.id,`${unit}: course supplement review identity changed`);
    } else {
      check(false,`${unit}: reference is not bound to an existing topical vocabulary renderer: ${file}`);
    }
    const value={file,groupId:group.id,item,reference,unit,key:identity(file,group.id,item)};
    resolved.set(value.key,value);
    return value;
  }

  for(const disposition of dispositions) {
    check(nonempty(disposition.auditLemma),'Empty auditLemma in manifest');
    const key=normalize(disposition.auditLemma);
    check(!units.has(key),`Duplicate audit-unit disposition: ${disposition.auditLemma}`);
    units.add(key);
    check(ACTIONS.has(disposition.action),`${disposition.auditLemma}: invalid action ${disposition.action}`);
    actionCounts[disposition.action]=(actionCounts[disposition.action]||0)+1;
    check(Array.isArray(disposition.cards)&&disposition.cards.length>0,`${disposition.auditLemma}: no concrete card disposition`);
    if(DISPUTED.has(disposition.auditLemma)) {
      check(nonempty(disposition.reason),`${disposition.auditLemma}: disputed form/sense requires a review reason`);
      const evidence=disposition.evidence||disposition.evidenceRefs;
      check(Array.isArray(evidence)?evidence.length>0:Boolean(evidence&&typeof evidence==='object'),`${disposition.auditLemma}: disputed form/sense requires review evidence`);
    }
    const dispositionCards=[];
    for(const reference of disposition.cards||[]) {
      const value=resolve(reference,disposition.auditLemma);
      if(!value)continue;
      dispositionCards.push(value);
      const isAdded=reference.addedCard===true || (reference.addedCard===undefined&&disposition.action==='add');
      if(isAdded) {
        const previous=added.get(value.key);
        value.approvals=[...(previous?.approvals||[]),{senseDistinction:reference.senseDistinction===true||disposition.senseDistinction===true,reason:reference.reason||disposition.reason||''}];
        added.set(value.key,value);
      }
    }
    if(nonempty(disposition.headword)) {
      const expected=[...new Set(alternatives(disposition.headword))];
      const visible=expected.every(word=>dispositionCards.some(({item})=>{
        if(alternatives(item.maltese||item.lemma).includes(word))return true;
        const notePattern=new RegExp('(^|[^\\p{L}\\p{N}])'+escape(word)+'($|[^\\p{L}\\p{N}])','u');
        const notes=[...(Array.isArray(item.notes)?item.notes:nonempty(item.notes)?[item.notes]:[]),...(nonempty(item.note)?[item.note]:[])];
        return notes.some(note=>notePattern.test(normalize(note)));
      }));
      check(visible,`${disposition.auditLemma}: proposed headword alternatives are not all visible as whole headwords or explicit notes; aliases and example mentions alone do not establish coverage`);
    }
  }
  for(const required of DISPUTED)check(dispositions.some(disposition=>disposition.auditLemma===required),`Missing disputed-unit disposition: ${required}`);

  for(const value of added.values()) {
    const item=value.item;
    for(const field of ['slug','maltese','english','example','exampleTranslation'])check(nonempty(item[field]),`${value.unit}: new card ${value.key} lacks ${field}`);
    check(item.verificationStatus!=='needs-review',`${value.unit}: unresolved card cannot count as published coverage`);
    for(const field of learnerFields) {
      const texts=Array.isArray(item[field])?item[field]:[item[field]];
      for(const text of texts)if(typeof text==='string')check(!provenanceText.test(text),`${value.unit}: learner-facing ${field} contains audit/book information: ${text}`);
    }
  }

  // Old overlap between established topic pages is retained. Any collision
  // involving a newly introduced card needs an explicit, different sense.
  const headwords=new Map();
  for(const file of configs.keys()) {
    if(/year4|vocabulary_review_catalog/.test(file))continue;
    const data=bank(file);if(!data)continue;
    for(const group of data.groups)for(const item of group.items||[]) {
      if(!item.maltese||!item.english||item.verificationStatus==='needs-review')continue;
      const card={file,groupId:group.id,item,key:identity(file,group.id,item)};
      for(const word of new Set(alternatives(item.maltese))) {
        const values=headwords.get(word)||[];
        values.push(card);headwords.set(word,values);
      }
    }
  }
  let legacyDuplicatePairs=0,approvedSensePairs=0;
  const pairs=new Set();
  for(const [word,cards] of headwords)for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++) {
    const a=cards[i],b=cards[j];if(a.key===b.key)continue;
    const pair=[a.key,b.key].sort().join('::');if(pairs.has(pair))continue;pairs.add(pair);
    const introduced=[added.get(a.key),added.get(b.key)].filter(Boolean);
    if(!introduced.length){legacyDuplicatePairs++;continue;}
    const approved=introduced.every(card=>card.approvals.some(approval=>approval.senseDistinction&&nonempty(approval.reason)))&&normalize(a.item.english)!==normalize(b.item.english);
    check(approved,`Unapproved new duplicate headword ${word}: ${a.key} (${a.item.english}) and ${b.key} (${b.item.english})`);
    if(approved)approvedSensePairs++;
  }

  if(Array.isArray(manifest.enrichedCards)) {
    check(new Set(manifest.enrichedCards.map(card=>[card.file,card.groupId,card.slug].join('#'))).size===manifest.enrichedCards.length,'Duplicate enriched-card audit record');
    for(const entry of manifest.enrichedCards) {
      const value=resolve(entry,'enriched '+entry.slug);if(!value)continue;
      for(const field of ['slug','id'])if(entry.before?.[field]!==undefined)check(value.item[field]===entry.before[field],`Enriched card stable ${field} changed: ${value.key}`);
    }
    if(manifest.summary?.enrichedCards!==undefined)check(manifest.summary.enrichedCards===manifest.enrichedCards.length,'Enriched-card summary is stale');
  }
  if(manifest.summary?.newCards!==undefined)check(manifest.summary.newCards===added.size,`New-card summary is stale: expected ${added.size}, found ${manifest.summary.newCards}`);
  if(manifest.summary?.sourceUnitsResolved!==undefined)check(manifest.summary.sourceUnitsResolved===units.size,'Resolved-unit summary is stale');
  if(errors.length)throw new Error(`${errors.length} vocabulary-intake failure(s):\n`+errors.slice(0,60).join('\n')+(errors.length>60?'\n...':''));
  return {sourceUnits:units.size,dispositions:actionCounts,newCards:added.size,enrichedCards:manifest.enrichedCards?.length||0,referencedCards:resolved.size,canonicalBanks:configs.size,approvedSensePairs,retainedLegacyDuplicatePairs:legacyDuplicatePairs,disputedUnitsReviewed:DISPUTED.size};
}

if(require.main===module) {
  try {
    const argument=name=>{const index=process.argv.indexOf(name);return index<0?null:process.argv[index+1];};
    const root=argument('--root')||path.resolve(__dirname,'..');
    const report=checkIntake(root,argument('--manifest')||'docs/analysis/b3-vocabulary-intake.json');
    console.log('PASS B3 vocabulary intake: '+JSON.stringify(report));
  } catch(error) {console.error(error.message);process.exitCode=1;}
}
module.exports={checkIntake,normalize,alternatives};
