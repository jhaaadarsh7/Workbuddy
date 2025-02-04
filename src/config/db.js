import mysql from 'mysql2';


const connection =mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',  // Enter your MySQL password here
    database: process.env.DB_NAME || 'WorkBuddy', 
})
connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL: ', err);
      return;
    }
    console.log('Connected to MySQL');
  });
  
  export default connection;