import { ImageBackground, Pressable, ScrollView, Text, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ActivityIndicator } from "react-native";
import { Screen, Row, C, useAnime, titleOf, posterOf, genresOf, openAnime } from "../../src/ui";

export default function Home(){
  const {items,loading}=useAnime();
  const hero=items[0];
  const count:Record<string,number>={};
  items.forEach(a=>genresOf(a).forEach(g=>{count[g]=(count[g]||0)+1;}));
  const topGenres=Object.keys(count).sort((a,b)=>count[b]-count[a]).slice(0,3);
  return <Screen>
    <View style={h.header}>
      <View><Text style={h.brand}>PRIME HINDI</Text><Text style={h.sub}>Hindi Anime Streaming</Text></View>
      <Pressable onPress={()=>router.push("/search")} hitSlop={10}><Text style={h.go}>Search</Text></Pressable>
    </View>
    {loading?<ActivityIndicator size="large" color={C.blue} style={{marginTop:40}}/>:
    <ScrollView contentContainerStyle={{paddingBottom:30}}>
      {hero?<Pressable onPress={()=>openAnime(hero)} style={{marginHorizontal:18}}>
        <ImageBackground source={posterOf(hero)?{uri:posterOf(hero)}:undefined} style={h.hero} imageStyle={{borderRadius:16}} resizeMode="cover">
          <View style={h.overlay}><Text numberOfLines={2} style={h.heroT}>{titleOf(hero)}</Text><View style={h.watch}><Text style={h.watchT}>WATCH NOW</Text></View></View>
        </ImageBackground>
      </Pressable>:null}
      <Row title="Trending now" data={items.slice(0,12)}/>
      <Row title="Latest additions" data={[...items].reverse().slice(0,12)}/>
      {topGenres.map(g=><Row key={g} title={g} data={items.filter(a=>genresOf(a).includes(g)).slice(0,12)}/>)}
    </ScrollView>}
  </Screen>;
}
const h=StyleSheet.create({
  header:{paddingHorizontal:18,paddingTop:12,paddingBottom:14,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
  brand:{color:C.text,fontSize:20,fontWeight:"900",letterSpacing:1.2},
  sub:{color:C.mute,fontSize:12,marginTop:2},
  go:{color:C.blue,fontWeight:"800"},
  hero:{height:380,justifyContent:"flex-end",backgroundColor:C.card,borderRadius:16},
  overlay:{padding:16,backgroundColor:"rgba(10,13,20,0.62)",borderBottomLeftRadius:16,borderBottomRightRadius:16},
  heroT:{color:"#fff",fontSize:22,fontWeight:"900"},
  watch:{alignSelf:"flex-start",backgroundColor:C.blue,borderRadius:10,paddingVertical:9,paddingHorizontal:18,marginTop:12},
  watchT:{color:"#fff",fontWeight:"900"}
});
