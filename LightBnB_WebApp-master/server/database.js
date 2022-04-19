const { Pool } = require('pg');
const { rows, password } = require('pg/lib/defaults');

// const properties = require('./json/properties.json');
const users = require('./json/users.json');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithEmail = (email) => {
  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

//getUserWithEmail("kaelynross@gmail.com").then(user => console.log(user));//test to amke sure it works
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])//userid
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

//getUserWithId(21).then(user => console.log(user));//test to make sure it works

exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool
    .query(`INSERT INTO users (name, email, password)
  VALUES ($1, $2, $3) RETURNING id;`, [user.name, user.email, user.password])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
  .query(`SELECT reservations.*, properties.*, avg(rating) as average_rating
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2;`, [guest_id, limit])
    .then((result) => {
      console.log(result.rows)
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

// const getAllProperties = (options, limit = 10) => {
  // return pool
  //   //.query(`SELECT * FROM properties LIMIT $1`, [limit])

  //   .query(`SELECT properties.*,
  //   avg(property_reviews.rating) as average_rating
  //   FROM properties
  //   LEFT JOIN property_reviews ON properties.id = property_id
  //   WHERE city LIKE '%ancouv%'
  //   GROUP BY properties.id
  //   HAVING avg(property_reviews.rating) >= 4
  //   ORDER BY cost_per_night
  //   LIMIT 10;`)

    // .then((result) => {
    //   return result.rows;
    // })
    // .catch((err) => {
    //   console.log(err.message);
    // });
    // const queryParams = [];
    // //Start the query with all information that comes before the WHERE clause.
    // let queryString = `
    // SELECT properties.*, avg(property_reviews.rating) as average_rating
    // FROM properties
    // JOIN property_reviews ON properties.id = property_id
    // `;
//Check if a city has been passed in as an option. Add the city to the params array and create a WHERE clause for the city.
    // if (options.city) {
    //   queryParams.push(`%${options.city}%`);
    //   queryString += `WHERE city LIKE $${queryParams.length} `;
    // }

//     queryParams.push(limit);
//     queryString += `
//     GROUP BY properties.id
//     ORDER BY cost_per_night
//     LIMIT $${queryParams.length};
//     `;

//     console.log(queryString, queryParams);
//     return pool.query(queryString, queryParams).then((res) => res.rows);
// };


const getAllProperties = function (options, limit = 10) {
  // 1
  const queryParams = [];
  let where = false;

  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;
  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length}`;
    where = true;
  } 
  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    if (!where) {
    queryString += `WHERE properties.owner_id = $${queryParams.length}`;
    where = true;
    } else {
      queryString += ` AND properties.owner_id = $${queryParams.length}`;
    }
  }
  if (options.minimum_price_per_night) {
    let dollars = options.minimum_price_per_night * 100;
    queryParams.push(dollars);
    if (!where) {
      queryString += ` WHERE properties.minimum_price_per_night >= $${queryParams.length}`;
      where = true;
    } else {
      queryString += ` AND properties.minimum_price_per_night >= $${queryParams.length}`;
    }
  }

  if (options.maximum_price_per_night) {
    let dollars = options.maximum_price_per_night * 100;
    queryParams.push(dollars);
    if (!where) {
      queryString += ` WHERE properties.maximum_price_per_night <= $${queryParams.length}`;
      where = true;
    } else {
      queryString += ` AND properties.maximum_price_per_night <= $${queryParams.length}`;
    }
  }

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    if (!where) {
      queryString += ` WHERE property_reviews.rating >= $${queryParams.length}`;
      where = true;
    } else {
      queryString += ` AND property_reviews.rating >= $${queryParams.length}`;
    }
  }

  // 4
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};`;
  // 5
  console.log(queryString, queryParams);
  // 6
  return pool.query(queryString, queryParams).then((res) => {
    console.log("this is a log", res.rows)
    return res.rows
  });
};

getAllProperties({
  city: 'Vancouver',
  owner_id: 747,
  minimum_rating: 5
});

//getAllProperties();

exports.getAllProperties = getAllProperties;



/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};
exports.addProperty = addProperty;
