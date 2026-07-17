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
    {
      name: "saphiro-inmobiliaria-web",
      cwd: "/home/deploy/saphiro-inmobiliaria",
      script: "node_modules/serve/build/main.js",
      args: "-s dist -l 3011",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production" },
    },
  ],
};
