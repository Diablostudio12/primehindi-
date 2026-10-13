module.exports = ({ config }) => ({
  ...config,
  name: "Prime Hindi",
  slug: "prime-hindi",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "primehindi",
  userInterfaceStyle: "dark",
  backgroundColor: "#050816",
  android: {
    ...config.android,
    package: "in.primordial.primehindi",
    adaptiveIcon: {
      backgroundColor: "#050816"
    }
  }
});
