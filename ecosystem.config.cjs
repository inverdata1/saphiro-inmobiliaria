module.exports = {
  apps: [
    {
      name: "saphiro-inmobiliaria-api",
      cwd: "/home/deploy/saphiro-inmobiliaria/api",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production" },
    },
  ],
};
