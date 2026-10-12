const fs=require("fs");
const path=require("path");
const src=path.join(__dirname,"..","file_00000000819c8211abf373cd1bf8c86c (1).png");
const dst=path.join(__dirname,"assets","icon.png");
try{
  if(fs.existsSync(src)){
    fs.mkdirSync(path.dirname(dst),{recursive:true});
    fs.copyFileSync(src,dst);
  }
}catch(e){}
const icon=fs.existsSync(dst);
module.exports=({config})=>({
  ...config,
  ...(icon?{icon:"./assets/icon.png"}:{}),
  android:{
    ...config.android,
    adaptiveIcon:{
      ...config.android.adaptiveIcon,
      ...(icon?{foregroundImage:"./assets/icon.png"}:{})
    }
  }
});
