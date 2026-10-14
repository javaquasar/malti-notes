"""Build the numbers extension from the local, provenance-aware lesson extraction.

Usage: python scripts/import_numbers_materials.py path/to/lesson02-learning-content.json
Generated data is committed; running the website never needs the local source folder.
"""
import argparse
import copy
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
args = parser.parse_args()
source = json.loads(args.source.read_text(encoding='utf-8'))
items = copy.deepcopy(source['learning_items'])
units = {u['id']: u for u in source['source_units']}
sections = {k: [] for k in ['number-forms', 'large-numbers', 'number-builder', 'dual-forms', 'fractions', 'measurements', 'temperature', 'decades', 'extra-time-expressions']}
coverage, questions, notes = [], [], []

references = [
 {'id':'decimal-order','title':'National Council for the Maltese Language: decimal measurements (question 39)','url':'https://kunsilltalmalti.gov.mt/mistoqsija-u-twegiba-26-51/'},
 {'id':'number-forms','title':'Għidha bil-Malti: numbers before nouns','url':'https://ghidhabilmalti.mt/iktibha-tajjeb/in-numri-man-nom-u-t-t-marbuta'},
 {'id':'maths','title':'National Literacy Agency: bilingual mathematics glossary','url':'https://nla.gov.mt/wp-content/uploads/2023/12/A-Bilingual-Glossary-of-Mathematics-Terms-The-Early-and-Junior-Years.pdf'},
 {'id':'dual-sacks','title':'University of Malta: L-Allomorfija (xkora / xkertejn)','url':'https://www.um.edu.mt/library/oar/bitstream/123456789/95807/3/L-Allomorfija.pdf'},
 {'id':'dual-wings','title':'National Council: Tagħrif fuq il-Kitba Maltija (ġwinħajn)','url':'https://kunsilltalmalti.gov.mt/wp-content/uploads/2023/03/taghrif.pdf'},
 {'id':'time-expression','title':'National Council: ilbiraħtlula (question 81)','url':'https://kunsilltalmalti.gov.mt/mistoqsija-u-twegiba-77-102/'}
]
fraction_examples = {
 2:('Ħallejna kwart mill-pizza fil-kaxxa biex nikluha aktar tard id-dar.','We left a quarter of the pizza in the box to eat later at home.'),
 3:('Tnejn minn tlitt itfal kellhom is-sogħla.','Two out of three children had a cough.'),
 4:('Nofs is-sala kienet mimlija bin-nies.','Half the hall was full of people.'),
 5:('Tliet kwarti mit-tfal m’għamlux ix-xogħol għax sabuh tqil u l-għalliema spjegatu mill-ġdid.','Three quarters of the children did not do the work because they found it difficult, and the teacher explained it again.'),
 6:('Wieħed u tliet kwarti ta’ kilo jiġu daqs 1750 gramma.','One and three quarters of a kilogram equals 1,750 grams.'),
 7:('Kielu tnejn u tnejn minn ħamsa mill-kejkiet li kien hemm fil-festin.','They ate two and two fifths of the cakes at the party.')
}
decimals = {3:'żero millimetri punt erbgħa',4:'żero millimetri punt sitta',5:'millimetru punt tmienja',6:'żewġ millimetri punt tlieta',7:'erbatax-il millimetru punt wieħed'}
quizzes = {8:('seba’ millimetri punt erbgħa',['seba’ millimetri punt erbgħa','sebgħa millimetri punt erbgħa','seba’ millimetri punt erba’']),
 9:('tnax-il millimetru punt ħamsa',['tnax-il millimetru punt ħamsa','tnax-il ċentimetru punt ħamsa','tnax-il millimetru u ħames millimetri']),
 10:('żewġ millimetri punt erbgħa',['żewġ millimetri punt erbgħa','żewġ ċentimetri punt erbgħa','żewġ millimetri punt erba’'])}

