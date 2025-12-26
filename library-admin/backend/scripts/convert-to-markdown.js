import mysql from 'mysql2/promise';
import { dbConfig } from '../config.js';

/**
 * Script to convert existing book descriptions and writer bios to Markdown format
 * This enhances readability and allows rich formatting in the UI
 */

const pool = mysql.createPool(dbConfig);

// Enhanced descriptions in Markdown format
const bookDescriptions = {
  1: `A **dystopian** social science fiction novel and cautionary tale about the dangers of totalitarianism.

Set in a totalitarian society where Big Brother watches everything, this classic explores themes of surveillance, thought control, and resistance.`,
  
  2: `The first novel in the **Harry Potter** series, following the adventures of a young wizard.

Join Harry Potter as he discovers his magical heritage and begins his journey at Hogwarts School of Witchcraft and Wizardry.`,
  
  3: `A **horror novel** about a family that becomes isolated in a haunted hotel.

This chilling tale follows the Torrance family as they caretake the Overlook Hotel during the winter, where supernatural forces begin to manifest.`,
  
  4: `A detective novel featuring **Hercule Poirot** investigating a murder aboard the Orient Express.

When a passenger is found dead on the luxurious train, Poirot must solve the mystery before the train reaches its destination.`,
  
  5: `A science fiction novel about the fall and rise of civilizations in a **galactic empire**.

Follow the Foundation as it navigates through political intrigue and scientific advancement to preserve human knowledge.`,
  
  6: `The exclusive biography of **Steve Jobs**, based on extensive interviews.

This comprehensive biography explores the life, career, and legacy of the co-founder of Apple Inc.`,
  
  7: `An exploration of the history of the human species from the **Stone Age** to the modern age.

Discover how Homo sapiens conquered the world through cognitive, agricultural, and scientific revolutions.`,
  
  8: `A self-help book about **interpersonal relations** and influencing people.

Learn timeless principles for building relationships, winning people over, and becoming more influential in your personal and professional life.`,
  
  9: `A guide to building good habits and breaking bad ones through **small changes**.

Discover the power of atomic habits - tiny changes that compound into remarkable results over time.`,
  
  10: `An examination of what contributes to **high levels of success**.

Explore the hidden patterns behind extraordinary achievement and what truly makes successful people different.`,
  
  11: `The memoir of former **First Lady of the United States** Michelle Obama.

A deeply personal account of her journey from childhood to the White House, sharing her experiences and insights.`,
  
  12: `A coming-of-age murder mystery set in the **marshlands of North Carolina**.

Follow Kya Clark, the "Marsh Girl," as she navigates isolation, love, and a murder investigation in this atmospheric novel.`,
  
  13: `A romance novel that tackles themes of **domestic violence** and difficult relationships.

This powerful story follows Lily Bloom as she navigates love, loss, and the courage to break cycles of abuse.`,
  
  14: `A guide on **power dynamics** and strategy based on historical examples.

Learn 48 timeless laws of power drawn from historical figures and master strategists throughout history.`,
  
  15: `Rules for focused success in a distracted world, exploring **productivity and concentration**.

Discover how to cultivate deep work - the ability to focus without distraction on cognitively demanding tasks.`
};

// Enhanced writer bios in Markdown format
const writerBios = {
  1: `**George Orwell** (1903-1950) was an English novelist and essayist.

## Notable Works
- *Animal Farm* (1945)
- *1984* (1949)

His works are known for their sharp social commentary and dystopian themes.`,
  
  2: `**J.K. Rowling** is a British author, best known as the creator of the **Harry Potter** series.

The series has sold over 500 million copies worldwide and has been adapted into a successful film franchise.`,
  
  3: `**Stephen King** is an American author known for **horror, supernatural fiction, and suspense**.

With over 60 novels and 200 short stories, he is one of the most prolific and successful authors of all time.`,
  
  4: `**Agatha Christie** (1890-1976) was an English writer known for detective novels featuring **Hercule Poirot** and Miss Marple.

She is the best-selling novelist of all time, with over 2 billion books sold worldwide.`,
  
  5: `**Isaac Asimov** (1920-1992) was an American writer and professor of biochemistry, known for **science fiction**.

He wrote or edited more than 500 books and is considered one of the "Big Three" science fiction writers.`,
  
  6: `**Walter Isaacson** is an American author and journalist, known for **biographies of notable people**.

His works include biographies of Steve Jobs, Leonardo da Vinci, Albert Einstein, and Benjamin Franklin.`,
  
  7: `**Yuval Noah Harari** is an Israeli historian and author of **Sapiens** and **Homo Deus**.

His books explore the history and future of humankind, combining history, biology, and philosophy.`,
  
  8: `**Dale Carnegie** (1888-1955) was an American writer and lecturer, known for **self-improvement books**.

His most famous work, "How to Win Friends and Influence People," has sold over 30 million copies worldwide.`,
  
  9: `**James Clear** is an author and speaker focused on **habits, decision making, and improvement**.

His book "Atomic Habits" has sold millions of copies and helps people build better habits and break bad ones.`,
  
  10: `**Malcolm Gladwell** is a Canadian journalist and author known for **The Tipping Point** and other bestsellers.

He explores social psychology and the hidden forces that shape our behavior and decisions.`,
  
  11: `**Michelle Obama** is an American attorney and former **First Lady of the United States**.

Her memoir "Becoming" became one of the best-selling books of all time, selling over 17 million copies.`,
  
  12: `**Delia Owens** is an American author and **wildlife scientist**.

Her debut novel "Where the Crawdads Sing" became a #1 New York Times bestseller and was adapted into a major motion picture.`,
  
  13: `**Colleen Hoover** is an American author known for **romance and young adult fiction**.

She has written numerous bestselling novels and is known for her emotional storytelling and relatable characters.`,
  
  14: `**Robert Greene** is an American author known for books on **strategy, power, and seduction**.

His works draw from historical examples and psychological principles to teach timeless strategies for success.`,
  
  15: `**Cal Newport** is a computer science professor and author on **productivity and focus**.

His books explore how to work deeply, avoid distraction, and achieve meaningful results in an age of constant connectivity.`
};

async function convertToMarkdown() {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    console.log('Converting book descriptions to Markdown...');
    
    // Update book descriptions
    for (const [bookId, markdown] of Object.entries(bookDescriptions)) {
      await connection.query(
        'UPDATE books SET description = ? WHERE id = ?',
        [markdown, bookId]
      );
      console.log(`Updated book ${bookId}`);
    }
    
    console.log('Converting writer bios to Markdown...');
    
    // Update writer bios
    for (const [writerId, markdown] of Object.entries(writerBios)) {
      await connection.query(
        'UPDATE writers SET bio = ? WHERE id = ?',
        [markdown, writerId]
      );
      console.log(`Updated writer ${writerId}`);
    }
    
    await connection.commit();
    console.log('✅ Successfully converted all descriptions and bios to Markdown!');
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error converting to Markdown:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

convertToMarkdown().catch(console.error);

