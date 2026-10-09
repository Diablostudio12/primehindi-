import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { api } from "./api";

export const C={bg:"#0A0D14",card:"#111622",line:"#1E2536",text:"#F2F5FA",mute:"#8A94A8",blue:"#2F6BFF"};
export type Anime={id:number;slug:string;[k:string]:any};

export const titleOf=(a:Anime):string=>a.title||a.name||"Untitled";
export const posterOf=(a:Anime):string=>a.poster||a.posterUrl||a.poster_url||"";
export const genresOf=(a:Anime):string[]=>{
  const g=a.genres||a.genre;
  if(!g) return [];
  const arr=Array.isArray(g)?g:String(g).split(",");
  return arr.map((x:any)=>String(typeof x==="string"?x:(x?.name||x?.title||"")).trim()).filter(Boolean);
};
export const listOf=(d:any,keys:string[]):any[]=>{
  if(Array.isArray(d)) return d;
  for(const k of keys){ if(Array.isArray(d?.[k])) return d[k]; }
  return [];
};
export const openAnime=(a:Anime)=>router.push({pathname:"/anime/[slug]",params:{slug:a.slug}});

let cache:Anime[]|null=null;
export function useAnime(){
  const [items,setItems]=useState<Anime[]>(cache||[]);
  const [loading,setLoading]=useState(!cache);
  const load=()=>{
    setLoading(true);
    api.anime().then(d=>{cache=listOf(d,["anime","items"]);setItems(cache);}).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{ if(!cache) load(); },[]);
  return {items,loading,reload:load};
}

export function Screen({children}:{children:any}){
  return <SafeAreaView edges={["top"]} style={{flex:1,backgroundColor:C.bg}}>{children}</SafeAreaView>;
}
export function Title({text,sub}:{text:string;sub?:string}){
  return <View style={{paddingHorizontal:18,paddingTop:12,paddingBottom:12}}><Text style={s.h1}>{text}</Text>{sub?<Text style={s.sub}>{sub}</Text>:null}</View>;
}

export function Card({a,w}:{a:Anime;w?:number}){
  const p=posterOf(a);
  return <Pressable onPress={()=>openAnime(a)} style={w?{width:w}:{flex:1,maxWidth:"50%"}}>
    {p?<Image source={{uri:p}} style={s.poster}/>:<View style={[s.poster,s.ph]}><Text style={s.phText}>PRIME</Text></View>}
    <Text numberOfLines={2} style={s.title}>{titleOf(a)}</Text>
  </Pressable>;
}

export function Grid({data,loading,empty}:{data:Anime[];loading?:boolean;empty?:string}){
  if(loading) return <ActivityIndicator size="large" color={C.blue} style={{marginTop:40}}/>;
  return <FlatList data={data} numColumns={2} keyExtractor={(x,i)=>String(x.id??x.slug??i)}
    contentContainerStyle={s.grid} columnWrapperStyle={{gap:14}}
    renderItem={({item})=><Card a={item}/>}
    ListEmptyComponent={<Text style={s.empty}>{empty||"Kuch nahi mila"}</Text>}/>;
}

export function Row({title,data}:{title:string;data:Anime[]}){
  if(!data.length) return null;
  return <View style={{marginTop:22}}>
    <Text style={s.h2}>{title}</Text>
    <FlatList horizontal showsHorizontalScrollIndicator={false} data={data}
      keyExtractor={(x,i)=>String(x.id??x.slug??i)}
      contentContainerStyle={{paddingHorizontal:18,gap:12}}
      renderItem={({item})=><Card a={item} w={120}/>}/>
  </View>;
}

export function Chip({label,on,onPress}:{label:string;on?:boolean;onPress:()=>void}){
  return <Pressable onPress={onPress} style={[s.chip,on&&s.chipOn]}><Text style={[s.chipT,on&&{color:"#fff"}]}>{label}</Text></Pressable>;
}

export const s=StyleSheet.create({
  h1:{color:C.text,fontSize:24,fontWeight:"900"},
  h2:{color:C.text,fontSize:17,fontWeight:"800",paddingHorizontal:18,marginBottom:10},
  sub:{color:C.mute,fontSize:12,marginTop:2},
  grid:{padding:18,paddingTop:4,gap:16},
  poster:{width:"100%",aspectRatio:0.68,borderRadius:12,backgroundColor:C.card},
  ph:{alignItems:"center",justifyContent:"center"},
  phText:{color:C.blue,fontWeight:"900"},
  title:{color:C.text,fontSize:13,fontWeight:"700",marginTop:8},
  empty:{color:C.mute,textAlign:"center",marginTop:40,paddingHorizontal:30},
  chip:{paddingHorizontal:14,paddingVertical:8,borderRadius:18,backgroundColor:C.card,borderWidth:1,borderColor:C.line},
  chipOn:{backgroundColor:C.blue,borderColor:C.blue},
  chipT:{color:C.mute,fontWeight:"700",fontSize:13},
  btn:{backgroundColor:C.blue,borderRadius:12,paddingVertical:13,paddingHorizontal:22,alignItems:"center"},
  btnT:{color:"#fff",fontWeight:"900"}
});
