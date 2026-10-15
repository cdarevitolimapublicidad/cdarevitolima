const SUPABASE_URL='https://acigzhssjxzfvzaaythl.supabase.co';
const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjaWd6aHNzanh6ZnZ6YWF5dGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMTIwNTQsImV4cCI6MjEwNTU4ODA1NH0.Fn-Ayehm_k36cGFWpkiL0fmwbVz2rInoA3rf5u0FwR4';
let SB=null;
try{SB=supabase.createClient(SUPABASE_URL,SUPABASE_KEY)}catch(e){console.warn('SB init:',e)}

async function sbLoad(){
  if(!SB)return false;
  try{
    const T={clients:'clients',vehicles:'vehicles',appts:'appointments',revisions:'revisions',credits:'credits',reminders:'reminders',cashLedger:'cash_ledger'};
    for(const[l,r]of Object.entries(T)){
      const{data,error}=await SB.from(r).select('*').order('created_at',{ascending:false}).limit(5000);
      if(!error&&data)DB[l]=data.map(x=>sbMap(x));
    }
    const{data:b}=await SB.from('bank_accounts').select('*');
    if(b)DB.bankAccounts=b.map(x=>({id:x.id,name:x.name,balance:x.balance}));
    const{data:u}=await SB.from('system_users').select('*');
    if(u&&u.length){USERS.length=0;u.forEach(x=>USERS.push({username:x.username,password:x.password_hash,name:x.name,role:x.role,advisor:x.advisor_id}))}
    console.log('✅ Supabase:',Object.keys(T).map(k=>k+':'+DB[k].length).join(', '));
    return true;
  }catch(e){console.warn('SB load:',e);return false}
}

function sbMap(r){
  const m={client_id:'clientId',vehicle_type:'type',due_date:'due',advisor_id:'advisor',service_type:'service',gift_code:'giftCode',gift_claimed:'giftClaimed',account_id:'accountId',request_date:'requestDate',disbursement_date:'disbursementDate',payment_day:'paymentDay',installment_amount:'installmentAmount',valid_until:'validUntil',confirmed_arrival:'arrived',last_revision:'lastRevision',password_hash:'password'};
  const o={};for(const[k,v]of Object.entries(r)){if(k==='created_at'||k==='updated_at')continue;o[m[k]||k]=v}return o;
}

function sbUnmap(o){
  const m={clientId:'client_id',type:'vehicle_type',due:'due_date',advisor:'advisor_id',service:'service_type',giftCode:'gift_code',giftClaimed:'gift_claimed',accountId:'account_id',requestDate:'request_date',disbursementDate:'disbursement_date',paymentDay:'payment_day',installmentAmount:'installment_amount',validUntil:'valid_until',arrived:'confirmed_arrival',lastRevision:'last_revision'};
  const r={};for(const[k,v]of Object.entries(o)){if(v===undefined||k==='cat'||k==='password')continue;r[m[k]||k]=v}return r;
}

const SBT={clients:'clients',vehicles:'vehicles',appts:'appointments',revisions:'revisions',credits:'credits',reminders:'reminders',cashLedger:'cash_ledger'};
async function sbSave(t,o){if(!SB||!SBT[t])return;try{await SB.from(SBT[t]).upsert(sbUnmap(o),{onConflict:'id'})}catch(e){}}
async function sbDelete(t,id){if(!SB||!SBT[t])return;try{await SB.from(SBT[t]).delete().eq('id',id)}catch(e){}}
async function sbLog(a,u){if(!SB)return;try{await SB.from('activity_log').insert({action:a,user_name:u||''})}catch(e){}}
