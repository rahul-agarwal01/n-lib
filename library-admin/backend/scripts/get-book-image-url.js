/**
 * Script to get book cover image URL for ISBN 9780593298602
 * Tries multiple sources to find the best image URL
 */

const isbn = '9780593298602';
const bookTitle = 'Soldiers and Kings: Survival and Hope in the World of Human Smuggling';
const author = 'Jason de León';

async function getBookImageUrl() {
  console.log(`Searching for book cover image...\n`);
  console.log(`ISBN: ${isbn}`);
  console.log(`Title: ${bookTitle}`);
  console.log(`Author: ${author}\n`);

  const results = {
    isbn,
    title: bookTitle,
    author,
    imageUrls: []
  };

  // Method 1: Google Books API - get volume ID and construct image URL
  try {
    console.log('1. Trying Google Books API...');
    const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    const response = await fetch(googleUrl);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const volumeId = data.items[0].id;
      const book = data.items[0].volumeInfo;
      
      // Construct direct image URL using volume ID
      const directImageUrl = `https://books.google.com/books/publisher/content/images/frontcover/${volumeId}?fife=w400-h600`;
      const largeImageUrl = `https://books.google.com/books/publisher/content/images/frontcover/${volumeId}?fife=w800-h1200`;
      
      results.imageUrls.push({
        source: 'Google Books (Direct)',
        url: largeImageUrl,
        size: 'large',
        fallback: directImageUrl
      });
      
      console.log(`✅ Found Google Books volume ID: ${volumeId}`);
      console.log(`   Large image: ${largeImageUrl}`);
      console.log(`   Medium image: ${directImageUrl}`);
    }
  } catch (error) {
    console.log(`❌ Google Books API error: ${error.message}`);
  }

  // Method 2: Open Library
  try {
    console.log('\n2. Trying Open Library API...');
    const openLibraryUrl = `https://openlibrary.org/isbn/${isbn}.json`;
    const response = await fetch(openLibraryUrl);
    const data = await response.json();
    
    if (data.covers && data.covers.length > 0) {
      const coverId = data.covers[0];
      const imageUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
      const mediumUrl = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
      
      results.imageUrls.push({
        source: 'Open Library',
        url: imageUrl,
        size: 'large',
        fallback: mediumUrl
      });
      
      console.log(`✅ Found Open Library cover ID: ${coverId}`);
      console.log(`   Large image: ${imageUrl}`);
      console.log(`   Medium image: ${mediumUrl}`);
    }
  } catch (error) {
    console.log(`❌ Open Library API error: ${error.message}`);
  }

  // Method 3: Construct ISBN-based URLs (common patterns)
  console.log('\n3. Trying common ISBN image URL patterns...');
  const commonPatterns = [
    `https://images-na.ssl-images-amazon.com/images/P/${isbn}.01.L.jpg`,
    `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
    `https://bookcover.longislandpress.com/${isbn}.jpg`
  ];
  
  // Note: These are just patterns, actual availability needs to be verified

  console.log('\n=== RECOMMENDED IMAGE URLS ===\n');
  
  if (results.imageUrls.length > 0) {
    results.imageUrls.forEach((img, index) => {
      console.log(`${index + 1}. ${img.source}:`);
      console.log(`   Primary: ${img.url}`);
      if (img.fallback) {
        console.log(`   Fallback: ${img.fallback}`);
      }
      console.log('');
    });
    
    console.log('✅ BEST RECOMMENDATION:');
    console.log(`   ${results.imageUrls[0].url}\n`);
  } else {
    console.log('⚠️  No direct image URLs found via APIs.');
    console.log('   You may need to manually find and upload the image.\n');
  }

  console.log('=== JSON OUTPUT ===\n');
  console.log(JSON.stringify(results, null, 2));

  return results;
}

getBookImageUrl().catch(console.error);

