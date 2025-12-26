import XLSX from 'xlsx';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  Warning: OPENAI_API_KEY not found in environment variables.');
  console.warn('   Please create a .env file in the backend directory with: OPENAI_API_KEY=your_key_here');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = mysql.createPool(dbConfig);

// Category mapping
const categoryMap = {
  "Antiques And Collectibles": 1,
  "Architecture": 2,
  "Art": 3,
  "Bibles": 4,
  "Biography And Autobiography": 5,
  "Body Mind And Spirit": 6,
  "Business And Economics": 7,
  "Comics And Graphic Novels": 8,
  "Computers": 9,
  "Cooking": 10,
  "Crafts And Hobbies": 11,
  "Design": 12,
  "Drama": 13,
  "Education": 14,
  "Family And Relationships": 15,
  "Fiction": 16,
  "Games And Activities": 17,
  "Gardening": 18,
  "Health And Fitness": 19,
  "History": 20,
  "House And Home": 21,
  "Humor": 22,
  "Juvenile Fiction": 23,
  "Juvenile Nonfiction": 24,
  "Language Arts And Disciplines": 25,
  "Language Study": 26,
  "Law": 27,
  "Literary Collections": 28,
  "Literary Criticism": 29,
  "Mathematics": 30,
  "Medical": 31,
  "Music": 32,
  "Nature": 33,
  "Non-Classifiable": 34,
  "Performing Arts": 35,
  "Pets": 36,
  "Philosophy": 37,
  "Photography": 38,
  "Poetry": 39,
  "Political Science": 40,
  "Psychology": 41,
  "Reference": 42,
  "Religion": 43,
  "Science": 44,
  "Self Help": 45,
  "Social Science": 46,
  "Sports And Recreation": 47,
  "Study Aids": 48,
  "Technology And Engineering": 49,
  "Transportation": 50,
  "Travel": 51,
  "True Crime": 52,
  "Young Adult Fiction": 53,
  "Young Adult Nonfiction": 54,
  "Other": 55,
  "#N/A": 55, // Map #N/A to Other
};

// Book type mapping
const bookTypeMap = {
  'PB': 'Paperback',
  'HB': 'Hardcover',
  'Paperback': 'Paperback',
  'Hardcover': 'Hardcover',
  'PAPERBACK': 'Paperback',
  'HARDCOVER': 'Hardcover',
  // Additional mappings for other BINDING values (default to Paperback for unknown types)
  'BD': 'Paperback',
  'Board Book': 'Paperback',
  'Boxed Pack': 'Paperback',
  'Boxed Set': 'Paperback',
  'CD': 'Paperback',
  'Misc': 'Paperback',
  'Spiral': 'Paperback'
};

/**
 * Get standardized author name from Google Books API using ISBN
 * Returns standardized author name from Google Books, or fallback to Excel name if not found
 */
async function getStandardizedAuthorName(isbn, fallbackAuthorName) {
  try {
    if (!isbn || isbn === '#N/A' || !fallbackAuthorName || fallbackAuthorName === 'Unknown Author') {
      return fallbackAuthorName;
    }
    
    const cleanIsbn = String(isbn).replace(/-/g, '').trim();
    const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`;
    const response = await fetch(googleUrl);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const volumeInfo = data.items[0].volumeInfo;
      
      // Google Books provides authors as an array
      if (volumeInfo.authors && volumeInfo.authors.length > 0) {
        // Use the first author (primary author)
        // Google Books typically provides names in standardized "First Name Last Name" format
        const standardizedName = volumeInfo.authors[0].trim();
        if (standardizedName !== fallbackAuthorName) {
          console.log(`  Standardized author name for ISBN ${isbn}: "${fallbackAuthorName}" → "${standardizedName}"`);
        }
        return standardizedName;
      }
    }
  } catch (error) {
    console.error(`Error fetching author name for ISBN ${isbn}:`, error.message);
  }
  
  // Fallback: Use Excel author name as-is (Google Books doesn't have this book)
  return fallbackAuthorName;
}

/**
 * Get book cover image URL from Google Books API
 */
async function getBookImageUrl(isbn) {
  try {
    if (!isbn || isbn === '#N/A') return null;
    
    const cleanIsbn = String(isbn).replace(/-/g, '').trim();
    const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`;
    const response = await fetch(googleUrl);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const volumeId = data.items[0].id;
      return `https://books.google.com/books/publisher/content/images/frontcover/${volumeId}?fife=w800-h1200`;
    }
  } catch (error) {
    console.error(`Error fetching image for ISBN ${isbn}:`, error.message);
  }
  return null;
}

