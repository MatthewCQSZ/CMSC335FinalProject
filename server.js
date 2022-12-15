const path = require('path');
const express = require("express");  
const bodyParser = require("body-parser"); 
const app = express(); 

require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') }) 

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const { MongoClient, ServerApiVersion } = require('mongodb');
const { table } = require('console');
const uri = `mongodb+srv://${userName}:${password}@cluster0.50bxxk7.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

if (process.argv.length != 3) {
    process.stdout.write(`Usage summerCampServer.js portNumber`);
    process.exit(1);
};
const portNumber = Number(process.argv[2]);
app.listen(portNumber);
const footer = `<a href="http://localhost:${portNumber}/">HOME</a>`;

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false}));

app.get("/", (request, response) => {
    response.render("index");
}); 

app.get("/caloriesInquery", (request, response) => {
    let form = {
        formAction: `<form action="http://localhost:${portNumber}/processCaloriesInquery" method="post">`,
        footer: footer,
    };
    response.render("caloriesInquery", form);
}); 

app.post("/processCaloriesInquery", (request, response) => { 
    let { food } = request.body;
    
    // API here
    let table = "<table border=\"1\"><tr><th>Name</th><th>Calories</th></tr>";

    table += "</table>";
    info = {
        table: table,
        footer: footer,
    };
    
    response.render("caloriesResponse", info);
});

app.get("/saveFood", (request, response) => {
    info = {
        footer: footer,
    }
    response.render("saveFood", info);
}); 

app.get("/enterFood", (request, response) => {
    let form = {
        formAction: `<form action="http://localhost:${portNumber}/processEnterFood" method="post">`,
        footer: footer,
    };
    response.render("enterFood", form);
}); 

app.post("/processEnterFood", (request, response) => { 
    let { userName, food } = request.body;
    
    // Add food entry to MongoDB here
    // Maybe get food calories before upload to DB? Should be easy

    let info = {
        header: `<h1><u>${userName}, Your Food is Saved Successfully!</u></h1>`,
        footer: footer,
    };
    
    response.render("processEnterFood", info);
});

app.get("/lookUpFood", (request, response) => {
    let form = {
        formAction: `<form action="http://localhost:${portNumber}/processLookUpFood" method="post">`,
        footer: footer,
    };
    response.render("lookUpFood", form);
}); 

app.post("/processLookUpFood", (request, response) => { 
    let { userName} = request.body;
    
    // Retrieve food entry from MongoDB here
    let table = "<table border=\"1\"><tr><th>Name</th><th>Calories</th></tr>";

    table += "</table>";

    let info = {
        header: `<h1><u>${userName}, Your Saved Food is Here!</u></h1>`,
        table: table,
        footer: footer,
    };
    
    response.render("processLookUpFood", info);
});




console.log(`Web server started and running at: http://localhost:${portNumber}`);
console.log("Stop to shutdown the server: ");
process.stdin.setEncoding("utf8"); 
process.stdin.on('readable', () => {  
	let dataInput = process.stdin.read();
	if (dataInput !== null) {
		let command = dataInput.trim();
		if (command === "stop") {
			console.log("Shutting down the server");
            process.exit(0); 
        } else {
			console.log(`Invalid command: ${command}`);
		}
        process.stdin.resume();
    }
});