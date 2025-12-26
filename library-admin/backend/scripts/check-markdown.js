import mysql from 'mysql2/promise';
import { dbConfig } from '../config.js';

/**
 * Script to check if Markdown content exists in the database
 */

const pool = mysql.createPool(dbConfig);

async function checkMarkdown() {
  try {
    console.log('=== CHECKING BOOK DESCRIPTIONS ===\n');
    
    const [books] = await pool.query(`
      SELECT id, title, 
             CASE 
               WHEN description LIKE '%**%' OR description LIKE '%##%' OR description LIKE '%- %' 
               THEN 'HAS MARKDOWN' 
               ELSE 'PLAIN TEXT' 
             END as markdown_status,
             LEFT(description, 150) as description_preview
      FROM books
      ORDER BY id
    `);
    
    books.forEach(book => {
      console.log(`ID: ${book.id} | ${book.title}`);
      console.log(`Status: ${book.markdown_status}`);
      console.log(`Preview: ${book.description_preview}`);
      console.log('---');
    });
    
    console.log('\n=== CHECKING WRITER BIOS ===\n');
    
    const [writers] = await pool.query(`
      SELECT id, name,
             CASE 
               WHEN bio LIKE '%**%' OR bio LIKE '%##%' OR bio LIKE '%- %' 
               THEN 'HAS MARKDOWN' 
               ELSE 'PLAIN TEXT' 
             END as markdown_status,
             LEFT(bio, 150) as bio_preview
      FROM writers
      ORDER BY id
    `);
    
    writers.forEach(writer => {
      console.log(`ID: ${writer.id} | ${writer.name}`);
      console.log(`Status: ${writer.markdown_status}`);
      console.log(`Preview: ${writer.bio_preview}`);
      console.log('---');
    });
    
    console.log('\n=== FULL EXAMPLE (Book ID 1) ===\n');
    const [book1] = await pool.query('SELECT description FROM books WHERE id = 1');
    console.log(book1[0].description);
    
    console.log('\n=== FULL EXAMPLE (Writer ID 1) ===\n');
    const [writer1] = await pool.query('SELECT bio FROM writers WHERE id = 1');
    console.log(writer1[0].bio);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkMarkdown();

