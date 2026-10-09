import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { api } from "../../src/api";
import { Screen, Title, Grid, Chip, useAnime, listOf, titleOf } from "../../src/ui";

export default function Browse(){
  const {items,loading}=useAnime();
  const [sort,setSort]=useState<"new"|"az">("new");
  const [studio,setStudio]=useState<number|null>(null);
  const [studios,setStudios]=useState<any[]>([]);
  useEffect(()=>{ api.studios().then(d=>setStudios(listOf(d,["studios","items"]))).catch(()=>{}); },[]);
  let data=items.filter(a=>studio===null||(a.studio_id??a.studioId)===studio);
  data=sort==="az"?[...data].sort((a,b)=>titleOf(a).localeCompare(titleOf(b))):[...data].reverse();
  return <Screen>
    <Title text="Browse" sub={items.length+" titles"}/>
    <View style={{height:48}}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:18,gap:8}}>
        <Chip label="Latest" on={sort==="new"} onPress={()=>setSort("new")}/>
        <Chip label="A-Z" on={sort==="az"} onPress={()=>setSort("az")}/>
        {studios.length?<Chip label="All studios" on={studio===null} onPress={()=>setStudio(null)}/>:null}
        {studios.map(st=><Chip key={st.id} label={st.name||st.title||"Studio"} on={studio===st.id} onPress={()=>setStudio(st.id)}/>)}
      </ScrollView>
    </View>
    <Grid data={data} loading={loading} empty="Is filter me koi anime nahi mila"/>
  </Screen>;
}
