(() => {
  'use strict';
  const units=['żero','wieħed','tnejn','tlieta','erbgħa','ħamsa','sitta','sebgħa','tmienja','disgħa'];
  const counted=['','wieħed','żewġ','tliet',"erba'",'ħames','sitt',"seba'",'tmien',"disa'",'għaxar'];
  const linked=['','','żewġt','tlitt','erbat','ħamest','sitt','sebat','tmint','disat','għaxart'];
  const teens=['għaxra','ħdax','tnax','tlettax','erbatax','ħmistax','sittax','sbatax','tmintax','dsatax'];
  const tens=['','','għoxrin','tletin','erbgħin','ħamsin','sittin','sebgħin','tmenin','disgħin'];
  function belowThousand(n,beforeScale=false){
    if(n<10)return beforeScale?counted[n]:units[n];
    if(n<20)return beforeScale?(n===10?'għaxar':teens[n-10]+'-il'):teens[n-10];
    if(n<100)return (n%10?units[n%10]+' u ':'')+tens[Math.floor(n/10)];
    const hundreds=Math.floor(n/100),rest=n%100;
    const head=hundreds===2?'mitejn':hundreds===1?(beforeScale&&!rest?'mitt':'mija'):counted[hundreds]+' '+(beforeScale&&!rest?'mitt':'mija');
    return head+(rest?' u '+belowThousand(rest,beforeScale):'');
  }
  function scale(n,million){
    if(n===1)return million?'miljun':'elf';
    if(!million&&n===2)return 'elfejn';
    if(!million&&n<=10)return linked[n]+' elef';
    return belowThousand(n,true)+' '+(million&&n<=10?'miljuni':million?'miljun':'elf');
  }
  function toWords(n){
    if(!Number.isInteger(n)||n<0||n>999999999)throw new RangeError('Enter a whole number from 0 to 999,999,999.');
    if(!n)return units[0];
    const millions=Math.floor(n/1000000),thousands=Math.floor(n/1000)%1000,remainder=n%1000;
    return [millions?scale(millions,true):'',thousands?scale(thousands,false):'',remainder?belowThousand(remainder):''].filter(Boolean).join(' u ');
  }
  function parse(text){
    const value=String(text).trim();
    if(!value)return null;
    if(!/^(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+)$/.test(value))return null;
    const n=Number(value.replace(/[, \u00a0\u202f]/g,''));
    return Number.isInteger(n)&&n>=0&&n<=999999999?n:null;
  }
  function mount(){
    const root=document.querySelector('[data-number-helper]');if(!root)return;
    const input=root.querySelector('input'),output=root.querySelector('output'),error=root.querySelector('[data-helper-error]'),copy=root.querySelector('button');
    let words='';
    function update(){
      const n=parse(input.value),invalid=n===null&&input.value.trim()!=='';
      words=n===null?'':toWords(n);output.textContent=words;copy.disabled=n===null;
      input.setAttribute('aria-invalid',String(invalid));error.textContent=invalid?'Enter a whole number from 0 to 999,999,999. Use digits, optionally grouped with spaces or commas.':'';
    }
    input.addEventListener('input',update);
    root.addEventListener('submit',event=>{event.preventDefault();update();});
    copy.addEventListener('click',async()=>{
      if(!words)return;
      try{await navigator.clipboard.writeText(words);error.textContent='Copied.';}
      catch{error.textContent='Clipboard unavailable. Select the result to copy it.';}
    });
    update();
  }
  const api={toWords,parse,mount};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.MaltiNumbersHelper=api;
})();