/**
 * Get writer image URL from Wikipedia API first, then fallback to OpenAI
 */
async function getWriterImageUrl(authorName) {
  try {
    if (!authorName || authorName === 'Unknown Author') {
      return null;
    }

    // Try Wikipedia API first (free and reliable)
    try {
      const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(authorName)}`;
      const response = await fetch(searchUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.thumbnail && data.thumbnail.source) {
          // Wikipedia returns thumbnail URLs, convert to full-size image
          const thumbnailUrl = data.thumbnail.source;
          // Convert thumbnail to full-size image URL
          const fullSizeUrl = thumbnailUrl.replace(/\/\d+px-/, '/800px-');
          console.log(`  Found Wikipedia image for ${authorName}`);
          return fullSizeUrl;
        }
      }
    } catch (wikiError) {
      // Wikipedia search failed, continue to OpenAI fallback
      console.log(`  Wikipedia search failed for ${authorName}, trying OpenAI...`);
    }

    // Fallback to OpenAI if Wikipedia doesn't have the image
    if (!process.env.OPENAI_API_KEY) {
      return null;
    }

    const prompt = `Find a public image URL for the author "${authorName}". 
    
Requirements:
- Return ONLY a direct URL to a publicly accessible image (JPG, PNG, or WebP format)
- Prefer official author photos, book covers featuring the author, or professional headshots
- The URL should be from a reliable source (Wikipedia, publisher websites, author websites, etc.)
- The image should be a portrait/headshot of the author
- Return ONLY the URL, nothing else
- If you cannot find a reliable image URL, return "null"`;

    const imageUrl = await retryOpenAICall(async () => {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that finds public image URLs for authors. Return only the direct image URL or "null" if not found.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      });

      const result = response.choices[0]?.message?.content?.trim() || '';
      
      // Clean up the response
      let url = result.replace(/["'`]/g, '').trim();
      
      // Check if it's a valid URL
      if (url && url !== 'null' && (url.startsWith('http://') || url.startsWith('https://'))) {
        // Validate it's an image URL
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext));
        const isImageHost = url.includes('wikipedia.org') || 
                           url.includes('wikimedia.org') || 
                           url.includes('amazonaws.com') ||
                           url.includes('googleusercontent.com') ||
                           url.includes('goodreads.com') ||
                           url.includes('penguinrandomhouse.com') ||
                           url.includes('simonandschuster.com') ||
                           url.includes('harpercollins.com');
        
        if (hasImageExtension || isImageHost) {
          console.log(`  Found OpenAI-suggested image for ${authorName}`);
          return url;
        }
      }
      
      return null;
    });

    return imageUrl;
    
  } catch (error) {
    console.error(`Error getting image URL for ${authorName}:`, error.message);
    return null;
  }
}

/**
 * Retry wrapper for OpenAI API calls
 */
