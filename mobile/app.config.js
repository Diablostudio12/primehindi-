const fs=require("fs");
const path=require("path");
const has=(f)=>fs.existsSync(path.join(__dirname,f));
module.exports=({config})=>{
  const icon=has("assets/icon.png");
  return {
    ...config,
    ...(icon?{icon:"./assets/icon.png"}:{}),
    android:{
      ...config.android,
      adaptiveIcon:{
        ...config.android.adaptiveIcon,
        ...(icon?{foregroundImage:"./assets/icon.png"}:{})
      }
    }
  };
};
