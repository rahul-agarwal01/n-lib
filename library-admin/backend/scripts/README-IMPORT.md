# Book Import Script - Setup Guide

## Prerequisites

1. **OpenAI API Key**: Get your API key from https://platform.openai.com/api-keys
2. **Excel File**: `Nagarro_Final_List_From_Atlantis.xlsx` should be in the project root
3. **Database**: MySQL database `n_lib` should be running

## Setup

1. **Create `.env` file** in the `backend` directory:
   ```bash
   cd library-admin/backend
   cp .env.example .env
   ```

2. **Add your OpenAI API key** to `.env`:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

## Usage

### Test Run (Process 10 books in batches of 5)
```bash
node scripts/process-excel-books.js 10 5
```

### Full Import (Process all ~1726 books in batches of 50)
```bash
node scripts/process-excel-books.js 0 50
```

### Custom Batch Size
```bash
node scripts/process-excel-books.js 0 100  # Process all books in batches of 100
```

## What the Script Does

1. **Reads Excel File**: Filters for rows where "Recommended" = "Yes - Bestseller"
2. **Extracts Data**: ISBN13, Author, Title, Publisher, Category
3. **AI Generation**:
   - Book descriptions (Markdown format) using GPT-3.5-turbo
   - Author bios (Markdown format) using GPT-3.5-turbo
   - Author nationality using GPT-3.5-turbo
4. **Fetches Images**: Gets book cover URLs from Google Books API
5. **Saves to Database**:
   - Creates/updates writers (checks for duplicates by name + nationality)
   - Creates books (owner_id = NULL, available_copies = 1)
   - Links books to categories
   - Links books to writers

## Cost Estimation

- **Model**: GPT-3.5-turbo (~$0.0015 per 1K tokens)
- **Per Book**: ~3 API calls (description, bio, nationality)
- **Total Books**: ~1726
- **Estimated Cost**: $5-15 for all books (depending on content length)

## Rate Limiting

- Script includes delays between batches (3 seconds)
- Includes retry logic with exponential backoff
- Respects OpenAI rate limits

## Notes

- The script processes in batches to avoid overwhelming the API
- If interrupted, you can resume by running again (it checks for existing writers)
- Errors are logged but don't stop the entire process
- Fallback descriptions/bios are used if API calls fail

