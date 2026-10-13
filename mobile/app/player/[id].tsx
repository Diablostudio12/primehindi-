import { useEffect } from "react";
import { Pressable,StyleSheet,Text,View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router,useLocalSearchParams } from "expo-router";
import { VideoView,useVideoPlayer } from "expo-video";
import { WebView } from "react-native-webview";

const norm=(raw:string)=>{
 let u=String(raw||"").trim().replace(/^__PDI_CUSTOM__:/,"");
 const m=u.match(/src=["']([^"']+)["']/i);
 if(m)u=m[1];
 if(u.startsWith("//"))u="https:"+u;
 return u;
};
const isDirect=(u:string)=>/\.(mp4|m3u8|webm|mkv|mpd)(\?|#|$)/i.test(u);
const BLOCK_JS=`window.open=function(){return null};document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[target=_blank]'):null;if(a){e.preventDefault();}},true);true;`;

function Direct({source}:{source:string}){
 const player=useVideoPlayer(source,p=>{p.play();});
 useEffect(()=>()=>{try{player.pause()}catch{}},[player]);
 return <VideoView player={player} style={s.player} nativeControls contentFit="contain"/>;
}

function Embed({source}:{source:string}){
 return <WebView
  source={{uri:source}}
  style={s.web}
  originWhitelist={["http://*","https://*","about:blank","data:*","blob:*"]}
  javaScriptEnabled
  domStorageEnabled
  thirdPartyCookiesEnabled
  sharedCookiesEnabled
  allowsFullscreenVideo
  allowsInlineMediaPlayback
  mediaPlaybackRequiresUserAction={false}
  setSupportMultipleWindows={false}
  mixedContentMode="compatibility"
  injectedJavaScriptBeforeContentLoaded={BLOCK_JS}
  onShouldStartLoadWithRequest={(r)=>{
   const u=String(r.url||"");
   // Allow player redirects and separate HTTPS CDN/media hosts.
   // Do not allow external app schemes such as intent:// or market://.
   return /^https?:\/\//i.test(u)||/^(about:blank|data:|blob:)/i.test(u);
  }}
  onOpenWindow={()=>{}}
 />;
}

export default function Player(){
 const {url}=useLocalSearchParams<{url?:string}>();
 const source=norm(Array.isArray(url)?url[0]:url||"");
 return <SafeAreaView style={s.safe}>
  <Pressable onPress={()=>router.back()}><Text style={s.back}>← Back</Text></Pressable>
  <View style={s.video}>
   {!source?<Text style={s.error}>Video source unavailable. Go back and select the episode again.</Text>:isDirect(source)?<Direct source={source}/>:<Embed source={source}/>}
  </View>
 </SafeAreaView>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:"#000"},
 back:{color:"#fff",padding:18,fontWeight:"700"},
 video:{flex:1,justifyContent:"center",alignItems:"center",backgroundColor:"#05070b"},
 player:{width:"100%",aspectRatio:16/9},
 web:{width:"100%",flex:1,backgroundColor:"#000"},
 error:{color:"#fff",padding:20,textAlign:"center"}
});