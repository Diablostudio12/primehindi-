import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const icon=(n:string)=>({color,size,focused}:{color:string;size:number;focused:boolean})=>
  <Ionicons name={(focused?n:n+"-outline") as any} size={size} color={color}/>;

export default function TabsLayout(){
  const insets=useSafeAreaInsets();
  return <Tabs screenOptions={{
    headerShown:false,
    tabBarActiveTintColor:"#2F6BFF",
    tabBarInactiveTintColor:"#6B7488",
    tabBarStyle:{backgroundColor:"#0D1220",borderTopColor:"#1E2536",height:64+insets.bottom,paddingTop:8,paddingBottom:8+insets.bottom},
    tabBarLabelStyle:{fontSize:10,fontWeight:"700"},
    sceneStyle:{backgroundColor:"#0A0D14"}
  }}>
    <Tabs.Screen name="home" options={{title:"Home",tabBarIcon:icon("home")}}/>
    <Tabs.Screen name="browse" options={{title:"Browse",tabBarIcon:icon("compass")}}/>
    <Tabs.Screen name="search" options={{title:"Search",tabBarIcon:icon("search")}}/>
    <Tabs.Screen name="category" options={{title:"Category",tabBarIcon:icon("grid")}}/>
    <Tabs.Screen name="mylist" options={{title:"My List",tabBarIcon:icon("bookmark")}}/>
    <Tabs.Screen name="profile" options={{title:"Profile",tabBarIcon:icon("person")}}/>
  </Tabs>;
}
