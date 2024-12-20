const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path'); // Ajout de l'importation de path

// Initialisation de l'application
const app = express();

// Importation des routes
const categorieRouter = require('./routes/categories.route');
const scategorieRouter = require('./routes/scategories.route');
const articleRouter = require('./routes/article.route');


// Middleware CORS
app.use(cors())
// Configuration dotenv
dotenv.config();

// Vérification des variables d'environnement
if (!process.env.DATABASECLOUD || !process.env.PORT) {
    console.error("Les variables d'environnement DATABASECLOUD et PORT doivent être définies.");
    process.exit(1);
}


// Middleware pour parser le corps des requêtes en JSON
app.use(express.json());

// Connexion à la base de données
mongoose.connect(process.env.DATABASECLOUD)
    .then(() => {
        console.log("Connexion réussie à la base de données.");
    })
    .catch(err => {
        console.error("Erreur lors de la connexion à la base de données :", err);
        process.exit(1);
    });

// Définition des routes
//app.get("/", (req, res) => {
   //res.send("Page d'accueil");
//});

app.use('/api/categories', categorieRouter);
app.use('/api/scategories', scategorieRouter);
app.use('/api/articles', articleRouter);

//dist reactjs
app.use(express.static(path.join(__dirname, './client/build'))); // Route pourles pages non trouvées, redirige vers index.html
app.get('*', (req, res) => { res.sendFile(path.join(__dirname,'./client/build/index.html')); });


// Lancement du serveur
app.listen(process.env.PORT)
console.log("application executée sur le port " + process.env.PORT)
module.exports = app;
