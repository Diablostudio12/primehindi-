import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { api, getSession, setSession } from "../../src/api";
import { Screen, Title, C, s, listOf } from "../../src/ui";

export default function Profile(){
  const [state,setState]=useState<"load"|"guest"|"ok">("load");
  const [me,setMe]=useState<any>(null);
  const [notes,setNotes]=useState<any[]>([]);
  useFocusEffect(useCallback(()=>{
    let on=true;
    getSession().then(t=>{
      if(!t){ if(on) setState("guest"); return; }
      api.me().then(d=>{ if(on){ setMe(d?.user||d); setState("ok"); } }).catch(()=>{ if(on) setState("guest"); });
      api.notifications().then(d=>{ if(on) setNotes(listOf(d,["notifications","items"]).slice(0,8)); }).catch(()=>{});
    });
    return ()=>{ on=false; };
  },[]));
  async function logout(){ await setSession(""); setMe(null); setNotes([]); setState("guest"); }
  const name=me?.displayName||me?.name||me?.username||"User";
  return <Screen>
    <Title text="Profile"/>
    {state==="load"?<ActivityIndicator size="large" color={C.blue} style={{marginTop:40}}/>:
    state==="guest"?<View style={{padding:30,alignItems:"center"}}>
      <Text style={{color:C.mute,textAlign:"center",marginBottom:18}}>Login karke apna profile, watchlist aur notifications dekho.</Text>
      <Pressable style={s.btn} onPress={()=>router.push("/login")}><Text style={s.btnT}>LOGIN</Text></Pressable>
    </View>:
    <ScrollView contentContainerStyle={{padding:18,paddingBottom:40}}>
      <View style={{backgroundColor:C.card,borderRadius:16,borderWidth:1,borderColor:C.line,padding:18}}>
        <Text style={{color:C.text,fontSize:20,fontWeight:"900"}}>{name}</Text>
        {me?.email?<Text style={{color:C.mute,marginTop:4}}>{me.email}</Text>:null}
      </View>
      {notes.length?<View style={{marginTop:22}}>
        <Text style={{color:C.text,fontSize:17,fontWeight:"800",marginBottom:10}}>Notifications</Text>
        {notes.map((n,i)=><View key={n.id??i} style={{backgroundColor:C.card,borderRadius:12,padding:14,marginBottom:8,borderWidth:1,borderColor:C.line}}>
          <Text style={{color:C.text}}>{n.message||n.title||n.text||"Notification"}</Text>
        </View>)}
      </View>:null}
      <Pressable onPress={logout} style={[s.btn,{backgroundColor:"#1E2536",marginTop:26}]}><Text style={s.btnT}>LOGOUT</Text></Pressable>
    </ScrollView>}
  </Screen>;
}
