import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { api } from "../src/api";

type Anime={id:number;slug:string;title?:string;name?:string;poster?:string;posterUrl?:string};

export default function Home(){
  const [items,setItems]=useState<Anime[]>([]);
  const [query,setQuery]=useState("");
  const [loading,setLoading]=useState(true);
  useEffect(()=>{api.anime().then(d=>setItems(Array.isArray(d)?d:(d.anime||d.items||[]))).catch(()=>setItems([])).finally(()=>setLoading(false))},[]);
  const filtered=items.filter(a=>(a.title||a.name||"").toLowerCase().includes(query.toLowerCase()));
  return <SafeAreaView style={s.safe}>
    <View style={s.header}><View><Text style={s.brand}>PRIME HINDI</Text><Text style={s.sub}>Hindi Anime Streaming</Text></View><Pressable onPress={()=>router.push("/login")}><Text style={s.login}>LOGIN</Text></Pressable></View>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search anime..." placeholderTextColor="#70798c" style={s.search}/>
    {loading?<ActivityIndicator size="large" color="#2F6BFF" style={{marginTop:40}}/>:<FlatList data={filtered} numColumns={2} keyExtractor={(x,i)=>String(x.id??x.slug??i)} contentContainerStyle={s.grid} columnWrapperStyle={{gap:14}} renderItem={({item})=><Pressable style={s.card} onPress={()=>router.push({pathname:"/anime/[slug]",params:{slug:item.slug}})}>
      {item.poster||item.posterUrl?<Image source={{uri:item.poster||item.posterUrl}} style={s.poster}/>:<View style={[s.poster,s.placeholder]}><Text style={s.placeholderText}>PRIME</Text></View>}
      <Text numberOfLines={2} style={s.title}>{item.title||item.name||"Untitled Anime"}</Text>
    </Pressable>}/>}
  </SafeAreaView>
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#0A0D14"},header:{paddingHorizontal:18,paddingTop:12,paddingBottom:14,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
 brand:{color:"#F2F5FA",fontSize:20,fontWeight:"900",letterSpacing:1.2},sub:{color:"#8A94A8",fontSize:12,marginTop:2},login:{color:"#fff",backgroundColor:"#2F6BFF",paddingHorizontal:14,paddingVertical:9,borderRadius:18,fontWeight:"800"},
 search:{marginHorizontal:18,marginBottom:12;backgroundColor:"#111622",borderWidth:1,borderColor:"#1E2536",borderRadius:14,paddingHorizontal:15,paddingVertical:12,color:"#fff"},
 grid:{padding:18,paddingTop:4,gap:16},card:{flex:1,maxWidth:"50%"},poster:{width:"100%",aspectRatio:.68,borderRadius:12,backgroundColor:"#111622"},placeholder:{alignItems:"center",justifyContent:"center"},placeholderText:{color:"#2F6BFF",fontWeight:"900"},title:{color:"#F2F5FA",fontSize:14,fontWeight:"700",marginTop:8}
});