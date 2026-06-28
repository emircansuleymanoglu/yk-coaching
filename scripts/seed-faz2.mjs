import pg from "pg";
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl:{rejectUnauthorized:false}});
await c.connect();
const today = new Date().toISOString().slice(0,10);
const { rows:[berat] } = await c.query("select id from profiles where full_name=$1",["Berat Bulut"]);
const cid = berat.id;
const { rows:[prog] } = await c.query("select id from programs where client_id=$1 order by created_at desc limit 1",[cid]);
const { rows:[day] } = await c.query("select id,name from workout_days where program_id=$1 order by sort limit 1",[prog.id]);
// temizle (idempotent)
await c.query("delete from workout_sessions where client_id=$1 and date=$2",[cid,today]);
await c.query("delete from daily_tasks where client_id=$1 and date=$2",[cid,today]);
await c.query("delete from checkins where client_id=$1",[cid]);
// seans
await c.query("insert into workout_sessions(client_id,program_id,workout_day_id,date,status) values($1,$2,$3,$4,'planned')",[cid,prog.id,day.id,today]);
// kardiyo görevi
await c.query("insert into daily_tasks(client_id,date,title,detail,kind) values($1,$2,$3,$4,'cardio')",[cid,today,"25 dk yürüyüş bandı","Sabah aç karnına, eğim 8"]);
// check-in geçmişi (grafik için)
const base = new Date();
for (let i=4;i>=0;i--){ const d=new Date(base); d.setDate(d.getDate()-i*7); const ds=d.toISOString().slice(0,10);
  await c.query("insert into checkins(client_id,date,weight,body_fat,notes) values($1,$2,$3,$4,$5)",[cid,ds, 86-i*0.8, 20-i*0.5, i===0?"Bu hafta formda hissediyorum":null]); }
console.log("✓ Faz 2 demo verisi eklendi. Antrenman:",day.name,"Tarih:",today);
await c.end();
