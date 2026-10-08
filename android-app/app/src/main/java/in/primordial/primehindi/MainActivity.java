package in.primordial.primehindi;

import android.app.*;
import android.content.*;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.*;
import android.view.*;
import android.view.inputmethod.InputMethodManager;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import androidx.media3.common.MediaItem;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.ui.PlayerView;
import com.google.android.gms.auth.api.signin.*;
import com.google.android.gms.common.api.ApiException;
import org.json.*;
import java.io.*;
import java.net.*;
import java.util.*;
import java.util.concurrent.*;

public class MainActivity extends AppCompatActivity {
 static final int BLUE=0xff2f6bff, BG_DARK=0xff080b12, CARD_DARK=0xff111622, TEXT_DARK=0xfff4f6fb, MUTED_DARK=0xff98a2b3;
 static final int BG_LIGHT=0xfff5f7fb, CARD_LIGHT=0xffffffff, TEXT_LIGHT=0xff101522, MUTED_LIGHT=0xff657084;
 LinearLayout root,content,bottom;
 ExecutorService io=Executors.newSingleThreadExecutor();
 Handler handler=new Handler(Looper.getMainLooper());
 ExoPlayer player;
 int episodeId=-1;
 boolean dark=true;
 String currentSlug="";
 SharedPreferences prefs;
 Runnable progressSaver;

 int bg(){return dark?BG_DARK:BG_LIGHT;} int card(){return dark?CARD_DARK:CARD_LIGHT;}
 int textColor(){return dark?TEXT_DARK:TEXT_LIGHT;} int muted(){return dark?MUTED_DARK:MUTED_LIGHT;}
 int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
 TextView tv(String s,float z){TextView t=new TextView(this);t.setText(s);t.setTextColor(textColor());t.setTextSize(z);t.setPadding(0,dp(5),0,dp(5));return t;}
 Button btn(String s){Button b=new Button(this);b.setText(s);b.setTextColor(Color.WHITE);b.setTextSize(14);b.setAllCaps(false);b.setMinHeight(dp(48));b.setPadding(dp(12),0,dp(12),0);GradientDrawable g=new GradientDrawable();g.setColor(BLUE);g.setCornerRadius(dp(12));b.setBackground(g);return b;}
 TextView chip(String s,boolean active){TextView t=tv(s,13);t.setGravity(Gravity.CENTER);t.setPadding(dp(16),0,dp(16),0);GradientDrawable g=new GradientDrawable();g.setColor(active?BLUE:card());g.setCornerRadius(dp(30));t.setBackground(g);return t;}
 void addGap(int h){Space s=new Space(this);content.addView(s,new LinearLayout.LayoutParams(1,dp(h)));}

