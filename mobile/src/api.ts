import AsyncStorage from "@react-native-async-storage/async-storage";
export const API="https://primehindi.up.railway.app/api";
const KEY="prime_hindi_session";
export const getSession=()=>AsyncStorage.getItem(KEY);
export const setSession=(v:string)=>v?AsyncStorage.setItem(KEY,v):AsyncStorage.removeItem(KEY);
async function req(path:string,init:RequestInit={}){const token=await getSession();const headers:any={"Accept":"application/json","Content-Type":"application/json",...(init.headers||{})};if(token)headers.Authorization="Bearer "+token;const r=await fetch(API+path,{...init,headers});const text=await r.text();let data:any={};try{data=text?JSON.parse(text):{}}catch{}if(!r.ok)throw new Error(data?.error||"Request failed ("+r.status+")");return data}
export const api={
 anime:()=>req("/anime"),
 detail:(slug:string)=>req("/anime/"+encodeURIComponent(slug)),
 studios:()=>req("/studios"),
 login:(email:string,password:string)=>req("/auth/login",{method:"POST",body:JSON.stringify({email,password})}),
 register:(displayName:string,email:string,password:string)=>req("/auth/register",{method:"POST",body:JSON.stringify({displayName,email,password})}),
 me:()=>req("/me"),
 watchlist:()=>req("/watchlist"),
 notifications:()=>req("/notifications"),
 comments:(slug:string)=>req("/anime/"+encodeURIComponent(slug)+"/comments")
};