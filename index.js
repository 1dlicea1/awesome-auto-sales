// Load packages and access services
const express = require("express");
const app = express();
const path = require("path");

require('dotenv').config()



const multer = require("multer");
const upload = multer();

const dblib = require("./dblib.js");

// Setup view engine to ejs
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
// Serve static content directly
app.use(express.static("css"));

// Add database package and connection string (can remove ssl)
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Start listening to incoming requests
// If process.env.PORT is not defined, port number 3000 is used
const listener = app.listen(process.env.PORT || 3000, () => {
    console.log(`Your app is listening on port ${listener.address().port}`);
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
app.get("/", (req, res) => {
    //res.send ("Hello world...");
    const sql = "SELECT * FROM CUSTOMER ORDER BY CUST_ID";
    pool.query(sql, [], (err, result) => {
        var message = "";
        var model = {};
        if(err) {
            message = `Error - ${err.message}`;
        } else {
            message = "success";
            model = result.rows;
        };
        res.render("index", {
            message: message,
            model : model
        });
    });
  });
/////////////////////////////////////////////////////////////////////////////////////////////////////////
// GET /delete/5
app.get("/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM customers WHERE cust_id = $1";
    pool.query(sql, [id], (err, result) => {
      // if (err) ...
      res.render("delete", { model: result.rows[0] });
    });
  });

// POST /delete/5
app.post("/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM customer WHERE cust_id = $1";
    pool.query(sql, [id], (err, result) => {
      // if (err) ...
      res.redirect("/books");
    });
  });


/////////////////////////////////////////////////////////////////////////////////////////////////////////
// GET /create
app.get("/create", (req, res) => {
    res.render("create", { model: {} });
  });

// POST /create
app.post("/create", (req, res) => {
    const sql = "INSERT INTO CUSTOMER (fisrt_name, last_name, state, sales_ytd, sales_ly) VALUES ($1, $2, $3, $4, $5)";
    const cust = [req.body.first_name, req.body.last_name, req.body.state, req.body.sales_ytd, req.body.sale_ly];
    pool.query(sql, cust, (err, result) => {
      // if (err) ...
      res.redirect("/");
    });
  });
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// GET /edit/5
app.get("/edit/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM CUSTOMER WHERE cust_id = $1";
    pool.query(sql, [id], (err, result) => {
      // if (err) ...
      res.render("edit", { model: result.rows[0] });
    });
  });

//POST /edit/5
app.post("/edit/:id", (req, res) => {
    const id = req.params.id;
    const cust = [req.body.first_name, req.body.last_name, req.body.state, req.body.sales_ytd, req.body.sale_ly, id];
    const sql = "UPDATE CUSTOMER SET first_name = $1, last_name = $2, state = $3, sales_ytd = $4. sales_ly = $5 WHERE (cust_id = $6)";
    pool.query(sql, cust, (err, result) => {
      if (err) {
      res.redirect("/");}
    });
  });
///////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/search", async (req, res) => {
    // Omitted validation check
    const totRecs = await dblib.getTotalRecords();
    //Create an empty product object (To populate form with values)
    const cust = {
        cust_id: "",
        first_name: "",
        last_name: "",
        state: "",
        sales_ytd: "",
        sales_ly: ""
    };
    res.render("search", {
        type: "get",
        totRecs: totRecs.totRecords,
        cust: cust
    });
  });
  
  // POST
  app.post("/search", async (req, res) => {
    // Omitted validation check
    //  Can get this from the page rather than using another DB call.
    //  Add it as a hidden form value.
    const totRecs = await dblib.getTotalRecords();
  
    console.log("in search post.  req.body is: ", req.body);
  
    dblib.findCustomers(req.body)
        .then(result => {
            console.log("dblib.findCustomers result is: ", result);
            res.render("search", {
                type: "post",
                totRecs: totRecs.totRecords,
                result: result,
                cust: req.body
            })
        })
        .catch(err => {
            res.render("search", {
                type: "post",
                totRecs: totRecs.totRecords,
                result: `Unexpected Error: ${err.message}`,
                cust: req.body
            });
        });
  });
///////////////////////////////////////////////////////////////////////////////////////////////////////////
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
              const sql = "INSERT INTO CUSTOMER (cust_id, first_name, last_name, state, sales_ytd, sales_ly) VALUES ($1, $2, $3, $4, $5, $6)";
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
       const sql = "SELECT * FROM CUSTOMER ORDER BY CUST_ID";
       pool.query(sql, [], (err, result) => {
           var message = "";
           if(err) {
               message = `Error - ${err.message}`;
               res.render("output", { message: message })
           } else {
               var output = "";
               result.rows.forEach(customer => {
                   output += `${customer.cust_id},${customer.first_name},${customer.last_name},${customer.state},${customer.sales_ytd},${customer.sales_ly}\r\n`;
               });
               res.header("Content-Type", "text/csv");
               res.attachment("export.csv");
               return res.send(output);
           };
       });
   });