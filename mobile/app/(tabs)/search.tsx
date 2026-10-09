import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Screen, Title, Grid, C, useAnime, titleOf, genresOf } from "../../src/ui";

export default function Search(){
  const {items,loading}=useAnime();
  const [q,setQ]=useState("");
  const t=q.trim().toLowerCase();
  const data=t?items.filter(a=>titleOf(a).toLowerCase().includes(t)||genresOf(a).some(g=>g.toLowerCase().includes(t))):[];
  return <Screen>
    <Title text="Search"/>
    <View style={{paddingHorizontal:18,marginBottom:8}}>
      <TextInput value={q} onChangeText={setQ} placeholder="Anime ya genre search karo..." placeholderTextColor="#70798c" style={st.input} autoCorrect={false} returnKeyType="search"/>
    </View>
    <Grid data={data} loading={loading} empty={t?"Kuch nahi mila":"Anime ka naam type karo"}/>
  </Screen>;
}
const st=StyleSheet.create({input:{backgroundColor:C.card,borderWidth:1,borderColor:C.line,borderRadius:14,paddingHorizontal:15,paddingVertical:12,color:"#fff"}});
