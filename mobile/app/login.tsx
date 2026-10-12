import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { api, setSession } from "../src/api";
export default function Login(){
 const [mode,setMode]=useState<"login"|"register">("login");
 const [name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(){
  setBusy(true);setError("");
  try{
   if(mode==="register"&&!name.trim())throw new Error("Naam daalo");
   const d=mode==="login"?await api.login(email.trim(),password):await api.register(name.trim(),email.trim(),password);
   const token=d.token||d.accessToken||d.session||"";
   if(token)await setSession(token);
   router.replace("/");
  }catch(e:any){setError(e?.message||"Failed")}finally{setBusy(false)}
 }
 const reg=mode==="register";
 return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled"><Text style={s.brand}>PRIME HINDI</Text><Text style={s.heading}>{reg?"Create account":"Welcome back"}</Text><Text style={s.muted}>{reg?"Free account banao aur watchlist save karo.":"Sign in to continue watching."}</Text>
  {reg&&<TextInput value={name} onChangeText={setName} placeholder="Naam" placeholderTextColor="#70798c" style={s.input}/>}
  <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor="#70798c" style={s.input}/>
  <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor="#70798c" style={s.input}/>
  {error?<Text style={s.error}>{error}</Text>:null}
  <Pressable disabled={busy} onPress={submit} style={s.button}>{busy?<ActivityIndicator color="#fff"/>:<Text style={s.buttonText}>{reg?"SIGN UP":"SIGN IN"}</Text>}</Pressable>
  <Pressable onPress={()=>{setError("");setMode(reg?"login":"register")}}><Text style={s.switch}>{reg?"Already account hai? Sign in":"Naya account? Sign up"}</Text></Pressable>
  <Pressable onPress={()=>router.replace("/")}><Text style={s.back}>← Back to Prime Hindi</Text></Pressable>
 </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:"#0A0D14"},scroll:{flexGrow:1,justifyContent:"center",padding:22},brand:{color:"#2F6BFF",fontWeight:"900",fontSize:18},heading:{color:"#F2F5FA",fontSize:28,fontWeight:"900",marginTop:20},muted:{color:"#8A94A8",marginTop:5,marginBottom:22},input:{backgroundColor:"#111622",borderWidth:1,borderColor:"#1E2536",borderRadius:12,color:"#fff",padding:13,marginBottom:12},button:{backgroundColor:"#2F6BFF",borderRadius:12,padding:14,alignItems:"center"},buttonText:{color:"#fff",fontWeight:"900"},error:{color:"#ff7b8a",marginBottom:10},switch:{color:"#2F6BFF",textAlign:"center",marginTop:20,fontWeight:"700"},back:{color:"#8A94A8",textAlign:"center",marginTop:16}});
