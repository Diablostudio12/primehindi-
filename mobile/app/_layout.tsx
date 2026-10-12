import { useEffect,useRef,useState } from "react";
import { ActivityIndicator,Animated,Easing,StyleSheet,Text,View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { warm } from "../src/ui";

function Splash({onDone}:{onDone:()=>void}){
 const pop=useRef(new Animated.Value(0)).current;
 const fade=useRef(new Animated.Value(1)).current;
 useEffect(()=>{
  let alive=true;
  Animated.timing(pop,{toValue:1,duration:800,easing:Easing.out(Easing.back(1.5)),useNativeDriver:true}).start();
  Promise.all([warm(),new Promise(r=>setTimeout(r,1900))]).then(()=>{
   if(!alive)return;
   Animated.timing(fade,{toValue:0,duration:350,useNativeDriver:true}).start(()=>onDone());
  });
  return ()=>{alive=false};
 },[]);
 return <Animated.View style={[s.wrap,{opacity:fade}]}>
  <Animated.View style={{alignItems:"center",opacity:pop,transform:[{scale:pop.interpolate({inputRange:[0,1],outputRange:[0.6,1]})}]}}>
   <View style={s.badge}><Text style={s.play}>▶</Text></View>
   <Text style={s.brand}>PRIME HINDI</Text>
   <Text style={s.sub}>Hindi Anime Streaming</Text>
  </Animated.View>
  <ActivityIndicator color="#2F6BFF" style={{position:"absolute",bottom:90}}/>
 </Animated.View>;
}

export default function Layout(){
 const [done,setDone]=useState(false);
 return <View style={{flex:1,backgroundColor:"#0A0D14"}}>
  <StatusBar style="light"/>
  <Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:"#0A0D14"}}}/>
  {!done&&<Splash onDone={()=>setDone(true)}/>}
 </View>;
}
const s=StyleSheet.create({
 wrap:{...StyleSheet.absoluteFillObject,backgroundColor:"#0A0D14",alignItems:"center",justifyContent:"center",zIndex:50},
 badge:{width:92,height:92,borderRadius:26,backgroundColor:"#2F6BFF",alignItems:"center",justifyContent:"center"},
 play:{color:"#fff",fontSize:38,marginLeft:5},
 brand:{color:"#F2F5FA",fontSize:28,fontWeight:"900",letterSpacing:3,marginTop:22},
 sub:{color:"#8A94A8",marginTop:6,fontSize:13}
});