def route(i):
    t=i['type']; mid=i['source_refs'][0]['material_id']
    if t=='number_forms': return 'number-forms'
    if t=='integer': return 'large-numbers'
    if t=='word_building': return 'number-builder'
    if t in ['dual_pair','rule','transformation_exercise']: return 'dual-forms'
    if t=='fraction': return 'fractions'
    if t in ['unit_vocabulary','measurement','decimal_or_money']: return 'measurements'
    if t in ['weather_forecast','temperature']: return 'temperature'
    if t=='decade': return 'decades'
    if t=='useful_expression': return 'extra-time-expressions'
    if mid.startswith('23-'): return 'temperature'
    if mid.startswith('25-'): return 'fractions'
    if mid.startswith('l-ghadd-'): return 'dual-forms'
    if mid=='decimali': return 'measurements'
    if mid=='numri-breakout-rooms': return 'large-numbers'
    if i.get('task')=='quantities-to-words': return 'fractions' if '/' in i['prompt_mt'] else 'measurements'
    return 'number-forms' if i.get('options_mt') or mid.startswith('in-numri-pp') else 'large-numbers'

def record(i,mt,en,**extra):
    return {'id':i['id'],'maltese':mt,'english':en,'sourceRefs':i['source_refs'],**extra}

for i in items:
    mid=i['source_refs'][0]['material_id']; page=i['source_refs'][0]['unit_number']; t=i['type']; section=route(i)
    original=copy.deepcopy(i); changed=False; deferred=False
    if t=='exercise' and 'Celcius' in str(i.get('answer_mt')):
        i['answer_mt']=i['answer_mt'].replace('Celcius','Celsius')
        i['options_mt']=[v.replace('Celcius','Celsius') for v in i['options_mt']]; changed=True
    if mid=='decimali' and t=='measurement':
        i['source_variants_mt']=[decimals[page]]; changed=True
    if mid=='decimali' and t=='exercise':
        i['answer_mt'],i['options_mt']=quizzes[page]; changed=True
    if mid=='5-kejl-u-uzin' and t=='measurement':
        if page==8: i['source_variants_mt']=['tliet kwarti ta’ kilo','seba’ mija u ħamsin gramma']; changed=True
        if page in [3,5]: i['source_variants_mt']=[v for v in i['source_variants_mt'] if not v.startswith(('wieħed punt','tnejn punt'))]; changed=True
        if page==6: i['source_variants_mt'][0]='kwart ta’ kilo'; changed=True
    if mid.startswith('25-') and t=='exercise' and page==12:
        i['answer_mt']='żewġ kuċċarini u nofs'; i['options_mt'][0]=i['answer_mt']; changed=True
    if mid=='numri-kbar-ghaxart-elefijiet-y-5-6' and page in [4,10,12]:
        i['maltese']=i['maltese'].replace('mija sebgħa','mija u sebgħa').replace('mitejn wieħed','mitejn u wieħed'); changed=True
    if t=='dual_pair' and i['singular_mt']=='Rkopa':
        i['singular_mt']='irkoppa'; i['dual_mt']='irkopptejn'; changed=True
    if t=='useful_expression' and 'lbiraħtlula' in i['maltese']:
        i['maltese']=i['maltese'].replace('lbiraħtlula','ilbiraħtlula'); changed=True
    if mid=='l-ghadd-imtenni' and t=='exercise' and i.get('sequence_number')==5:
        i['prompt_mt']=i['prompt_mt'].replace('(2 passi)','(2 pass)'); changed=True
    if t=='exercise' and i.get('answer_mt') in ['tlett','tlitt']:
        i['accepted']=['tlett','tlitt']
    if t=='exercise' and 'Fit-9' in i['prompt_mt']:
        i['prompt_mt']=i['prompt_mt'].replace('Fit-9','Fid-9'); changed=True
    if mid=='numri-breakout-rooms' and i.get('proposed_answer_mt'):
        i['answer_mt']=i['proposed_answer_mt']; changed=True
    if i.get('task')=='listening': deferred=True
    disposition='editorially-corrected' if changed else 'source-retained'
    if deferred: disposition='deferred-missing-audio'
    if t=='exercise':
        if not deferred:
            assert i.get('answer_mt'), i
            q={'id':i['id'],'topic':section,'prompt':i['prompt_mt'],'answer':i['answer_mt'],
               'accepted':i.get('accepted',[i['answer_mt']]),'options':i.get('options_mt') or [],
               'value':i.get('value'),'visualValue':i.get('visual_value'),
               'sourceRefs':i['source_refs'],'explanation':{
                 'number-forms':'Use the form required by the noun, not the standalone counting form.',
                 'large-numbers':'Read the hundreds and thousands in groups; inside a two-digit number, the unit comes before the ten.',
                 'fractions':'Identify the equal parts, then read the fraction or the mixed number.',
                 'dual-forms':'Use the lexical dual form; changes inside the stem must also be learned.',
                 'measurements':'State the whole amount with its unit, then punt and the decimal digits. Prices can be read as euro and cents.',
                 'temperature':'Use gradi with the short forms 2–10; the examples for 15, 25 and 30 use grad.'}[section],
               'editorialStatus':disposition}
            if i.get('task')=='words-to-digits': q['answerKind']='integer'
            q['english']=('Write in digits: ' if i.get('task')=='words-to-digits' else 'Write in Maltese: ')+str(i.get('value') or i.get('visual_value') or i['answer_mt']) if i.get('task') in ['words-to-digits','digits-to-words'] else None
            if mid.startswith('25-') and page==12: q['explanation']='Żewġ takes the plural kuċċarini. This example practises language, not medicine dosage.'
            questions.append(q)
    elif t=='transformation_exercise':
        lines=[line.strip() for line in units[i['source_refs'][0]['unit_id']]['source_text'].splitlines() if line.strip()]
        # Each bold target is a standalone lexical drill; sentence-level agreement is not silently guessed.
        for n,target in enumerate(i['targets']):
            questions.append({'id':i['id']+'-'+str(n+1),'topic':'dual-forms','prompt':target['source_mt']+' → 2',
                              'answer':target['proposed_target_mt'],'accepted':[target['proposed_target_mt']], 'options':[],
                              'sourceRefs':i['source_refs'],'explanation':'The dual denotes two. Possessive siequ becomes saqajh (his two feet).','editorialStatus':'lexical-target-only'})
    elif t=='number_forms':
        sections[section].append(record(i,i['standalone_mt'],str(i['value']),kind='forms',value=i['value'],ordinary=i['before_ordinary_noun_mt'],linked=i['before_epenthetic_i_mt']))
    elif t=='dual_pair':
        plurals={'foot':'feet','thigh':'thighs','ear':'ears','eye':'eyes','lip':'lips','shoulder':'shoulders','knee':'knees','elbow':'elbows','finger':'fingers','leg':'legs','hand':'hands','cheek':'cheeks','nail':'nails','day':'days','hour':'hours','week':'weeks','thousand':'thousand','side':'sides','strike':'strikes','year':'years','word':'words','month':'months','time/occasion':'times / occasions','wing':'wings','piece':'pieces','tear':'tears','hole':'holes','hundred':'hundred','step':'steps','sack':'sacks'}
        sections[section].append(record(i,i['dual_mt'],'two '+plurals[i['english']],kind='dual',singular=i['singular_mt']))
    elif t=='rule': sections[section].append(record(i,'L-għadd imtenni',i['explanation_en'],kind='rule'))
    elif t=='weather_forecast': sections[section].append(record(i,i['day_mt'],i['day_en'],kind='forecast',value=i['value'],weather=i['weather_en']))
    elif t=='fraction':
        r=record(i,i['maltese'],i['english'],kind='fraction',value=i['value'])
        if mid.startswith('25-'):
            r['example'],r['exampleTranslation']=fraction_examples[page]
        sections[section].append(r)
    elif t in ['measurement','decimal_or_money']:
        sections[section].append(record(i,' / '.join(i.get('source_variants_mt',[i.get('maltese','')])),str(i['value'])+' '+str(i.get('unit') or ''),kind='measurement',value=i['value'],unit=i.get('unit')))
    elif t=='word_building': sections[section].append(record(i,i['maltese'],f'{i["value"]:,}',kind='builder',value=i['value']))
    elif t=='integer': sections[section].append(record(i,i['maltese'],f'{i["value"]:,}',kind='integer',value=i['value']))
    elif t=='temperature': sections[section].append(record(i,i['maltese'],str(i['value'])+'°C',kind='temperature'))
    elif t=='decade': sections[section].append(record(i,i['maltese'],str(i['example_decade'])+'s',kind='decade'))
    else: sections[section].append(record(i,i.get('maltese',''),i.get('english',''),kind='phrase'))
    coverage.append({'sourceItemId':i['id'],'section':section,'disposition':disposition,'sourceRefs':i['source_refs'],
                     'sourceItem':original if changed or deferred else None})