async function retryOpenAICall(apiCall, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.log(`  Retrying (attempt ${attempt + 1}/${maxRetries}) after ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Generate book description using OpenAI API
 */
async function generateBookDescription(title, author, category, publisher) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const categoryName = Object.keys(categoryMap).find(key => categoryMap[key] === category) || 'book';
    
    const prompt = `Write a compelling book description in Markdown format for the book "${title}" by ${author}.
Category: ${categoryName}${publisher ? `. Publisher: ${publisher}` : ''}.

Requirements:
- Write 3-4 paragraphs
- Use Markdown formatting with **bold** for emphasis
- Include an engaging overview, key themes, and why readers would enjoy it
- Keep it informative but accessible
- Make it sound professional and appealing

Write only the description, no additional commentary.`;

    const description = await retryOpenAICall(async () => {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional book description writer. Write engaging, informative book descriptions in Markdown format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const result = response.choices[0]?.message?.content?.trim() || '';
      if (!result) {
        throw new Error('Empty response from OpenAI');
      }
      return result;
    });

    return description;
    
  } catch (error) {
    console.error(`Error generating description for ${title}:`, error.message);
    // Fallback to basic description
    const categoryName = Object.keys(categoryMap).find(key => categoryMap[key] === category) || 'book';
    return `**${title}** by ${author}\n\nA ${categoryName.toLowerCase()} book that explores important themes and topics.`;
  }
}

/**
 * Generate author bio using OpenAI API
 */
async function generateAuthorBio(authorName) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Write a brief author biography in Markdown format for ${authorName}.

Requirements:
- Write 2-3 paragraphs
- Use Markdown formatting with **bold** for the author's name
- Include their background, writing style, notable works, and impact
- Keep it informative and professional
- If you don't have specific information, write a general but engaging bio

Write only the biography, no additional commentary.`;

    const bio = await retryOpenAICall(async () => {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a biographer writing professional author biographies in Markdown format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 250,
        temperature: 0.7
      });

      const result = response.choices[0]?.message?.content?.trim() || '';
      if (!result) {
        throw new Error('Empty response from OpenAI');
      }
      return result;
    });

    return bio;
    
  } catch (error) {
    console.error(`Error generating bio for ${authorName}:`, error.message);
    return `**${authorName}** is an author known for their contributions to literature and engaging storytelling.`;
  }
}

/**
 * Get author nationality using OpenAI API
 */
async function getAuthorNationality(authorName) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      // Fallback to pattern matching if API key not available
      const nameParts = authorName.split(/[\s\/]+/);
      const lastName = nameParts[nameParts.length - 1];
      if (lastName.match(/^(de|van|von|le|la|du|da)/i)) {
        return 'European';
      }
      return 'Unknown';
    }

    const prompt = `What is the nationality or country of origin of the author "${authorName}"? 
Respond with only the country name (e.g., "American", "British", "Indian", "French"). 
If you're not certain, respond with "Unknown".`;

    const nationality = await retryOpenAICall(async () => {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that identifies author nationalities. Respond with only the country name.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 20,
        temperature: 0.3
      });

      const result = response.choices[0]?.message?.content?.trim() || 'Unknown';
      // Clean up response (remove quotes, periods, etc.)
      return result.replace(/["'\.]/g, '').trim() || 'Unknown';
    });

    return nationality;
    
  } catch (error) {
    console.error(`Error getting nationality for ${authorName}:`, error.message);
    // Fallback to pattern matching
    const nameParts = authorName.split(/[\s\/]+/);
    const lastName = nameParts[nameParts.length - 1];
    if (lastName.match(/^(de|van|von|le|la|du|da)/i)) {
      return 'European';
    }
    return 'Unknown';
  }
}

/**
 * Find or create writer
 */
async function findOrCreateWriter(connection, authorName, nationality) {
  // Handle "Unknown Author" case
  if (authorName === 'Unknown Author') {
    // Check if "Unknown Author" already exists
    const [existing] = await connection.query(
      'SELECT id FROM writers WHERE name = ?',
      ['Unknown Author']
    );
    
    if (existing.length > 0) {
      return existing[0].id;
    }
    
    // Create "Unknown Author" writer (no image URL)
    const [result] = await connection.query(
      'INSERT INTO writers (name, nationality, bio, image_url) VALUES (?, ?, ?, ?)',
      ['Unknown Author', 'Unknown', '**Unknown Author** - Author information not available.', null]
    );
    
    return result.insertId;
  }
  
  // Check if writer exists
  const [existing] = await connection.query(
    'SELECT id FROM writers WHERE name = ? AND nationality = ?',
    [authorName, nationality]
  );
  
  if (existing.length > 0) {
    return existing[0].id;
  }
  
  // Generate bio
  const bio = await generateAuthorBio(authorName);
  
  // Get writer image URL
  const imageUrl = await getWriterImageUrl(authorName);
  
  // Create new writer with image URL
  const [result] = await connection.query(
    'INSERT INTO writers (name, nationality, bio, image_url) VALUES (?, ?, ?, ?)',
    [authorName, nationality, bio, imageUrl]
  );
  
  return result.insertId;
}

