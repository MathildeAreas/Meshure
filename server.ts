// server.ts - Serveur Deno principal
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

const app = new Application();
const router = new Router();

// Configuration CORS
app.use(oakCors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware pour servir les fichiers statiques
app.use(async (context, next) => {
  const { pathname } = context.request.url;
  
  // Servir index.html pour la racine
  if (pathname === "/") {
    try {
      const content = await Deno.readTextFile("./public/index.html");
      context.response.type = "text/html";
      context.response.body = content;
      return;
    } catch {
      context.response.status = 404;
      return;
    }
  }
  
  // Servir les fichiers statiques du dossier public
  if (pathname.startsWith("/")) {
    try {
      const filePath = `./public${pathname}`;
      const content = await Deno.readFile(filePath);
      
      // Définir le type MIME approprié
      const ext = pathname.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'html':
          context.response.type = "text/html";
          break;
        case 'css':
          context.response.type = "text/css";
          break;
        case 'js':
          context.response.type = "application/javascript";
          break;
        case 'json':
          context.response.type = "application/json";
          break;
        default:
          context.response.type = "application/octet-stream";
      }
      
      context.response.body = content;
      return;
    } catch {
      // Continue vers le prochain middleware si le fichier n'existe pas
    }
  }
  
  await next();
});

// Routes API
router.get("/api/health", (context) => {
  context.response.body = { 
    status: "OK", 
    timestamp: new Date().toISOString(),
    message: "Serveur Blender-Web fonctionnel"
  };
});

router.post("/api/measurements", async (context) => {
  try {
    const body = await context.request.body().value;
    console.log("Nouvelle mesure reçue:", body);
    
    // Ici vous pourrez sauvegarder en base de données plus tard
    context.response.body = { 
      success: true, 
      id: crypto.randomUUID(),
      measurement: body 
    };
  } catch (error) {
    context.response.status = 400;
    context.response.body = { error: "Données invalides" };
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

// Middleware 404
app.use((context) => {
  context.response.status = 404;
  context.response.body = "Page non trouvée";
});

// Démarrage du serveur
const PORT = 8000;
console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
console.log(`📁 Dossier public: ./public/`);
console.log(`🎯 API disponible sur /api/`);

await app.listen({ port: PORT });