const net = require("net");
const fs = require("fs");

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

const flags = process.argv.slice(2);
const directory = flags.find((_, index) => flags[index - 1] == "--directory");

const args = {};
process.argv.forEach((arg, index) => {
  if (arg.startsWith("--")) {
    args[arg.replace(/^--/, "")] = process.argv[index + 1];
  }
});
1;

const FILES_DIR = args["directory"];

const server = net.createServer((socket) => {
    //Request
    socket.on("data", (data) => {
        const request = data.toString();
        console.log("Request: \n" + request);
        const url = request.split(' ')[1];
        const headers = request.split('\r\n');

        const reqBreakDown = data.toString().split("\r\n");
        const method = reqBreakDown[0].split(" ")[0];

        if(url == "/"){
            socket.write("HTTP/1.1 200 OK\r\n\r\n");
        } else if(url.includes("/echo/")){
            const content = url.split('/echo/')[1];
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`);
        } else if(url == "/user-agent"){
            const userAgent = headers[2].split('User-Agent: ')[1];
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`);
        } else if(url.startsWith("/files/") && method == 'GET'){
            const filePath = url.slice(7);
            if(!fs.existsSync(directory + filePath)){
                socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
                socket.end();
                return;
            }
            const file = fs.readFileSync(directory + filePath);
            socket.write(`HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${file.length}\r\n\r\n${file}`);
        } else if (
            url.startsWith("/files/") &&
            data.toString().split(" ")[0] === "POST"
          ) {
            let fileName = url.split("/")[2];
            const filePath = FILES_DIR + fileName;
            const file = data.toString("utf-8").split("\r\n\r\n")[1];
            fs.writeFileSync(filePath, file);
            socket.write("HTTP/1.1 201 Created\r\n\r\n");
          }  else{
            socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        }
    });

    //Error Handling
    socket.on("error", (e) => {
        console.error("ERROR: " + e);
        socket.end();
        socket.close();
    });
    
    //Closing
    socket.on("close", () => {
        socket.end();
       // server.close();
    });
});

server.listen(4221, "localhost");
