// Add packages
require("dotenv").config();
// Add database package and connection string
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const getTotalRecords = () => {
    sql = "SELECT COUNT(*) FROM customer";
    return pool.query(sql)
        .then(result => {
            return {
                msg: "success",
                totRecords: result.rows[0].count
            }
        })
        .catch(err => {
            return {
                msg: `Error: ${err.message}`
            }
        });
};


const insertCustomer = async (customer) => {
  // Will accept either a customer array or customer object
  if (customer instanceof Array) {
      params = customer;
  } else {
      params = Object.values(customer);
  };

  const sql = `INSERT INTO customer (cust_id, first_name, last_name, state, sales_ytd, sales_ly)
               VALUES ($1, $2, $3, $4, $5, $6)`;

  try {
        const res = await pool.query(sql, params);
        return {
            trans: "success",
            msg: `customer id ${params[0]} successfully inserted`
        };
    } catch (err) {
        return {
            trans: "fail",
            msg: `Error on insert of customer id ${params[0]}.  ${err.message}`
        };
    }
};


const findCustomers = async (customer) => {
  // Will build query based on data provided from the form
  //  Use parameters to avoid sql injection

  console.log("In findcustomer, customer is: ", customer);

  // Declare variables
  var i = 1;
  params = [];
  sql = "SELECT * FROM customer WHERE true";

  // Check data provided and build query as necessary
  if (customer.cust_id !== "") {
      params.push(parseInt(customer.cust_id));
      sql += ` AND cust_id = $${i}`;
      i++;
  };
  if (customer.first_name !== "") {
      params.push(`${customer.first_name}%`);
      sql += ` AND UPPER(first_name) LIKE UPPER($${i})`;
      i++;
  };
  if (customer.last_name !== "") {
      params.push(`${customer.last_name}%`);
      sql += ` AND UPPER(last_name) LIKE UPPER($${i})`;
      i++;
  };
  if (customer.state !== "") {
      params.push(`${customer.state}%`);
      sql += ` AND UPPER(state) LIKE UPPER($${i})`;
      i++;
  };
  if (customer.sales_ytd !== "") {
    params.push(parseFloat(customer.sales_ytd));
    sql += ` AND sales_ytd >= $${i}`;
    i++;
  };
  if (customer.sales_ly !== "") {
    params.push(parseFloat(customer.sales_ly));
    sql += ` AND sales_ly >= $${i}`;
    i++;
  };

  sql += ` ORDER BY cust_id`;
  // for debugging
   console.log("sql: " + sql);
   console.log("params: " + params);

  try {
        const result = await pool.query(sql, params);
        return {
            trans: "success",
            result: result.rows
        };
    } catch (err) {
        return {
            trans: "Error",
            result: `Error: ${err.message}`
        };
    }
};


// Add this at the bottom
module.exports.getTotalRecords = getTotalRecords;
module.exports.insertCustomer = insertCustomer;
module.exports.findCustomers = findCustomers;
module.exports.findCustomers = findCustomers;
