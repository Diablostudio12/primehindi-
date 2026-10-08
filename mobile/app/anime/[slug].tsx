import { useEffect,useState } from "react";
import { ActivityIndicator,Image,Pressable,SafeAreaView,ScrollView,StyleSheet,Text,View } from "react-native";
import { router,useLocalSearchParams } from "expo-router";
import { api } from "../../src/api";
export default function Detail(){
 const {slug}=useLocalSearchParams<{slug:string}>(); const [data,setData]=useState<any>(null); const [loading,setLoading]=useState(true);
 useEffect(()=>{if(slug)api.detail(slug).then(setData).catch(()=>setData(null)).finally(()=>setLoading(false))},[slug]);
 if(loading)return <SafeAreaView style={s.safe}><ActivityIndicator color="#2F6BFF" size="large" style={{marginTop:60}}/></SafeAreaView>;
 if(!data)return <SafeAreaView style={s.safe}><Text style={s.err}>Anime not found.</Text></SafeAreaView>;
 const a=data.anime||data; const eps=data.episodes||a.episodes||[];
 return <SafeAreaView style={s.safe}><ScrollView>
  <Pressable onPress={()=>router.back()}><Text style={s.back}>← Back</Text></Pressable>
  <View style={s.hero}>{(a.banner||a.bannerUrl||a.poster||a.posterUrl)&&<Image source={{uri:a.banner||a.bannerUrl||a.poster||a.posterUrl}} style={s.banner}/>}</View>
  <View style={s.body}><Text style={s.title}>{a.title||a.name||"Untitled Anime"}</Text><Text style={s.meta}>{a.status||"Anime"}{a.genre?" • "+(Array.isArray(a.genre)?a.genre.join(", "):a.genre):""}</Text>{a.description&&<Text style={s.desc}>{a.description}</Text>}
  {eps.length>0&&<><Text style={s.section}>Episodes</Text>{eps.map((e:any,i:number)=><Pressable key={e.id||i} style={s.ep} onPress={()=>router.push({pathname:"/player/[id]",params:{id:String(e.id||e.episodeId),url:e.videoUrl||e.video||e.url||""}})}><Text style={s.epText}>Episode {e.episodeNumber||e.number||i+1}</Text><Text style={s.play}>▶</Text></Pressable>)}</>}</View>
 </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:"#0A0D14"},back:{color:"#8A94A8",fontSize:15,fontWeight:"700",padding:18},hero:{marginHorizontal:18,borderRadius:18,overflow:"hidden",backgroundColor:"#111622"},banner:{width:"100%",aspectRatio:1.8},body:{padding:18},title:{color:"#F2F5FA",fontSize:27,fontWeight:"900"},meta:{color:"#2F6BFF",marginTop:7,fontWeight:"700"},desc:{color:"#AAB2C2",lineHeight:22,marginTop:15},section:{color:"#F2F5FA",fontSize:20,fontWeight:"900",marginTop:25,marginBottom:10},ep:{backgroundColor:"#111622",borderWidth:1,borderColor:"#1E2536",padding:16,borderRadius:12,marginBottom:9,flexDirection:"row",justifyContent:"space-between"},epText:{color:"#F2F5FA",fontWeight:"700"},play:{color:"#2F6BFF"},err:{color:"#F2F5FA",textAlign:"center",marginTop:60}});