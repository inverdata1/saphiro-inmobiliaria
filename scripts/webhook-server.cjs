#!/usr/bin/env node
const http = require("http");
const { execFile } = require("child_process");
const fs = require("fs");
const crypto = require("crypto");

const PORT = 3012;
const SECRET = fs.readFileSync("/home/deploy/saphiro-inmobiliaria/scripts/.deploy_secret", "utf8").trim();
const DEPLOY = "/home/deploy/saphiro-inmobiliaria/scripts/deploy.sh";

function verify(sig, body) {
  if (!sig) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", SECRET).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/hooks/deploy") {
    res.writeHead(404);
    return res.end("not found");
  }
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const sig = req.headers["x-hub-signature-256"];
    if (!verify(sig, body)) {
      res.writeHead(401);
      return res.end("invalid signature");
    }
    let payload;
    try {
      payload = JSON.parse(body.toString("utf8"));
    } catch {
      res.writeHead(400);
      return res.end("bad json");
    }
    const ref = payload.ref || "";
    if (ref !== "refs/heads/main") {
      res.writeHead(200);
      return res.end("ignored");
    }
    res.writeHead(202);
    res.end("deploying");
    execFile(DEPLOY, { timeout: 15 * 60 * 1000 }, (err) => {
      if (err) console.error("deploy failed", err);
      else console.log("deploy finished");
    });
  });
});

server.listen(PORT, "127.0.0.1", () => console.log("webhook on", PORT));
