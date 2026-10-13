import { useMemo, useState } from "react";
import { ActivityIndicator, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { C, Screen, useAnime, titleOf, posterOf, genresOf, openAnime, newest, Anime } from "../../src/ui";

export default function Home(){
  const {items,loading,reload}=useAnime();
  const [genre,setGenre]=useState("All");
  const genreCounts=useMemo(()=>{const counts:Record<string,number>={};items.forEach(a=>genresOf(a).forEach(g=>{counts[g]=(counts[g]||0)+1;}));return counts;},[items]);
  const genres=useMemo(()=>["All",...Object.keys(genreCounts).sort((a,b)=>genreCounts[b]-genreCounts[a]).slice(0,7)],[genreCounts]);
  const filtered=genre==="All"?items:items.filter(a=>genresOf(a).some(g=>g.toLowerCase()===genre.toLowerCase()));
  const featured:Anime|undefined=items.find(a=>posterOf(a))||items[0];
  return <Screen><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={h.page}>
    <View style={h.header}>
      <View style={h.brandRow}><View style={h.logoMark}><Ionicons name="play" size={19} color="#fff"/></View><View><Text style={h.brand}>PRIME HINDI</Text><Text style={h.sub}>Hindi Anime Streaming</Text></View></View>
      <View style={h.tools}>
        <Pressable accessibilityLabel="Search anime" onPress={()=>router.push("/search")} style={h.iconBtn}><Ionicons name="search" size={20} color={C.text}/></Pressable>
        <Pressable accessibilityLabel="Profile" onPress={()=>router.push("/(tabs)/profile")} style={h.iconBtn}><Ionicons name="person-outline" size={20} color={C.text}/></Pressable>
      </View>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={h.chips}>
      {genres.map(g=><Pressable key={g} onPress={()=>setGenre(g)} style={[h.chip,genre===g&&h.chipOn]}><Text style={[h.chipText,genre===g&&h.chipTextOn]}>{g}</Text></Pressable>)}
    </ScrollView>
    {loading&&!items.length?<ActivityIndicator size="large" color={C.blue} style={{marginTop:48}}/>:
    !items.length?<View style={h.empty}><Ionicons name="cloud-offline-outline" size={38} color={C.mute}/><Text style={h.emptyTitle}>Anime load nahi hue</Text><Text style={h.emptyText}>Internet check karke dobara try karo.</Text><Pressable style={h.retry} onPress={reload}><Text style={h.retryText}>RETRY</Text></Pressable></View>:
    <>
      {featured&&<Pressable onPress={()=>openAnime(featured)} style={h.feature}>
        {posterOf(featured)?<ImageBackground source={{uri:posterOf(featured)}} resizeMode="cover" style={StyleSheet.absoluteFillObject as any} imageStyle={h.featureImage}/>:null}
        <View style={h.featureShade}/>
        <View style={h.featureContent}><View style={h.featureBadge}><Ionicons name="sparkles" size={12} color="#fff"/><Text style={h.featureBadgeText}>FEATURED ANIME</Text></View>
          <Text numberOfLines={3} style={h.featureTitle}>{titleOf(featured)}</Text>
          <Text numberOfLines={2} style={h.featureMeta}>{[featured.year,featured.type,genresOf(featured).slice(0,2).join(" · ")].filter(Boolean).join("  •  ")||"Hindi Dub · Anime"}</Text>
          <View style={h.watchBtn}><Ionicons name="play" size={16} color="#fff"/><Text style={h.watchText}>EXPLORE NOW</Text></View>
        </View>
      </Pressable>}
      <View style={h.sectionHead}><Text style={h.sectionTitle}>{genre==="All"?"Trending now":genre+" anime"}</Text><Pressable onPress={()=>router.push("/(tabs)/browse")}><Text style={h.seeAll}>See all ›</Text></Pressable></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={h.row}>{(filtered.length?filtered:items).slice(0,14).map((a,i)=><AnimeCard key={String(a.id??a.slug??i)} anime={a}/>)}</ScrollView>
      <View style={h.sectionHead}><Text style={h.sectionTitle}>Latest additions</Text><Pressable onPress={()=>router.push("/(tabs)/browse")}><Text style={h.seeAll}>See all ›</Text></Pressable></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={h.row}>{newest(items).slice(0,14).map((a,i)=><AnimeCard key={String(a.id??a.slug??i)} anime={a}/>)}</ScrollView>
      {Object.keys(genreCounts).filter(g=>g!==genre).slice(0,3).map(g=><View key={g}>
        <View style={h.sectionHead}><Text style={h.sectionTitle}>{g}</Text><Pressable onPress={()=>router.push("/(tabs)/category")}><Text style={h.seeAll}>Explore ›</Text></Pressable></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={h.row}>{items.filter(a=>genresOf(a).some(x=>x.toLowerCase()===g.toLowerCase())).slice(0,12).map((a,i)=><AnimeCard key={String(a.id??a.slug??i)} anime={a}/>)}</ScrollView>
      </View>)}
    </>}
    <View style={{height:18}}/>
  </ScrollView></Screen>;
}
function AnimeCard({anime}:{anime:Anime}){
 const p=posterOf(anime);
 return <Pressable onPress={()=>openAnime(anime)} style={h.card}>
   {p?<Image source={{uri:p}} style={h.poster} resizeMode="cover"/>:<View style={[h.poster,h.placeholder]}><Ionicons name="film-outline" size={28} color="#8e8be8"/></View>}
   <Text numberOfLines={2} style={h.cardTitle}>{titleOf(anime)}</Text><Text numberOfLines={1} style={h.cardMeta}>{genresOf(anime).slice(0,2).join(" · ")||anime.type||"Anime"}</Text>
 </Pressable>;
}
const h=StyleSheet.create({
 page:{paddingBottom:14,backgroundColor:"#050816"},
 header:{paddingHorizontal:17,paddingTop:12,paddingBottom:13,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
 brandRow:{flexDirection:"row",alignItems:"center",gap:10},logoMark:{width:38,height:38,borderRadius:13,backgroundColor:"#2f6bff",alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:"#5b82ff"},
 brand:{color:"#eef2ff",fontSize:18,fontWeight:"900",letterSpacing:1.1},sub:{color:"#8f99c6",fontSize:11,marginTop:1},tools:{flexDirection:"row",gap:8},
 iconBtn:{width:38,height:38,borderRadius:20,backgroundColor:"#0d1330",borderWidth:1,borderColor:"#222b5c",alignItems:"center",justifyContent:"center"},
 chips:{paddingHorizontal:16,paddingBottom:15,gap:8},chip:{paddingHorizontal:15,paddingVertical:8,borderRadius:22,borderWidth:1,borderColor:"#222b5c",backgroundColor:"#0d1330"},
 chipOn:{backgroundColor:"#2f6bff",borderColor:"#2f6bff"},chipText:{color:"#8f99c6",fontSize:12,fontWeight:"700"},chipTextOn:{color:"#fff"},
 feature:{height:330,marginHorizontal:15,borderRadius:22,overflow:"hidden",justifyContent:"flex-end",backgroundColor:"#141b42",borderWidth:1,borderColor:"#222b5c"},
 featureImage:{borderRadius:22,opacity:0.72},featureShade:{...StyleSheet.absoluteFillObject,backgroundColor:"rgba(4,6,22,0.38)"},
 featureContent:{padding:18,backgroundColor:"rgba(5,8,22,0.58)"},featureBadge:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:5,borderRadius:14,paddingHorizontal:9,paddingVertical:5,backgroundColor:"#6540d7",marginBottom:10},
 featureBadgeText:{fontSize:10,color:"#fff",fontWeight:"900",letterSpacing:0.7},featureTitle:{fontSize:26,lineHeight:31,color:"#fff",fontWeight:"900"},featureMeta:{fontSize:12,color:"#d3d9f6",marginTop:6},
 watchBtn:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:7,paddingHorizontal:15,paddingVertical:10,borderRadius:11,backgroundColor:"#2f6bff",marginTop:13},watchText:{fontSize:11,color:"#fff",fontWeight:"900",letterSpacing:0.5},
 sectionHead:{marginTop:23,marginBottom:11,paddingHorizontal:17,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},sectionTitle:{color:"#eef2ff",fontSize:18,fontWeight:"900"},seeAll:{color:"#8e9cff",fontSize:12,fontWeight:"800"},
 row:{paddingHorizontal:16,gap:12},card:{width:124},poster:{width:124,height:176,borderRadius:13,backgroundColor:"#141b42",borderWidth:1,borderColor:"#222b5c"},placeholder:{alignItems:"center",justifyContent:"center"},
 cardTitle:{color:"#eef2ff",fontSize:12,fontWeight:"800",marginTop:8,lineHeight:16},cardMeta:{color:"#8f99c6",fontSize:10,marginTop:4},
 empty:{padding:28,alignItems:"center",marginTop:28},emptyTitle:{color:"#eef2ff",fontSize:17,fontWeight:"900",marginTop:12},emptyText:{color:"#8f99c6",fontSize:12,marginTop:6,textAlign:"center"},retry:{marginTop:16,backgroundColor:"#2f6bff",borderRadius:10,paddingHorizontal:20,paddingVertical:10},retryText:{color:"#fff",fontWeight:"900",fontSize:12}
});
