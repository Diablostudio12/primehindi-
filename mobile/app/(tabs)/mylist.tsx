import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api, getSession } from "../../src/api";
import { Screen, Title, Grid, C, s, listOf, Anime } from "../../src/ui";

export default function MyList(){
  const [state,setState]=useState<"load"|"guest"|"ok">("load");
  const [list,setList]=useState<Anime[]>([]);
  useFocusEffect(useCallback(()=>{
    let on=true;
    getSession().then(t=>{
      if(!t){ if(on) setState("guest"); return; }
      api.watchlist().then(d=>{
        const arr=listOf(d,["watchlist","items","anime"]).map((x:any)=>x.anime||x);
        if(on){ setList(arr); setState("ok"); }
      }).catch(()=>{ if(on) setState("guest"); });
    });
    return ()=>{ on=false; };
  },[]));
  return <Screen>
    <Title text="My List" sub="Aapki saved anime"/>
    {state==="guest"?<View style={{padding:30,alignItems:"center"}}>
      <Text style={{color:C.mute,textAlign:"center",marginBottom:18}}>Apni watchlist dekhne ke liye login karo.</Text>
      <Pressable style={s.btn} onPress={()=>router.push("/login")}><Text style={s.btnT}>LOGIN</Text></Pressable>
    </View>:<Grid data={list} loading={state==="load"} empty="Watchlist khali hai"/>}
  </Screen>;
}
