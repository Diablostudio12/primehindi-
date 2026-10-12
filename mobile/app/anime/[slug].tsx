import { useEffect,useState } from "react";
import { ActivityIndicator,Image,Pressable,ScrollView,StyleSheet,Text,View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router,useLocalSearchParams } from "expo-router";
import { api } from "../../src/api";

const clean=(u:any)=>String(u||"").replace(/^__PDI_CUSTOM__:/,"").trim();

export default function Detail(){
 const {slug}=useLocalSearchParams<{slug:string}>(); const [data,setData]=useState<any>(null); const [loading,setLoading]=useState(true);
 useEffect(()=>{if(slug)api.detail(slug).then(setData).catch(()=>setData(null)).finally(()=>setLoading(false))},[slug]);
 if(loading)return <SafeAreaView style={s.safe}><ActivityIndicator color="#2F6BFF" size="large" style={{marginTop:60}}/></SafeAreaView>;
 if(!data)return <SafeAreaView style={s.safe}><Pressable onPress={()=>router.back()}><Text style={s.back}>← Back</Text></Pressable><Text style={s.err}>Anime not found.</Text></SafeAreaView>;
 const a=data.anime||data; const eps:any[]=data.episodes||a.episodes||[];
 const poster=a.poster_url||a.posterUrl||a.poster; const banner=a.banner_url||a.bannerUrl||a.banner||poster;
 const genres:string[]=Array.isArray(a.genres)?a.genres:(a.genre?[a.genre]:[]);
 const meta=[a.year,a.type,a.status].filter(Boolean).join(" • ");
 const play=(e:any,i:number)=>router.push({pathname:"/player/[id]",params:{id:String(e.id??i),url:clean(e.video_url||e.videoUrl||e.video||e.url)}});
 const first=eps[0];
 return <SafeAreaView style={s.safe} edges={["top"]}><ScrollView contentContainerStyle={{paddingBottom:40}}>
  <Pressable onPress={()=>router.back()}><Text style={s.back}>← Back</Text></Pressable>
  {!!banner&&<View style={s.hero}><Image source={{uri:banner}} style={s.banner} resizeMode="cover"/></View>}
  <View style={s.body}>
   <View style={s.row}>
    {!!poster&&<Image source={{uri:poster}} style={s.poster}/>}
    <View style={{flex:1}}>
     <Text style={s.title}>{a.title||a.name||"Untitled Anime"}</Text>
     {!!a.alt_title&&<Text style={s.alt}>{a.alt_title}</Text>}
     {!!meta&&<Text style={s.meta}>{meta}</Text>}
     {!!a.rating&&<Text style={s.rating}>★ {a.rating}</Text>}
     {!!a.studio_name&&<Text style={s.studio}>{a.studio_name}</Text>}
    </View>
   </View>
   <View style={s.chips}>{a.hindi_dub&&<Text style={[s.chip,s.chipHi]}>Hindi Dub</Text>}{a.subtitles&&<Text style={s.chip}>Subtitles</Text>}{genres.map(g=><Text key={g} style={s.chip}>{g}</Text>)}</View>
   {!!first&&<Pressable style={s.watch} onPress={()=>play(first,0)}><Text style={s.watchText}>▶  Watch Episode {first.episode_number||first.episodeNumber||1}</Text></Pressable>}
   {!!a.description&&<Text style={s.desc}>{a.description}</Text>}
   <Text style={s.section}>Episodes</Text>
   {eps.length===0&&<Text style={s.alt}>No episodes yet.</Text>}
   {eps.map((e:any,i:number)=>{const n=e.episode_number||e.episodeNumber||e.number||i+1;const t=e.title&&!/^episode\s*\d+$/i.test(e.title)?e.title:"";return <Pressable key={e.id||i} style={s.ep} onPress={()=>play(e,i)}><View style={{flex:1}}><Text style={s.epText}>Episode {n}</Text>{!!t&&<Text style={s.epSub}>{t}</Text>}</View><Text style={s.play}>▶</Text></Pressable>})}
  </View>
 </ScrollView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:"#0A0D14"},back:{color:"#8A94A8",fontSize:15,fontWeight:"700",padding:18},hero:{marginHorizontal:18,borderRadius:18,overflow:"hidden",backgroundColor:"#111622"},banner:{width:"100%",aspectRatio:1.8},body:{padding:18},row:{flexDirection:"row",gap:14},poster:{width:100,height:146,borderRadius:12,backgroundColor:"#111622"},title:{color:"#F2F5FA",fontSize:24,fontWeight:"900"},alt:{color:"#8A94A8",marginTop:4},meta:{color:"#2F6BFF",marginTop:7,fontWeight:"700",textTransform:"capitalize"},rating:{color:"#FBBF24",marginTop:6,fontWeight:"800"},studio:{color:"#AAB2C2",marginTop:6,fontSize:12},chips:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:16},chip:{color:"#C7CEDD",backgroundColor:"#151B2B",borderWidth:1,borderColor:"#1E2536",paddingHorizontal:10,paddingVertical:5,borderRadius:999,fontSize:12,fontWeight:"700",overflow:"hidden"},chipHi:{color:"#fff",backgroundColor:"#2F6BFF",borderColor:"#2F6BFF"},watch:{backgroundColor:"#2F6BFF",borderRadius:12,padding:14,alignItems:"center",marginTop:18},watchText:{color:"#fff",fontWeight:"900",fontSize:15},desc:{color:"#AAB2C2",lineHeight:22,marginTop:18},section:{color:"#F2F5FA",fontSize:20,fontWeight:"900",marginTop:25,marginBottom:10},ep:{backgroundColor:"#111622",borderWidth:1,borderColor:"#1E2536",padding:16,borderRadius:12,marginBottom:9,flexDirection:"row",alignItems:"center"},epText:{color:"#F2F5FA",fontWeight:"700"},epSub:{color:"#8A94A8",marginTop:3,fontSize:12},play:{color:"#2F6BFF"},err:{color:"#F2F5FA",textAlign:"center",marginTop:60}});
