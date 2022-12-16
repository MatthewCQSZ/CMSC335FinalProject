const path = require('path');
const express = require("express");  
const bodyParser = require("body-parser"); 
const app = express(); 

require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') }) ;

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const apiKey = process.env.API_KEY;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${userName}:${password}@cluster0.50bxxk7.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const api_url = 'https://api.calorieninjas.com/v1/nutrition?query=';


const portNumber = process.env.PORT || 5000;;
app.listen(portNumber);
const footer = `<a href="/">HOME</a>`;

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false}));

app.get("/", (request, response) => {
    response.render("index");
}); 

app.get("/caloriesInquery", (request, response) => {
    let form = {
        formAction: `<form action="/processCaloriesInquery" method="post">`,
        footer: footer,
    };
    response.render("caloriesInquery", form);
}); 

app.post("/processCaloriesInquery", async (request, response) => { 
    let { food } = request.body;
    
    // API here
    let table = `<div><em>In ${food}</em></div><br>`;
    table += "<table border=\"1\"><tr><th>Name</th><th>Calories</th></tr>";

    let res = await fetch(api_url+food, {
		method: 'GET',
		headers: {
			'X-Api-Key': apiKey,
		},
	});

    let {items} = await res.json();

    items.forEach((item) => {table += `<tr><td>${item.name}</td><td>${item.calories}</td></tr>`;});


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
        formAction: `<form action="/processEnterFood" method="post">`,
        footer: footer,
    };
    response.render("enterFood", form);
}); 

app.post("/processEnterFood", async (request, response) => { 
    let { userName, food } = request.body;
    
    // Add food entry to MongoDB here
    let res = await fetch(api_url+food, {
		method: 'GET',
		headers: {
			'X-Api-Key': apiKey,
		},
	})

    let {items} = await res.json();

    let totalCalories = items.reduce((result, elem) => {
        return result + elem.calories;
     }, 0);

    let mdb = await client.connect();
    await mdb.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .insertOne({
        userName: userName,
        food: food,
        totalCalories: Number(totalCalories),
    });
    

    let info = {
        header: `<h1><u>${userName}, Your Food is Saved Successfully!</u></h1>`,
        footer: footer,
    };
    
    response.render("processEnterFood", info);
});

app.get("/lookUpFood", (request, response) => {
    let form = {
        formAction: `<form action="/processLookUpFood" method="post">`,
        footer: footer,
    };
    response.render("lookUpFood", form);
}); 

app.post("/processLookUpFood", async (request, response) => { 
    let { userName } = request.body;
    
    // Retrieve food entry from MongoDB here
    let table = "<table border=\"1\"><tr><th>Name</th><th>Calories</th></tr>";

    let mdb = await client.connect();
    let items = await mdb.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .find({userName: {$eq: userName}});

    items = await items.toArray();

    items.forEach((item) => {table += `<tr><td>${item.food}</td><td>${item.totalCalories}</td></tr>`;});

    table += "</table>";

    let info = {
        header: `<h1><u>${userName}, Your Saved Food is Here!</u></h1>`,
        table: table,
        footer: footer,
    };
    
    response.render("processLookUpFood", info);
});

app.get("/deleteUser", (request, response) => {
    let form = {
        formAction: `<form action="/processDeleteUser" method="post">`,
        footer: footer,
    };
    response.render("deleteUser", form);
}); 

app.post("/processDeleteUser", async (request, response) => { 
    let { userName } = request.body;
    
    // Remove food entry from MongoDB here

    let mdb = await client.connect();
    let result = await mdb.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .deleteMany({userName: {$eq: userName}});

    let info = {
        header: `<h1><u>${userName}, Your Saved Food Entries are Deleted!</u></h1>`,
        count: `<em>${result.deletedCount} entries deleted</em>`,
        footer: footer,
    };
    
    response.render("processDeleteUser", info);
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