# Add the remaining everyday number forms beside those explicitly tabulated in the slides.
for n,alone,ordinary,linked in [(2,'tnejn','żewġ','żewġt'),(6,'sitta','sitt','sitt'),(10,'għaxra','għaxar','għaxart')]:
    sections['number-forms'].append({'id':'forms-extra-'+str(n),'kind':'forms','value':n,'maltese':alone,'english':str(n),'ordinary':ordinary,'linked':linked,'sourceRefs':[]})
sections['number-forms'].sort(key=lambda i:i.get('value',0))

form_examples=[
 (2,'Għandi tlieta.','I have three.'),(2,'Wara t-tlieta mmur nixtri.','After three o’clock I go shopping.'),
 (3,'Kelli tliet ħutiet.','I had three fish.'),(3,'Fl-iskola hemm tliet klassijiet.','There are three classes at the school.'),
 (4,'Għandi tlett iħbieb.','I have three friends.'),(4,'Xtrajt tlett iġdur.','I bought three pots.'),
 (10,'It-tmienja li huma ħarġu għajjenin wara l-eżami.','All eight of them came out tired after the exam.'),
 (10,'Fit-tmienja tal-lejla oħti titlaq għal vjaġġ twil.','At eight in the evening my sister leaves for a long journey.'),
 (11,'Ili tmien xhur nistenna pakkett minn Londra.','I have been waiting eight months for a parcel from London.'),
 (11,'Ħija hu dak li ġie t-tmien wieħed fil-maratona.','My brother is the one who came eighth in the marathon.'),
 (12,'Xtrajt tmint ifniek biex insajjarhom nhar il-Ħadd.','I bought eight rabbits to cook on Sunday.'),
 (12,'Għall-ħarġa ġew tmint ibniet.','Eight girls came on the outing.')]