/**
 * Process Excel file and import books
 * @param {number} limit - Limit number of books to process (for testing). Set to 0 for all.
 * @param {number} batchSize - Number of books to process per batch (default: 50)
 */
async function processExcelBooks(limit = 0, batchSize = 50) {
  try {
    // Read Excel file first (before getting connection)
    const excelPath = '/Users/rahulagarwal/Library/CloudStorage/OneDrive-Nagarro/Nagarro/Library/NLib/library-admin/xlsxFiles/Nagarro_Final_Quote_Customer_V1.xlsx';
    
    if (!existsSync(excelPath)) {
      throw new Error(`Excel file not found at: ${excelPath}`);
    }
    
    console.log(`Reading Excel file: ${excelPath}`);
    
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0]; // Sheet 1
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    console.log(`Total rows in Excel: ${data.length}`);
    
    // Find header row
    let headerRowIndex = -1;
    let headerRow = null;
    
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && row.includes('ISBN13') && row.includes('AUTHOR') && row.includes('Title')) {
        headerRowIndex = i;
        headerRow = row;
        break;
      }
    }
    
    if (headerRowIndex === -1) {
      throw new Error('Could not find header row in Excel file');
    }
    
    console.log(`Header row found at index: ${headerRowIndex}`);
    
    // Find column indices
    const getColumnIndex = (name) => {
      return headerRow.findIndex(col => col && String(col).toLowerCase().includes(name.toLowerCase()));
    };
    
    // Find Category column first (preferred), then fallback to Subject
    const categoryColIndex = getColumnIndex('Category') !== -1 
      ? getColumnIndex('Category') 
      : (getColumnIndex('Subject') !== -1 ? getColumnIndex('Subject') : 19); // Column T (Category) or fallback to Column P (Subject) or index 19
    
    const colIndices = {
      isbn13: getColumnIndex('ISBN13') !== -1 ? getColumnIndex('ISBN13') : 0, // Column A
      author: getColumnIndex('AUTHOR') !== -1 ? getColumnIndex('AUTHOR') : 1, // Column B
      title: getColumnIndex('Title') !== -1 ? getColumnIndex('Title') : 2, // Column C
      publisher: getColumnIndex('PUB IMPRINT') !== -1 ? getColumnIndex('PUB IMPRINT') : 7, // Column H
      category: categoryColIndex,
      categoryIsCategoryColumn: getColumnIndex('Category') !== -1, // Track if we're using Category or Subject column
      recommended: getColumnIndex('Recommended') !== -1 ? getColumnIndex('Recommended') : 16, // Column Q
      bookType: getColumnIndex('BINDING') !== -1 ? getColumnIndex('BINDING') : 8 // Column I
    };
    
    console.log('Column indices:', colIndices);
    
    // Collect all valid rows first
    const validRows = [];
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      const recommended = row[colIndices.recommended];
      if (!recommended || String(recommended).trim() !== 'Yes - Bestseller') {
        continue;
      }
      
      const isbn13 = row[colIndices.isbn13] ? String(row[colIndices.isbn13]).trim() : null;
      const author = row[colIndices.author] ? String(row[colIndices.author]).trim() : null;
      const title = row[colIndices.title] ? String(row[colIndices.title]).trim() : null;
      
      // Process if ISBN13 and title are available (author can be missing)
      if (isbn13 && title && isbn13 !== '#N/A') {
        validRows.push({ row, index: i, isbn13 });
      }
    }
    
    console.log(`\nFound ${validRows.length} valid books in Excel`);
    
    // Get existing ISBNs from database to avoid duplicates
    console.log('Checking for existing books in database...');
    const connection = await pool.getConnection();
    try {
      const [existingBooks] = await connection.query('SELECT isbn FROM books');
      const existingIsbns = new Set(
        existingBooks.map(book => String(book.isbn).trim().toLowerCase())
      );
      console.log(`Found ${existingIsbns.size} existing books in database`);
      
      // Filter out books that already exist
      const newRows = validRows.filter(({ isbn13 }) => {
        const normalizedIsbn = isbn13.toLowerCase();
        return !existingIsbns.has(normalizedIsbn);
      });
      
      const skippedCount = validRows.length - newRows.length;
      if (skippedCount > 0) {
        console.log(`Skipping ${skippedCount} books that already exist in database`);
      }
      
      console.log(`\n${newRows.length} new books to process`);
      console.log(`Processing in batches of ${batchSize}...\n`);
      
      // Replace validRows with filtered list
      validRows.length = 0;
      validRows.push(...newRows);
    } finally {
      connection.release();
    }
    
    // Process rows in batches
    let processed = 0;
    let skipped = 0;
    let errors = 0;
    const totalBatches = Math.ceil(validRows.length / batchSize);
    
    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const batchStart = batchNum * batchSize;
      const batchEnd = Math.min(batchStart + batchSize, validRows.length);
      const batch = validRows.slice(batchStart, batchEnd);
      
      console.log(`\n=== Processing Batch ${batchNum + 1}/${totalBatches} (Books ${batchStart + 1}-${batchEnd}) ===`);
      
      // Start a new transaction for this batch
      const connection = await pool.getConnection();
      let batchProcessed = 0;
      let batchSkipped = 0;
      let batchErrors = 0;
      
      try {
        await connection.beginTransaction();
        
        for (const { row, index } of batch) {
          try {
          const isbn13 = row[colIndices.isbn13] ? String(row[colIndices.isbn13]).trim() : null;
          const authorRaw = row[colIndices.author] ? String(row[colIndices.author]).trim() : null;
          const title = row[colIndices.title] ? String(row[colIndices.title]).trim() : null;
          const publisher = row[colIndices.publisher] ? String(row[colIndices.publisher]).trim() : null;
          const category = row[colIndices.category] ? String(row[colIndices.category]).trim() : null;
          const bookTypeRaw = colIndices.bookType !== -1 && row[colIndices.bookType] 
            ? String(row[colIndices.bookType]).trim() 
            : 'PB'; // Default to Paperback
          
          // Skip if essential data missing (ISBN13 and title are required, author can be missing)
          if (!isbn13 || !title || isbn13 === '#N/A') {
            batchSkipped++;
            continue;
          }
          
          // Handle missing author - use "Unknown Author" if not available
          const authorRawProcessed = (authorRaw && authorRaw !== '#N/A' && authorRaw !== '') ? authorRaw : 'Unknown Author';
        
          // Get standardized author name from Google Books API (using ISBN)
          // Google Books provides standardized names, so we use that when available
          // Falls back to Excel author name if Google Books doesn't have the book
          const author = await getStandardizedAuthorName(isbn13, authorRawProcessed);
        
          // Map category
          // If using Category column, it's already capitalized - use directly
          // If using Subject column, normalize to match categoryMap format
          let categoryId = 55; // Default to "Other"
          
          if (category) {
            if (colIndices.categoryIsCategoryColumn) {
              // Category column is already capitalized (e.g., "Fiction", "Business And Economics")
              categoryId = categoryMap[category] || categoryMap['#N/A'] || 55;
            } else {
              // Subject column needs normalization: capitalize first letter of each word
              const normalizedCategory = category.toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              categoryId = categoryMap[normalizedCategory] || categoryMap[category] || categoryMap['#N/A'] || 55;
            }
          } else {
            categoryId = categoryMap['#N/A'] || 55;
          }
          
          // Map book type
          const bookType = bookTypeMap[bookTypeRaw] || 'Paperback';
          
          // Get image URL
          const imageUrl = await getBookImageUrl(isbn13);
          
          // Generate description (use standardized author name)
          const description = await generateBookDescription(title, author, categoryId, publisher);
          
          // Get author nationality (skip AI call for "Unknown Author" to save costs)
          const nationality = author === 'Unknown Author' ? 'Unknown' : await getAuthorNationality(author);
          
          // Find or create writer (using standardized author name from Google Books)
          const writerId = await findOrCreateWriter(connection, author, nationality);
          
          // Create book
          const [bookResult] = await connection.query(
            `INSERT INTO books (
              title, isbn, label_number, publication_year, total_copies, 
              available_copies, image_url, description, owner_id, book_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              title,
              isbn13,
              '', // label_number (keep empty as empty string)
              null, // publication_year
              1, // total_copies
              1, // available_copies
              imageUrl,
              description,
              null, // owner_id (NULL instead of 0 to satisfy foreign key constraint)
              bookType
            ]
          );
          
          const bookId = bookResult.insertId;
          
          // Add category relationship
          await connection.query(
            'INSERT INTO book_categories (book_id, category_id) VALUES (?, ?)',
            [bookId, categoryId]
          );
          
          // Add writer relationship
          await connection.query(
            'INSERT INTO book_writers (book_id, writer_id) VALUES (?, ?)',
            [bookId, writerId]
          );
        
          batchProcessed++;
          processed++;
          console.log(`  ✓ Processed: ${title} (${processed}/${validRows.length})`);
          
          // Small delay to avoid rate limiting (OpenAI has rate limits)
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          batchErrors++;
          errors++;
          console.error(`  ✗ Error processing row ${index}:`, error.message);
          // Continue with next row
        }
      }
      
      // Commit this batch
      await connection.commit();
      skipped += batchSkipped;
      console.log(`\n✓ Batch ${batchNum + 1} completed: ${batchProcessed} processed, ${batchSkipped} skipped, ${batchErrors} errors`);
      console.log(`  Total progress: ${processed}/${validRows.length} books saved to database`);
      
      connection.release();
      
      // Limit for testing
      if (limit > 0 && processed >= limit) {
        console.log(`\nReached limit of ${limit} books. Stopping...`);
        break;
      }
      
      // Delay between batches to avoid rate limiting (OpenAI free tier: 3 RPM)
      if (batchNum < totalBatches - 1) {
        console.log(`\nWaiting 3 seconds before next batch (to respect OpenAI rate limits)...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
    } catch (batchError) {
      // Rollback this batch if it fails
      await connection.rollback();
      connection.release();
      errors += batch.length;
      console.error(`\n❌ Batch ${batchNum + 1} failed, rolled back:`, batchError.message);
      console.log(`  Continuing with next batch...`);
    }
  }
  
  await pool.end();
  
  console.log('\n=== IMPORT SUMMARY ===');
  console.log(`Total processed: ${processed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log('✅ Import completed successfully!');
  
  } catch (error) {
    console.error('❌ Error processing Excel:', error);
    throw error;
  }
}

// Get limit and batch size from command line arguments
// Usage: node script.js [limit] [batchSize]
// Example: node script.js 10 5 (process 10 books in batches of 5)
// Example: node script.js 0 50 (process all books in batches of 50)
const limit = process.argv[2] ? parseInt(process.argv[2]) : 0;
const batchSize = process.argv[3] ? parseInt(process.argv[3]) : 50;

console.log(`Starting import with batch size: ${batchSize}${limit > 0 ? `, limit: ${limit}` : ' (all books)'}\n`);

processExcelBooks(limit, batchSize).catch(console.error);