 @Override public void onCreate(Bundle b){
  super.onCreate(b);
  prefs=getSharedPreferences("prime_hindi",MODE_PRIVATE);
  dark=prefs.getBoolean("dark",true);
  ApiClient.setToken(prefs.getString("token",""));
  getWindow().setStatusBarColor(bg()); getWindow().setNavigationBarColor(bg());
  home();
 }
 void saveToken(String t){ApiClient.setToken(t);prefs.edit().putString("token",t).apply();}
 void shell(String title,boolean withBottom){
  root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(bg());
  int status=getResources().getIdentifier("status_bar_height","dimen","android");
  root.setPadding(0,status>0?getResources().getDimensionPixelSize(status):dp(24),0,0);
  LinearLayout bar=new LinearLayout(this);bar.setGravity(Gravity.CENTER_VERTICAL);bar.setPadding(dp(16),dp(8),dp(10),dp(8));
  TextView logo=tv("PRIME HINDI",20);logo.setTypeface(null,1);
  bar.addView(logo,new LinearLayout.LayoutParams(0,dp(52),1));
  Button search=btn("⌕");search.setOnClickListener(v->search());bar.addView(search,new LinearLayout.LayoutParams(dp(52),dp(52)));
  Button profile=btn("◉");profile.setOnClickListener(v->profile());bar.addView(profile,new LinearLayout.LayoutParams(dp(52),dp(52)));
  root.addView(bar);
  ScrollView sc=new ScrollView(this);sc.setFillViewport(true);
  content=new LinearLayout(this);content.setOrientation(LinearLayout.VERTICAL);content.setPadding(dp(16),dp(8),dp(16),dp(withBottom?88:24));sc.addView(content);
  root.addView(sc,new LinearLayout.LayoutParams(-1,0,1));
  if(withBottom){bottom=new LinearLayout(this);bottom.setGravity(Gravity.CENTER);bottom.setPadding(dp(8),dp(6),dp(8),dp(8));bottom.setBackgroundColor(card());
   String[] n={"⌂ Home","◈ Explore","★ Saved","☰ Menu"};
   for(String x:n){Button q=btn(x);q.setTextSize(12);q.setBackgroundColor(Color.TRANSPARENT);q.setTextColor(textColor());bottom.addView(q,new LinearLayout.LayoutParams(0,dp(58),1));
    q.setOnClickListener(v->{if(x.contains("Home"))home();else if(x.contains("Explore"))search();else if(x.contains("Saved"))watchlist();else menu();});}
   root.addView(bottom,new LinearLayout.LayoutParams(-1,dp(70)));
  }
  setContentView(root);
 }
 void home(){
  shell("Home",true);
  content.addView(tv("Welcome to Prime Hindi",28));content.addView(tv("Hindi fan-dub anime, made for easy watching.",15));
  addGap(10);
  TextView trend=tv("🔥 Trending Now",21);trend.setTypeface(null,1);content.addView(trend);
  loadAnime(false,"Trending");
 }
 void loadAnime(boolean filter,String heading){
  io.execute(()->{try{JSONArray a=ApiClient.anime();runOnUiThread(()->renderHome(a,heading));}catch(Exception e){err(e);}});
 }
 void renderHome(JSONArray a,String heading){
  content.removeAllViews();
  content.addView(tv("Welcome to Prime Hindi",28));content.addView(tv("Free Hindi fan-dub anime • Stream anywhere",15));
  addGap(12);
  TextView h=tv("🔥 "+heading,21);h.setTypeface(null,1);content.addView(h);
  int count=Math.min(6,a.length());
  for(int i=0;i<count;i++) addCard(a.optJSONObject(i),false);
  if(!ApiClient.getToken().isEmpty()) continueWatching(a);
  TextView cat=tv("Browse Categories",21);cat.setTypeface(null,1);content.addView(cat);addGap(4);
  LinearLayout row=new LinearLayout(this);row.setOrientation(LinearLayout.HORIZONTAL);
  String[] cats={"Action","Romance","Fantasy","Comedy","Sci-Fi","Sports"};
  for(String c:cats){TextView q=chip(c,false);row.addView(q,new LinearLayout.LayoutParams(-2,dp(42)));q.setOnClickListener(v->filterCategory(a,c));}
  ScrollView hs=new ScrollView(this);hs.setHorizontalScrollBarEnabled(false);hs.addView(row);content.addView(hs,new LinearLayout.LayoutParams(-1,dp(50)));
  TextView all=tv("All Anime",21);all.setTypeface(null,1);content.addView(all);
  for(int i=6;i<a.length();i++)addCard(a.optJSONObject(i),false);
 }
 void filterCategory(JSONArray a,String category){
  JSONArray out=new JSONArray();
  for(int i=0;i<a.length();i++){JSONObject x=a.optJSONObject(i);if(x==null)continue;JSONArray g=x.optJSONArray("genres");boolean ok=false;if(g!=null)for(int j=0;j<g.length();j++)if(g.optString(j).equalsIgnoreCase(category))ok=true;if(ok)out.put(x);}
  content.removeAllViews();content.addView(tv(category+" Anime",26));content.addView(tv(out.length()+" titles found",14));for(int i=0;i<out.length();i++)addCard(out.optJSONObject(i),false);
 }
 void addCard(JSONObject x,boolean compact){
  if(x==null)return;
  LinearLayout c=new LinearLayout(this);c.setOrientation(LinearLayout.VERTICAL);c.setPadding(dp(14),dp(14),dp(14),dp(14));c.setBackgroundColor(card());
  LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,-2);cp.setMargins(0,0,0,dp(12));
  ImageView poster=new ImageView(this);poster.setScaleType(ImageView.ScaleType.CENTER_CROP);poster.setBackgroundColor(0xff1b2230);String url=x.optString("poster_url","");
  c.addView(poster,new LinearLayout.LayoutParams(-1,compact?dp(120):dp(170)));if(!url.isEmpty())loadImage(url,poster);
  TextView title=tv(x.optString("title"),19);title.setTypeface(null,1);c.addView(title);
  c.addView(tv("★ "+x.optString("rating","—")+"   •   "+x.optString("year","—")+"   •   "+x.optString("status",""),13));
  String genres=x.optJSONArray("genres")!=null?x.optJSONArray("genres").join(" • "):"";
  if(!genres.isEmpty())c.addView(tv(genres,12));
  String desc=x.optString("description","");if(desc.length()>150)desc=desc.substring(0,150)+"…";c.addView(tv(desc,13));
  Button open=btn("View Anime");open.setOnClickListener(v->detail(x.optString("slug")));c.addView(open);
  content.addView(c,cp);
 }
 void continueWatching(JSONArray all){
  io.execute(()->{try{JSONArray p=ApiClient.progress();runOnUiThread(()->{if(p.length()==0)return;TextView h=tv("▶ Continue Watching",21);h.setTypeface(null,1);content.addView(h,0);int added=0;
    for(int i=0;i<p.length()&&added<5;i++){JSONObject pr=p.optJSONObject(i);int eid=pr.optInt("episode_id",-1);int sec=pr.optInt("seconds",0);if(sec<5)continue;
     for(int j=0;j<all.length();j++){JSONObject a=all.optJSONObject(j);JSONArray es=a==null?null:a.optJSONArray("episodes");if(es==null)continue;for(int k=0;k<es.length();k++){JSONObject e=es.optJSONObject(k);if(e!=null&&e.optInt("id",-2)==eid){TextView q=tv("▶ "+a.optString("title")+" • Episode "+e.optInt("episode_number")+"  ("+sec+"s)",15);q.setPadding(dp(12),dp(14),dp(12),dp(14));q.setBackgroundColor(card());q.setOnClickListener(v->play(a,e,sec));content.addView(q,1+added);added++;break;}}if(added>=5)break;}}
   });}catch(Exception ignored){}}});
 }
 void detail(String slug){
  currentSlug=slug;shell("Anime",true);content.addView(tv("Loading…",16));
  io.execute(()->{try{JSONObject a=ApiClient.anime(slug);JSONArray c=ApiClient.comments(slug);runOnUiThread(()->detailUi(a,c));}catch(Exception e){err(e);}});
 }
 void detailUi(JSONObject a,JSONArray comments){
  content.removeAllViews();currentSlug=a.optString("slug","");
  ImageView poster=new ImageView(this);poster.setScaleType(ImageView.ScaleType.CENTER_CROP);poster.setBackgroundColor(0xff1b2230);content.addView(poster,new LinearLayout.LayoutParams(-1,dp(260)));if(!a.optString("poster_url","").isEmpty())loadImage(a.optString("poster_url"),poster);
  TextView title=tv(a.optString("title"),27);title.setTypeface(null,1);content.addView(title);
  content.addView(tv("★ "+a.optString("rating","—")+"   "+a.optString("year","—")+"   "+a.optString("status",""),14));
  content.addView(tv(a.optString("description"),14));
  Button w=btn(ApiClient.getToken().isEmpty()?"Sign in to use Watchlist":"★ Add to Watchlist");w.setOnClickListener(v->{if(ApiClient.getToken().isEmpty()){profile();return;}io.execute(()->{try{ApiClient.watch(a.getInt("id"),true);runOnUiThread(()->toast("Added to Watchlist"));}catch(Exception e){err(e);}});});content.addView(w);
  TextView epH=tv("Episodes",21);epH.setTypeface(null,1);content.addView(epH);
  JSONArray es=a.optJSONArray("episodes");if(es!=null)for(int i=0;i<es.length();i++){JSONObject e=es.optJSONObject(i);Button b=btn("Episode "+e.optInt("episode_number")+"  •  "+e.optString("title",""));b.setOnClickListener(v->play(a,e,0));content.addView(b,new LinearLayout.LayoutParams(-1,dp(52)));}
  addGap(10);TextView ch=tv("💬 Comments",21);ch.setTypeface(null,1);content.addView(ch);
  if(ApiClient.getToken().isEmpty()){content.addView(tv("Sign in to join the discussion.",14));}else{EditText input=new EditText(this);input.setHint("Write a comment…");input.setTextColor(textColor());input.setHintTextColor(muted());content.addView(input);Button post=btn("Post Comment");post.setOnClickListener(v->{String s=input.getText().toString().trim();if(s.isEmpty())return;io.execute(()->{try{ApiClient.comment(currentSlug,s);runOnUiThread(()->{input.setText("");toast("Comment sent for approval");});}catch(Exception e){err(e);}});});content.addView(post);}
  for(int i=0;i<comments.length();i++){JSONObject c=comments.optJSONObject(i);content.addView(tv(c.optString("display_name")+"\n"+c.optString("content"),14));}
 }
 void play(JSONObject anime,JSONObject e,int resume){
  if(player!=null){player.release();player=null;}
  episodeId=e.optInt("id",-1);String url=e.optString("video_url","");
  shell("Now Playing",false);content.setPadding(0,0,0,0);
  TextView t=tv(anime.optString("title")+" • Episode "+e.optInt("episode_number"),18);t.setPadding(dp(16),dp(10),dp(16),dp(10));content.addView(t);
  PlayerView pv=new PlayerView(this);pv.setUseController(true);content.addView(pv,new LinearLayout.LayoutParams(-1,dp(235)));
  TextView info=tv("Loading video…",14);info.setPadding(dp(16),dp(10),dp(16),dp(10));content.addView(info);
  player=new ExoPlayer.Builder(this).build();pv.setPlayer(player);
  if(url.startsWith("__PDI_CUSTOM__:"))url=url.substring("__PDI_CUSTOM__:".length());
  player.setMediaItem(MediaItem.fromUri(Uri.parse(url)));player.prepare();
  player.addListener(new androidx.media3.common.Player.Listener(){@Override public void onPlaybackStateChanged(int state){if(state==androidx.media3.common.Player.STATE_READY){if(resume>0)player.seekTo(resume*1000L);info.setText("Playing • Progress is saved automatically");}}});
  player.play();
  progressSaver=()->{if(player!=null&&player.isPlaying()&&!ApiClient.getToken().isEmpty()&&episodeId>0){int sec=(int)(player.getCurrentPosition()/1000);io.execute(()->{try{ApiClient.progress(episodeId,sec);}catch(Exception ignored){}});}handler.postDelayed(progressSaver,5000);};
  handler.postDelayed(progressSaver,5000);
 }
 void search(){
  shell("Search",true);EditText q=new EditText(this);q.setHint("Search anime…");q.setTextColor(textColor());q.setHintTextColor(muted());content.addView(q);
  Button b=btn("Search");content.addView(b);b.setOnClickListener(v->{String z=q.getText().toString().trim().toLowerCase(Locale.ROOT);io.execute(()->{try{JSONArray a=ApiClient.anime(),o=new JSONArray();for(int i=0;i<a.length();i++){JSONObject x=a.getJSONObject(i);if(z.isEmpty()||x.optString("title").toLowerCase(Locale.ROOT).contains(z)||x.optString("alt_title").toLowerCase(Locale.ROOT).contains(z))o.put(x);}runOnUiThread(()->{content.removeAllViews();content.addView(tv("Search Results",25));for(int i=0;i<o.length();i++)addCard(o.optJSONObject(i),true);});}catch(Exception e){err(e);}});});
 }
 void watchlist(){
  shell("Watchlist",true);if(ApiClient.getToken().isEmpty()){content.addView(tv("Sign in to use your Watchlist.",19));Button b=btn("Sign In / Register");b.setOnClickListener(v->profile());content.addView(b);return;}
  io.execute(()->{try{JSONArray a=ApiClient.watchlist();runOnUiThread(()->{content.addView(tv(a.length()+" saved titles",14));for(int i=0;i<a.length();i++)addCard(a.optJSONObject(i),true);});}catch(Exception e){err(e);}});
 }
 void studios(){shell("Studios",true);io.execute(()->{try{JSONArray a=ApiClient.studios();runOnUiThread(()->{content.addView(tv("Dubbing Studios",26));for(int i=0;i<a.length();i++){JSONObject x=a.optJSONObject(i);LinearLayout c=new LinearLayout(this);c.setOrientation(LinearLayout.VERTICAL);c.setPadding(dp(14),dp(14),dp(14),dp(14));c.setBackgroundColor(card());c.addView(tv(x.optString("name"),19));c.addView(tv(x.optInt("anime_count")+" anime",13));content.addView(c,new LinearLayout.LayoutParams(-1,dp(90)));}});}catch(Exception e){err(e);}});}
 void menu(){
  shell("Menu",true);content.addView(tv("Prime Hindi",28));content.addView(tv("Your native anime streaming app",14));String[] names={"Home","Search","Watchlist","Studios","Profile","Notifications","Appearance"};
  for(String n:names){Button b=btn(n);b.setBackgroundColor(Color.TRANSPARENT);b.setTextColor(textColor());content.addView(b);b.setOnClickListener(v->{if(n.equals("Home"))home();else if(n.equals("Search"))search();else if(n.equals("Watchlist"))watchlist();else if(n.equals("Studios"))studios();else if(n.equals("Profile"))profile();else if(n.equals("Notifications"))notifications();else appearance();});}
 }
 void profile(){
  shell("Account",true);if(ApiClient.getToken().isEmpty()){auth();return;}
  io.execute(()->{try{JSONObject u=ApiClient.me();runOnUiThread(()->{content.addView(tv("Welcome, "+u.optString("display_name"),27));content.addView(tv(u.optString("email"),14));Button w=btn("★ Watchlist");w.setOnClickListener(v->watchlist());content.addView(w);Button n=btn("🔔 Notifications");n.setOnClickListener(v->notifications());content.addView(n);Button o=btn("Sign Out");o.setOnClickListener(v->{saveToken("");home();});content.addView(o);});}catch(Exception e){err(e);}});
 }
 void auth(){
  content.addView(tv("Sign in to Prime Hindi",27));content.addView(tv("Use your existing website account.",14));
  EditText name=new EditText(this);name.setHint("Display name (Register only)");name.setTextColor(textColor());name.setHintTextColor(muted());content.addView(name);
  EditText e=new EditText(this);e.setHint("Email");e.setTextColor(textColor());e.setHintTextColor(muted());content.addView(e);
  EditText p=new EditText(this);p.setHint("Password");p.setTextColor(textColor());p.setHintTextColor(muted());p.setInputType(0x81);content.addView(p);
  Button login=btn("Sign In");content.addView(login);Button reg=btn("Create Account");reg.setBackgroundColor(0xff202838);content.addView(reg);
  Button google=btn("G  Continue with Google");google.setBackgroundColor(Color.WHITE);google.setTextColor(Color.BLACK);content.addView(google);
  login.setOnClickListener(v->io.execute(()->{try{JSONObject r=ApiClient.login(e.getText().toString().trim(),p.getText().toString());saveToken(r.getString("token"));runOnUiThread(this::home);}catch(Exception x){err(x);}}));
  reg.setOnClickListener(v->io.execute(()->{try{JSONObject r=ApiClient.register(name.getText().toString().trim(),e.getText().toString().trim(),p.getText().toString());if(r.has("token"))saveToken(r.getString("token"));runOnUiThread(()->{toast(r.has("token")?"Account created":"Account created — please sign in");if(!r.has("token"))auth();else home();});}catch(Exception x){err(x);}}));
  google.setOnClickListener(v->startGoogle());
 }
 void startGoogle(){
  io.execute(()->{try{String id=ApiClient.googleClientId();if(id.isEmpty()){err(new Exception("Google Sign-In is not configured on the server"));return;}GoogleSignInOptions gso=new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN).requestIdToken(id).requestEmail().build();GoogleSignInClient client=GoogleSignIn.getClient(this,gso);runOnUiThread(()->startActivityForResult(client.getSignInIntent(),7001));}catch(Exception e){err(e);}});
 }
 @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){
  super.onActivityResult(requestCode,resultCode,data);if(requestCode!=7001)return;
  try{GoogleSignInAccount a=GoogleSignIn.getSignedInAccountFromIntent(data).getResult(ApiException.class);String id=a.getIdToken();if(id==null){err(new Exception("Google did not return an ID token"));return;}io.execute(()->{try{JSONObject r=ApiClient.google(id);saveToken(r.getString("token"));runOnUiThread(this::home);}catch(Exception e){err(e);}});}catch(ApiException e){err(new Exception("Google Sign-In failed ("+e.getStatusCode()+")"));}}
 void notifications(){
  shell("Notifications",true);if(ApiClient.getToken().isEmpty()){content.addView(tv("Sign in to view notifications.",18));return;}
  io.execute(()->{try{JSONArray a=ApiClient.notifications();runOnUiThread(()->{if(a.length()==0)content.addView(tv("You're all caught up.",18));for(int i=0;i<a.length();i++){JSONObject x=a.optJSONObject(i);LinearLayout c=new LinearLayout(this);c.setOrientation(LinearLayout.VERTICAL);c.setPadding(dp(14),dp(12),dp(14),dp(12));c.setBackgroundColor(card());c.addView(tv(x.optString("title"),17));c.addView(tv(x.optString("message"),14));Button r=btn(x.optBoolean("is_read")?"Read":"Mark as read");r.setOnClickListener(v->io.execute(()->{try{ApiClient.markNotification(x.optInt("id"));runOnUiThread(()->r.setText("Read"));}catch(Exception e){err(e);}}));c.addView(r);content.addView(c);}});}catch(Exception e){err(e);}});
 }
 void appearance(){
  shell("Appearance",true);content.addView(tv("Theme",25));content.addView(tv("Choose how Prime Hindi looks on your phone.",14));
  Switch sw=new Switch(this);sw.setText("Dark mode");sw.setTextColor(textColor());sw.setChecked(dark);content.addView(sw);sw.setOnCheckedChangeListener((b,c)->{dark=c;prefs.edit().putBoolean("dark",dark).apply();getWindow().setStatusBarColor(bg());getWindow().setNavigationBarColor(bg());recreate();});
 }
 void loadImage(String url,ImageView target){
  io.execute(()->{try{HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setConnectTimeout(8000);c.setReadTimeout(12000);InputStream in=c.getInputStream();final Bitmap bm=BitmapFactory.decodeStream(in);in.close();if(bm!=null)runOnUiThread(()->target.setImageBitmap(bm));}catch(Exception ignored){}});}
 void toast(String s){Toast.makeText(this,s,Toast.LENGTH_SHORT).show();}
 void err(Exception e){runOnUiThread(()->Toast.makeText(this,e.getMessage()==null?"Something went wrong":e.getMessage(),Toast.LENGTH_LONG).show());}
 @Override protected void onDestroy(){if(progressSaver!=null)handler.removeCallbacks(progressSaver);if(player!=null)player.release();io.shutdownNow();super.onDestroy();}
}