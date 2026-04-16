const url = 'https://agbskncncrnzmutaubdn.supabase.co/rest/v1/store_settings?select=*';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYnNrbmNuY3Juem11dGF1YmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NjQ4OTksImV4cCI6MjA5MTU0MDg5OX0.Y-p426eqLyl-rumc-ZI56u2WJFk0oDvXkvp5G6m1iFM';

const res = await fetch(url, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } });
const json = await res.json();
console.log(JSON.stringify(json, null, 2));