for n,(p,mt,en) in enumerate(form_examples):
    sections['number-forms'].append({'id':'forms-context-'+str(n),'kind':'phrase','maltese':mt,'english':en,
                                    'sourceRefs':[{'material_id':'in-numri-pp-ccp-sena-11-1','unit_number':p,'unit_id':f'in-numri-pp-ccp-sena-11-1--{p:03d}'}]})
for n,(mt,en) in enumerate([
 ('L-għajn tat-tifla minfuħa.','The girl’s eye is swollen.'),('Infaqt elf ewro meta sifirt.','I spent a thousand euro when I travelled.'),
 ('Hemm bżonn li taqra siegħa kuljum.','You need to read for an hour every day.'),('Waqajt u weġġajt l-irkoppa.','I fell and hurt my knee.'),
 ('Kiser siequ u għamluhielu fil-ġibs.','He broke his foot and they put it in a cast.'),('Il-widna tal-borma nkisret.','The pot’s handle broke.'),
 ('Nixtieq immur btala ta’ xahar.','I would like to go on a month-long holiday.'),('Ġarr kollox fuq l-ispalla.','He carried everything on his shoulder.')]):
    sections['dual-forms'].append({'id':'dual-context-'+str(n),'kind':'phrase','maltese':mt,'english':en,
                                  'sourceRefs':[{'material_id':'l-ghadd-imtenni','unit_number':7,'unit_id':'l-ghadd-imtenni--007'}]})

for n,mt in [(100,'mija'),(200,'mitejn'),(300,'tliet mija'),(400,'erba’ mija'),(500,'ħames mija'),(600,'sitt mija'),(700,'seba’ mija'),(800,'tmien mija'),(900,'disa’ mija'),(1000,'elf'),(2000,'elfejn'),(3000,'tlitt elef'),(4000,'erbat elef'),(5000,'ħamest elef')]:
    sections['large-numbers'].insert(0,{'id':'place-value-'+str(n),'kind':'integer','value':n,'maltese':mt,'english':f'{n:,}','sourceRefs':[]})
