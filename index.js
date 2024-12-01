import express from "express";
import bodyparser from "body-parser";
import pg from "pg";
import axios from "axios";
const app = express();
const port= 3000;
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "BookNotes",
    password:"{use your pass}",
    port: 5432,
});

db.connect();
app.use(bodyparser.urlencoded({extended : true}));
app.use(express.static("public"));


let books = [];

app.get("/" , async(req,res)=> {
  const result = await db.query("SELECT * FROM readbooks ")
  books = result.rows;
  

  try{
   
    
    
    res.render("index.ejs" , {
        listreadbooks : books,
    })
  }catch(err){
    console.log(err);
  }
});

app.post("/submit" , async (req,res)=>{
    res.render("new.ejs");
})

app.post("/new", async (req, res) => {
  const bookname = req.body.bookname;
  const summary = req.body.summary;
  const date = new Date();

  try {
      // Fetch all books from the database
      const check = await db.query("SELECT * FROM readbooks");
      const checkbook = check.rows;

      // Check if the book already exists
      for (let books of checkbook) {
          if (bookname === books.book_name) {
              return res.status(500).send("Book already exists."); // Exit the route
          }
      }

      // Fetch book data from OpenLibrary API
      const response = await axios.get(`https://openlibrary.org/search.json?title=${bookname}`);
      const books = response.data.docs;

      // Collect all `cover_edition_key` values
      const coverEditionKeys = books
          .filter(book => book.cover_edition_key) // Ensure it has a cover key
          .map(book => book.cover_edition_key);

      // Get a random cover key if available
      let randomCoverKey = null;
      if (coverEditionKeys.length > 0) {
          randomCoverKey = coverEditionKeys[0];
      }

      console.log("Random Cover Key:", randomCoverKey);

      // Insert the new book into the database
      await db.query(
          "INSERT INTO readbooks (book_name, about, date, CoverKey) VALUES ($1, $2, $3, $4)",
          [bookname, summary, date, randomCoverKey]
      );

      res.redirect("/"); // Redirect to the homepage
  } catch (error) {
      console.error("Error in /new route:", error);
      res.status(500).send("An error occurred while processing your request.");
  }
});

app.get("/sortbyname" , async (req,res)=>{
  const result= await db.query("SELECT * FROM readbooks ORDER BY book_name");
  books = result.rows;
  res.render("index.ejs",{
    listreadbooks : books,
  });
});
app.get("/sortbydate" , async (req,res)=>{
  const result= await db.query("SELECT * FROM readbooks ORDER BY date");
  books = result.rows;
  res.render("index.ejs",{
    listreadbooks : books,
  });
});
app.post("/delete",async (req, res) => {
  const del = req.body.deleteItemId;
 
  const result = await db.query("DELETE FROM readbooks WHERE id = ($1)",[del]);
  res.redirect("/");
  
});


app.listen(port , ()=> {
    console.log(`the server is now live on ${port}`);
});