const http = require('http');
const url = require('url');
const mime = require('mime');
const path = require('path');
const fs = require('fs');

const server = http.createServer(function(req, resp) {
    const filename = path.join(__dirname, "public", url.parse(req.url).pathname);

    (fs.exists || path.exists)(filename, function(exists) {
        if (exists) {
            fs.readFile(filename, function(err, data) {
                if (err) {
                    resp.writeHead(500, {
                        "Content-Type": "text/plain"
                    });
                    resp.write("Internal server error: could not read file");
                    resp.end();
                    return;
                }
                const mimetype = mime.getType(filename);
                resp.writeHead(200, {
                    "Content-Type": mimetype
                });
                resp.write(data);
                resp.end();
                return;
            });
        } else {
            resp.writeHead(404, {
                "Content-Type": "text/plain"
            });
            resp.write("Requested file not found: " + filename);
            resp.end();
            return;
        }
    });
});

server.listen(3456, function() {
    console.log("Server running at http://localhost:3456/");
});