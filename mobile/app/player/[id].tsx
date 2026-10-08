import { useEffect } from "react";
import { Pressable,SafeAreaView,StyleSheet,Text,View } from "react-native";
import { router,useLocalSearchParams } from "expo-router";
import { VideoView,useVideoPlayer } from "expo-video";
export default function Player(){
 const {url}=useLocalSearchParams<{url?:string}>(); const source=Array.isArray(url)?url[0]:url||"";
 const player=useVideoPlayer(source||null,p=>{p.play();});
 useEffect(()=>()=>{try{player.pause()}catch{}},[player]);
 return <SafeAreaView style={s.safe}><Pressable onPress={()=>router.back()}><Text style={s.back}>← Back</Text></Pressable><View style={s.video}>{source?<VideoView player={player} style={s.player} nativeControls contentFit="contain"/>:<Text style={s.error}>Video source unavailable.</Text>}</View></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:"#000"},back:{color:"#fff",padding:18,fontWeight:"700"},video:{flex:1,justifyContent:"center",alignItems:"center",backgroundColor:"#05070b"},player:{width:"100%",aspectRatio:16/9},error:{color:"#fff"}});