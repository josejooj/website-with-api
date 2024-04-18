import { Server } from 'hyper-express';

const server = new Server({
    fast_buffers: true,
    trust_proxy: true
});

server.get("/", (req, res) => res.json("Hello World!"));

server.listen(82, () => {
    console.log("to on na porta 82")
})