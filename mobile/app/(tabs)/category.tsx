import { useState } from "react";
import { ScrollView, View } from "react-native";
import { Screen, Title, Grid, Chip, useAnime, genresOf } from "../../src/ui";

export default function Category(){
  const {items,loading}=useAnime();
  const [sel,setSel]=useState<string|null>(null);
  const genres=Array.from(new Set(items.flatMap(a=>genresOf(a)))).sort();
  const cur=sel||genres[0]||null;
  const data=cur?items.filter(a=>genresOf(a).includes(cur)):[];
  return <Screen>
    <Title text="Category" sub={cur?cur+" • "+data.length+" titles":undefined}/>
    <View style={{height:48}}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:18,gap:8}}>
        {genres.map(g=><Chip key={g} label={g} on={g===cur} onPress={()=>setSel(g)}/>)}
      </ScrollView>
    </View>
    <Grid data={data} loading={loading} empty={genres.length?"Is category me koi anime nahi":"Categories abhi available nahi hain"}/>
  </Screen>;
}
