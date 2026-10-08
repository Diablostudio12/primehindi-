package in.primordial.primehindi;

import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;

public final class ApiClient {
 public static final String BASE="https://primordial-streaming-backend-production.up.railway.app/api";
 private static String token="";
 public static void setToken(String t){token=t==null?"":t;}
 public static String getToken(){return token;}

 private static String req(String m,String p,String b)throws Exception{
  HttpURLConnection c=(HttpURLConnection)new URL(BASE+p).openConnection();
  c.setRequestMethod(m); c.setConnectTimeout(12000); c.setReadTimeout(20000);
  c.setRequestProperty("Accept","application/json");
  if(!token.isEmpty())c.setRequestProperty("Authorization","Bearer "+token);
  if(b!=null){c.setDoOutput(true);c.setRequestProperty("Content-Type","application/json");try(OutputStream o=c.getOutputStream()){o.write(b.getBytes(StandardCharsets.UTF_8));}}
  int n=c.getResponseCode(); InputStream in=n>=200&&n<400?c.getInputStream():c.getErrorStream();
  String s=new BufferedReader(new InputStreamReader(in==null?InputStream.nullInputStream():in,StandardCharsets.UTF_8)).lines().reduce("",(a,x)->a+x);
  if(n<200||n>=400)throw new IOException(s.isEmpty()?"Request failed ("+n+")":s);
  return s;
 }
 public static JSONObject login(String e,String p)throws Exception{return new JSONObject(req("POST","/auth/login",new JSONObject().put("email",e).put("password",p).toString()));}
 public static JSONObject register(String n,String e,String p)throws Exception{return new JSONObject(req("POST","/auth/register",new JSONObject().put("displayName",n).put("email",e).put("password",p).toString()));}
 public static String googleClientId()throws Exception{return new JSONObject(req("GET","/auth/google/config",null)).optString("clientId","");}
 public static JSONObject google(String credential)throws Exception{return new JSONObject(req("POST","/auth/google",new JSONObject().put("credential",credential).toString()));}
 public static JSONArray anime()throws Exception{return new JSONArray(req("GET","/anime",null));}
 public static JSONObject anime(String s)throws Exception{return new JSONObject(req("GET","/anime/"+URLEncoder.encode(s,StandardCharsets.UTF_8),null));}
 public static JSONArray studios()throws Exception{return new JSONArray(req("GET","/studios",null));}
 public static JSONArray watchlist()throws Exception{return new JSONArray(req("GET","/watchlist",null));}
 public static void watch(int id,boolean add)throws Exception{req(add?"POST":"DELETE","/watchlist/"+id,add?"{}":null);}
 public static JSONArray notifications()throws Exception{return new JSONArray(req("GET","/notifications",null));}
 public static void markNotification(int id)throws Exception{req("PATCH","/notifications/"+id+"/read","{}");}
 public static JSONObject me()throws Exception{return new JSONObject(req("GET","/me",null));}
 public static JSONArray progress()throws Exception{return new JSONArray(req("GET","/progress",null));}
 public static void progress(int id,int sec)throws Exception{req("PUT","/progress/"+id,new JSONObject().put("seconds",sec).toString());}
 public static JSONArray comments(String slug)throws Exception{return new JSONArray(req("GET","/anime/"+URLEncoder.encode(slug,StandardCharsets.UTF_8)+"/comments",null));}
 public static JSONObject comment(String slug,String text)throws Exception{return new JSONObject(req("POST","/anime/"+URLEncoder.encode(slug,StandardCharsets.UTF_8)+"/comments",new JSONObject().put("content",text).toString()));}
}