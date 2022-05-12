// Load packages and access services
const express = require("express");
const app = express();

const multer = require("multer");
const upload = multer();

require('dotenv').config()



// Setup view engine to ejs
app.set('view engine', 'ejs');

// Serve static content directly
app.use(express.static("css"));


// Add database package and connection string (can remove ssl)
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});


// Add middleware to parse default urlencoded form
app.use(express.urlencoded({ extended: false }));

// Enable CORS (see https://enable-cors.org/server_expressjs.html)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });
  

// Route to welcome page
app.get('/', (request, response) => {
    response.render("index");
});


// GET Route to form page
app.get('/formPost', (request, response) => {
    const message = "get";
    const data = {
        name: "",
        email: "",
        payment: ""
    };
    response.render("formPost", 
        {
            message: message,
            data: data
        });

});

// POST Route to form page
//app.post('/formPost', (request, response) => {
    app.post('/formPost', upload.array(), (request, response) => {    
        const message = "post";
        // Send form data back to the form
        const data = {
            name: request.body.name,
            email: request.body.email,
            payment: request.body.payment
        }
        //Call formPost passing message and name
        response.render("formPost", 
            {
                message: message,
                data: data
            });
    });
////////////////////////////////////////////////////////////////////////////////////////////////////////////    
    
    app.get("/input", (req, res) => {
        res.render("input");
     });
     
     app.post("/input",  upload.single('filename'), (req, res) => {
         if(!req.file || Object.keys(req.file).length === 0) {
             message = "Error: Import file not uploaded";
             return res.send(message);
         };
         //Read file line by line, inserting records
         const buffer = req.file.buffer; 
         const lines = buffer.toString().split(/\r?\n/);
     
         lines.forEach(line => {
              //console.log(line);
              product = line.split(",");
              //console.log(product);
              const sql = "INSERT INTO PRODUCT(prod_id, prod_name, prod_desc, prod_price) VALUES ($1, $2, $3, $4)";
              pool.query(sql, product, (err, result) => {
                  if (err) {
                      console.log(`Insert Error.  Error message: ${err.message}`);
                  } else {
                      console.log(`Inserted successfully`);
                  }
             });
         });
         message = `Processing Complete - Processed ${lines.length} records`;
         res.send(message);
     });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
     app.get("/output", (req, res) => {
        var message = "";
        res.render("output",{ message: message });
       });
       
       
       app.post("/output", (req, res) => {
           const sql = "SELECT * FROM PRODUCT ORDER BY PROD_ID";
           pool.query(sql, [], (err, result) => {
               var message = "";
               if(err) {
                   message = `Error - ${err.message}`;
                   res.render("output", { message: message })
               } else {
                   var output = "";
                   result.rows.forEach(product => {
                       output += `${product.prod_id},${product.prod_name},${product.prod_desc},${product.prod_price}\r\n`;
                   });
                   res.header("Content-Type", "text/csv");
                   res.attachment("export.csv");
                   return res.send(output);
               };
           });
       });
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Start listening to incoming requests
// If process.env.PORT is not defined, port number 3000 is used
const listener = app.listen(process.env.PORT || 3000, () => {
    console.log(`Your app is listening on port ${listener.address().port}`);
});

// GET Route to form page
app.get('/formAjax', (request, response) => {
    response.render("formAjax")
});

// POST Route to form page
app.post('/formAjax', upload.array(), (request, response) => {    
    // Send form data back to the form
    const data = {
        name: request.body.name,
        email: request.body.email,
        payment: request.body.payment
    };
    //Call formPost passing message and name
    response.json(data);
});

