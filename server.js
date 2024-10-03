const http = require("http");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

// Configuración de Nodemailer
const transport = nodemailer.createTransport({
    host: process.env.HOST,
    port: process.env.PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
    },
});

// Función para validar el body
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?\d{10,15}$/;
const NAME_REGEX = /^[a-zA-Z\s]+$/;

function isValidBody(body) {
    return (
        typeof body === "object" &&
        body !== null &&
        typeof body.email === "string" &&
        typeof body.message === "string" &&
        typeof body.phone === "string" &&
        typeof body.name === "string" &&
        EMAIL_REGEX.test(body.email) &&
        PHONE_REGEX.test(body.phone) &&
        NAME_REGEX.test(body.name) &&
        body.message.trim().length > 0
    );
}

// Crear el servidor
const server = http.createServer(async (req, res) => {
    // Permitir CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        // Manejo de solicitudes preflight
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === "POST" && req.url === "/") {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", async () => {
            try {
                const parsedBody = JSON.parse(body);

                // Validar el cuerpo
                if (!isValidBody(parsedBody)) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ error: "Invalid Body" }));
                    return;
                }

                // Preparar el correo
                const mailOptions = {
                    from: `"${parsedBody.name}" <${process.env.EMAIL}>`,
                    to: process.env.EMAIL,
                    subject: `Mensaje de ${parsedBody.name} desde PuntoCero`,
                    html: `
                        <h2>Detalles del mensaje:</h2>
                        <p><strong>Nombre:</strong> ${parsedBody.name}</p>
                        <p><strong>Email:</strong> ${parsedBody.email}</p>
                        <p><strong>Teléfono:</strong> ${parsedBody.phone}</p>
                        <p><strong>Mensaje:</strong></p>
                        <p>${parsedBody.message}</p>
                    `,
                    replyTo: parsedBody.email,
                };

                // Enviar el correo
                await transport.sendMail(mailOptions);

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Email successfully delivered" }));
            } catch (error) {
                console.error("Error:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Internal Server Error" }));
            }
        });
    } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not Found" }));
    }
});

// Iniciar el servidor en el puerto 3000
server.listen(3000, () => {
    console.log("Server listening on port 3000");
});