sections['large-numbers'].sort(key=lambda i:i.get('value',0))

# Merge exact lexical duplicates without losing any occurrence or source ID.
for section,rows in sections.items():
    merged={}; out=[]
    for row in rows:
        key=(row['kind'],row.get('singular'),row['maltese'],row['english'])
        if row['kind'] in ['dual','fraction'] and key in merged:
            merged[key]['sourceRefs']+=row['sourceRefs']; merged[key]['sourceItemIds'].append(row['id'])
        else:
            row['sourceItemIds']=[row['id']]; merged[key]=row; out.append(row)
    sections[section]=out

notes=[{'id':i['id'],'code':i['code'],'source':i['source_value'],'proposed':i['proposed_value'],
        'note':i['description_en'],'sourceRefs':i['source_refs']} for i in source['issues']]
resolutions={
 'temperature-typography':('corrected','Display degrees and Celsius, not a superscript extra zero or Celcius.','maths'),
 'noun-number-agreement':('corrected','Use plural kuċċarini after żewġ.','number-forms'),
 'incorrect-unit-equivalence':('corrected','0.75 kg = 750 g; the arithmetic error is corrected.','maths'),
 'decimal-variant-policy':('standardized','Use whole quantity plus unit, then punt; retain equivalent metric readings.','decimal-order'),
 'decimal-forms-and-options':('rewritten','Replace ambiguous source options with consistent unit-first readings.','decimal-order'),
 'omitted-conjunction':('corrected','Restore u after the hundreds group in the three affected examples.','maths'),
 'tlett-tlitt-source-variation':('accepted-variants','Both tlett and tlitt are accepted in the appropriate noun context.','number-forms'),
 'article-assimilation':('corrected','Use fid-disgħa in the complete time expression.','number-forms'),
 'dual-table-spelling':('partly-corrected','Normalize irkoppa/irkopptejn; retain attested xkora/xkertejn.','dual-sacks'),
 'dual-wing-spelling':('source-confirmed','Retain ġwinħajn.','dual-wings'),
 'exercise-lemma-already-plural':('corrected','Use singular pass as the cue for the target passejn.','dual-sacks'),
 'time-expression-spelling':('standardized','Use ilbiraħtlula in the teaching example.','time-expression'),
 'missing-listening-stimulus':('deferred','Do not invent audio or a graded answer. No listening question is imported.',None),
 'odt-whitespace-and-key':('reconstructed','Preserve ODF spaces. Large-number keys are compositional editorial derivations, not source-provided answers.','maths')
}
for note in notes:
    state,text,ref=resolutions[note['code']]
    note['resolution']={'status':state,'explanation':text,'referenceId':ref}
for q in questions:
    if not q.get('english'): q.pop('english',None)

# Source typography and full wording are preserved outside the published card payload.
evidence_path=ROOT/'docs/analysis/numbers-source-evidence.json'
evidence_path.write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for entry in coverage:
    entry.pop('sourceItem',None)
    entry['evidenceItemId']=entry['sourceItemId']
data={'schemaVersion':1,'title':'Numbers, Quantities, Calendar and Time','translationLanguage':'en',
      'sections':sections,'questions':questions,'editorialNotes':notes,'references':references,
      'coverage':coverage,'materials':source['materials'],
      'sourceUnits':[{'id':u['id'],'role':u['role']} for u in source['source_units']],
      'sourceEvidenceUrl':'./docs/analysis/numbers-source-evidence.json',
      'audioPolicy':'Embedded clips were not transcribed and are not used as pronunciation recordings.',
      'editorialPolicy':'Corrected teaching versions are separate from original evidence. Missing listening material is excluded from grading.'}
def published_typography(value):
    if isinstance(value,str): return value.replace('’',"'").replace('‘',"'").replace('´',"'")
    if isinstance(value,list): return [published_typography(v) for v in value]
    if isinstance(value,dict): return {k:published_typography(v) for k,v in value.items()}
    return value
data=published_typography(data)
out=ROOT/'assets/data/numbers_expansion.json'
out.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{out.name}: {len(coverage)} source items, {len(questions)} questions, {sum(len(v) for v in sections.values())} reference entries')
