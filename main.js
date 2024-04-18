const { createServer } = require("node:http");
const { createProxyServer } = require("@squarecloud/http-proxy");
const { Worker } = require('worker_threads');

const proxy = createProxyServer({});
const targets = {
    website: "http://localhost:81",
    api: "http://localhost:82"
};

const server = createServer(async (req, res) => {

    try {

        let target = targets.website;

        if (req.url.startsWith("/api")) {
            req.url = req.url.slice(4);
            target = targets.api;
        };

        await proxy.web(req, res, { target });

    } catch (error) {
        console.error(error);
        res.statusCode = 500;
        res.end("Proxy error: " + error.toString());
    }

});

server.on("upgrade", async (req, socket, head) => {

    try {

        let target = targets.website;

        if (req.url.startsWith("/api")) {
            req.url = req.url.slice(4);
            target = targets.api;
        };

        await proxy.ws(req, socket, head, { target });
        
    } catch (error) {
        console.error(error);
        socket.end();
    }

});

server.listen(80, () => console.log("A proxy está ativa em http://localhost"));

new Worker("./start_service.js");