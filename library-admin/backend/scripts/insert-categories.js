import mysql from 'mysql2/promise';
import { dbConfig } from '../config.js';

/**
 * Script to insert categories into the categories table
 * Returns JSON with primary key and category name
 */

const pool = mysql.createPool(dbConfig);

const categories = [
  'Antiques And Collectibles',
  'Architecture',
  'Art',
  'Bibles',
  'Biography And Autobiography',
  'Body Mind And Spirit',
  'Business And Economics',
  'Comics And Graphic Novels',
  'Computers',
  'Cooking',
  'Crafts And Hobbies',
  'Design',
  'Drama',
  'Education',
  'Family And Relationships',
  'Fiction',
  'Games And Activities',
  'Gardening',
  'Health And Fitness',
  'History',
  'House And Home',
  'Humor',
  'Juvenile Fiction',
  'Juvenile Nonfiction',
  'Language Arts And Disciplines',
  'Language Study',
  'Law',
  'Literary Collections',
  'Literary Criticism',
  'Mathematics',
  'Medical',
  'Music',
  'Nature',
  'Non-Classifiable',
  'Performing Arts',
  'Pets',
  'Philosophy',
  'Photography',
  'Poetry',
  'Political Science',
  'Psychology',
  'Reference',
  'Religion',
  'Science',
  'Self Help',
  'Social Science',
  'Sports And Recreation',
  'Study Aids',
  'Technology And Engineering',
  'Transportation',
  'Travel',
  'True Crime',
  'Young Adult Fiction',
  'Young Adult Nonfiction',
  'Other'
];

async function insertCategories() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = [];
    
    for (const categoryName of categories) {
      // Check if category already exists
      const [existing] = await connection.query(
        'SELECT id, name FROM categories WHERE name = ?',
        [categoryName]
      );
      
      if (existing.length > 0) {
        // Category already exists, use existing ID
        results.push({
          id: existing[0].id,
          name: existing[0].name
        });
        console.log(`Category "${categoryName}" already exists (ID: ${existing[0].id})`);
      } else {
        // Insert new category
        const [result] = await connection.query(
          'INSERT INTO categories (name) VALUES (?)',
          [categoryName]
        );
        
        results.push({
          id: result.insertId,
          name: categoryName
        });
        console.log(`Inserted category "${categoryName}" (ID: ${result.insertId})`);
      }
    }
    
    await connection.commit();
    
    // Output JSON
    console.log('\n=== CATEGORIES JSON ===\n');
    console.log(JSON.stringify(results, null, 2));
    
    return results;
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error inserting categories:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

insertCategories()
  .then(() => {
    console.log('\n✅ Categories insertion completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to insert categories:', error);
    process.exit(1);
  });

