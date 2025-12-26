/**
 * Script to find book cover image URL using ISBN
 * Uses Google Books API and Open Library API
 */

const isbn = '9780593298602';
const bookTitle = 'Soldiers and Kings: Survival and Hope in the World of Human Smuggling';
const author = 'Jason de León';

async function findBookImage() {
  const results = {
    isbn,
    title: bookTitle,
    author,
    imageUrls: []
  };

  // Try Google Books API
  try {
    console.log('Searching Google Books API...');
    const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
    const response = await fetch(googleUrl);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const book = data.items[0].volumeInfo;
      if (book.imageLinks) {
        // Try different image sizes
        const images = {
          smallThumbnail: book.imageLinks.smallThumbnail,
          thumbnail: book.imageLinks.thumbnail,
          small: book.imageLinks.small,
          medium: book.imageLinks.medium,
          large: book.imageLinks.large,
          extraLarge: book.imageLinks.extraLarge
        };
        
        // Prefer larger images
        const preferredImage = images.large || images.medium || images.thumbnail || images.smallThumbnail;
        if (preferredImage) {
          results.imageUrls.push({
            source: 'Google Books API',
            url: preferredImage,
            size: images.large ? 'large' : images.medium ? 'medium' : 'thumbnail'
          });
          console.log(`✅ Found image from Google Books: ${preferredImage}`);
        }
      }
    }
  } catch (error) {
    console.log('❌ Google Books API error:', error.message);
  }

  // Try Open Library API
  try {
    console.log('\nSearching Open Library API...');
    const openLibraryUrl = `https://openlibrary.org/isbn/${isbn}.json`;
    const response = await fetch(openLibraryUrl);
    const data = await response.json();
    
    if (data.covers && data.covers.length > 0) {
      const coverId = data.covers[0];
      const imageUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
      results.imageUrls.push({
        source: 'Open Library API',
        url: imageUrl,
        size: 'large'
      });
      console.log(`✅ Found image from Open Library: ${imageUrl}`);
    }
  } catch (error) {
    console.log('❌ Open Library API error:', error.message);
  }

  // Try ISBN Search API
  try {
    console.log('\nSearching ISBN Search API...');
    const isbnSearchUrl = `https://api.isbndb.com/book/${isbn}`;
    // Note: This API requires an API key, but we can try without it
    // For now, we'll skip this as it requires authentication
  } catch (error) {
    console.log('❌ ISBN Search API requires authentication');
  }

  console.log('\n=== RESULTS ===\n');
  console.log(JSON.stringify(results, null, 2));
  
  if (results.imageUrls.length > 0) {
    console.log('\n✅ Recommended image URL:', results.imageUrls[0].url);
  } else {
    console.log('\n⚠️  No images found via APIs. You may need to search manually or use a different source.');
  }

  return results;
}

findBookImage().catch(console.error);

